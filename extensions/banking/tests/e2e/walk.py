"""Walk the Banking flow on a local test-mode realm, with the real vetKD, and check what the realm kept.

    python3 walk.py <realm frontend URL> <out dir> [<realms CLI> ...]

The realm must run in test mode (Internet Identity skipped), have Banking installed, and seat Identities 1 and 2 in
a department whose positions give treasury.manage and document.manage. Identity 3 must hold no such seat; the walk
joins it as an ordinary member if it is not one.

1. Identity 1 fills the bank register (example IBANs only) and commits an order: two salaries and a QR-bill.
   The downloaded file must be the bytes whose sha256 the realm recorded before the download.
2. Identity 2, the second signatory, opens the order: the per-person list decrypts for them, and they record the
   bank's acceptance.
3. Identity 1 imports the sample camt.053: the salary group matches as one entry, the QR-bill by its id.
4. Identity 3 is refused: the screen says so, and the realm refuses a document_list of the treasury as a non-staff
   caller (the CLI's identity) even though it holds every permission.
"""
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1].rstrip("/")
OUT = pathlib.Path(sys.argv[2])
CLI = sys.argv[3:]
FIXTURES = pathlib.Path(__file__).resolve().parent.parent / "fixtures"
OUT.mkdir(parents=True, exist_ok=True)

PAYEES = [
    ("Ada Example", "CH5604835012345678009", "Zürich"),
    ("Bruno Sample", "CH5800791123000889012", "Basel"),
    ("Example Printing Ltd", "CH4431999123000889012", "Biel/Bienne"),
]


def realm(op, args):
    out = subprocess.run([*CLI, "local", "call", op, json.dumps(args), "--json"], capture_output=True, text=True,
                         env={**os.environ, "COLUMNS": "100000"})
    return json.loads(out.stdout)["response"]


def signed_in(browser, identity):
    page = browser.new_context(viewport={"width": 1400, "height": 1000}, accept_downloads=True).new_page()
    pin = f"?ti={identity - 1}&test_mode=1&skip_ii=1"
    page.goto(f"{BASE}/join{pin}", wait_until="networkidle", timeout=120000)
    page.get_by_role("button", name=re.compile(r"^Continue as Identity")).click()
    page.wait_for_timeout(5000)
    agree = page.get_by_text("I agree to these terms and conditions")
    if agree.count():  # not a member yet: join, as anyone may on an open test realm
        agree.click()
        page.get_by_role("button", name="Continue", exact=True).click()
        page.wait_for_timeout(15000)
    page.goto(f"{BASE}/extensions/banking{pin}", wait_until="networkidle", timeout=120000)
    page.get_by_role("heading", name="Banking", exact=True).wait_for(timeout=60000)
    return page


def done(page, wait=60000):
    """Close the host's notice of what just happened; it covers the page until closed."""
    page.get_by_role("button", name="Close", exact=True).last.click(timeout=wait)


def tab(page, name):
    page.get_by_role("button", name=name, exact=True).click()


def fill_account(scope, name, iban, town):
    scope.get_by_label("Name at the bank").fill(name)
    scope.get_by_label("IBAN").fill(iban)
    scope.get_by_label("Town").fill(town)
    scope.get_by_label("Country").fill("CH")


with sync_playwright() as p:
    browser = p.chromium.launch()

    # 1. The treasurer: register, order, commit, download.
    page = signed_in(browser, 1)
    page.wait_for_timeout(4000)
    tab(page, "Accounts and payees")
    fill_account(page.locator("section").first, "Example Realm Association", "CH93 0076 2011 6238 5295 7", "Bern")
    for name, iban, town in PAYEES:
        if page.get_by_role("cell", name=name, exact=True).count():
            continue  # a walk run before already added it
        page.get_by_role("button", name="Add a payee").click()
        fill_account(page.locator(".bk-card"), name, iban, town)
        page.get_by_role("button", name="Keep").click()
    page.get_by_role("button", name="Save the register").click()
    expect(page.get_by_text(re.compile("Bank register saved"))).to_be_visible(timeout=120000)
    page.screenshot(path=str(OUT / "1-register.png"), full_page=True)
    done(page)

    tab(page, "New order")
    lines = [("P1", "4200", True, "", ""), ("P2", "3850.50", True, "", ""),
             ("P3", "1250", False, "QRR", "21 00000 00003 13947 14300 09017")]
    for i, (payee, amount, salary, kind, ref) in enumerate(lines):
        if i:
            page.get_by_role("button", name="Add a payment").click()
        row = page.locator("tbody tr").nth(i)
        row.locator("select").first.select_option(payee)
        row.locator("input.bk-amount").fill(amount)
        if salary:
            row.get_by_label("Salary").check()
        if kind:
            row.locator("select").nth(1).select_option(kind)
            row.locator("td").nth(4).locator("input").fill(ref)
        row.locator("td").nth(5).locator("input").fill("Salary November 2026" if salary else "")
    page.screenshot(path=str(OUT / "2-new-order.png"), full_page=True)
    with page.expect_download(timeout=120000) as download:
        page.get_by_role("button", name="Commit and download the file").click()
    file = OUT / download.value.suggested_filename
    download.value.save_as(file)
    done(page)
    page.wait_for_timeout(4000)
    page.screenshot(path=str(OUT / "3-orders.png"), full_page=True)

    # What anyone with realm.monitor reads in the audit log: the register stored as ciphertext without its wrapped
    # keys, and the order's dispatch to the bank naming the file's sha256 (the order's own document_store is too large
    # for the log to keep its arguments; its facts are on the document, which only the staff read).
    events = realm("events", {"count": 60})["events"]
    register = next(e for e in events if e["op"] == "document_store" and e["args"].get("kind") == "banking.register")
    assert "keys" not in register["args"], "the wrapped keys reached the audit log"
    logged = json.dumps([e["args"] for e in events])
    for clear in ("CH5604835012345678009", "Ada Example", "Zürich", "Z\\u00fcrich"):
        assert clear not in logged, f"{clear} is in the audit log"
    sent = next(e for e in events if e["op"] == "notification_send" and e["args"].get("topic") == "banking.order"
                and file.stem in e["args"]["title"])
    sha = hashlib.sha256(file.read_bytes()).hexdigest()
    print("downloaded", file.name, "sha256", sha[:16], "| dispatch:", sent["args"]["title"][:60])
    assert sent["args"]["title"].endswith(f"sha256:{sha}"), "the downloaded file is not the committed one"
    page.close()

    # 2. The second signatory: the per-person list decrypts for them; they record the bank's acceptance.
    page = signed_in(browser, 2)
    page.get_by_role("row").filter(has_text=file.stem).get_by_role("button", name="Check").click()
    expect(page.get_by_text("The file is the one committed")).to_be_visible(timeout=120000)
    expect(page.get_by_role("cell", name="Ada Example")).to_be_visible()
    expect(page.get_by_role("cell", name="CH44 3199 9123 0008 8901 2")).to_be_visible()
    page.screenshot(path=str(OUT / "4-check-before-signing.png"), full_page=True)
    page.get_by_placeholder("e-banking order reference").fill("EB-LOCAL-0001")
    page.get_by_role("button", name="Record as accepted").click()
    done(page)
    page.close()

    # 3. The treasurer imports the sample statement.
    page = signed_in(browser, 1)
    tab(page, "Statements")
    # The sample statement books order BK-20261124-0001; name the order this walk committed instead.
    statement = OUT / "camt053.xml"
    statement.write_text((FIXTURES / "camt053-sample.xml").read_text().replace("BK-20261124-0001", file.stem))
    page.locator("input[type=file]").set_input_files(str(statement))
    expect(page.get_by_text("booked as one entry: 2 payments")).to_be_visible(timeout=30000)
    expect(page.get_by_text(re.compile(r"-03 paid$"))).to_be_visible()
    page.screenshot(path=str(OUT / "5-statement.png"), full_page=True)
    page.get_by_role("button", name="Record this import").click()
    expect(page.get_by_text(re.compile("reported to the realm"))).to_be_visible(timeout=120000)
    done(page)
    tab(page, "Orders")
    row = page.get_by_role("row").filter(has_text=file.stem)
    expect(row).to_contain_text("accepted by the bank (EB-LOCAL-0001); 3 of 3 booked", timeout=30000)
    page.screenshot(path=str(OUT / "6-orders-booked.png"), full_page=True)
    page.close()

    # 4. Refusals.
    page = signed_in(browser, 3)
    expect(page.get_by_text("Banking is for the treasury's staff")).to_be_visible(timeout=60000)
    page.screenshot(path=str(OUT / "7-refused.png"), full_page=True)
    refused = realm("document_list", {"department": "Treasury", "kind": "banking.register"})
    print("non-staff document_list:", refused)
    assert refused.get("ok") is False and "staff" in refused.get("error", ""), refused
    browser.close()

print("walk ok:", OUT)
