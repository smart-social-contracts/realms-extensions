"""Demo Simulator: one batch of demo data per call, created through realm operations.

Runs sandboxed (CPython builtins only, so no ``random``) and creates everything with
``rpc``, as the user running the batch. ``run_batch`` is the step of the realm task
``demo_simulator`` that the frontend creates and schedules: each batch is one run of
that task, and the run's number drives the rotation between entity types.
"""

TASK = "demo_simulator"
TYPES = (
    "users",
    "organizations",
    "proposals",
    "disputes",
    "lands",
    "courts",
    "funds",
    "fiscal_periods",
    "budgets",
    "messages",
    "departments",
)
COUNTED = {
    "users": "User",
    "organizations": "Organization",
    "proposals": "Proposal",
    "messages": "Notification",
    "departments": "Department",
}
JUSTICE = "Justice"

# fmt: off
FIRST_NAMES = (
    "Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Helen",
    "Ivan", "Julia", "Kevin", "Laura", "Michael", "Nina", "Oliver", "Patricia",
    "Quinn", "Rachel", "Samuel", "Tina", "Ulrich", "Victoria", "William", "Xara",
    "Yuki", "Zoe", "Adrian", "Bella", "Carlos", "Delia", "Erik", "Fatima",
    "Hugo", "Iris", "Jin", "Kira", "Leo", "Maya", "Niko", "Olga",
)
LAST_NAMES = (
    "Anderson", "Brown", "Clark", "Davis", "Evans", "Fisher", "Garcia", "Harris",
    "Johnson", "King", "Lee", "Miller", "Nelson", "O'Connor", "Parker", "Quinn",
    "Rodriguez", "Smith", "Taylor", "Underwood", "Valdez", "Wilson", "Xavier",
    "Young", "Zhang", "Adams", "Baker", "Cooper", "Duncan", "Ellis", "Foster",
)
ORG_NAMES = (
    "Digital Services Corp", "Green Energy Solutions", "Healthcare Partners",
    "Education Foundation", "Transport Authority", "Housing Development Co",
    "Financial Services Inc", "Technology Innovations", "Agricultural Cooperative",
    "Environmental Protection Agency", "Cultural Heritage Foundation",
    "Community Development Trust", "Infrastructure Management", "Social Services Org",
)
PROPOSALS = (
    (
        "Increase public transport budget",
        "This proposal allocates an additional 12% of the municipal mobility fund to "
        "expand bus and tram service frequency in underserved districts. It authorizes "
        "the Transport Authority to renegotiate operator contracts, subsidize off-peak "
        "fares for students and seniors, and publish monthly ridership dashboards. "
        "Funding is phased over two fiscal years with quarterly performance reviews.",
    ),
    (
        "Create community garden in District 3",
        "District 3 residents request a 2,400 m² community garden on the vacant lot at "
        "Maple & 5th. The plan includes raised beds, composting, a rainwater collection "
        "system, and a shared tool library. A neighborhood cooperative will manage day-to-day "
        "operations; the realm grants a 10-year land-use license and seed funding for "
        "infrastructure and insurance.",
    ),
    (
        "Establish digital identity standards",
        "Members propose a realm-wide digital identity standard so citizens can prove "
        "membership, sign documents, and access services without repeated KYC. The standard "
        "must be open, auditable, and interoperable with Internet Identity. A technical "
        "working group will publish reference implementations and a 90-day migration path "
        "for existing integrations.",
    ),
    (
        "Fund renewable energy research",
        "The Green Energy Solutions cooperative seeks 500,000 realm tokens over three years "
        "to pilot solar micro-grids on public buildings and publish open datasets on "
        "generation and consumption. Milestones tie disbursements to installed capacity, "
        "peer-reviewed reports, and citizen-accessible monitoring dashboards.",
    ),
    (
        "Build new community center",
        "This capital project constructs a multi-purpose community center with meeting "
        "rooms, a childcare co-op space, and a public library annex. Construction follows "
        "green-building guidelines; 30% of subcontracting is reserved for local worker "
        "cooperatives. The center will be governed by a mixed board of residents and "
        "elected delegates.",
    ),
    (
        "Implement universal basic income pilot",
        "A 18-month UBI pilot will provide a fixed monthly transfer to 500 randomly "
        "selected verified members in Districts 1–3. Researchers will measure effects on "
        "employment, health outcomes, and local commerce. Transfers are funded from the "
        "general treasury with independent audit and public anonymized reporting.",
    ),
    (
        "Expand healthcare coverage",
        "Healthcare Partners proposes extending preventive care coverage to all verified "
        "members, including dental screenings, mental-health counseling sessions, and "
        "telemedicine. Premiums are capped as a percentage of income; a public formulary "
        "committee reviews drug pricing quarterly.",
    ),
    (
        "Create open-source governance tools",
        "Fund development of open-source tooling for proposal drafting, deliberation "
        "threads, and vote auditing on the Internet Computer. Deliverables include APIs, "
        "documentation, and reference UIs that any realm can fork. All code is MIT-licensed "
        "and maintained by a contributor guild with transparent treasury reporting.",
    ),
    (
        "Establish data privacy framework",
        "This codex defines how member data may be collected, stored, shared, and deleted "
        "across realm services. It mandates purpose limitation, encryption at rest, breach "
        "notification within 72 hours, and a citizen data-rights portal. Departments must "
        "publish data inventories and obtain opt-in consent for non-essential processing.",
    ),
    (
        "Fund education technology initiative",
        "The Education Foundation requests funding for tablets, offline-capable learning "
        "content, and teacher training in rural districts. The program targets grades 6–12, "
        "emphasizes digital literacy and civic education, and requires open licensing of "
        "curriculum materials produced with public funds.",
    ),
)
DISPUTE_TITLES = (
    "Contract breach in service agreement",
    "Property boundary disagreement",
    "Payment delay on completed work",
    "Intellectual property licensing dispute",
    "Employment termination challenge",
    "Environmental compliance violation",
    "Tax assessment contestation",
    "Zoning regulation interpretation",
)
COURTS = (
    ("District Court of Commerce", "Commercial law"),
    ("Civil Rights Tribunal", "Civil rights"),
    ("Environmental Court", "Environmental law"),
    ("Labor Arbitration Court", "Labor disputes"),
    ("Family & Property Court", "Property law"),
    ("Digital Disputes Tribunal", "Digital & IP law"),
    ("Tax Appeals Court", "Tax law"),
    ("Supreme Court of Appeals", "Constitutional law"),
)
COURT_LEVELS = ("first_instance", "first_instance", "appellate", "specialized")
LAND_TYPES = ("residential", "agricultural", "industrial", "commercial")
ZONE_NAMES = (
    "Central District", "Harbor Quarter", "Innovation Park", "Old Town",
    "Riverside", "Mountain View", "Lake District", "Sunset Hills",
    "Market Square", "Garden Heights", "Tech Valley", "Arts Quarter",
)
CITIES = (
    "Paris", "New York", "Tokyo", "Sydney", "London",
    "Berlin", "Seoul", "Singapore", "Dubai", "São Paulo",
)
DEPARTMENTS = (
    ("Treasury", "Manages public finances, budgets, and fiscal policy"),
    (JUSTICE, "Oversees courts, legal affairs, and dispute resolution"),
    ("Public Works", "Infrastructure, roads, and municipal facilities"),
    ("Health & Social Services", "Healthcare, welfare, and community support"),
    ("Education", "Schools, training programs, and educational initiatives"),
    ("Environment", "Environmental protection, sustainability, and conservation"),
    ("Land & Territory", "Land registry, zoning, and urban planning"),
    ("Digital Services", "Technology, digital identity, and IT infrastructure"),
    ("Commerce & Trade", "Business licensing, trade regulation, and economic development"),
    ("Public Safety", "Security, emergency services, and civil protection"),
)
MESSAGES = (
    ("governance", "New proposal submitted for review", "A new governance proposal has been submitted and is awaiting community review. Please check the Voting section for details."),
    ("governance", "Voting period opened", "A voting period has opened for a pending proposal. Cast your vote before the deadline."),
    ("governance", "Proposal approved by majority", "A governance proposal has been approved with majority support. Implementation will begin shortly."),
    ("finance", "Invoice generated for membership dues", "Your membership dues invoice has been generated. Please review and complete payment at your earliest convenience."),
    ("finance", "Payment received — thank you", "Your recent payment has been successfully processed and recorded. Thank you for your contribution."),
    ("finance", "Budget report available", "The quarterly budget report is now available. Review the financial summary in the Dashboard."),
    ("system", "Welcome to the community", "Welcome! Your membership has been activated. Explore the dashboard to get started with governance, services, and more."),
    ("system", "Profile update reminder", "Your profile is incomplete. Please update your public and private data in the Account section for full access to community services."),
    ("system", "Scheduled maintenance notice", "A brief maintenance window is planned. Some services may be temporarily unavailable during this period."),
    ("legal", "Case status update", "There has been an update to a case you are involved in. Please check the Justice section for the latest status."),
    ("legal", "New dispute filed", "A dispute has been filed that may involve you. Review the details in the Justice section."),
    ("land", "Zoning change notification", "A zoning change has been proposed in your area. Review the details in Land & Territory."),
    ("land", "Land registration confirmed", "Your land parcel registration has been confirmed and recorded in the registry."),
    ("department", "Department assignment update", "You have been assigned to a new department. Check the Administration section for details."),
    ("department", "Department meeting scheduled", "A department meeting has been scheduled. Please review the agenda and confirm attendance."),
)
FUNDS = (
    ("GF", "General Fund", "general"),
    ("SR", "Special Revenue Fund", "special_revenue"),
    ("CP", "Capital Projects Fund", "capital_projects"),
    ("DS", "Debt Service Fund", "debt_service"),
    ("ENT", "Enterprise Fund", "enterprise"),
)
PERIODS = (
    ("FY2025", "Fiscal Year 2025", 1735689600, 1767225600),
    ("FY2026", "Fiscal Year 2026", 1767225600, 1798761600),
)
BUDGETS = (
    ("Property Tax Revenue", "revenue"),
    ("Income Tax Revenue", "revenue"),
    ("License & Permit Fees", "revenue"),
    ("Service Fees", "revenue"),
    ("Intergovernmental Grants", "revenue"),
    ("Utility Charges", "revenue"),
    ("Personnel & Salaries", "expense"),
    ("Office Supplies & Materials", "expense"),
    ("Contracted Services", "expense"),
    ("Capital Improvements", "expense"),
    ("Debt Service Payments", "expense"),
    ("IT & Technology Services", "expense"),
    ("Vehicle & Equipment Maintenance", "expense"),
)
# fmt: on


class Rng:
    """A seeded linear congruential generator, so a seed always yields the same data."""

    def __init__(self, seed):
        self.state = seed % 2147483648

    def below(self, n):
        self.state = (self.state * 1103515245 + 12345) % 2147483648
        return (self.state >> 8) % n

    def choice(self, items):
        return items[self.below(len(items))]

    def sample(self, items, k):
        pool = list(items)
        return [pool.pop(self.below(len(pool))) for _ in range(min(k, len(pool)))]


class Batch:
    def __init__(self, seed, number):
        self.seed, self.number = seed, number
        self.rows = rpc("realm_monitor")["rows"]
        self.created, self.errors = {}, []
        self._people = None

    def rng(self, offset):
        return Rng(self.seed * 7919 + self.number * 131 + offset)

    @property
    def people(self):
        """Ids of the realm's first users, for owners, respondents and recipients."""
        if self._people is None:
            self._people = [u["id"] for u in rpc("user_list", count=100)["users"]]
        return self._people

    def record(self, kind, reply, n):
        if reply["ok"]:
            self.created[kind] = self.created.get(kind, 0) + n
        else:
            self.errors.append({kind: reply["error"]})

    def make(self, kind, op, key, /, **args):
        """Call ``op`` and return the id it reports under ``key`` (none when it failed or went to a vote)."""
        reply = rpc(op, **args)
        self.record(kind, reply, 1 if key in reply else 0)
        return reply.get(key)


def users(b, n):
    rng, base = b.rng(0), b.rows["User"]
    batch = [
        {
            "user": f"demo_user_{base + i:04d}",
            "nickname": f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}",
        }
        for i in range(n)
    ]
    reply = rpc("user_import", users=batch)
    b.record("users", reply, reply.get("added", 0))


def organizations(b, n):
    rng = b.rng(10000)
    for i in range(n):
        name = f"{rng.choice(ORG_NAMES)} #{b.rows['Organization'] + i + 1:03d}"
        b.make(
            "organizations", "organization_register", "organization", organization=name
        )


def proposals(b, n):
    rng = b.rng(20000)
    for i in range(n):
        title, description = rng.choice(PROPOSALS)
        b.make(
            "proposals",
            "proposal_create",
            "proposal",
            title=f"{title} (#{b.rows['Proposal'] + i + 1})",
            description=description,
        )


def disputes(b, n):
    rng = b.rng(40000)
    for _ in range(n):
        b.make(
            "disputes",
            "dispute_file",
            "dispute",
            respondent=rng.choice(b.people),
            title=rng.choice(DISPUTE_TITLES),
        )


def lands(b, n):
    rng = b.rng(60000)
    for _ in range(n):
        b.make(
            "lands",
            "land_register",
            "land",
            x=rng.below(4096),
            y=rng.below(4096),
            width=1 + rng.below(10),
            height=1 + rng.below(10),
            owner=rng.choice(b.people),
            kind=rng.choice(LAND_TYPES),
            metadata={"zone": rng.choice(ZONE_NAMES), "city": rng.choice(CITIES)},
        )


def courts(b, n):
    rng = b.rng(70000)
    if not rpc("department_get", department=JUSTICE)["ok"]:
        b.make("departments", "department_create", "department", department=JUSTICE)
    for _ in range(n):
        name, specialization = rng.choice(COURTS)
        court = b.make(
            "courts",
            "court_create",
            "court",
            name=name,
            operator=f"Department:{JUSTICE}",
            level=rng.choice(COURT_LEVELS),
            jurisdiction="General",
        )
        if court:
            judge = rng.choice(b.people)
            b.record(
                "courts",
                rpc(
                    "judge_appoint",
                    user=judge,
                    court=court,
                    specialization=specialization,
                ),
                0,
            )


def funds(b, n):
    for code, name, kind in FUNDS[:n]:
        b.make("funds", "fund_create", "fund", fund=code, name=name, kind=kind)


def fiscal_periods(b, n):
    for period, name, starts, ends in PERIODS[:n]:
        b.make(
            "fiscal_periods",
            "period_open",
            "period",
            period=period,
            name=name,
            starts_at=starts,
            ends_at=ends,
        )


def budgets(b, n):
    rng = b.rng(90000)
    for i in range(n):
        category, kind = BUDGETS[(b.number + i) % len(BUDGETS)]
        budget = b.make(
            "budgets",
            "budget_draft",
            "budget",
            fund=rng.choice(FUNDS)[0],
            period=rng.choice(PERIODS)[0],
            category=category,
            kind=kind,
            planned=10000 + rng.below(490000),
        )
        if budget and rng.below(5) >= 2:
            b.record("budgets", rpc("budget_propose", budget=budget), 0)


def messages(b, n):
    rng = b.rng(110000)
    for _ in range(n):
        topic, title, body = rng.choice(MESSAGES)
        b.make(
            "messages",
            "notification_send",
            "notification",
            recipient=f"User:{rng.choice(b.people)}",
            title=title,
            body=body,
            href="/messages",
            topic=topic,
        )


def departments(b, n):
    rng = b.rng(120000)
    todo = [d for d in DEPARTMENTS if not rpc("department_get", department=d[0])["ok"]]
    for name, description in todo[:n]:
        if not b.make(
            "departments",
            "department_create",
            "department",
            department=name,
            description=description,
        ):
            continue
        members = rng.sample(b.people, 2 + rng.below(7))
        position = f"{name} member"
        reply = rpc(
            "position_create",
            department=name,
            position=position,
            title="Member",
            headcount=len(members),
        )
        b.record("departments", reply, 0)
        if reply["ok"]:
            for user in members:
                b.record("departments", rpc("appoint", user=user, position=position), 0)
            b.record(
                "departments",
                rpc("department_edit", department=name, head=members[0]),
                0,
            )


GENERATORS = {
    "users": users,
    "organizations": organizations,
    "proposals": proposals,
    "disputes": disputes,
    "lands": lands,
    "courts": courts,
    "funds": funds,
    "fiscal_periods": fiscal_periods,
    "budgets": budgets,
    "messages": messages,
    "departments": departments,
}


def default_count(kind, batch_size):
    bs = max(1, int(batch_size))
    half, third = max(1, bs // 2), max(1, bs // 3)
    return {
        "organizations": half,
        "proposals": half,
        "disputes": third,
        "lands": half,
        "courts": third,
        "funds": 5,
        "fiscal_periods": 2,
        "budgets": max(2, bs),
        "departments": max(2, bs),
    }.get(kind, bs)


def run_batch(config):
    """Create one batch under the simulator's ``config``: ``enabled_types``, ``type_counts``
    (overrides of the counts derived from ``batch_size``), ``seed``, ``rotation_mode`` and
    ``max_entities`` (a cap on the realm's counted rows)."""
    number = int(
        rpc("task_logs", task=TASK, count=1)["runs"][0]["name"].rsplit("#", 1)[1]
    )
    b = Batch(int(config["seed"]), number)
    cap = config.get("max_entities")
    if cap and sum(b.rows[e] for e in COUNTED.values()) >= cap:
        return {"status": "paused", "reason": "max_entities_reached"}
    enabled = [t for t in TYPES if config["enabled_types"].get(t)]
    if not enabled:
        return {"status": "skipped", "reason": "no_enabled_types", "batch": number}
    mode = config["rotation_mode"]
    if mode == "all":
        picked = enabled
    elif mode == "random":
        picked = [b.rng(9973).choice(enabled)]
    else:
        picked = [enabled[(number - 1) % len(enabled)]]
    for kind in picked:
        override = config["type_counts"].get(kind)
        GENERATORS[kind](
            b,
            (
                default_count(kind, config["batch_size"])
                if override is None
                else int(override)
            ),
        )
    return {
        "status": "ok",
        "batch": number,
        "types": picked,
        "created": b.created,
        "errors": b.errors,
    }
