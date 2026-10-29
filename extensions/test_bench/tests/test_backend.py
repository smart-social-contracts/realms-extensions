import os

import world
from kit import ok

EXT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_get_data_echoes_its_arguments(install):
    install(EXT)
    world.person("ada", "admin")
    out = ok(
        "extension_call",
        "ada",
        extension="test_bench",
        function="get_data",
        args={"some_param": False},
    )
    assert out["result"] == {"data": "some data {'some_param': False}"}
