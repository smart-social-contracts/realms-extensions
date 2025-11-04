import json
import traceback
from datetime import datetime, timedelta
from typing import Any, Dict

from ggg import Service, TaxRecord, User
from kybra import Async
from kybra_simple_logging import get_logger

# Initialize logger
logger = get_logger("citizen_dashboard")


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


def _tax_record_to_dict(tax_record: TaxRecord) -> Dict[str, Any]:
    """Convert TaxRecord entity to dictionary format"""
    return {
        "id": tax_record.tax_id,
        "tax_type": tax_record.tax_type,
        "description": tax_record.description,
        "period": tax_record.period,
        "amount": tax_record.amount,
        "due_date": tax_record.due_date,
        "status": tax_record.status,
    }


def get_dashboard_summary(args: str) -> Async[str]:
    try:
        args = "{}"
        logger.info(f"get_dashboard_summary called with args: {args}")
        params = json.loads(args)
        user_id = params.get("user_id", "anonymous")

        # Get data from database
        all_services = Service.instances()
        all_tax_records = TaxRecord.instances()
        
        # Filter by user if provided
        if user_id and user_id != "anonymous":
            user_services = [s for s in all_services if s.user and s.user.id == user_id]
            user_tax_records = [t for t in all_tax_records if t.user and t.user.id == user_id]
        else:
            user_services = list(all_services)
            user_tax_records = list(all_tax_records)
        
        # Calculate summary
        services_approaching = len([s for s in user_services if s.status == "Approaching"])
        tax_overdue = len([t for t in user_tax_records if t.status == "Overdue"])
        
        summary_data = {
            "user_name": user_id,
            "services_count": len(user_services),
            "services_approaching": services_approaching,
            "tax_records": len(user_tax_records),
            "tax_overdue": tax_overdue,
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
    Get a list of public services for the citizen.

    Args:
        args (str): JSON string containing user_id

    Returns:
        str: JSON string with public services data
    """
    try:
        logger.info(f"get_public_services called with args: {args}")
        params = json.loads(args)
        user_id = params.get("user_id", "anonymous")

        # Get services from database
        all_services = Service.instances()
        
        # Filter by user if user_id provided
        if user_id and user_id != "anonymous":
            services = [s for s in all_services if s.user and s.user.id == user_id]
        else:
            services = list(all_services)
        
        # Convert to dict format
        services_list = [_service_to_dict(s) for s in services]

        response = {
            "success": True,
            "data": {"services": services_list, "total_count": len(services_list)},
        }

        logger.info(f"get_public_services successful for user: {user_id}")
        return json.dumps(response)
    except Exception as e:
        logger.error(f"Error in get_public_services: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})


def get_tax_information(args: str) -> str:
    """
    Get tax information for the citizen.

    Args:
        args (str): JSON string containing user_id

    Returns:
        str: JSON string with tax information data
    """
    try:
        logger.info(f"get_tax_information called with args: {args}")
        params = json.loads(args) if args else {}
        user_id = params.get("user_id", "anonymous")

        # Get tax records from database
        all_tax_records = TaxRecord.instances()
        
        # Filter by user if user_id provided
        if user_id and user_id != "anonymous":
            tax_records = [t for t in all_tax_records if t.user and t.user.id == user_id]
        else:
            tax_records = list(all_tax_records)
        
        # Convert to dict format
        tax_records_list = [_tax_record_to_dict(t) for t in tax_records]

        # Calculate summary
        total_paid = sum(
            record["amount"] for record in tax_records_list if record["status"] == "Paid"
        )
        total_pending = sum(
            record["amount"] for record in tax_records_list if record["status"] == "Pending"
        )
        total_overdue = sum(
            record["amount"] for record in tax_records_list if record["status"] == "Overdue"
        )

        summary = {
            "total_paid": total_paid,
            "total_pending": total_pending,
            "total_overdue": total_overdue,
            "total_amount": total_paid + total_pending + total_overdue,
        }

        response = {
            "success": True,
            "data": {"tax_records": tax_records_list, "summary": summary},
        }

        logger.info(f"get_tax_information successful for user: {user_id}")
        return json.dumps(response)
    except Exception as e:
        logger.error(
            f"Error in get_tax_information: {str(e)}\n{traceback.format_exc()}"
        )
        return json.dumps({"success": False, "error": str(e)})


def get_personal_data(args: str) -> str:
    """
    Get personal data for the citizen.

    Args:
        args (str): JSON string containing user_id

    Returns:
        str: JSON string with personal data
    """
    try:
        args = "{}"
        logger.info(f"get_personal_data called with args: {args}")
        params = json.loads(args)
        user_id = params.get("user_id", "anonymous")

        # Get user from database
        user = None
        for u in User.instances():
            if u.id == user_id:
                user = u
                break
        
        if not user:
            return json.dumps({"success": False, "error": "User not found"})

        personal_data = {
            "name": user.name or "",
            "id_number": user.id or "",
            "date_of_birth": "",
            "citizenship_status": "Full Citizenship" if user.profiles and "member" in user.profiles else "Pending",
            "registration_date": str(user.timestamp_created) if hasattr(user, 'timestamp_created') else "",
            "address": "",
            "email": user.email or "",
            "phone": "",
        }

        response = {"success": True, "data": {"personal_data": personal_data}}

        logger.info(f"get_personal_data successful for user: {user_id}")
        return json.dumps(response)
    except Exception as e:
        logger.error(f"Error in get_personal_data: {str(e)}\n{traceback.format_exc()}")
        return json.dumps({"success": False, "error": str(e)})
