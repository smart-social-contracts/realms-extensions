"""Financial Reports extension backend.

Draft snapshots freeze current working books. They are unofficial and do not
move money, so the host applies them directly for any registered member.
"""

import json

from ggg_sdk import ctx


def _ok(data):
    return json.dumps({"success": True, "data": data})


def _err(msg):
    return json.dumps({"success": False, "error": str(msg)})


def issue_draft(args) -> str:
    """Freeze current working books as an unofficial draft snapshot."""
    try:
        return _ok(ctx.treasury.issue_draft())
    except Exception as e:
        return _err(e)


EXTENSION_FUNCTIONS = {
    "issue_draft": issue_draft,
}
