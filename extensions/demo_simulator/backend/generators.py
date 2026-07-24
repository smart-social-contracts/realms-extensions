"""
Demo Simulator — Entity generators.

Each generator function creates a batch of entities and updates state counters.
All generators use a seeded RNG derived from (seed + offset) so the output is
fully deterministic for a given seed value.
"""

import random
import time

from .constants import (
    CASE_TITLES,
    CITY_COORDINATES,
    CODEX_RAW_BASE,
    COURT_NAMES,
    DEFAULT_PROPOSAL_PROFILE,
    DEMO_CODEX_NAMES,
    DEPARTMENT_DEFINITIONS,
    EXPENSE_BUDGETS,
    FIRST_NAMES,
    FISCAL_PERIOD_DEFINITIONS,
    FUND_DEFINITIONS,
    JUDGE_SPECIALIZATIONS,
    LAND_TYPES,
    LAST_NAMES,
    LEDGER_TEMPLATES,
    MESSAGE_TEMPLATES,
    ORG_NAMES,
    PROPOSAL_PROFILES,
    PROPOSAL_TITLES,
    REVENUE_BUDGETS,
    VERDICT_DECISIONS,
    ZONE_NAMES,
)


def build_demo_citizen_payloads(state_data, count):
    """Build register_demo_citizens payloads (no side effects)."""
    import random
    import time

    payloads = []
    base_idx = state_data.get("total_users_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx)

    for i in range(count):
        idx = base_idx + i
        first = rng.choice(FIRST_NAMES)
        last = rng.choice(LAST_NAMES)
        principal = f"demo_user_{idx:04d}"

        city = rng.choice(CITY_COORDINATES)
        lat = city["lat"] + rng.uniform(-0.5, 0.5)
        lng = city["lng"] + rng.uniform(-0.5, 0.5)

        age_days = rng.randint(18 * 365, 70 * 365)
        birth_ts = int(time.time()) - age_days * 86400
        birth_year = 1970 + birth_ts // (365 * 86400)
        birth_day_of_year = (birth_ts % (365 * 86400)) // 86400
        birth_month = min(12, birth_day_of_year // 30 + 1)
        birth_day = max(1, min(28, birth_day_of_year % 30 + 1))
        dob = f"{birth_year:04d}-{birth_month:02d}-{birth_day:02d}"

        payloads.append({
            "principal": principal,
            "profile": "member",
            "profile_picture_url": (
                f"https://api.dicebear.com/7.x/personas/svg?seed={rng.randint(1, 999999)}"
            ),
            "human": {
                "name": f"{first} {last}",
                "date_of_birth": dob,
                "latitude": lat,
                "longitude": lng,
            },
            "member": {
                "id": f"demo_mem_{idx:04d}",
                "residence_permit": rng.choice(["valid", "expired", "pending"]),
                "tax_compliance": rng.choice(["compliant", "delinquent", "under_review"]),
                "identity_verification": rng.choice(["verified", "pending", "rejected"]),
                "voting_eligibility": rng.choice(["eligible", "ineligible", "suspended"]),
                "public_benefits_eligibility": rng.choice(["eligible", "ineligible", "conditional"]),
                "criminal_record": rng.choice(["clean", "minor_offenses", "major_offenses"]),
            },
        })

    return payloads


def generate_org_batch(state_data, count):
    """Generate a batch of organizations."""
    from ggg import Organization

    base_idx = state_data.get("total_orgs_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 10000)

    created = []
    for i in range(count):
        idx = base_idx + i
        name = rng.choice(ORG_NAMES)
        org = Organization(name=f"{name} #{idx + 1:03d}")
        created.append(org.name)

    state_data["total_orgs_created"] = base_idx + count
    return created


def _extract_proposal_title_base(title: str) -> str:
    """Strip the trailing ' (#N)' suffix from demo proposal titles."""
    if not title:
        return ""
    marker = " (#"
    if marker in title:
        return title.rsplit(marker, 1)[0].strip()
    return title.strip()


def _proposal_profile(title_base: str) -> dict:
    return PROPOSAL_PROFILES.get(title_base, DEFAULT_PROPOSAL_PROFILE)


def _is_legacy_proposal_description(description: str) -> bool:
    if not description:
        return True
    return description.startswith("Auto-generated demo")


def _escape_codex_string(value: str) -> str:
    return (value or "").replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")


def _demo_inline_new_codex(title_base: str, idx: int, codex_name: str) -> str:
    """Inline Python codex tailored to the proposal theme."""
    profile = _proposal_profile(title_base)
    summary = _escape_codex_string(profile["description"][:120])
    return (
        f'"""{title_base} — proposed codex ({codex_name})."""\n\n'
        f'PROPOSAL_ID = "demo_prop_{idx:04d}"\n'
        f'POLICY_TITLE = "{_escape_codex_string(title_base)}"\n'
        f'CODEX_NAME = "{codex_name}"\n\n'
        "def configure():\n"
        '    """Apply policy parameters when this proposal is executed."""\n'
        "    return {\n"
        '        "proposal_id": PROPOSAL_ID,\n'
        '        "codex": CODEX_NAME,\n'
        '        "policy": POLICY_TITLE,\n'
        f'        "summary": "{summary}...",\n'
        "    }\n\n"
        "def main():\n"
        '    logger.info("Executing demo codex for %s", POLICY_TITLE)\n'
        "    result = configure()\n"
        "    return result\n"
    )


def _demo_inline_amendment(title_base: str, codex_name: str, idx: int) -> str:
    """Amendment codex that references the realm baseline and the proposal theme."""
    profile = _proposal_profile(title_base)
    amend_target = profile.get("amend_target", codex_name)
    rationale = _escape_codex_string(profile["description"][:160])
    return (
        f'"""Amend {amend_target} — {title_base}."""\n\n'
        f'PROPOSAL_ID = "demo_prop_{idx:04d}"\n'
        f'BASELINE_CODEX = "{amend_target}"\n'
        f'POLICY_TITLE = "{_escape_codex_string(title_base)}"\n'
        f"DEMO_AMENDMENT_TAG = 'demo_prop_{idx:04d}'\n\n"
        "def apply_amendment():\n"
        '    """Describe the amendment applied on execution."""\n'
        "    return {\n"
        '        "proposal_id": PROPOSAL_ID,\n'
        '        "baseline_codex": BASELINE_CODEX,\n'
        '        "policy": POLICY_TITLE,\n'
        '        "amendment_tag": DEMO_AMENDMENT_TAG,\n'
        f'        "rationale": "{rationale}",\n'
        "    }\n\n"
        "def main():\n"
        f'    logger.info("Applying amendment to %s for %s", BASELINE_CODEX, POLICY_TITLE)\n'
        "    return apply_amendment()\n"
    )


def _build_demo_proposal_payload(title_base: str, idx: int, rng: random.Random):
    """Build description, metadata, and code_url for a demo proposal."""
    profile = _proposal_profile(title_base)
    description = profile["description"]
    kind = idx % 4
    metadata = {}
    code_url = ""
    code_checksum = ""

    if kind == 0:
        codex_name = profile.get("codex_name", f"demo_inline_{idx:04d}")
        metadata = {
            "proposal_type": "code_execution",
            "codex_name": codex_name,
            "code_inline": _demo_inline_new_codex(title_base, idx, codex_name),
        }
    elif kind == 1:
        codex_name = profile.get("amend_target") or rng.choice(DEMO_CODEX_NAMES)
        code_url = f"{CODEX_RAW_BASE}{codex_name}.py"
        metadata = {
            "proposal_type": "code_execution",
            "codex_name": codex_name,
            "policy_title": title_base,
        }
    elif kind == 2:
        codex_name = profile.get("amend_target") or rng.choice(DEMO_CODEX_NAMES)
        metadata = {
            "proposal_type": "codex_amendment",
            "codex_name": codex_name,
            "code_inline": _demo_inline_amendment(title_base, codex_name, idx),
        }
    else:
        names = list(DEMO_CODEX_NAMES)
        codex_entries = [
            {"name": names[0], "url": f"{CODEX_RAW_BASE}{names[0]}.py", "checksum": ""},
            {"name": names[1], "url": f"{CODEX_RAW_BASE}{names[1]}.py", "checksum": ""},
        ] if len(names) >= 2 else [
            {"name": names[0], "url": f"{CODEX_RAW_BASE}{names[0]}.py", "checksum": ""},
        ]
        code_url = codex_entries[0]["url"]
        metadata = {
            "proposal_type": "codex_amendment",
            "codices": codex_entries,
            "policy_title": title_base,
        }

    return description, metadata, code_url, code_checksum


def _proposal_needs_content_backfill(proposal) -> bool:
    import json

    if not (proposal.proposal_id or "").startswith("demo_prop_"):
        return False
    if _is_legacy_proposal_description(proposal.description or ""):
        return True
    meta = {}
    try:
        meta = json.loads(proposal.metadata) if proposal.metadata else {}
    except Exception:
        return True
    has_code = bool(
        meta.get("code_inline")
        or meta.get("codices")
        or (proposal.code_url and str(proposal.code_url) not in ("None", ""))
    )
    return not has_code


def backfill_proposal_content(page_size: int = 20, max_pages: int = 50):
    """Attach meaningful descriptions and code to legacy demo proposals."""
    import json

    from ggg import Proposal

    rng = random.Random(42)
    updated = []
    from_id = 1
    pages = 0
    max_id = Proposal.max_id()

    while from_id <= max_id and pages < max_pages:
        batch = Proposal.load_some(from_id=from_id, count=page_size)
        if not batch:
            break
        pages += 1

        for proposal in batch:
            entity_id = int(getattr(proposal, "_id", 0) or 0)
            if entity_id:
                from_id = entity_id + 1
            else:
                from_id += 1

            if not _proposal_needs_content_backfill(proposal):
                continue

            try:
                idx = int(proposal.proposal_id.split("_")[-1])
            except (ValueError, AttributeError):
                continue

            title_base = _extract_proposal_title_base(proposal.title or "")
            if not title_base:
                continue

            description, metadata, code_url, code_checksum = _build_demo_proposal_payload(
                title_base, idx, rng
            )
            proposal.description = description
            proposal.metadata = json.dumps(metadata)
            proposal.code_url = code_url or ""
            proposal.code_checksum = code_checksum or ""
            updated.append(proposal.proposal_id)

        if len(batch) < page_size:
            break

    return updated


def generate_proposal_batch(state_data, count):
    """Generate proposals covering inline, URL, and codex-amendment patterns."""
    import json

    from ggg import Proposal, User

    base_idx = state_data.get("total_proposals_created", 0)
    total_users = state_data.get("total_users_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 20000)

    created = []
    for i in range(count):
        idx = base_idx + i
        title = rng.choice(PROPOSAL_TITLES)
        proposer = None
        if total_users > 0:
            proposer = User[f"demo_user_{rng.randint(0, total_users - 1):04d}"]

        description, metadata, code_url, code_checksum = _build_demo_proposal_payload(
            title, idx, rng
        )

        p = Proposal(
            proposal_id=f"demo_prop_{idx:04d}",
            title=f"{title} (#{idx + 1})",
            description=description,
            code_url=code_url,
            code_checksum=code_checksum,
            status=rng.choice(["draft", "open", "voting", "approved", "rejected"]),
            proposer=proposer,
            metadata=json.dumps(metadata),
        )
        p.votes_yes = float(rng.randint(0, 20))
        p.votes_no = float(rng.randint(0, 10))
        p.votes_abstain = float(rng.randint(0, 5))
        created.append(f"demo_prop_{idx:04d}")

    state_data["total_proposals_created"] = base_idx + count
    return created


def generate_transfer_batch(state_data, count):
    """Generate a batch of transfers between existing demo users."""
    from ggg import Transfer

    base_idx = state_data.get("total_transfers_created", 0)
    total_users = state_data.get("total_users_created", 0)
    if total_users < 2:
        return []

    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 30000)

    created = []
    for i in range(count):
        idx = base_idx + i
        from_idx = rng.randint(0, total_users - 1)
        to_idx = rng.randint(0, total_users - 2)
        if to_idx >= from_idx:
            to_idx += 1

        Transfer(
            id=f"demo_tr_{idx:04d}",
            principal_from=f"demo_user_{from_idx:04d}",
            principal_to=f"demo_user_{to_idx:04d}",
            instrument="Realm Token",
            amount=rng.randint(1, 5000),
            timestamp=str(int(time.time())),
            transfer_type="internal",
            status="completed",
        )
        created.append(f"demo_tr_{idx:04d}")

    state_data["total_transfers_created"] = base_idx + count
    return created


def generate_dispute_batch(state_data, count):
    """Generate a batch of disputes."""
    from ggg import Dispute

    base_idx = state_data.get("total_disputes_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 40000)

    created = []
    for i in range(count):
        idx = base_idx + i
        Dispute(
            dispute_id=f"demo_dispute_{idx:04d}",
            status=rng.choice(["open", "investigating", "resolved", "closed", "appealed"]),
        )
        created.append(f"demo_dispute_{idx:04d}")

    state_data["total_disputes_created"] = base_idx + count
    return created


def generate_vote_batch(state_data, count):
    """Generate votes on existing proposals."""
    from ggg import Proposal, User, Vote

    total_users = state_data.get("total_users_created", 0)
    total_proposals = state_data.get("total_proposals_created", 0)
    if total_users < 1 or total_proposals < 1:
        return []

    base_idx = state_data.get("total_votes_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 50000)

    created = []
    for i in range(count):
        prop_idx = rng.randint(0, total_proposals - 1)
        user_idx = rng.randint(0, total_users - 1)
        proposal = Proposal[f"demo_prop_{prop_idx:04d}"]
        voter = User[f"demo_user_{user_idx:04d}"]
        if not proposal or not voter:
            continue
        Vote(
            proposal=proposal,
            voter=voter,
            vote_choice=rng.choice(["yes", "yes", "yes", "no", "no", "abstain"]),
        )
        created.append(f"vote_{base_idx + i}")

    state_data["total_votes_created"] = base_idx + len(created)
    return created


def generate_land_batch(state_data, count):
    """Generate land parcels with zones."""
    from ggg import Land, User, Zone

    def _make_h3(lat, lng, res):
        """Generate a deterministic pseudo-H3 index from coordinates.

        Real H3 geometry is computed on the frontend with h3-js. The backend only
        needs a stable cell identifier per parcel.
        """
        lat_hex = abs(int(lat * 10000)) & 0xFFFFFF
        lng_hex = abs(int(lng * 10000)) & 0xFFFFFF
        return f"8{res}{lat_hex:06x}{lng_hex:06x}f"

    total_users = state_data.get("total_users_created", 0)
    base_idx = state_data.get("total_lands_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 60000)

    created = []
    for i in range(count):
        idx = base_idx + i
        city = rng.choice(CITY_COORDINATES)
        lat = city["lat"] + rng.uniform(-0.5, 0.5)
        lng = city["lng"] + rng.uniform(-0.5, 0.5)

        owner = None
        if total_users > 0 and rng.random() > 0.3:
            owner = User[f"demo_user_{rng.randint(0, total_users - 1):04d}"]

        land = Land(
            id=f"demo_land_{idx:04d}",
            x_coordinate=int(lat * 1000),
            y_coordinate=int(lng * 1000),
            land_type=rng.choice(LAND_TYPES),
            size_width=rng.randint(1, 10),
            size_height=rng.randint(1, 10),
            status="active",
        )
        if owner:
            try:
                land.owner_user = owner
            except Exception:
                pass

        zone_name = rng.choice(ZONE_NAMES)
        h3_idx = _make_h3(lat, lng, 6)

        zone = Zone(
            h3_index=h3_idx,
            name=f"{zone_name} {idx + 1}",
            description=f"Land parcel in {city['name']}",
            zone_type=rng.choice(LAND_TYPES),
        )
        try:
            zone.land = land
            if owner:
                zone.user = owner
        except Exception:
            pass
        created.append(f"demo_land_{idx:04d}")

    state_data["total_lands_created"] = base_idx + count
    return created


def generate_court_batch(state_data, count):
    """Generate courts and judges."""
    from ggg import Court, Judge, Member

    base_idx = state_data.get("total_courts_created", 0)
    total_members = state_data.get("total_users_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 70000)

    created = []
    for i in range(count):
        idx = base_idx + i
        court_name = COURT_NAMES[idx % len(COURT_NAMES)]
        level = rng.choice(["first_instance", "first_instance", "appellate", "specialized"])

        court = Court(
            name=f"{court_name} #{idx + 1}",
            description=f"Demo court for {JUDGE_SPECIALIZATIONS[idx % len(JUDGE_SPECIALIZATIONS)]}",
            jurisdiction="General",
            level=level,
            status="active",
        )

        if total_members > 2:
            judge_member_idx = rng.randint(0, total_members - 1)
            member = Member[f"demo_mem_{judge_member_idx:04d}"]
            if member:
                judge = Judge(
                    id=f"demo_judge_{idx:04d}",
                    appointment_date="2026-01-01",
                    status="active",
                    specialization=JUDGE_SPECIALIZATIONS[idx % len(JUDGE_SPECIALIZATIONS)],
                )
                try:
                    judge.member = member
                    judge.court = court
                except Exception:
                    pass

        created.append(court.name)

    state_data["total_courts_created"] = base_idx + count
    return created


def generate_case_batch(state_data, count):
    """Generate cases with verdicts."""
    from ggg import Case, Court, User, Verdict

    total_users = state_data.get("total_users_created", 0)
    total_courts = state_data.get("total_courts_created", 0)
    if total_users < 2 or total_courts < 1:
        return []

    base_idx = state_data.get("total_cases_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 80000)

    created = []
    for i in range(count):
        idx = base_idx + i
        plaintiff_idx = rng.randint(0, total_users - 1)
        defendant_idx = rng.randint(0, total_users - 2)
        if defendant_idx >= plaintiff_idx:
            defendant_idx += 1

        plaintiff = User[f"demo_user_{plaintiff_idx:04d}"]
        defendant = User[f"demo_user_{defendant_idx:04d}"]
        if not plaintiff or not defendant:
            continue

        status = rng.choice(["filed", "assigned", "in_progress", "verdict_issued", "closed"])
        case = Case(
            case_number=f"DEMO-2026-{idx:04d}",
            title=rng.choice(CASE_TITLES),
            description=f"Auto-generated demo case #{idx + 1}",
            status=status,
            filed_date="2026-01-15",
        )
        try:
            case.plaintiff = plaintiff
            case.defendant = defendant
        except Exception:
            pass

        if status in ("verdict_issued", "closed"):
            verdict = Verdict(
                id=f"demo_verdict_{idx:04d}",
                decision=rng.choice(VERDICT_DECISIONS),
                reasoning=f"Based on evidence presented in case DEMO-2026-{idx:04d}",
                issued_date="2026-03-01",
            )
            try:
                verdict.case = case
            except Exception:
                pass

        created.append(case.case_number)

    state_data["total_cases_created"] = base_idx + count
    return created


# ── Finance generators (for Metrics extension) ──────────────────────────────


def generate_fund_batch(state_data, count):
    """Generate governmental funds (idempotent — skips existing codes)."""
    from ggg import Fund

    created = []
    for defn in FUND_DEFINITIONS[:count]:
        existing = Fund[defn["code"]]
        if existing:
            continue
        Fund(
            code=defn["code"],
            name=defn["name"],
            fund_type=defn["fund_type"],
            description=defn["description"],
        )
        created.append(defn["code"])

    state_data["total_funds_created"] = state_data.get("total_funds_created", 0) + len(created)
    return created


def generate_fiscal_period_batch(state_data, count):
    """Generate fiscal periods (idempotent — skips existing IDs)."""
    from ggg import FiscalPeriod

    created = []
    for defn in FISCAL_PERIOD_DEFINITIONS[:count]:
        existing = FiscalPeriod[defn["id"]]
        if existing:
            continue
        FiscalPeriod(
            id=defn["id"],
            name=defn["name"],
            start_date=defn["start_date"],
            end_date=defn["end_date"],
            status=defn["status"],
        )
        created.append(defn["id"])

    state_data["total_fiscal_periods_created"] = state_data.get("total_fiscal_periods_created", 0) + len(created)
    return created


def generate_budget_batch(state_data, count):
    """Generate budget line items linked to funds and fiscal periods."""
    from ggg import Budget, FiscalPeriod, Fund

    funds = list(Fund.instances())
    periods = list(FiscalPeriod.instances())
    if not funds or not periods:
        return []

    base_idx = state_data.get("total_budgets_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 90000)

    all_budgets = REVENUE_BUDGETS + EXPENSE_BUDGETS
    created = []
    for i in range(count):
        idx = base_idx + i
        template = all_budgets[idx % len(all_budgets)]
        fund = rng.choice(funds)
        period = rng.choice(periods)

        planned = rng.randint(10_000, 500_000)
        variance = rng.uniform(-0.15, 0.25)
        actual = max(0, int(planned * (1 + variance)))

        Budget(
            id=f"demo_budget_{idx:04d}",
            name=template["name"],
            category=template["category"],
            budget_type=template["budget_type"],
            planned_amount=planned,
            actual_amount=actual,
            status=rng.choice(["draft", "proposed", "adopted", "adopted", "adopted"]),
            fund=fund,
            fiscal_period=period,
        )
        created.append(f"demo_budget_{idx:04d}")

    state_data["total_budgets_created"] = base_idx + count
    return created


def generate_ledger_batch(state_data, count):
    """Generate double-entry ledger entries linked to funds and fiscal periods."""
    from ggg import FiscalPeriod, Fund, LedgerEntry

    funds = list(Fund.instances())
    periods = list(FiscalPeriod.instances())
    if not funds or not periods:
        return []

    base_idx = state_data.get("total_ledger_entries_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 100000)

    created = []
    for i in range(count):
        idx = base_idx + i
        template = rng.choice(LEDGER_TEMPLATES)
        fund = rng.choice(funds)
        period = rng.choice(periods)

        amount = rng.randint(500, 150_000)
        tx_id = f"demo_tx_{idx:04d}"

        month = rng.randint(1, 12)
        day = rng.randint(1, 28)
        year = 2026 if period.id == "FY2026" else 2025
        entry_date = f"{year}-{month:02d}-{day:02d}"

        # Primary entry
        if template["entry_type"] in ("revenue", "liability", "equity"):
            debit, credit = 0, amount
        else:
            debit, credit = amount, 0

        LedgerEntry(
            id=f"demo_le_{idx:04d}_a",
            transaction_id=tx_id,
            entry_type=template["entry_type"],
            category=template["category"],
            debit=debit,
            credit=credit,
            entry_date=entry_date,
            fund=fund,
            fiscal_period=period,
            description=template["description"],
            tags=template.get("tags", ""),
        )

        # Balancing cash entry (the other side of double-entry)
        LedgerEntry(
            id=f"demo_le_{idx:04d}_b",
            transaction_id=tx_id,
            entry_type="asset",
            category="cash",
            debit=credit,
            credit=debit,
            entry_date=entry_date,
            fund=fund,
            fiscal_period=period,
            description=f"Cash {'receipt' if credit > 0 else 'disbursement'} — {template['description']}",
            tags=template.get("tags", ""),
        )

        created.append(tx_id)

    state_data["total_ledger_entries_created"] = base_idx + count
    return created


def generate_notification_batch(state_data, count):
    """Generate notification messages for existing demo users."""
    from ggg import Notification, User

    total_users = state_data.get("total_users_created", 0)
    if total_users < 1:
        return []

    base_idx = state_data.get("total_notifications_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 110000)

    created = []
    for i in range(count):
        idx = base_idx + i
        user_idx = rng.randint(0, total_users - 1)
        user = User[f"demo_user_{user_idx:04d}"]
        if not user:
            continue

        template = rng.choice(MESSAGE_TEMPLATES)
        Notification(
            topic=template["topic"],
            title=template["title"],
            message=template["message"],
            sender="Realm System",
            recipient=f"demo_user_{user_idx:04d}",
            user=user,
            read=rng.random() < 0.4,
            icon="bell",
            href="/messages",
            color=rng.choice(["blue", "green", "amber", "red"]),
        )
        created.append(f"demo_notif_{idx:04d}")

    state_data["total_notifications_created"] = base_idx + len(created)
    return created


def generate_department_batch(state_data, count):
    """Generate departments and assign existing demo users to them."""
    from ggg import Department, User

    total_users = state_data.get("total_users_created", 0)
    base_idx = state_data.get("total_departments_created", 0)
    seed = state_data.get("seed", 42)
    rng = random.Random(seed + base_idx + 120000)

    created = []
    for i in range(count):
        idx = base_idx + i
        if idx >= len(DEPARTMENT_DEFINITIONS):
            break

        defn = DEPARTMENT_DEFINITIONS[idx]
        existing = Department[defn["name"]]
        if existing:
            continue

        dept = Department(
            name=defn["name"],
            description=defn["description"],
        )

        if total_users > 0:
            head_idx = rng.randint(0, total_users - 1)
            head = User[f"demo_user_{head_idx:04d}"]
            if head:
                try:
                    dept.head = head
                except Exception:
                    pass

            member_count = rng.randint(2, min(8, total_users))
            member_indices = rng.sample(range(total_users), member_count)
            for m_idx in member_indices:
                member = User[f"demo_user_{m_idx:04d}"]
                if member:
                    try:
                        from core.membership import add_department_member

                        add_department_member(dept, member)
                    except Exception:
                        pass

        created.append(dept.name)

    state_data["total_departments_created"] = base_idx + len(created)
    return created
