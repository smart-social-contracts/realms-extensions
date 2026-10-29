import json
import os

import fake_chain
import world
from core.op import run
from ggg import Department, Land, Organization, Proposal, User
from kit import ok

EXT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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


def config(**overrides):
    return {
        "interval_seconds": 30,
        "batch_size": 3,
        "max_entities": None,
        "seed": 7,
        "rotation_mode": "all",
        "enabled_types": {t: True for t in TYPES},
        "type_counts": {},
        **overrides,
    }


def simulator(install, cfg):
    """The task the frontend creates: one step calling ``run_batch`` with the saved config."""
    install(EXT)
    world.person("ada", "admin")
    step = {
        "op": "extension_call",
        "args": {
            "extension": "demo_simulator",
            "function": "run_batch",
            "args": {"config": cfg},
        },
        "wait": 0,
    }
    ok("task_create", "ada", name="demo_simulator", steps=[step])


def run_once():
    ok("task_run", "ada", task="demo_simulator")
    run = ok("task_logs", "ada", task="demo_simulator", count=1)["runs"][0]
    reply = json.loads(run["result"])
    assert reply["ok"], reply
    return reply["result"]


def test_one_batch_creates_every_type_through_operations(install):
    simulator(install, config())
    users = User.count()
    out = run_once()
    assert out["status"] == "ok" and out["batch"] == 1 and out["errors"] == []
    assert out["types"] == list(TYPES) and set(out["created"]) == set(TYPES)
    assert User.count() == users + 3 and User["demo_user_0008"] is not None
    assert Proposal.count() == 1 and Land.count() == 1
    treasury = Department["Treasury"]
    assert treasury is not None and treasury.head in [
        p.id for p in User.load_some(1, User.count())
    ]


def test_round_robin_takes_the_next_type_on_each_run(install):
    simulator(install, config(rotation_mode="round_robin"))
    assert [run_once()["types"] for _ in range(3)] == [
        ["users"],
        ["organizations"],
        ["proposals"],
    ]


def test_the_cap_pauses_the_simulator(install):
    simulator(install, config(max_entities=10))
    assert run_once() == {"status": "paused", "reason": "max_entities_reached"}


def test_nothing_enabled_skips_the_batch(install):
    simulator(install, config(enabled_types={}))
    assert run_once()["reason"] == "no_enabled_types"


def test_a_seed_yields_the_same_members(install):
    simulator(install, config(rotation_mode="round_robin", type_counts={"users": 2}))
    run_once()
    names = [User[f"demo_user_{i:04d}"].nickname for i in (8, 9)]
    assert names == ["Jin Underwood", "Victoria Young"]


def test_the_schedule_runs_batches_on_its_own(install):
    simulator(install, config(rotation_mode="round_robin"))
    ok("task_schedule", "ada", task="demo_simulator", repeat_every=30)
    for _ in range(2):
        _, fire = fake_chain.state["timers"].pop()
        run(fire())
    assert User["demo_user_0008"] is not None and Organization.count() == 3
