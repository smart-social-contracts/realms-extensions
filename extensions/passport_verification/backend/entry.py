import json
import secrets
from urllib.parse import quote

from basilisk import Async, CallResult, ic, match, query, update
from basilisk.canisters.management import (
    HttpResponse,
    management_canister,
)
from ic_python_logging import get_logger
from ic_python_db import String
from core.extensions import create_extension_entity_class

logger = get_logger("passport_verification")

# Create ExtensionEntity for passport_verification
ExtensionEntity = create_extension_entity_class("passport_verification")


# Define configuration entity for storing application settings
class AppConfig(ExtensionEntity):
    """Store application configuration in stable memory.

    Stored with namespace: ext_passport_verification::AppConfig
    """

    __alias__ = "key"
    key = String()
    value = String()


RARIMO_API_BASE = "https://api.app.rarime.com"
VERIFICATION_LINK_PATH = "/integrations/verificator-svc/private/verification-link"
# verificator-svc rejects non-decimal event_id ("must be decimal and less
# than field modulo"). Unix seconds fit; hex / slugs / empty do not.
_EVENT_ID_MAX_DIGITS = 76


def _decimal_event_id(raw) -> str:
    value = "" if raw is None else str(raw).strip()
    if value.isdigit() and 1 <= len(value) <= _EVENT_ID_MAX_DIGITS:
        return value
    digits = "".join(ch for ch in value if ch.isdigit())
    if digits:
        return digits[:_EVENT_ID_MAX_DIGITS]
    # Stable non-time fallback so replicated outcalls agree on the payload.
    acc = 0
    for ch in value or "event":
        acc = (acc * 131 + ord(ch)) % 10**18
    return str(acc or 1)


def _format_jsonapi_errors(errors) -> str:
    parts = []
    if isinstance(errors, list):
        for err in errors:
            if not isinstance(err, dict):
                continue
            meta = err.get("meta") if isinstance(err.get("meta"), dict) else {}
            field = meta.get("field")
            msg = meta.get("error") or err.get("detail") or err.get("title")
            if field and msg:
                parts.append(f"{field}: {msg}")
            elif msg:
                parts.append(str(msg))
    return "; ".join(parts) or "Verification service rejected the request"


def _decode_http_body(response):
    body = response.get("body") or b""
    raw = body.decode("utf-8") if isinstance(body, (bytes, bytearray)) else str(body)
    status = int(response.get("status") or response.get("status_code") or 0)
    try:
        data = json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        snippet = raw[:180].replace("\n", " ")
        return {
            "success": False,
            "error": (
                f"Verification service returned non-JSON "
                f"(HTTP {status or 'unknown'}): {snippet}"
            ),
        }
    if isinstance(data, dict) and data.get("errors"):
        return {
            "success": False,
            "error": _format_jsonapi_errors(data.get("errors")),
            "errors": data.get("errors"),
        }
    if status and status >= 400:
        return {
            "success": False,
            "error": f"Verification service HTTP {status}",
            "body": data,
        }
    return data


def _with_rarime_app_url(response_data):
    if (
        isinstance(response_data, dict)
        and isinstance(response_data.get("data"), dict)
        and isinstance(response_data["data"].get("attributes"), dict)
    ):
        proof_params_url = response_data["data"]["attributes"].get(
            "get_proof_params", ""
        )
        if proof_params_url:
            encoded_url = quote(proof_params_url, safe="")
            rarime_url = (
                "https://app.rarime.com/external?type=proof-request"
                f"&proof_params_url={encoded_url}"
            )
            response_data["data"]["attributes"]["rarime_app_url"] = rarime_url
            logger.info(f"🔗 Formatted RariMe app URL: {rarime_url}")
    return response_data


def register_entities():
    """Register passport_verification entity types with the Database."""
    from ic_python_db import Database

    logger.info("Registering passport_verification entity types...")

    entity_types = [AppConfig]

    for entity_type in entity_types:
        try:
            logger.info(f"Registering entity type {entity_type.__name__}")
            Database.get_instance().register_entity_type(entity_type)
        except Exception as e:
            logger.error(
                f"Error registering entity type {entity_type.__name__}: {str(e)}"
            )

    logger.info("✅ Passport verification entity types registered")


def initialize(args: str):
    """Initialize extension - generate application ID if not exists.

    Called once during canister initialization.
    """
    logger.info("Initializing passport_verification extension...")

    # Check if application ID already exists
    config = AppConfig["application_id"]

    if not config:
        # First time initialization - use unix timestamp as ID
        timestamp_ns = ic.time()
        app_id = str(timestamp_ns // 1_000_000_000)

        AppConfig(key="application_id", value=app_id)
        logger.info(f"🆕 Generated new application ID: {app_id}")
    else:
        logger.info(f"📋 Application ID already exists: {config.value}")

    logger.info("Passport verification extension initialized.")


def get_session_id(args: str) -> str:
    return ic.caller().to_str()


def get_event_id(args: str) -> str:
    """Get the application ID (event_id for Rarimo) from storage.

    The ID is generated once and persists in stable storage.
    If not found, generates it on-the-fly (self-healing).
    """
    config = AppConfig["application_id"]
    if config and config.value:
        return _decimal_event_id(config.value)

    # Self-healing: generate application ID if missing
    logger.warning("Application ID not found in storage, generating now...")
    timestamp_ns = ic.time()
    app_id = str(timestamp_ns // 1_000_000_000)

    AppConfig(key="application_id", value=app_id)
    logger.info(f"🆕 Generated application ID on-the-fly: {app_id}")
    return _decimal_event_id(app_id)


@update
def get_verification_link(args: str) -> Async[str]:
    """Get the verification link -- bypasses Rarimo API in test mode."""
    from core.runtime_flags import skip_passport_zkproof

    if skip_passport_zkproof():
        session_id = get_session_id(args)
        logger.info(f"🧪 TEST MODE: Returning mock verification link for {session_id}")
        return json.dumps({
            "data": {
                "id": session_id,
                "type": "verification",
                "attributes": {
                    "status": "verified",
                    "rarime_app_url": "https://test-mode/passport-bypass",
                    "test_mode": True
                }
            }
        })

    session_id = get_session_id(args)
    logger.info(f"🔗 Getting verification link for session: {session_id}")

    payload = {
        "data": {
            "id": session_id,
            "type": "user",
            "attributes": {
                "age_lower_bound": 18,
                "uniqueness": True,
                "nationality": "",
                "nationality_check": False,
                "event_id": get_event_id(args),
            },
        }
    }

    logger.info(
        f"📤 Sending HTTP POST request to Rarimo API with payload: {json.dumps(payload)}"
    )
    logger.info("🔄 Using 500M cycles for HTTP request")

    http_result: CallResult[HttpResponse] = yield management_canister.http_request(
        {
            "url": f"{RARIMO_API_BASE}{VERIFICATION_LINK_PATH}",
            "max_response_bytes": 8_000,
            "method": {"post": None},
            "headers": [
                {"name": "Content-Type", "value": "application/json"},
                {
                    "name": "Accept",
                    "value": "application/vnd.api+json, application/json",
                },
            ],
            "body": json.dumps(payload).encode("utf-8"),
            "transform": {
                "function": (ic.id(), "http_transform"),
                "context": bytes(),
            },
        }
    ).with_cycles(500_000_000)

    logger.info(f"✅ HTTP request sent to Rarimo API. Result: {http_result}")

    def format_response(response):
        response_data = _decode_http_body(response)
        if isinstance(response_data, dict) and response_data.get("success") is False:
            return json.dumps(response_data)
        return json.dumps(_with_rarime_app_url(response_data))

    return match(
        http_result,
        {
            "Ok": format_response,
            "Err": lambda err: json.dumps({"success": False, "error": str(err)}),
        },
    )


@update
def check_verification_status(args: str) -> Async[str]:
    """Check verification status -- bypasses Rarimo API in test mode."""
    from core.runtime_flags import skip_passport_zkproof

    if skip_passport_zkproof():
        session_id = get_session_id(args)
        logger.info(f"🧪 TEST MODE: Skipping Rarimo API, returning verified for {session_id}")
        return json.dumps({
            "data": {
                "id": session_id,
                "type": "verification",
                "attributes": {"status": "verified", "test_mode": True}
            }
        })

    session_id = get_session_id(args)
    logger.info(f"🔍 Checking verification status for session: {session_id}")
    logger.info("📤 Sending HTTP GET request to check status")
    logger.info("🔄 Using 500M cycles for status check request")

    http_result: CallResult[HttpResponse] = yield management_canister.http_request(
        {
            "url": (
                f"{RARIMO_API_BASE}/integrations/verificator-svc"
                f"/private/verification-status/{session_id}"
            ),
            "max_response_bytes": 8_000,
            "method": {"get": None},
            "headers": [
                {
                    "name": "Accept",
                    "value": "application/vnd.api+json, application/json",
                }
            ],
            "body": bytes(),
            "transform": {
                "function": (ic.id(), "http_transform"),
                "context": bytes(),
            },
        }
    ).with_cycles(500_000_000)

    return match(
        http_result,
        {
            "Ok": lambda response: json.dumps(_decode_http_body(response)),
            "Err": lambda err: json.dumps({"success": False, "error": str(err)}),
        },
    )


@query
def get_current_application_id(args: str) -> str:
    """Get the current application ID without generating a new one (query method)."""
    from core.runtime_flags import skip_passport_zkproof

    skip_zk = bool(skip_passport_zkproof())
    config = AppConfig["application_id"]
    if config:
        return json.dumps(
            {
                "application_id": config.value,
                "status": "initialized",
                "skip_passport_zkproof": skip_zk,
                "created_at": (
                    str(config.created_at) if hasattr(config, "created_at") else None
                ),
            }
        )
    return json.dumps(
        {
            "application_id": None,
            "status": "not_initialized",
            "skip_passport_zkproof": skip_zk,
        }
    )


@update
def set_application_id(new_app_id: str) -> str:
    """Manually set a specific application ID (admin/debug function)."""
    try:
        # Check if config already exists
        config = AppConfig["application_id"]

        if config:
            # Update existing config
            old_value = config.value
            config.value = new_app_id
            logger.info(f"🔧 Application ID updated from {old_value} to {new_app_id}")
        else:
            # Create new config
            config = AppConfig(key="application_id", value=new_app_id)
            logger.info(f"🔧 Application ID manually set to: {new_app_id}")

        return json.dumps({"success": True, "application_id": new_app_id})
    except Exception as e:
        logger.error(f"❌ Error setting application ID: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})


def get_identity_status(args: str) -> str:
    """Check if the current user has a verified passport identity."""
    try:
        from ggg import User

        session_id = get_session_id(args)
        user = User[session_id]
        if not user or not user.human:
            return json.dumps({"verified": False})

        for identity in user.human.identities:
            if identity.type == "passport":
                return json.dumps({"verified": True, "type": "passport"})

        return json.dumps({"verified": False})
    except Exception as e:
        logger.error(f"Error checking identity status: {e}")
        return json.dumps({"verified": False, "error": str(e)})


def create_passport_identity(args: str) -> str:
    """Create passport identity after successful verification"""
    try:
        from ggg import User
        from ggg.identity.human import Human
        from ggg.identity.identity import Identity

        session_id = get_session_id(args)
        logger.info(f"🆔 Creating passport identity for session: {session_id}")

        verification_data = {}
        if args and args.strip():
            try:
                verification_data = json.loads(args)
            except json.JSONDecodeError as json_err:
                logger.error(f"❌ JSON decode error: {json_err}")
                return json.dumps(
                    {
                        "success": False,
                        "error": f"Invalid JSON in args: {str(json_err)}",
                    }
                )

        user = User[session_id]
        if not user:
            logger.error(f"❌ User not found: {session_id}")
            return json.dumps({"success": False, "error": "User not found"})

        human = user.human
        if not human:
            human = Human(name=session_id, user=user)
            logger.info(f"Created Human for user {session_id}")

        # Check if passport identity already exists
        for identity in human.identities:
            if identity.type == "passport":
                logger.info(f"Passport identity already exists for {session_id}")
                return json.dumps(
                    {
                        "success": True,
                        "session_id": session_id,
                        "identity_created": False,
                        "already_exists": True,
                    }
                )

        # Create the passport Identity
        Identity(type="passport", metadata=json.dumps(verification_data), human=human)
        logger.info(f"✅ Passport identity created for session: {session_id}")

        return json.dumps(
            {
                "success": True,
                "session_id": session_id,
                "identity_created": True,
                "timestamp": str(ic.time()),
                "verification_data": verification_data,
            }
        )

    except Exception as e:
        logger.error(f"❌ Error creating passport identity: {str(e)}")
        import traceback

        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})
