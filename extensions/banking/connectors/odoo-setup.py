# Prepares the local Odoo database "realms" for the Banking connector demo. Run inside the container:
#   odoo shell -d <database> --no-http < odoo-setup.py   (with the OCA modules on the addons path)
# Example IBANs only (published documentation examples); every name is made up. Safe to run again.
env = env  # noqa: F821 (provided by odoo shell)

company = env.company
if not company.chart_template:
    company.write({"name": "Example Realm Association", "country_id": env.ref("base.ch").id, "street": "Musterstrasse 1",
                   "zip": "3000", "city": "Bern"})
    env["account.chart.template"].try_loading("ch", company, install_demo=False)
print("company", company.name, company.currency_id.name, company.chart_template)

# A made-up BIC: Odoo writes the paying bank by BIC, and the Swiss schema refuses the "not provided" placeholder.
bank = env["res.bank"].search([("name", "=", "Example Bank")], limit=1) or env["res.bank"].create({"name": "Example Bank"})
bank.bic = "EXMPCHZZ"


def partner_bank(partner, iban):
    found = env["res.partner.bank"].search([("acc_number", "=", iban), ("partner_id", "=", partner.id)], limit=1)
    return found or env["res.partner.bank"].create({"acc_number": iban, "partner_id": partner.id, "bank_id": bank.id})


own = partner_bank(company.partner_id, "CH93 0076 2011 6238 5295 7")
journal = env["account.journal"].search([("type", "=", "bank"), ("company_id", "=", company.id)], limit=1)
journal.bank_account_id = own

# l10n_ch_pain_credit_transfer adds the Swiss Payment Standards as a version of OCA's credit transfer method.
method = env.ref("account_banking_sepa_credit_transfer.sepa_credit_transfer")
method.pain_version = "pain.001.001.09.ch.03"
mode = env["account.payment.mode"].search([("name", "=", "Swiss credit transfer")], limit=1) or env["account.payment.mode"].create({
    "name": "Swiss credit transfer", "payment_method_id": method.id, "bank_account_link": "fixed",
    "fixed_journal_id": journal.id, "payment_order_ok": True, "company_id": company.id})

# The connector logs in as its own user; it is the reviewer of every payment order (OCA tier validation).
connector = env["res.users"].search([("login", "=", "realm-connector")], limit=1) or env["res.users"].create({
    "name": "Realm connector", "login": "realm-connector", "password": "realm-connector-demo",
    "groups_id": [(4, env.ref("account.group_account_manager").id),
                  (4, env.ref("account_payment_order.group_account_payment").id)]})
model = env["ir.model"]._get("account.payment.order")
env["tier.definition"].search([("model_id", "=", model.id)]) or env["tier.definition"].create({
    "name": "Approved by the realm's treasury", "model_id": model.id, "review_type": "individual",
    "reviewer_id": connector.id, "definition_domain": "[]"})

# What the connector writes back, shown on a "Realm" page of the payment order.
for name, label, ttype in [("x_realm_status", "Realm status", "char"), ("x_realm_proposal", "Realm proposal", "char"),
                           ("x_realm_votes", "Votes", "char"), ("x_realm_dispatch", "Dispatch to the bank", "char"),
                           ("x_file_sha256", "File sha256 (committed in the realm)", "char"), ("x_realm_note", "Note", "text")]:
    if not env["ir.model.fields"].search([("model_id", "=", model.id), ("name", "=", name)]):
        env["ir.model.fields"].create({"model_id": model.id, "name": name, "field_description": label, "ttype": ttype,
                                       "state": "manual", "readonly": True})
# The connector writes its own fields with OCA's skip_validation_check context: a tier.validation.exception would
# instead lock every other field after validation, and Odoo could no longer record the file it generates.
env["tier.validation.exception"].search([("model_id", "=", model.id), ("name", "=", "Realm connector")]).unlink()
if not env["ir.ui.view"].search([("name", "=", "account.payment.order.form.realm")]):
    env["ir.ui.view"].create({
        "name": "account.payment.order.form.realm", "model": "account.payment.order",
        "inherit_id": env.ref("account_payment_order.account_payment_order_form").id,
        "arch": """<xpath expr="//notebook" position="inside">
            <page string="Realm" name="realm"><group>
                <field name="x_realm_status"/><field name="x_realm_proposal"/><field name="x_realm_votes"/>
                <field name="x_realm_dispatch"/><field name="x_file_sha256"/><field name="x_realm_note"/>
            </group></page></xpath>"""})

SUPPLIERS = [("Ada Example", "CH56 0483 5012 3456 7800 9", "Beispielweg 7", "8000", "Zürich", 4200.0),
             ("Bruno Sample", "CH58 0079 1123 0008 8901 2", "Musterweg 3", "4051", "Basel", 3850.5),
             ("Example Printing Ltd", "LI21 0881 0000 2324 013A A", "Industrieweg 12", "9490", "Vaduz", 1250.0)]
expense = env["account.account"].search([("account_type", "=", "expense"), ("company_ids", "in", company.id)], limit=1)
bills = env["account.move"]
for name, iban, street, zip_, city, amount in SUPPLIERS:
    country = env.ref("base.li") if iban.startswith("LI") else env.ref("base.ch")
    partner = env["res.partner"].search([("name", "=", name)], limit=1) or env["res.partner"].create({
        "name": name, "street": street, "zip": zip_, "city": city, "country_id": country.id,
        "supplier_payment_mode_id": mode.id})
    account = partner_bank(partner, iban)
    bill = env["account.move"].search([("partner_id", "=", partner.id), ("move_type", "=", "in_invoice")], limit=1)
    if not bill:
        bill = env["account.move"].create({
            "move_type": "in_invoice", "partner_id": partner.id, "invoice_date": "2026-11-20", "ref": f"Bill {name}",
            "payment_mode_id": mode.id, "partner_bank_id": account.id,
            "invoice_line_ids": [(0, 0, {"name": "Services November 2026", "quantity": 1, "price_unit": amount,
                                         "account_id": expense.id, "tax_ids": [(5, 0, 0)]})]})
        bill.action_post()
    bills |= bill
order = env["account.payment.order"].search([("state", "!=", "cancel"), ("payment_mode_id", "=", mode.id)], limit=1)
if not order:
    bills.create_account_payment_line()
    order = env["account.payment.order"].search([("state", "=", "draft"), ("payment_mode_id", "=", mode.id)], limit=1)
print("order", order.name, order.state, len(order.payment_line_ids), "lines", order.total_company_currency)
env.cr.commit()
