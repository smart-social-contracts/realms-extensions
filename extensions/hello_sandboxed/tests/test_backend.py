import os

from ggg import Realm
from kit import ok

EXT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_greet_calls_realm_info_through_rpc(install):
    install(EXT)
    Realm["1"].name = "Agora"
    out = ok(
        "extension_call",
        "alice",
        extension="hello_sandboxed",
        function="greet",
        args={"name": "Ada"},
    )
    assert out["result"] == "Hello, Ada! Welcome to Agora."
