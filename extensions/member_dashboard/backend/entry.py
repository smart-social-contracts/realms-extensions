import json
import re
import traceback
from typing import Any, Dict

from ggg import Invoice, PaymentAccount, Service, User
from basilisk import Async, ic
from ic_python_logging import get_logger

# Initialize logger
logger = get_logger("member_dashboard")


def _caller_id() -> str:
    """The authenticated caller.

    Every endpoint here serves the caller their *own* data, so identity is
    never read from the call args. Accepting a ``user_id`` from the client
    would let any member read another member's invoices and payment accounts.
    Cross-member access belongs in member_manager, behind its own operation.
    """
    return ic.caller().to_str()


def _service_to_dict(service: Service) -> Dict[str, Any]:
    """Convert Service entity to dictionary format"""
    return {
        "id": service.service_id,
        "name": service.name,
        "description": service.description,
        "provider": service.provider,
        "status": service.status,
        "due_date": service.due_date,
        "link": service.link,
    }


def _invoice_to_dict(
    invoice: Invoice, include_deposit_address: bool = True
) -> Dict[str, Any]:
    """Convert Invoice entity to dictionary format with optional deposit address."""
    recipient_name = None
    if hasattr(invoice, 'recipient') and invoice.recipient:
        recipient_name = getattr(invoice.recipient, 'id', None)

    result = {
        "id": invoice.id,
        "recipient": recipient_name,
        "amount": invoice.get_nonce_amount_human(),
        "amount_base": invoice.amount,
        "currency": invoice.currency,
        "due_on": getattr(invoice, "due_on", None) or getattr(invoice, "due_date", None),
        "type": getattr(invoice, "type", None),
        "metadata": invoice.metadata,
        "status": invoice.status,
        "paid_on": getattr(invoice, "paid_on", None) or getattr(invoice, "paid_at", None),
    }

    if include_deposit_address:
        result["payment"] = invoice.get_payment_address()

    return result


def get_dashboard_summary(args: str) -> Async[str]:
    try:
        logger.info(f"get_dashboard_summary called with args: {args}")
        params = json.loads(args) if args and args.strip() else {}
        user_id = _caller_id()

        # Get data from database
        all_services = Service.instances()
        all_invoices = Invoice.instances()

        user_services = [s for s in all_services if s.user and s.user.id == user_id]
        user_invoices = [i for i in all_invoices if i.user and i.user.id == user_id]

        # Calculate summary
        services_approaching = len(
            [s for s in user_services if s.status == "Approaching"]
        )
        invoices_overdue = len([i for i in user_invoices if i.status == "Overdue"])

        summary_data = {
            "user_name": user_id,
            "services_count": len(user_services),
            "services_approaching": services_approaching,
            "tax_records": len(user_invoices),
            "tax_overdue": invoices_overdue,
            "personal_data_items": 0,
            "personal_data_updated": 0,
        }

        response = {"success": True, "data": summary_data}

        logger.info(f"get_dashboard_summary successful for user: {user_id}")
        return json.dumps(response)
    except Exception as e:
        logger.error(
            f"Error in get_dashboard_summary: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def get_public_services(args: str) -> Async[str]:
    """
    Get a list of public services for the member.

    Args:
        args (str): JSON string containing user_id

    Returns:
        str: JSON string with public services data
    """
    try:
        logger.info(f"get_public_services called with args: {args}")
        params = json.loads(args)
        user_id = _caller_id()

        # Get services from database
        all_services = Service.instances()

        services = [s for s in all_services if s.user and s.user.id == user_id]

        # Convert to dict format
        services_list = [_service_to_dict(s) for s in services]

        response = {
            "success": True,
            "data": {"services": services_list, "total_count": len(services_list)},
        }

        logger.info(f"get_public_services successful for user: {user_id}")
        return json.dumps(response)
    except Exception as e:
        logger.error(
            f"Error in get_public_services: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def get_citizenship_status(args: str) -> str:
    """Get membership activation status for a user.

    Checks two requirements:
    1. Registration invoice paid
    2. Passport verified (user has 'verified' flag or passport identity)
    """
    try:
        params = json.loads(args)
        user_id = _caller_id()
        logger.info(f"get_citizenship_status called for user: {user_id}")

        # Check invoice payment status
        all_invoices = Invoice.instances()
        user_invoices = [i for i in all_invoices if i.user and i.user.id == user_id]
        has_pending = any(i.status == "Pending" for i in user_invoices)
        all_paid = len(user_invoices) > 0 and all(i.status == "Paid" for i in user_invoices)
        invoice_paid = all_paid

        # Check passport verification
        # Look for passport Identity entity linked to user's Human
        passport_verified = False
        try:
            user = User.load(user_id)
            logger.info(f"get_citizenship_status: User.load({user_id}) = {user}")
            if not user:
                user = User[user_id]
                logger.info(f"get_citizenship_status: User[{user_id}] = {user}")
            if user:
                human = user.human
                logger.info(f"get_citizenship_status: user.human = {human}")
                if human:
                    identities_list = list(human.identities)
                    logger.info(f"get_citizenship_status: human.identities = {identities_list}")
                    for identity in identities_list:
                        logger.info(f"get_citizenship_status: identity.type = {identity.type}")
                        if identity.type == "passport":
                            passport_verified = True
                            break
                else:
                    logger.info(f"get_citizenship_status: no human for user {user_id}")
                # Also check profiles for active status
                profiles = getattr(user, 'profiles', []) or []
                if 'active_citizen' in profiles:
                    passport_verified = True
                    invoice_paid = True
            else:
                logger.info(f"get_citizenship_status: user not found for {user_id}")
        except Exception as e:
            logger.error(f"get_citizenship_status: error checking passport: {e}")
            import traceback as tb
            logger.error(f"get_citizenship_status: {tb.format_exc()}")

        # Overall status
        if invoice_paid and passport_verified:
            status = "active"
            status_label = "Active member"
        else:
            status = "pending"
            status_label = "Pending Activation"

        return json.dumps({
            "success": True,
            "data": {
                "status": status,
                "status_label": status_label,
                "invoice_paid": invoice_paid,
                "passport_verified": passport_verified,
                "total_invoices": len(user_invoices),
                "paid_invoices": len([i for i in user_invoices if i.status == "Paid"]),
            }
        })
    except Exception as e:
        logger.error(f"Error in get_citizenship_status: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_tax_information(args: str) -> str:
    """
    Get invoice information for the member (tax/billing data).

    Args:
        args (str): JSON string containing user_id

    Returns:
        str: JSON string with invoice information data
    """
    try:
        logger.info(f"get_tax_information called with args: {args}")
        params = json.loads(args) if args else {}
        user_id = _caller_id()

        # Get invoices from database
        all_invoices = Invoice.instances()

        invoices = [i for i in all_invoices if i.user and i.user.id == user_id]

        # Convert to dict format
        invoices_list = [_invoice_to_dict(i) for i in invoices]

        # Calculate summary
        total_paid = sum(
            record["amount"] for record in invoices_list if record["status"] == "Paid"
        )
        total_pending = sum(
            record["amount"]
            for record in invoices_list
            if record["status"] == "Pending"
        )
        total_overdue = sum(
            record["amount"]
            for record in invoices_list
            if record["status"] == "Overdue"
        )

        summary = {
            "total_paid": total_paid,
            "total_pending": total_pending,
            "total_overdue": total_overdue,
            "total_amount": total_paid + total_pending + total_overdue,
        }

        response = {
            "success": True,
            "data": {"invoices": invoices_list, "summary": summary},
        }

        logger.info(f"get_tax_information successful for user: {user_id}")
        return json.dumps(response)
    except Exception as e:
        logger.error(
            f"Error in get_tax_information: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def get_invoice_information(args: str) -> str:
    """
    Get invoice information for the member.
    Alias for get_tax_information with updated naming.

    Args:
        args (str): JSON string containing user_id

    Returns:
        str: JSON string with invoice information data
    """
    return get_tax_information(args)


def get_vault_address(args: str) -> str:
    """
    Get the realm's vault address (canister principal) for deposits.

    Returns:
        JSON string with vault principal ID
    """
    try:
        vault_principal = ic.id().to_str()

        return json.dumps(
            {
                "success": True,
                "data": {
                    "vault_principal": vault_principal,
                    "network": "ICP",
                },
            }
        )
    except Exception as e:
        logger.error(f"Error in get_vault_address: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})


def get_invoice_deposit_address(args: str) -> str:
    """
    Get the payment instructions for a specific invoice.

    Returns nonce-based or subaccount-based info depending on the
    SUBACCOUNT_PAYMENTS_ENABLED flag in Invoice.
    """
    try:
        logger.info(f"get_invoice_deposit_address called with args: {args}")
        params = json.loads(args) if args else {}
        invoice_id = params.get("invoice_id")

        if not invoice_id:
            return json.dumps({"success": False, "error": "invoice_id is required"})

        invoice = Invoice[invoice_id]
        if not invoice:
            return json.dumps({"success": False, "error": "Invoice not found"})

        payment = invoice.get_payment_address()
        payment["invoice_id"] = invoice_id
        if "currency" not in payment:
            payment["currency"] = invoice.currency

        return json.dumps({"success": True, "data": payment})
    except Exception as e:
        logger.error(
            f"Error in get_invoice_deposit_address: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def _match_wallet_transfer(invoice):
    """Find a cached incoming transfer for this invoice's exact nonce amount."""
    from ic_basilisk_toolkit.entities import WalletTransfer

    token = invoice._find_token()
    if not token:
        return None, 0
    expected = invoice.get_nonce_amount_raw(invoice._get_token_decimals())
    me = ic.id().to_str()
    scanned = 0
    for wt in WalletTransfer.instances():
        scanned += 1
        try:
            if wt.token is None or wt.token.name != token.name:
                continue
        except Exception:
            continue
        if wt.kind not in ("transfer", "mint"):
            continue
        if wt.principal_to and wt.principal_to != me:
            continue
        if int(wt.amount or 0) == expected:
            return wt, scanned
    return None, scanned


def check_invoice_payment(args: str) -> Async[str]:
    """Pull new treasury transfers, then mark the invoice paid if the nonce matches."""
    try:
        logger.info(f"check_invoice_payment called with args: {args}")
        params = json.loads(args) if args else {}
        invoice_id = params.get("invoice_id")

        if not invoice_id:
            return json.dumps({"success": False, "error": "invoice_id is required"})

        invoice = Invoice[invoice_id]
        if not invoice:
            return json.dumps({"success": False, "error": "Invoice not found"})

        if invoice.status == "Paid":
            return json.dumps(
                {
                    "success": True,
                    "data": {
                        "already_paid": True,
                        "paid": True,
                        "invoice_id": invoice_id,
                        "paid_at": getattr(invoice, "paid_at", None),
                    },
                }
            )

        token = invoice._find_token()
        if not token:
            return json.dumps(
                {
                    "success": False,
                    "error": (
                        f"No registered Token with an indexer for "
                        f"'{invoice.currency or ''}'"
                    ),
                }
            )

        from ic_basilisk_toolkit.wallet import Wallet

        sync = {}
        try:
            sync = yield from Wallet().refresh(token.name)
        except Exception as e:
            logger.warning(f"check_invoice_payment: wallet.refresh failed: {e}")
            sync = {"error": str(e)}

        matched, scanned = _match_wallet_transfer(invoice)
        if matched:
            decimals = invoice._get_token_decimals()
            amount = int(matched.amount or 0)
            invoice.mark_paid(
                payment_currency=invoice.currency,
                payment_amount=amount / (10 ** decimals),
                payment_amount_raw=amount,
            )
            return json.dumps(
                {
                    "success": True,
                    "data": {
                        "paid": True,
                        "already_paid": False,
                        "invoice_id": invoice_id,
                        "paid_at": getattr(invoice, "paid_at", None),
                        "scanned_transactions": scanned,
                        "new_txs": (sync or {}).get("new_txs"),
                    },
                }
            )

        refresh_gen = invoice.refresh()
        if hasattr(refresh_gen, "__next__"):
            result = yield from refresh_gen
        else:
            result = refresh_gen
        if not isinstance(result, dict):
            return json.dumps({"success": False, "error": str(result)})
        if result.get("error"):
            return json.dumps({"success": False, "error": result["error"]})

        paid = result.get("status") == "Paid" or invoice.status == "Paid"
        return json.dumps(
            {
                "success": True,
                "data": {
                    "paid": paid,
                    "already_paid": False,
                    "invoice_id": invoice_id,
                    "status": result.get("status") or invoice.status,
                    "currency": result.get("currency") or invoice.currency,
                    "payment_method": result.get("payment_method"),
                    "scanned_transactions": result.get("scanned_transactions", scanned),
                    "new_txs": (sync or {}).get("new_txs"),
                    "paid_at": getattr(invoice, "paid_at", None),
                },
            }
        )

    except Exception as e:
        logger.error(
            f"Error in check_invoice_payment: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def demo_mark_invoice_paid(args: str) -> str:
    """
    [DEMO FEATURE] Mark an invoice as paid without actual payment.
    This is for demonstration purposes only.

    Args:
        args: JSON string with {"invoice_id": "..."}

    Returns:
        JSON string with updated invoice status
    """
    try:
        logger.info(f"demo_mark_invoice_paid called with args: {args}")
        params = json.loads(args) if args else {}
        invoice_id = params.get("invoice_id")

        if not invoice_id:
            return json.dumps({"success": False, "error": "invoice_id is required"})

        # Find the invoice
        invoice = Invoice[invoice_id]
        if not invoice:
            return json.dumps({"success": False, "error": "Invoice not found"})

        if invoice.status == "Paid":
            return json.dumps(
                {
                    "success": True,
                    "data": {
                        "already_paid": True,
                        "invoice_id": invoice_id,
                        "message": "Invoice was already paid",
                    },
                }
            )

        # Mark as paid (demo)
        invoice.mark_paid(
            payment_currency=invoice.currency,
            payment_amount=invoice.amount,
        )

        logger.info(f"[DEMO] Invoice {invoice_id} marked as Paid")

        return json.dumps(
            {
                "success": True,
                "data": {
                    "invoice_id": invoice_id,
                    "status": "Paid",
                    "paid_at": invoice.paid_at,
                    "message": "Invoice marked as paid (demo)",
                },
            }
        )

    except Exception as e:
        logger.error(
            f"Error in demo_mark_invoice_paid: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def get_personal_data(args: str) -> str:
    """
    Get personal data for the member.

    Args:
        args (str): JSON string containing user_id

    Returns:
        str: JSON string with personal data
    """
    try:
        logger.info(f"get_personal_data called with args: {args}")
        user_id = _caller_id()

        user = User[user_id]
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        personal_data = {
            "name": user.name or "",
            "id_number": user.id or "",
            "date_of_birth": "",
            "citizenship_status": (
                "Full Membership"
                if user.profiles and "member" in user.profiles
                else "Pending"
            ),
            "registration_date": (
                str(user.timestamp_created)
                if hasattr(user, "timestamp_created")
                else ""
            ),
            "address": "",
            "email": user.email or "",
            "phone": "",
        }

        response = {"success": True, "data": {"personal_data": personal_data}}

        logger.info(f"get_personal_data successful for user: {user_id}")
        return json.dumps(response)
    except Exception as e:
        logger.error(
            f"Error in get_personal_data: {str(e)}\n" f"{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def _validate_address(address: str, network: str) -> tuple[bool, str]:
    """Validate address format based on network (no regex — frozen re is limited)"""
    if not address or len(address) == 0:
        return False, "Address cannot be empty"

    if network == "ICP":
        # ICP principals: groups of lowercase alnum separated by dashes
        parts = address.split("-")
        if len(parts) < 2:
            return False, "Invalid ICP principal format"
        if not all(p.isalnum() and p == p.lower() for p in parts):
            return False, "Invalid ICP principal format"
    elif network == "Bitcoin":
        if not (
            (address.startswith("1") and 26 <= len(address) <= 35)
            or (address.startswith("3") and 26 <= len(address) <= 35)
            or (address.startswith("bc1") and len(address) >= 42)
        ):
            return False, "Invalid Bitcoin address format"
    elif network == "Ethereum":
        if not (address.startswith("0x") and len(address) == 42 and all(c in "0123456789abcdefABCDEF" for c in address[2:])):
            return False, "Invalid Ethereum address format"
    elif network == "SEPA":
        iban = address.upper().replace(" ", "")
        if len(iban) < 5 or not iban[:2].isalpha() or not iban[2:4].isdigit() or not iban[4:].isalnum():
            return False, "Invalid IBAN format"

    return True, ""


def add_payment_account(args: str) -> str:
    """
    Add a new payment account for a user.

    Args:
        args (str): JSON string containing user_id, address, label,
                    network, currency

    Returns:
        str: JSON string with success status and account data
    """
    try:
        logger.info(f"add_payment_account called with args: {args}")
        params = json.loads(args)
        user_id = _caller_id()
        address = params.get("address")
        label = params.get("label")
        network = params.get("network")
        currency = params.get("currency")

        if not all([address, label, network, currency]):
            return json.dumps({"success": False, "error": "Missing required fields"})

        # Get user
        user = User[user_id]
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        # Validate address
        is_valid, error_msg = _validate_address(address, network)
        if not is_valid:
            return json.dumps({"success": False, "error": error_msg})

        # Check for duplicates
        existing = [
            pa
            for pa in list(user.payment_accounts)
            if pa.address == address and pa.is_active
        ]
        if existing:
            return json.dumps(
                {
                    "success": False,
                    "error": "Payment account with this address already exists",
                }
            )

        # Create payment account (ID auto-generated by PaymentAccount entity)
        payment_account = PaymentAccount(
            address=address,
            label=label,
            network=network,
            currency=currency,
            user=user,
            is_active=True,
            is_verified=False,
            metadata="{}",
        )

        logger.info(f"Created payment account {payment_account.id} for user {user_id}")

        return json.dumps({"success": True, "data": payment_account.serialize()})
    except Exception as e:
        logger.error(
            f"Error in add_payment_account: {str(e)}\n" f"{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def list_payment_accounts(args: str) -> str:
    """
    List payment accounts for a user.

    Args:
        args (str): JSON string containing user_id (principal)

    Returns:
        str: JSON string with success status and accounts list
    """
    try:
        params = json.loads(args)
        user_id = _caller_id()

        # Get user
        user = User[user_id]
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        # Get active payment accounts
        accounts = [
            pa.serialize() for pa in list(user.payment_accounts) if pa.is_active
        ]

        return json.dumps({"success": True, "data": accounts})

    except Exception as e:
        logger.error(f"Error listing payment accounts: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})


def get_notifications(args: str) -> str:
    """Notifications visible to the caller (same semantics as notifications ext)."""
    try:
        from core.notification_bridge import v_list

        caller = _caller_id()
        result = v_list(caller=caller)
        return json.dumps({"success": True, "data": result.get("notifications", [])})
    except Exception as e:
        logger.error(
            f"Error in get_notifications: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def mark_as_read(args: str) -> str:
    """Mark a notification read or unread for the caller."""
    try:
        from core.notification_bridge import v_mark_read

        params = json.loads(args) if args and args.strip() else {}
        notification_id = params.get("id")
        read = bool(params.get("read", True))
        result = v_mark_read(caller=_caller_id(), id=notification_id, read=read)
        return json.dumps({"success": True, "data": result})
    except Exception as e:
        logger.error(f"Error in mark_as_read: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def delete_notification(args: str) -> str:
    """Delete a notification (recipient, sender, or admin only)."""
    try:
        from core.notification_bridge import v_delete

        params = json.loads(args) if args and args.strip() else {}
        notification_id = params.get("id")
        result = v_delete(caller=_caller_id(), id=notification_id)
        return json.dumps({"success": True, "data": result})
    except Exception as e:
        logger.error(
            f"Error in delete_notification: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def remove_payment_account(args: str) -> str:
    """
    Remove a payment account (soft delete).

    Args:
        args (str): JSON string containing user_id and account_id

    Returns:
        str: JSON string with success status
    """
    try:
        params = json.loads(args)
        user_id = _caller_id()
        account_id = params.get("account_id")

        if not account_id:
            return json.dumps({"success": False, "error": "Missing required fields"})

        # Get user
        user = User[user_id]
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        # Find account
        account = PaymentAccount[account_id]
        if not account or account.user != user:
            return json.dumps({"success": False, "error": "Payment account not found"})

        # Soft delete
        account.is_active = False

        return json.dumps({"success": True})

    except Exception as e:
        logger.error(f"Error removing payment account: {str(e)}")
        return json.dumps({"success": False, "error": str(e)})
