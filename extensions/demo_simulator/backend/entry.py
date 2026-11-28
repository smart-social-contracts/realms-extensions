"""demo_simulator: simulated members for a demo realm, added in batches on a schedule until this canister of the realm
holds as many as it should.

It runs in the realm's sandbox: a subinterpreter with Python's built-in modules only (no ``json``, no ``hashlib``),
whose only way out is ``rpc(op, **args)``, a realm operation its manifest declares, run as the member who called it.
So it adds members through ``user_import`` and keeps its settings in its own task, and it cannot write rows the way
the in-process version did: it creates no proposals, votes or transfers "by" a simulated member, since nobody can act
as a member without that member's key. Activity comes from people who hold keys (a demo's cast, the geister swarm).

Each canister of a realm runs its own copy, the capital and every quarter, because an extension cannot call another
canister. A quarter the realm grows by itself gets the extension when its capital furnishes it; its own schedule is
started there (``toggle``), by an administrator or a setup script.

A simulated member's principal has the shape of a self-authenticating id (29 bytes ending in 0x02) made from this
canister's id, the seed and the member's index, not from a public key: no key exists for it, so nobody can sign as
it. Its index is the canister's population when it is added, so the members of one canister and one seed are always
the same ones.
"""

TASK = "demo_simulator"
EXTENSION = "demo_simulator"
DEFAULTS = {"batch_size": 200, "interval_seconds": 5, "target": 0, "seed": 1}
BATCH_MAX = 1000  # members per run, one user_import. Measured on a local network (28 Nov 2026): one message adds
# 2,000 members, 3,000 go over the 40 billion instructions a message may use; 1,000 take 5.4 s from 4,000 to 10,000.
INTERVAL_MIN = 1

FIRST_NAMES = (
    "Alba", "Andreu", "Aitana", "Bruno", "Carla", "Daniel", "Elena", "Enric", "Fatima", "Gabriel", "Hugo", "Ines",
    "Jaume", "Julia", "Kenji", "Laia", "Leo", "Lucia", "Marc", "Maria", "Marta", "Mateo", "Nadia", "Nil", "Noa",
    "Oriol", "Paula", "Pau", "Rosa", "Sara", "Sergi", "Sofia", "Tomas", "Vera", "Victor", "Xenia", "Yara", "Zoe",
    "Adria", "Amira", "Ivan", "Olga", "Wei", "Amara", "Diego", "Irene", "Joan", "Lola", "Raul", "Teresa",
)
LAST_NAMES = (
    "Alonso", "Bosch", "Camps", "Diaz", "Escriva", "Ferrer", "Garcia", "Gimeno", "Herrero", "Ibanez", "Jimenez",
    "Llopis", "Lopez", "Marti", "Mas", "Molina", "Navarro", "Ortega", "Perez", "Pons", "Ribes", "Roig", "Sanchis",
    "Soler", "Tormo", "Torres", "Vidal", "Vila", "Zhang", "Okafor", "Nguyen", "Silva", "Novak", "Haddad", "Kim",
)


# ---- principals, with built-in modules only

_CRC_TABLE = []


def crc32(data):
    """CRC-32 (IEEE), as the principal text format checksums its bytes."""
    if not _CRC_TABLE:
        for n in range(256):
            c = n
            for _ in range(8):
                c = (0xEDB88320 ^ (c >> 1)) if c & 1 else (c >> 1)
            _CRC_TABLE.append(c)
    crc = 0xFFFFFFFF
    for b in data:
        crc = _CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >> 8)
    return crc ^ 0xFFFFFFFF


_BASE32 = "abcdefghijklmnopqrstuvwxyz234567"


def base32(data):
    """RFC 4648 base32, lower case, without padding."""
    out, bits, value = [], 0, 0
    for b in data:
        value, bits = (value << 8) | b, bits + 8
        while bits >= 5:
            bits -= 5
            out.append(_BASE32[(value >> bits) & 31])
    if bits:
        out.append(_BASE32[(value << (5 - bits)) & 31])
    return "".join(out)


def be(n, size):
    return bytes((n >> (8 * (size - 1 - i))) & 0xFF for i in range(size))


def principal_text(raw):
    """The text form of the principal ``raw``: its CRC-32, then the bytes, in base32 groups of five."""
    text = base32(be(crc32(raw), 4) + raw)
    return "-".join(text[i:i + 5] for i in range(0, len(text), 5))


def simulated(own, seed, index):
    """Simulated member ``index`` of the canister ``own`` under ``seed``."""
    raw = b"rsim" + be(crc32(own.encode()), 4) + be(seed, 4) + be(index, 8)
    return principal_text(raw + bytes(28 - len(raw)) + b"\x02")


def nickname(seed, index):
    """A resident's name, the same for the same seed and index."""
    mix = (index * 2654435761 + seed * 40503) & 0xFFFFFFFF
    return FIRST_NAMES[mix % len(FIRST_NAMES)] + " " + LAST_NAMES[(mix >> 8) % len(LAST_NAMES)]


# ---- the realm, through declared operations


def call(operation, **args):
    """Run the realm's ``operation`` (one the manifest declares) as the caller; its reply, or an error if it refused."""
    reply = rpc(operation, **args)  # noqa: F821 - the sandbox provides it
    if not reply.get("ok"):
        raise RuntimeError("%s: %s" % (operation, reply.get("error")))
    return reply


def here():
    """This canister's id and population, and the capacity of a quarter: the directory lists this realm's own row
    first, with its population as of now."""
    rows = call("quarter_directory")["quarters"]
    scale = call("scale_status")
    return rows[0]["id"], int(rows[0]["population"]), int(scale.get("capacity") or 0)


def task():
    """The simulator's task, or None: its step's arguments are the settings, its schedule the interval."""
    cursor = 1
    while cursor:
        page = call("task_list", op="extension_call", count=500, **{"from": cursor})
        for t in page.get("tasks", []):
            if t["name"] == TASK:
                return t
        cursor = page.get("next")
    return None


def settings(t=None):
    t = t if t is not None else task()
    kept = {}
    if t and t.get("steps"):
        kept = t["steps"][0].get("args", {}).get("args") or {}
    out = dict(DEFAULTS)
    out.update({k: kept[k] for k in ("batch_size", "target", "seed", "interval_seconds") if k in kept})
    for s in (t or {}).get("schedules", []):  # a running schedule's own interval
        if not s.get("disabled") and s.get("repeat_every"):
            out["interval_seconds"] = s["repeat_every"]
    return out


def running(t):
    return bool(t) and any(not s.get("disabled") for s in t.get("schedules", []))


def checked(values):
    """``values`` within bounds, as integers."""
    out = dict(values)
    out["batch_size"] = max(1, min(BATCH_MAX, int(out["batch_size"])))
    out["interval_seconds"] = max(INTERVAL_MIN, int(out["interval_seconds"]))
    out["target"] = max(0, int(out.get("target") or 0))
    out["seed"] = int(out.get("seed") or 1)
    return out


def replace(values, start):
    """Make the simulator's task anew with ``values``, scheduled every ``interval_seconds`` when ``start``."""
    old = task()
    if old:
        while call("task_delete", task=TASK).get("remaining"):
            pass
    step = {"op": "extension_call",
            "args": {"extension": EXTENSION, "function": "run_batch",
                     "args": {k: values[k] for k in ("batch_size", "target", "seed", "interval_seconds")}}}
    call("task_create", name=TASK, steps=[step])
    if start:
        call("task_add_schedule", task=TASK, repeat_every=values["interval_seconds"])


# ---- what the task and the screen call


def run_batch(batch_size=DEFAULTS["batch_size"], target=0, seed=DEFAULTS["seed"], interval_seconds=0):
    """Add up to ``batch_size`` members to this canister, until it holds ``target`` (0: a quarter's capacity).
    ``interval_seconds`` is kept with the other settings in the task's step; a batch does not use it."""
    own, population, capacity = here()
    goal = int(target) or capacity
    room = max(0, goal - population)
    n = min(int(batch_size), BATCH_MAX, room)
    if n <= 0:
        return {"success": True, "status": "full", "population": population, "target": goal, "added": 0}
    users = [{"user": simulated(own, int(seed), population + i), "nickname": nickname(int(seed), population + i)}
             for i in range(n)]
    added = call("user_import", users=users)["added"]
    return {"success": True, "status": "ok", "population": population + added, "target": goal, "added": added}


def get_status():
    t = task()
    values = settings(t)
    own, population, capacity = here()
    goal = values["target"] or capacity
    return {
        "success": True, "running": running(t), "canister": own, "population": population, "capacity": capacity,
        "interval_seconds": values["interval_seconds"], "batch_size": values["batch_size"],
        "batch_size_max": BATCH_MAX, "interval_min": INTERVAL_MIN, "target": values["target"],
        "effective_target": goal, "max_entities": values["target"] or None, "seed": values["seed"],
        "rotation_mode": "all", "rotation_modes": ["all"],
        "entity_types": [{"key": "users", "label": "Members"}], "enabled_types": {"users": True},
        "type_counts": {}, "resolved_type_counts": {"users": values["batch_size"]},
        "stats": {"users": population}, "batch_number": 0, "demo_mode_active": True,
    }


def toggle(enabled=None, **config):
    """Start or stop the schedule (``enabled``; without it, the other way round). ``config`` may carry new settings."""
    t = task()
    on = (not running(t)) if enabled is None else bool(enabled)
    values = settings(t)
    values.update({k: config[k] for k in ("batch_size", "interval_seconds", "target", "seed") if k in config})
    values = checked(values)
    if on:
        replace(values, start=True)
    elif t:
        call("task_cancel", task=TASK)
    return {"success": True, "running": on, "action": "started" if on else "stopped"}


def update_config(**config):
    """Change ``batch_size``, ``interval_seconds``, ``target`` or ``seed`` (``max_entities`` is the screen's name for
    ``target``); a running schedule goes on with them."""
    if "max_entities" in config and "target" not in config:
        config["target"] = config["max_entities"] or 0
    t = task()
    values = settings(t)
    values.update({k: config[k] for k in ("batch_size", "interval_seconds", "target", "seed")
                   if k in config and config[k] is not None})
    values = checked(values)
    replace(values, start=running(t))
    return {"success": True, "config": values}


def run_once(**_):
    """One batch now, with the current settings."""
    values = settings()
    return run_batch(values["batch_size"], values["target"], values["seed"])


def reset(**_):
    """Back to the default settings, stopped. Members already added stay."""
    if task():
        replace(checked(dict(DEFAULTS)), start=False)
    return {"success": True, "action": "reset"}
