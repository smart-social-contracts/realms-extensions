"""Walk the any-ERP route on a local test-mode realm: a payment file made by an ERP is put to the treasury's vote,
approved by the department's seats, committed for the bank, and then verified (and a changed copy refused).

    python3 erp_file.py <realm frontend URL> <the ERP's pain.001> <out dir>

Needs the setup walk.py needs (Identities 1 and 2 seated in the treasury department, whose policy decides the vote),
and a file whose message id the realm has not seen. Example IBANs only.
"""
import pathlib
import re
import sys

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1].rstrip("/")
FILE = pathlib.Path(sys.argv[2])
OUT = pathlib.Path(sys.argv[3])
OUT.mkdir(parents=True, exist_ok=True)
MSG = re.search(r"<MsgId>([^<]+)</MsgId>", FILE.read_text()).group(1)


def signed_in(browser, identity, path="/extensions/banking"):
    page = browser.new_context(viewport={"width": 1400, "height": 1000}).new_page()
    pin = f"?ti={identity - 1}&test_mode=1&skip_ii=1"
    page.goto(f"{BASE}/join{pin}", wait_until="networkidle", timeout=120000)
    page.get_by_role("button", name=re.compile(r"^Continue as Identity")).click()
    page.wait_for_timeout(5000)
    page.goto(f"{BASE}{path}{pin}", wait_until="networkidle", timeout=120000)
    return page


def done(page):
    page.get_by_role("button", name="Close", exact=True).last.click(timeout=120000)


with sync_playwright() as p:
    browser = p.chromium.launch()

    # 1. The treasurer puts the ERP's file to the vote.
    page = signed_in(browser, 1)
    page.get_by_role("heading", name="Banking", exact=True).wait_for(timeout=60000)
    page.get_by_role("button", name="From the ERP", exact=True).click()
    page.get_by_label("The ERP's file").set_input_files(str(FILE))
    expect(page.get_by_text(f"Message {MSG}")).to_be_visible(timeout=30000)
    page.screenshot(path=str(OUT / "1-erp-file.png"), full_page=True)
    page.get_by_role("button", name="Put it to the treasury's vote").click()
    expect(page.get_by_text(re.compile("put to the treasury's vote as P-"))).to_be_visible(timeout=120000)
    notice = page.get_by_text(re.compile("put to the treasury's vote as P-")).inner_text()
    proposal = re.search(r"as (P-\d+)", notice).group(1)
    done(page)
    row = page.get_by_role("row").filter(has_text=MSG)
    expect(row).to_contain_text(f"voting on {proposal}: 0 of 2 yes", timeout=60000)
    page.close()

    # 2. The department's seats vote.
    for identity in (1, 2):
        page = signed_in(browser, identity, "/extensions/voting")
        title = page.get_by_text(re.compile(f"Approve payment file {MSG}")).first
        title.wait_for(timeout=60000)
        card = page.locator("div").filter(has_text=re.compile(f"payment file {MSG}")).filter(
            has=page.get_by_role("button", name="Yes", exact=True)).last
        card.get_by_role("button", name="Yes", exact=True).click()
        page.wait_for_timeout(8000)
        page.close()

    # 3. Approved: the treasurer commits it for the bank.
    page = signed_in(browser, 1)
    row = page.get_by_role("row").filter(has_text=MSG)
    expect(row).to_contain_text(f"approved by {proposal}: commit it for the bank", timeout=60000)
    row.get_by_role("button", name="Commit for the bank").click()
    expect(page.get_by_text(re.compile("is committed for the bank"))).to_be_visible(timeout=120000)
    done(page)
    expect(page.get_by_role("row").filter(has_text=MSG)).to_contain_text("waiting for the e-banking", timeout=60000)
    page.screenshot(path=str(OUT / "2-committed.png"), full_page=True)

    # 4. Anyone verifies a file before the upload: the approved one passes, a changed copy does not.
    page.get_by_role("button", name="From the ERP", exact=True).click()
    page.get_by_label("The file to check").set_input_files(str(FILE))
    approved = re.compile(f"This is {MSG}, committed for the bank as DSP-\\d+ after {proposal} approved it")
    expect(page.get_by_text(approved)).to_be_visible(timeout=30000)
    changed = OUT / "changed.xml"
    original = '<InstdAmt Ccy="CHF">4200.00</InstdAmt>'
    changed.write_text(FILE.read_text().replace(original, original.replace("4200", "4300")))
    page.get_by_label("The file to check").set_input_files(str(changed))
    expect(page.get_by_text("The realm never approved this file. Do not upload it.")).to_be_visible(timeout=30000)
    page.screenshot(path=str(OUT / "3-verify.png"), full_page=True)
    browser.close()

print(f"erp file walk ok: {MSG} approved by {proposal}, committed, verified")
