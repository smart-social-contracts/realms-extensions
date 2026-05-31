"""
Vault Candid types — re-exports from basilisk.canisters.icrc.

All ICRC-1/ICRC-2 Candid types, service definitions, and error variants
are now provided by ``basilisk.canisters.icrc`` (ic-basilisk >= 0.10.0).
This module re-exports them for backward compatibility.
"""

# Re-export every ICRC type from basilisk so existing imports keep working.
from basilisk.canisters.icrc import (
    Account,
    AccountTransaction,
    Approve,
    BadBurn,
    BadFee,
)
from basilisk.canisters.icrc import BurnTx as Burn  # noqa: F401
from basilisk.canisters.icrc import (
    Duplicate,
    GenericError,
    GetAccountTransactionsRequest,
    GetAccountTransactionsResponse,
    GetTransactionsResult,
    ICRCIndexer,
    ICRCLedger,
    InsufficientFunds,
)
from basilisk.canisters.icrc import MintTx as Mint
from basilisk.canisters.icrc import (
    Spender,
    Transaction,
    TransferArg,
    TransferError,
    TransferResult,
)
from basilisk.canisters.icrc import TransferTx as Transfer
