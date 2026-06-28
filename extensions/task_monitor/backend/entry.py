"""
Task Monitor Backend Extension Entry Point
Provides task monitoring and management operations for administrators.
"""

import json
import traceback
from datetime import datetime
from typing import Any, Dict, List

import ggg
from core.task_manager import TaskManager
from ggg import Codex, Task, TaskExecution, TaskSchedule
from basilisk import ic
from ic_python_logging import get_logger

logger = get_logger("extensions.task_monitor")

DEFAULT_PAGE_SIZE = 10


def _relation_child_count(entity, relation_name: str) -> int:
    """Count related entities via reverse index without loading them."""
    try:
        db = entity.db()
        ids = db.reverse_index_get(entity._type, str(entity._id), relation_name)
        return len(ids)
    except Exception:
        return 0


def _load_schedules_for_task(task) -> List[Dict[str, Any]]:
    """Load schedule summaries without resolving the parent task relation."""
    schedules = []
    try:
        db = task.db()
        schedule_ids = db.reverse_index_get(task._type, str(task._id), "schedules")
        for sid in schedule_ids:
            schedule = TaskSchedule.load(sid, level=1)
            if schedule:
                schedules.append(
                    {
                        "_id": str(schedule._id),
                        "name": schedule.name,
                        "disabled": schedule.disabled,
                        "run_at": schedule.run_at,
                        "repeat_every": schedule.repeat_every,
                        "last_run_at": schedule.last_run_at,
                    }
                )
    except Exception:
        pass
    return schedules


def _get_timestamp_ms(entity, field: str):
    """Extract a millisecond timestamp from an entity.

    Tries the private `_timestamp_*` attribute first (int, ms since epoch).
    Falls back to the public `timestamp_*` formatted string set during load,
    parsing it back to milliseconds.  Returns None when unavailable.
    """
    private = f"_timestamp_{field}"
    val = getattr(entity, private, 0) or 0
    if val:
        return val
    public = f"timestamp_{field}"
    formatted = getattr(entity, public, None)
    if formatted and isinstance(formatted, str) and formatted != "None":
        try:
            dt = datetime.strptime(formatted, "%Y-%m-%d %H:%M:%S.%f")
            return int(dt.timestamp() * 1000)
        except ValueError:
            pass
    return None


def extension_sync_call(method_name: str, args: dict):
    """
    Synchronous extension API calls for task monitoring operations
    """
    methods = {
        "get_all_tasks": get_all_tasks,
        "get_task_details": get_task_details,
        "get_task_executions": get_task_executions,
        "get_execution_logs": get_execution_logs,
        "toggle_schedule": toggle_schedule,
        "run_task_now": run_task_now,
        "stop_task": stop_task,
        "delete_task": delete_task,
        "get_task_logs": get_task_logs,
    }

    if method_name not in methods:
        return json.dumps({"success": False, "error": f"Unknown method: {method_name}"})

    function = methods[method_name]

    try:
        return function(args)
    except Exception as e:
        logger.error(f"Error calling {method_name}: {str(e)}")
        logger.error(traceback.format_exc())
        return json.dumps(
            {"success": False, "error": f"Error calling {method_name}: {str(e)}"}
        )


def get_all_tasks(args: str = "{}"):
    """
    Get a page of tasks with their schedules and status.
    Uses shallow loads and reverse-index counts to stay within IC instruction limits.
    Skips temporary _shell_* tasks.
    """
    try:
        if isinstance(args, str):
            args = json.loads(args) if args else {}
        show_shell = args.get("show_shell", False)
        from_id = int(args.get("from_id", 1))
        page_size = int(args.get("page_size", DEFAULT_PAGE_SIZE))

        max_id = Task.max_id()

        # Load one page of tasks, skipping shell tasks
        # We may need to load extra batches if shell tasks are filtered out
        tasks = []
        current_from = from_id
        attempts = 0
        while len(tasks) < page_size and current_from <= max_id and attempts < 10:
            batch = []
            batch_end = min(current_from + page_size - 1, max_id)
            for eid in range(current_from, batch_end + 1):
                try:
                    entity = Task.load(str(eid), level=1)
                    if entity:
                        batch.append(entity)
                except Exception as load_err:
                    logger.warning(
                        f"get_all_tasks: skipping Task {eid} due to load error: {load_err}"
                    )
            if not batch:
                break
            for task in batch:
                if not show_shell and hasattr(task, "name") and task.name.startswith("Shell Task _shell_"):
                    continue

                task_id = str(task._id)

                task_data = {
                    "_id": task_id,
                    "name": task.name,
                    "status": task.status if hasattr(task, "status") else "unknown",
                    "metadata": task.metadata if hasattr(task, "metadata") else "",
                    "step_to_execute": (
                        task.step_to_execute if hasattr(task, "step_to_execute") else 0
                    ),
                    "total_steps": _relation_child_count(task, "steps"),
                    "executions_count": _relation_child_count(task, "executions"),
                    "schedules": _load_schedules_for_task(task),
                    "created_at": _get_timestamp_ms(task, "created"),
                    "updated_at": _get_timestamp_ms(task, "updated"),
                }

                tasks.append(task_data)
                if len(tasks) >= page_size:
                    break

            current_from = int(batch[-1]._id) + 1
            attempts += 1

        # Determine next_from_id for the frontend to request the next page
        next_from_id = current_from if current_from <= max_id else None

        return json.dumps({
            "success": True,
            "tasks": tasks,
            "count": len(tasks),
            "max_id": max_id,
            "next_from_id": next_from_id,
            "has_more": next_from_id is not None,
        })
    except Exception as e:
        logger.error(f"Error getting tasks: {str(e)}")
        logger.error(traceback.format_exc())
        return json.dumps({"success": False, "error": str(e)})


def get_task_details(args):
    """
    Get detailed information about a specific task including steps and codex
    """
    try:
        logger.info("get_task_details: START")
        # Parse args if it's a string
        if isinstance(args, str):
            args = json.loads(args)
        task_id = args.get("task_id")
        if not task_id:
            return json.dumps({"success": False, "error": "task_id is required"})

        logger.info(f"get_task_details: loading task {task_id}")
        # Find task
        task = Task.load(task_id)
        if not task:
            return json.dumps({"success": False, "error": f"Task {task_id} not found"})
        logger.info(f"get_task_details: task loaded: {task.name}")

        exec_count = _relation_child_count(task, "executions")

        # Build detailed task data
        task_data = {
            "_id": str(task._id),
            "name": task.name,
            "status": task.status if hasattr(task, "status") else "unknown",
            "metadata": task.metadata if hasattr(task, "metadata") else "",
            "step_to_execute": (
                task.step_to_execute if hasattr(task, "step_to_execute") else 0
            ),
            "steps": [],
            "schedules": [],
            "created_at": _get_timestamp_ms(task, "created"),
            "updated_at": _get_timestamp_ms(task, "updated"),
            "executions_count": exec_count,
        }
        logger.info("get_task_details: basic data built")

        # Get steps with their calls and codex
        logger.info("get_task_details: loading steps")
        if hasattr(task, "steps"):
            for step in task.steps:
                step_data = {
                    "_id": str(step._id),
                    "status": step.status if hasattr(step, "status") else "pending",
                    "run_next_after": (
                        step.run_next_after if hasattr(step, "run_next_after") else 0
                    ),
                    "codex": None,
                }

                # Get codex information
                if hasattr(step, "call") and step.call:
                    call = step.call
                    if hasattr(call, "codex") and call.codex:
                        codex = call.codex
                        step_data["codex"] = {
                            "_id": str(codex._id),
                            "name": codex.name,
                            "code": codex.code if hasattr(codex, "code") else "",
                            "description": (
                                codex.description
                                if hasattr(codex, "description")
                                else ""
                            ),
                        }
                    step_data["is_async"] = (
                        call.is_async if hasattr(call, "is_async") else False
                    )

                task_data["steps"].append(step_data)
        logger.info(f"get_task_details: {len(task_data['steps'])} steps loaded")

        # Get schedules
        logger.info("get_task_details: loading schedules")
        if hasattr(task, "schedules"):
            for schedule in task.schedules:
                task_data["schedules"].append(
                    {
                        "_id": str(schedule._id),
                        "name": schedule.name,
                        "disabled": schedule.disabled,
                        "run_at": schedule.run_at,
                        "repeat_every": schedule.repeat_every,
                        "last_run_at": schedule.last_run_at,
                    }
                )

        # Get executions with pagination using load_some
        # Load a page of TaskExecution filtered by task_id
        logger.info("get_task_details: starting execution scan")
        exec_from_id = int(args.get("exec_from_id", 1))
        exec_page_size = int(args.get("exec_page_size", DEFAULT_PAGE_SIZE))
        task_data["executions"] = []
        task_data["exec_max_id"] = TaskExecution.max_id()
        logger.info(f"get_task_details: exec_max_id={task_data['exec_max_id']}, exec_from_id={exec_from_id}")

        execs_found = []
        current_from = exec_from_id
        # Use level=2 to load TaskExecution + direct Task ref without deep resolution
        # (avoids crashes from missing Call entities in Task.steps)
        while len(execs_found) < exec_page_size and current_from <= task_data["exec_max_id"]:
            try:
                exc = TaskExecution.load(str(current_from), level=2)
            except Exception:
                logger.warning(f"get_task_details: skipping TaskExecution {current_from} due to load error")
                current_from += 1
                continue
            current_from += 1
            if not exc:
                continue
            if hasattr(exc, "task") and exc.task and str(exc.task._id) == task_id:
                execs_found.append(exc)

        logger.info(f"get_task_details: exec scan done, found={len(execs_found)}")
        task_data["exec_next_from_id"] = current_from if current_from <= task_data["exec_max_id"] else None
        task_data["exec_has_more"] = task_data["exec_next_from_id"] is not None

        for execution in execs_found:
            exec_data = {
                "_id": str(execution._id),
                "name": execution.name,
                "status": execution.status,
                "result": execution.result if hasattr(execution, "result") else "",
                "created_at": _get_timestamp_ms(execution, "created"),
                "updated_at": _get_timestamp_ms(execution, "updated"),
                "logger_name": execution._logger_name() if hasattr(execution, "_logger_name") else "",
            }
            task_data["executions"].append(exec_data)

        logger.info("get_task_details: DONE, returning response")
        return json.dumps({"success": True, "task": task_data})
    except Exception as e:
        logger.error(f"Error getting task details: {str(e)}")
        logger.error(traceback.format_exc())
        return json.dumps({"success": False, "error": str(e)})


def get_task_executions(args):
    """
    Get execution history for a specific task
    """
    try:
        # Parse args if it's a string
        if isinstance(args, str):
            args = json.loads(args)
        task_id = args.get("task_id")
        limit = args.get("limit", 50)

        if not task_id:
            return json.dumps({"success": False, "error": "task_id is required"})

        # Find task
        task = Task.load(task_id)
        if not task:
            return json.dumps({"success": False, "error": f"Task {task_id} not found"})

        executions = []
        if hasattr(task, "executions"):
            for execution in list(task.executions)[:limit]:
                executions.append(
                    {
                        "_id": str(execution._id),
                        "name": execution.name,
                        "status": execution.status,
                        "logs": execution.logs if hasattr(execution, "logs") else "",
                        "result": (
                            execution.result if hasattr(execution, "result") else ""
                        ),
                        "created_at": _get_timestamp_ms(execution, "created"),
                        "updated_at": _get_timestamp_ms(execution, "updated"),
                    }
                )

        return json.dumps(
            {
                "success": True,
                "executions": executions,
                "count": len(executions),
                "task_name": task.name,
            }
        )
    except Exception as e:
        logger.error(f"Error getting task executions: {str(e)}")
        logger.error(traceback.format_exc())
        return json.dumps({"success": False, "error": str(e)})


def get_execution_logs(args):
    """
    Get logs for a specific task execution by its logger_name
    """
    try:
        if isinstance(args, str):
            args = json.loads(args)
        logger_name = args.get("logger_name")
        limit = int(args.get("limit", 200))

        if not logger_name:
            return json.dumps({"success": False, "error": "logger_name is required"})

        from ic_python_logging import get_logs

        all_logs = get_logs(max_entries=limit * 10)
        exec_logs = [
            log for log in all_logs
            if log.get("logger_name", "") == logger_name
        ][:limit]

        raw_lines = []
        for log in exec_logs:
            timestamp = log.get("timestamp", 0)
            from datetime import datetime
            try:
                dt = datetime.fromtimestamp(timestamp / 1_000_000_000)
                time_str = dt.strftime("%Y-%m-%d %H:%M:%S")
            except Exception:
                time_str = str(timestamp)
            level = log.get("level", "INFO")
            message = log.get("message", "")
            raw_lines.append(f"[{time_str}] [{level}] {message}")

        return json.dumps({
            "success": True,
            "logs": "\n".join(raw_lines),
            "count": len(exec_logs),
            "logger_name": logger_name,
        })
    except Exception as e:
        logger.error(f"Error getting execution logs: {str(e)}")
        logger.error(traceback.format_exc())
        return json.dumps({"success": False, "error": str(e)})


def toggle_schedule(args):
    """
    Enable or disable a task schedule
    """
    try:
        # Parse args if it's a string
        if isinstance(args, str):
            args = json.loads(args)
        schedule_id = args.get("schedule_id")
        disabled = args.get("disabled", True)

        if not schedule_id:
            return json.dumps({"success": False, "error": "schedule_id is required"})

        # Find schedule
        schedule = TaskSchedule.load(schedule_id)
        if not schedule:
            return json.dumps(
                {"success": False, "error": f"Schedule {schedule_id} not found"}
            )

        schedule.disabled = disabled
        logger.info(
            f"Schedule {schedule.name} ({'disabled' if disabled else 'enabled'})"
        )

        return json.dumps(
            {
                "success": True,
                "message": f"Schedule {'disabled' if disabled else 'enabled'}",
                "schedule_id": str(schedule._id),
                "disabled": disabled,
            }
        )
    except Exception as e:
        logger.error(f"Error toggling schedule: {str(e)}")
        logger.error(traceback.format_exc())
        return json.dumps({"success": False, "error": str(e)})


def run_task_now(args):
    """
    Immediately execute a task by triggering the task manager.
    If the task has no steps, attempts to find and execute the codex
    referenced in the task's metadata directly.
    """
    try:
        if isinstance(args, str):
            args = json.loads(args)
        task_id = args.get("task_id")

        if not task_id:
            return json.dumps({"success": False, "error": "task_id is required"})

        task = Task.load(task_id)
        if not task:
            return json.dumps({"success": False, "error": f"Task {task_id} not found"})

        has_steps = hasattr(task, "steps") and len(list(task.steps)) > 0

        if has_steps:
            # Normal flow: reset task, steps, AND schedule so it triggers immediately
            if hasattr(task, "status"):
                task.status = "pending"
            if hasattr(task, "step_to_execute"):
                task.step_to_execute = 0
            for step in task.steps:
                if hasattr(step, "status"):
                    step.status = "pending"
            # Reset schedule.last_run_at so _update_timers sees it as never-run
            if hasattr(task, "schedules"):
                for schedule in task.schedules:
                    schedule.last_run_at = 0

            manager = TaskManager()
            manager.add_task(task)
            manager.run()

            logger.info(f"Task {task.name} triggered manually via task manager")
            return json.dumps({
                "success": True,
                "message": f"Task {task.name} started",
                "task_id": str(task._id),
            })
        else:
            # No steps: try to execute codex directly from metadata
            codex_name = None
            if hasattr(task, "metadata") and task.metadata:
                try:
                    meta = json.loads(task.metadata)
                    codex_name = meta.get("codex_name")
                except Exception:
                    pass

            if not codex_name:
                return json.dumps({
                    "success": False,
                    "error": f"Task {task.name} has no steps and no codex_name in metadata",
                })

            codex = Codex[codex_name]
            if not codex:
                return json.dumps({
                    "success": False,
                    "error": f"Codex '{codex_name}' not found",
                })

            if not hasattr(codex, "code") or not codex.code:
                return json.dumps({
                    "success": False,
                    "error": f"Codex '{codex_name}' has no code",
                })

            # Create execution record and run the codex directly
            task_execution = task.new_task_execution()
            task_execution.status = "running"

            # Codex code defines functions (e.g. async_task(), main()) but doesn't call them.
            # Detect and append a call to the entry point function.
            code_to_run = codex.code
            logger.info(f"run_task_now: codex code length={len(code_to_run)}")
            # Codex entry points may use 'yield' for IC async calls, making them generators.
            # We must iterate the generator to actually execute the code body.
            _call_snippet = '''
_entry_result = {entry_fn}()
if hasattr(_entry_result, '__next__'):
    try:
        while True:
            next(_entry_result)
    except StopIteration:
        pass
'''
            if 'def async_task' in code_to_run:
                logger.info("run_task_now: detected async_task entry point")
                code_to_run += _call_snippet.format(entry_fn='async_task')
            elif 'def main' in code_to_run:
                logger.info("run_task_now: detected main entry point")
                code_to_run += _call_snippet.format(entry_fn='main')
            else:
                logger.info("run_task_now: no entry point function detected, running code as-is")

            from core.execution import run_code
            result = run_code(code_to_run, task_execution=task_execution)
            logger.info(f"run_task_now: run_code result success={result.get('success')}, error={result.get('error', 'none')[:200] if result.get('error') else 'none'}")

            if result.get("success"):
                task_execution.status = "completed"
                task_execution.result = str(result.get("result", ""))[:4999]
                task.status = "completed"
                msg = f"Task {task.name} executed successfully (codex: {codex_name})"
            else:
                task_execution.status = "failed"
                task_execution.result = str(result.get("error", ""))[:4999]
                task.status = "failed"
                msg = f"Task {task.name} execution failed (codex: {codex_name})"

            logger.info(msg)
            return json.dumps({
                "success": True,
                "message": msg,
                "task_id": str(task._id),
                "execution_id": str(task_execution._id),
            })

    except Exception as e:
        logger.error(f"Error running task: {str(e)}")
        logger.error(traceback.format_exc())
        return json.dumps({"success": False, "error": str(e)})


def stop_task(args):
    """
    Stop a running task by setting status to 'cancelled' and disabling schedules.
    The timer callback checks for 'cancelled' status and skips execution.
    """
    try:
        if isinstance(args, str):
            args = json.loads(args)
        task_id = args.get("task_id")

        if not task_id:
            return json.dumps({"success": False, "error": "task_id is required"})

        task = Task.load(task_id)
        if not task:
            return json.dumps({"success": False, "error": f"Task {task_id} not found"})

        task_name = task.name
        task.status = "cancelled"

        if hasattr(task, "schedules"):
            for schedule in task.schedules:
                schedule.disabled = True

        logger.info(f"Task {task_name} stopped (status=cancelled, schedules disabled)")

        return json.dumps({
            "success": True,
            "message": f"Task {task_name} stopped",
            "task_id": str(task._id),
        })
    except Exception as e:
        logger.error(f"Error stopping task: {str(e)}")
        logger.error(traceback.format_exc())
        return json.dumps({"success": False, "error": str(e)})


def delete_task(args):
    """
    Delete a task and its associated schedules and executions
    """
    try:
        # Parse args if it's a string
        if isinstance(args, str):
            args = json.loads(args)
        task_id = args.get("task_id")

        if not task_id:
            return json.dumps({"success": False, "error": "task_id is required"})

        # Find task
        task = Task.load(task_id)
        if not task:
            return json.dumps({"success": False, "error": f"Task {task_id} not found"})

        task_name = task.name

        # Delete associated schedules
        if hasattr(task, "schedules"):
            for schedule in list(task.schedules):
                schedule.delete()

        # Delete associated executions
        if hasattr(task, "executions"):
            for execution in list(task.executions):
                execution.delete()

        # Delete task steps
        if hasattr(task, "steps"):
            for step in list(task.steps):
                if hasattr(step, "call") and step.call:
                    step.call.delete()
                step.delete()

        # Delete task
        task.delete()

        logger.info(f"Task {task_name} deleted")

        return json.dumps(
            {
                "success": True,
                "message": f"Task {task_name} deleted successfully",
                "task_id": task_id,
            }
        )
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        logger.error(traceback.format_exc())
        return json.dumps({"success": False, "error": str(e)})


def get_task_logs(args):
    """
    Get recent logs from ic-python-logging for a specific task
    """
    try:
        # Parse args if it's a string
        if isinstance(args, str):
            args = json.loads(args)
        task_id = args.get("task_id")
        limit = int(args.get("limit", 100))

        if not task_id:
            return json.dumps({"success": False, "error": "task_id is required"})

        # Import the logging module to access logs
        from ic_python_logging import get_logs

        # Get logs for this task - logs are stored with pattern task_{task_id}_{execution_id}
        # We need to search for all logs that start with task_{task_id}_
        logger_prefix = f"task_{task_id}_"
        
        # Get all logs and filter by prefix
        # get_logs signature: (from_entry, max_entries, min_level, logger_name)
        all_logs = get_logs(max_entries=limit * 10)  # Get more to filter
        task_logs = [
            log for log in all_logs 
            if log.get("logger_name", "").startswith(logger_prefix)
        ][:limit]

        # Format as raw logs string for display
        raw_lines = []
        for log in task_logs:
            timestamp = log.get("timestamp", 0)
            # Convert nanoseconds to readable format
            from datetime import datetime
            try:
                dt = datetime.fromtimestamp(timestamp / 1_000_000_000)
                time_str = dt.strftime("%Y-%m-%d %H:%M:%S")
            except:
                time_str = str(timestamp)
            level = log.get("level", "INFO")
            message = log.get("message", "")
            raw_lines.append(f"[{time_str}] [{level}] {message}")
        
        raw_logs = "\n".join(raw_lines)

        return json.dumps({
            "success": True, 
            "logs": raw_logs,
            "parsed_logs": task_logs,
            "count": len(task_logs)
        })
    except Exception as e:
        # Fallback if get_logs doesn't exist
        logger.error(f"Error getting task logs: {traceback.format_exc()}")
        return json.dumps(
            {
                "success": False,
                "error": "Log retrieval not available",
                "message": "Check TaskExecution records for execution logs",
            }
        )


def extension_async_call(method_name: str, args: dict):
    """
    Async extension API calls (reserved for future use)
    """
    return json.dumps({"success": False, "error": "No async methods available"})
