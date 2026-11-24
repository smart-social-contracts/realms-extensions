"""Walk the QR-bill flow on a local test-mode realm: the treasurer issues a bill to a payee of the register, the
QR-bill is shown, a statement brings the payment back by the bill's reference, and the bill shows as paid.

    python3 qr_bill.py <realm frontend URL> <out dir>

Needs the setup walk.py leaves (the register with the realm's account and Ada Example as P1). Gives both a post code,
which a QR-bill requires. Example IBANs only.
"""
import pathlib
import re
import sys

from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1].rstrip("/")
OUT = pathlib.Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

CAMT = """<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08"><BkToCstmrDbtCdtNtfctn>
<GrpHdr><MsgId>NTF-{bill}</MsgId><CreDtTm>2026-12-04T09:00:00+01:00</CreDtTm></GrpHdr>
<Ntfctn><Id>NTF-{bill}-1</Id><Acct><Id><IBAN>CH9300762011623852957</IBAN></Id></Acct>
<Ntry><Amt Ccy="CHF">150.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><Sts><Cd>BOOK</Cd></Sts>
<BookgDt><Dt>2026-12-04</Dt></BookgDt><AcctSvcrRef>EXB-QR-1</AcctSvcrRef>
<BkTxCd><Domn><Cd>PMNT</Cd><Fmly><Cd>RCDT</Cd><SubFmlyCd>DMCT</SubFmlyCd></Fmly></Domn></BkTxCd>
<NtryDtls><TxDtls><Amt Ccy="CHF">150.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
<RmtInf><Strd><CdtrRefInf><Tp><CdOrPrtry><Cd>SCOR</Cd></CdOrPrtry></Tp><Ref>{reference}</Ref></CdtrRefInf></Strd></RmtInf>
</TxDtls></NtryDtls></Ntry></Ntfctn></BkToCstmrDbtCdtNtfctn></Document>
"""


def done(page):
    page.get_by_role("button", name="Close", exact=True).last.click(timeout=120000)


def tab(page, name):
    page.get_by_role("button", name=name, exact=True).click()


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_context(viewport={"width": 1400, "height": 1100}).new_page()
    pin = "?ti=0&test_mode=1&skip_ii=1"
    page.goto(f"{BASE}/join{pin}", wait_until="networkidle", timeout=120000)
    page.get_by_role("button", name=re.compile(r"^Continue as Identity")).click()
    page.wait_for_timeout(5000)
    page.goto(f"{BASE}/extensions/banking{pin}", wait_until="networkidle", timeout=120000)
    page.get_by_role("heading", name="Banking", exact=True).wait_for(timeout=60000)

    # 1. Post codes for the realm's account and for Ada Example: a QR-bill takes structured addresses only.
    tab(page, "Accounts and payees")
    page.locator("section").first.get_by_label("Post code").fill("3000")
    page.get_by_role("row").filter(has_text="Ada Example").first.get_by_role("button", name="Edit").click()
    page.locator(".bk-card").get_by_label("Post code").fill("8000")
    page.get_by_role("button", name="Keep").click()
    page.get_by_role("button", name="Save the register").click()
    expect(page.get_by_text(re.compile("Bank register saved"))).to_be_visible(timeout=120000)
    done(page)

    # 2. Issue the bill.
    tab(page, "QR-bills")
    page.locator("section").first.locator("select").first.select_option("P1")
    page.get_by_label("Amount (blank: the payer enters it)").fill("150")
    page.get_by_label("Due on").fill("2026-12-31")
    page.get_by_label("For (printed on the bill)").fill("Waste fee 2026")
    page.get_by_label("Settles realm invoice").fill("INV-31")
    issue = page.get_by_role("button", name=re.compile(r"^Issue BILL-\d+$"))
    bill = issue.inner_text().split()[-1]
    issue.click()
    expect(page.get_by_text(re.compile(f"{bill} is issued"))).to_be_visible(timeout=120000)
    done(page)
    expect(page.get_by_alt_text(f"QR-bill {bill}")).to_be_visible(timeout=30000)
    page.screenshot(path=str(OUT / "1-qr-bill.png"), full_page=True)
    row = page.get_by_role("row").filter(has_text=bill)
    expect(row).to_contain_text("open, due 2026-12-31", timeout=60000)
    reference = row.locator("td").nth(2).inner_text().strip()
    print("issued", bill, "reference", reference)

    # 3. The payment comes back in a statement.
    statement = OUT / f"camt054-{bill}.xml"
    statement.write_text(CAMT.format(bill=bill, reference=reference))
    tab(page, "Statements")
    page.locator("input[type=file]").set_input_files(str(statement))
    expect(page.get_by_text(re.compile(f"{bill} paid"))).to_be_visible(timeout=30000)
    page.get_by_role("button", name="Record this import").click()
    expect(page.get_by_text(re.compile("reported to the realm"))).to_be_visible(timeout=120000)
    done(page)

    # 4. The bill shows as paid.
    tab(page, "QR-bills")
    expect(page.get_by_role("row").filter(has_text=bill)).to_contain_text("paid on 2026-12-04", timeout=60000)
    page.screenshot(path=str(OUT / "2-paid.png"), full_page=True)
    browser.close()

print(f"qr-bill walk ok: {bill} issued, paid by reference {reference}")
