# Odoo 18 Community with the Python package the OCA payment modules need (unidecode, for the files' character set).
FROM odoo:18.0
USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3-unidecode && rm -rf /var/lib/apt/lists/*
USER odoo
