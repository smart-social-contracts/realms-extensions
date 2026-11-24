# The demo's company, Swiss and in francs, set before the Swiss chart of accounts is installed (an Odoo shell script).
c = env.company
c.write({"name": "Example Realm Association", "country_id": env.ref("base.ch").id, "currency_id": env.ref("base.CHF").id,
         "street": "Musterstrasse 1", "zip": "3000", "city": "Bern"})
env.ref("base.CHF").active = True
env.cr.commit()
print("company", c.name, c.country_id.code, c.currency_id.name)
