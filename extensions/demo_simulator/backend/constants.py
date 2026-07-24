"""
Demo Simulator — Data pools and constants.

Name banks, city coordinates, and other static data used by the generators.
"""

TASK_NAME = "demo_simulator_task"
SCHEDULE_NAME = "demo_simulator_schedule"
DEFAULT_INTERVAL_SECONDS = 30
DEFAULT_BATCH_SIZE = 5
MAX_ENTITIES_TOTAL = None  # None = unlimited
DEFAULT_ROTATION_MODE = "round_robin"  # round_robin | random | all
ROTATION_MODES = ("round_robin", "random", "all")

# Keys returned in API / UI (messages = in-app notifications).
ENTITY_TYPE_KEYS = (
    "users",
    "organizations",
    "proposals",
    "transfers",
    "disputes",
    "votes",
    "lands",
    "courts",
    "cases",
    "funds",
    "fiscal_periods",
    "budgets",
    "ledger_entries",
    "messages",
    "departments",
)

ENTITY_TYPE_LABELS = {
    "users": "Users",
    "organizations": "Organizations",
    "proposals": "Proposals",
    "transfers": "Transfers",
    "disputes": "Disputes",
    "votes": "Votes",
    "lands": "Land parcels",
    "courts": "Courts",
    "cases": "Cases",
    "funds": "Funds",
    "fiscal_periods": "Fiscal periods",
    "budgets": "Budget lines",
    "ledger_entries": "Ledger entries",
    "messages": "Messages",
    "departments": "Departments",
}

# Counter field on persisted state for each entity type.
ENTITY_STAT_FIELDS = {
    "users": "total_users_created",
    "organizations": "total_orgs_created",
    "proposals": "total_proposals_created",
    "transfers": "total_transfers_created",
    "disputes": "total_disputes_created",
    "votes": "total_votes_created",
    "lands": "total_lands_created",
    "courts": "total_courts_created",
    "cases": "total_cases_created",
    "funds": "total_funds_created",
    "fiscal_periods": "total_fiscal_periods_created",
    "budgets": "total_budgets_created",
    "ledger_entries": "total_ledger_entries_created",
    "messages": "total_notifications_created",
    "departments": "total_departments_created",
}


def default_enabled_types():
    """All entity generators enabled by default."""
    return {key: True for key in ENTITY_TYPE_KEYS}


def default_type_count(type_key, batch_size):
    """Default batch count per type (matches legacy round-robin behaviour)."""
    bs = max(1, int(batch_size or DEFAULT_BATCH_SIZE))
    if type_key == "users":
        return bs
    if type_key == "organizations":
        return max(1, bs // 2)
    if type_key == "proposals":
        return max(1, bs // 2)
    if type_key == "transfers":
        return bs
    if type_key == "disputes":
        return max(1, bs // 3)
    if type_key == "votes":
        return bs
    if type_key == "lands":
        return max(1, bs // 2)
    if type_key == "courts":
        return max(1, bs // 3)
    if type_key == "cases":
        return max(1, bs // 2)
    if type_key == "funds":
        return 5
    if type_key == "fiscal_periods":
        return 2
    if type_key == "budgets":
        return max(2, bs)
    if type_key == "ledger_entries":
        return bs * 2
    if type_key == "messages":
        return bs
    if type_key == "departments":
        return max(2, bs)
    return bs


def entity_type_catalog():
    """Metadata for the frontend configuration panel."""
    return [
        {
            "key": key,
            "label": ENTITY_TYPE_LABELS.get(key, key),
            "stat_field": ENTITY_STAT_FIELDS[key],
        }
        for key in ENTITY_TYPE_KEYS
    ]

FIRST_NAMES = [
    "Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Helen",
    "Ivan", "Julia", "Kevin", "Laura", "Michael", "Nina", "Oliver", "Patricia",
    "Quinn", "Rachel", "Samuel", "Tina", "Ulrich", "Victoria", "William", "Xara",
    "Yuki", "Zoe", "Adrian", "Bella", "Carlos", "Delia", "Erik", "Fatima",
    "Hugo", "Iris", "Jin", "Kira", "Leo", "Maya", "Niko", "Olga",
]

LAST_NAMES = [
    "Anderson", "Brown", "Clark", "Davis", "Evans", "Fisher", "Garcia", "Harris",
    "Johnson", "King", "Lee", "Miller", "Nelson", "O'Connor", "Parker", "Quinn",
    "Rodriguez", "Smith", "Taylor", "Underwood", "Valdez", "Wilson", "Xavier",
    "Young", "Zhang", "Adams", "Baker", "Cooper", "Duncan", "Ellis", "Foster",
]

ORG_NAMES = [
    "Digital Services Corp", "Green Energy Solutions", "Healthcare Partners",
    "Education Foundation", "Transport Authority", "Housing Development Co",
    "Financial Services Inc", "Technology Innovations", "Agricultural Cooperative",
    "Environmental Protection Agency", "Cultural Heritage Foundation",
    "Community Development Trust", "Infrastructure Management", "Social Services Org",
]

# Raw GitHub URLs for demo URL-based proposals (realms-codices agora codices)
CODEX_RAW_BASE = (
    "https://raw.githubusercontent.com/smart-social-contracts/realms-codices/"
    "refs/heads/main/codices/agora/"
)

DEMO_CODEX_NAMES = ["tax_collection", "social_benefits"]

PROPOSAL_TITLES = [
    "Increase public transport budget",
    "Create community garden in District 3",
    "Establish digital identity standards",
    "Fund renewable energy research",
    "Build new community center",
    "Implement universal basic income pilot",
    "Expand healthcare coverage",
    "Create open-source governance tools",
    "Establish data privacy framework",
    "Fund education technology initiative",
]

# Rich narrative + code themes for demo governance proposals.
PROPOSAL_PROFILES = {
    "Increase public transport budget": {
        "description": (
            "This proposal allocates an additional 12% of the municipal mobility fund to "
            "expand bus and tram service frequency in underserved districts. It authorizes "
            "the Transport Authority to renegotiate operator contracts, subsidize off-peak "
            "fares for students and seniors, and publish monthly ridership dashboards. "
            "Funding is phased over two fiscal years with quarterly performance reviews."
        ),
        "codex_name": "transport_subsidy",
        "amend_target": "social_benefits",
    },
    "Create community garden in District 3": {
        "description": (
            "District 3 residents request a 2,400 m² community garden on the vacant lot at "
            "Maple & 5th. The plan includes raised beds, composting, a rainwater collection "
            "system, and a shared tool library. A neighborhood cooperative will manage day-to-day "
            "operations; the realm grants a 10-year land-use license and seed funding for "
            "infrastructure and insurance."
        ),
        "codex_name": "community_garden_d3",
        "amend_target": "tax_collection",
    },
    "Establish digital identity standards": {
        "description": (
            "Members propose a realm-wide digital identity standard so citizens can prove "
            "membership, sign documents, and access services without repeated KYC. The standard "
            "must be open, auditable, and interoperable with Internet Identity. A technical "
            "working group will publish reference implementations and a 90-day migration path "
            "for existing integrations."
        ),
        "codex_name": "digital_identity_standard",
        "amend_target": "tax_collection",
    },
    "Fund renewable energy research": {
        "description": (
            "The Green Energy Solutions cooperative seeks 500,000 realm tokens over three years "
            "to pilot solar micro-grids on public buildings and publish open datasets on "
            "generation and consumption. Milestones tie disbursements to installed capacity, "
            "peer-reviewed reports, and citizen-accessible monitoring dashboards."
        ),
        "codex_name": "renewable_energy_grants",
        "amend_target": "social_benefits",
    },
    "Build new community center": {
        "description": (
            "This capital project constructs a multi-purpose community center with meeting "
            "rooms, a childcare co-op space, and a public library annex. Construction follows "
            "green-building guidelines; 30% of subcontracting is reserved for local worker "
            "cooperatives. The center will be governed by a mixed board of residents and "
            "elected delegates."
        ),
        "codex_name": "community_center_capital",
        "amend_target": "tax_collection",
    },
    "Implement universal basic income pilot": {
        "description": (
            "A 18-month UBI pilot will provide a fixed monthly transfer to 500 randomly "
            "selected verified members in Districts 1–3. Researchers will measure effects on "
            "employment, health outcomes, and local commerce. Transfers are funded from the "
            "general treasury with independent audit and public anonymized reporting."
        ),
        "codex_name": "ubi_pilot",
        "amend_target": "social_benefits",
    },
    "Expand healthcare coverage": {
        "description": (
            "Healthcare Partners proposes extending preventive care coverage to all verified "
            "members, including dental screenings, mental-health counseling sessions, and "
            "telemedicine. Premiums are capped as a percentage of income; a public formulary "
            "committee reviews drug pricing quarterly."
        ),
        "codex_name": "healthcare_coverage_expansion",
        "amend_target": "social_benefits",
    },
    "Create open-source governance tools": {
        "description": (
            "Fund development of open-source tooling for proposal drafting, deliberation "
            "threads, and vote auditing on the Internet Computer. Deliverables include APIs, "
            "documentation, and reference UIs that any realm can fork. All code is MIT-licensed "
            "and maintained by a contributor guild with transparent treasury reporting."
        ),
        "codex_name": "governance_toolkit",
        "amend_target": "tax_collection",
    },
    "Establish data privacy framework": {
        "description": (
            "This codex defines how member data may be collected, stored, shared, and deleted "
            "across realm services. It mandates purpose limitation, encryption at rest, breach "
            "notification within 72 hours, and a citizen data-rights portal. Departments must "
            "publish data inventories and obtain opt-in consent for non-essential processing."
        ),
        "codex_name": "data_privacy_framework",
        "amend_target": "tax_collection",
    },
    "Fund education technology initiative": {
        "description": (
            "The Education Foundation requests funding for tablets, offline-capable learning "
            "content, and teacher training in rural districts. The program targets grades 6–12, "
            "emphasizes digital literacy and civic education, and requires open licensing of "
            "curriculum materials produced with public funds."
        ),
        "codex_name": "edtech_initiative",
        "amend_target": "social_benefits",
    },
}

DEFAULT_PROPOSAL_PROFILE = {
    "description": (
        "This governance proposal authorizes a targeted policy change developed through "
        "community deliberation. If approved, the attached codex will execute on the realm "
        "canister, updating configuration and publishing an audit trail for members to review."
    ),
    "codex_name": "demo_policy_codex",
    "amend_target": "tax_collection",
}

DISPUTE_DESCRIPTIONS = [
    "Contract breach in service agreement",
    "Property boundary disagreement",
    "Payment delay on completed work",
    "Intellectual property licensing dispute",
    "Employment termination challenge",
    "Environmental compliance violation",
    "Tax assessment contestation",
    "Zoning regulation interpretation",
]

COURT_NAMES = [
    "District Court of Commerce",
    "Civil Rights Tribunal",
    "Environmental Court",
    "Labor Arbitration Court",
    "Family & Property Court",
    "Digital Disputes Tribunal",
    "Tax Appeals Court",
    "Supreme Court of Appeals",
]

JUDGE_SPECIALIZATIONS = [
    "Commercial law",
    "Civil rights",
    "Environmental law",
    "Labor disputes",
    "Property law",
    "Digital & IP law",
    "Tax law",
    "Constitutional law",
]

CASE_TITLES = [
    "Breach of rental agreement",
    "Unpaid service fees dispute",
    "Property damage claim",
    "Wrongful termination case",
    "Copyright infringement suit",
    "Environmental pollution claim",
    "Tax evasion investigation",
    "Contract non-performance",
    "Data privacy violation",
    "Noise complaint escalation",
]

VERDICT_DECISIONS = [
    "guilty", "not_guilty", "liable", "not_liable", "dismissed",
    "settled", "partially_liable",
]

LAND_TYPES = ["residential", "agricultural", "industrial", "commercial"]

ZONE_NAMES = [
    "Central District", "Harbor Quarter", "Innovation Park", "Old Town",
    "Riverside", "Mountain View", "Lake District", "Sunset Hills",
    "Market Square", "Garden Heights", "Tech Valley", "Arts Quarter",
]

CITY_COORDINATES = [
    {"name": "Paris", "lat": 48.8566, "lng": 2.3522},
    {"name": "New York", "lat": 40.7128, "lng": -74.0060},
    {"name": "Tokyo", "lat": 35.6762, "lng": 139.6503},
    {"name": "Sydney", "lat": -33.8688, "lng": 151.2093},
    {"name": "London", "lat": 51.5074, "lng": -0.1278},
    {"name": "Berlin", "lat": 52.5200, "lng": 13.4050},
    {"name": "Seoul", "lat": 37.5665, "lng": 126.9780},
    {"name": "Singapore", "lat": 1.3521, "lng": 103.8198},
    {"name": "Dubai", "lat": 25.2048, "lng": 55.2708},
    {"name": "São Paulo", "lat": -23.5505, "lng": -46.6333},
]

DEPARTMENT_DEFINITIONS = [
    {"name": "Treasury", "description": "Manages public finances, budgets, and fiscal policy"},
    {"name": "Justice", "description": "Oversees courts, legal affairs, and dispute resolution"},
    {"name": "Public Works", "description": "Infrastructure, roads, and municipal facilities"},
    {"name": "Health & Social Services", "description": "Healthcare, welfare, and community support"},
    {"name": "Education", "description": "Schools, training programs, and educational initiatives"},
    {"name": "Environment", "description": "Environmental protection, sustainability, and conservation"},
    {"name": "Land & Territory", "description": "Land registry, zoning, and urban planning"},
    {"name": "Digital Services", "description": "Technology, digital identity, and IT infrastructure"},
    {"name": "Commerce & Trade", "description": "Business licensing, trade regulation, and economic development"},
    {"name": "Public Safety", "description": "Security, emergency services, and civil protection"},
]

MESSAGE_TEMPLATES = [
    {"topic": "governance", "title": "New proposal submitted for review", "message": "A new governance proposal has been submitted and is awaiting community review. Please check the Voting section for details."},
    {"topic": "governance", "title": "Voting period opened", "message": "A voting period has opened for a pending proposal. Cast your vote before the deadline."},
    {"topic": "governance", "title": "Proposal approved by majority", "message": "A governance proposal has been approved with majority support. Implementation will begin shortly."},
    {"topic": "finance", "title": "Invoice generated for membership dues", "message": "Your membership dues invoice has been generated. Please review and complete payment at your earliest convenience."},
    {"topic": "finance", "title": "Payment received — thank you", "message": "Your recent payment has been successfully processed and recorded. Thank you for your contribution."},
    {"topic": "finance", "title": "Budget report available", "message": "The quarterly budget report is now available. Review the financial summary in the Dashboard."},
    {"topic": "system", "title": "Welcome to the community", "message": "Welcome! Your membership has been activated. Explore the dashboard to get started with governance, services, and more."},
    {"topic": "system", "title": "Profile update reminder", "message": "Your profile is incomplete. Please update your public and private data in the Account section for full access to community services."},
    {"topic": "system", "title": "Scheduled maintenance notice", "message": "A brief maintenance window is planned. Some services may be temporarily unavailable during this period."},
    {"topic": "legal", "title": "Case status update", "message": "There has been an update to a case you are involved in. Please check the Justice section for the latest status."},
    {"topic": "legal", "title": "New dispute filed", "message": "A dispute has been filed that may involve you. Review the details in the Justice section."},
    {"topic": "land", "title": "Zoning change notification", "message": "A zoning change has been proposed in your area. Review the details in Land & Territory."},
    {"topic": "land", "title": "Land registration confirmed", "message": "Your land parcel registration has been confirmed and recorded in the registry."},
    {"topic": "department", "title": "Department assignment update", "message": "You have been assigned to a new department. Check the Administration section for details."},
    {"topic": "department", "title": "Department meeting scheduled", "message": "A department meeting has been scheduled. Please review the agenda and confirm attendance."},
]

# ── Finance constants (for Metrics extension) ────────────────────────────────

FUND_DEFINITIONS = [
    {"code": "GF", "name": "General Fund", "fund_type": "general",
     "description": "Main operating fund for general government services"},
    {"code": "SR", "name": "Special Revenue Fund", "fund_type": "special_revenue",
     "description": "Restricted revenue sources for specific programs"},
    {"code": "CP", "name": "Capital Projects Fund", "fund_type": "capital_projects",
     "description": "Funding for major capital acquisitions and construction"},
    {"code": "DS", "name": "Debt Service Fund", "fund_type": "debt_service",
     "description": "Principal and interest payments on long-term debt"},
    {"code": "ENT", "name": "Enterprise Fund", "fund_type": "enterprise",
     "description": "Business-type activities that charge fees for services"},
]

FISCAL_PERIOD_DEFINITIONS = [
    {"id": "FY2025", "name": "Fiscal Year 2025", "start_date": "2025-01-01", "end_date": "2025-12-31", "status": "closed"},
    {"id": "FY2026", "name": "Fiscal Year 2026", "start_date": "2026-01-01", "end_date": "2026-12-31", "status": "open"},
]

REVENUE_BUDGETS = [
    {"category": "tax", "name": "Property Tax Revenue", "budget_type": "revenue"},
    {"category": "tax", "name": "Income Tax Revenue", "budget_type": "revenue"},
    {"category": "fee", "name": "License & Permit Fees", "budget_type": "revenue"},
    {"category": "fee", "name": "Service Fees", "budget_type": "revenue"},
    {"category": "grant", "name": "Intergovernmental Grants", "budget_type": "revenue"},
    {"category": "fee", "name": "Utility Charges", "budget_type": "revenue"},
]

EXPENSE_BUDGETS = [
    {"category": "personnel", "name": "Personnel & Salaries", "budget_type": "expense"},
    {"category": "supplies", "name": "Office Supplies & Materials", "budget_type": "expense"},
    {"category": "services", "name": "Contracted Services", "budget_type": "expense"},
    {"category": "capital", "name": "Capital Improvements", "budget_type": "expense"},
    {"category": "debt", "name": "Debt Service Payments", "budget_type": "expense"},
    {"category": "services", "name": "IT & Technology Services", "budget_type": "expense"},
    {"category": "supplies", "name": "Vehicle & Equipment Maintenance", "budget_type": "expense"},
]

LEDGER_TEMPLATES = [
    # Revenue transactions (credit revenue, debit cash)
    {"entry_type": "revenue", "category": "tax", "description": "Property tax collection", "tags": "operating"},
    {"entry_type": "revenue", "category": "tax", "description": "Income tax withholding", "tags": "operating"},
    {"entry_type": "revenue", "category": "fee", "description": "Building permit fee", "tags": "operating"},
    {"entry_type": "revenue", "category": "fee", "description": "Business license fee", "tags": "operating"},
    {"entry_type": "revenue", "category": "grant", "description": "Federal infrastructure grant", "tags": "operating"},
    {"entry_type": "revenue", "category": "fee", "description": "Water utility charges", "tags": "operating"},
    # Expense transactions (debit expense, credit cash)
    {"entry_type": "expense", "category": "personnel", "description": "Monthly payroll", "tags": "operating"},
    {"entry_type": "expense", "category": "personnel", "description": "Benefits & insurance", "tags": "operating"},
    {"entry_type": "expense", "category": "supplies", "description": "Office supplies purchase", "tags": "operating"},
    {"entry_type": "expense", "category": "services", "description": "IT consulting services", "tags": "operating"},
    {"entry_type": "expense", "category": "capital", "description": "Road repair project", "tags": "investing,capital"},
    {"entry_type": "expense", "category": "debt", "description": "Bond interest payment", "tags": "financing,bond"},
    # Asset transactions
    {"entry_type": "asset", "category": "cash", "description": "Cash deposit", "tags": "operating"},
    {"entry_type": "asset", "category": "receivable", "description": "Tax receivable accrual", "tags": "operating"},
    {"entry_type": "asset", "category": "equipment", "description": "Equipment purchase", "tags": "investing,capital"},
    # Liability transactions
    {"entry_type": "liability", "category": "payable", "description": "Accounts payable", "tags": "operating"},
    {"entry_type": "liability", "category": "bond", "description": "Bond proceeds received", "tags": "financing,bond"},
    # Equity transactions
    {"entry_type": "equity", "category": "fund_balance", "description": "Fund balance adjustment", "tags": ""},
]
