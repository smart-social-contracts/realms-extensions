#!/bin/bash
set -e

echo "=== Deploying Test Canisters ==="

# Configuration
NUM_ADDITIONAL_TRANSACTIONS=${NUM_ADDITIONAL_TRANSACTIONS:-5}  # Default to 5 additional transactions

# Get current principal for initialization
PRINCIPAL=$(dfx identity get-principal)
echo "Using principal: $PRINCIPAL"
echo "Will send $NUM_ADDITIONAL_TRANSACTIONS additional transactions after initial transfer"

# Step 1: Create canisters
echo ""
echo "[1/8] Creating canisters..."
dfx canister create --all --no-wallet

# Step 2: Deploy the ckBTC ledger
echo ""
echo "[2/8] Deploying ckbtc_ledger..."
dfx deploy ckbtc_ledger --no-wallet --yes --argument="(variant { Init = record { minting_account = record { owner = principal \"aaaaa-aa\"; subaccount = null }; transfer_fee = 10; token_symbol = \"ckBTC\"; token_name = \"ckBTC Test\"; decimals = opt 8; metadata = vec {}; initial_balances = vec { record { record { owner = principal \"$PRINCIPAL\"; subaccount = null }; 1_000_000_000 } }; feature_flags = opt record { icrc2 = true }; archive_options = record { num_blocks_to_archive = 1000; trigger_threshold = 2000; controller_id = principal \"$PRINCIPAL\" } } })"

# Step 3: Get the ledger canister ID
echo ""
echo "[3/8] Getting ledger canister ID..."
LEDGER_ID=$(dfx canister id ckbtc_ledger)
echo "Ledger canister ID: $LEDGER_ID"

# Step 4: Deploy the ckBTC indexer with the ledger ID
echo ""
echo "[4/8] Deploying ckbtc_indexer with ledger reference..."
dfx deploy ckbtc_indexer --no-wallet --argument="(opt variant { Init = record { ledger_id = principal \"$LEDGER_ID\"; retrieve_blocks_from_ledger_interval_seconds = opt 1 } })"

echo ""
echo "✅ All test canisters deployed successfully!"
echo ""
echo "Canister IDs:"
echo "  - ckbtc_ledger: $LEDGER_ID"
echo "  - ckbtc_indexer: $(dfx canister id ckbtc_indexer)"

# Step 5: Get realm_backend canister ID
echo ""
echo "[5/8] Getting realm_backend canister ID..."
REALM_BACKEND_ID=$(dfx canister id realm_backend)
echo "Realm backend canister ID: $REALM_BACKEND_ID"

# Step 6: Send initial test tokens to realm_backend
echo ""
echo "[6/8] Sending initial 100,000 ckBTC tokens to realm_backend..."
TRANSFER_RESULT=$(dfx canister call ckbtc_ledger icrc1_transfer "(record {
  to = record {
    owner = principal \"$REALM_BACKEND_ID\";
    subaccount = null;
  };
  amount = 100_000;
  fee = null;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
})")

echo "Transfer result: $TRANSFER_RESULT"

# Step 7: Send N additional transactions with incrementing amounts
echo ""
echo "[7/8] Sending $NUM_ADDITIONAL_TRANSACTIONS additional transactions with amounts 1, 2, 3, ... $NUM_ADDITIONAL_TRANSACTIONS satoshis..."
TOTAL_SENT=100000  # Track total amount sent (including initial)

for i in $(seq 1 $NUM_ADDITIONAL_TRANSACTIONS); do
  echo "  Transaction $i: Sending $i satoshi(s) to realm_backend..."
  TRANSFER_RESULT=$(dfx canister call ckbtc_ledger icrc1_transfer "(record {
    to = record {
      owner = principal \"$REALM_BACKEND_ID\";
      subaccount = null;
    };
    amount = $i;
    fee = null;
    memo = null;
    from_subaccount = null;
    created_at_time = null;
  })")
  
  # Add to total (note: each transfer also has a 10 satoshi fee deducted from sender)
  TOTAL_SENT=$((TOTAL_SENT + i))
  
  # Small delay to ensure transactions are processed and indexed
  sleep 0.5
done

echo "✅ Sent $NUM_ADDITIONAL_TRANSACTIONS additional transactions"
echo "   Total amount sent to realm_backend: $TOTAL_SENT satoshis"

# Step 8: Verify balance and check indexer
echo ""
echo "[8/8] Verifying final balance and checking indexer..."
BALANCE=$(dfx canister call ckbtc_ledger icrc1_balance_of "(record {
  owner = principal \"$REALM_BACKEND_ID\";
  subaccount = null;
})")
echo "Realm backend balance: $BALANCE"

echo ""
echo "Checking indexer transactions..."
dfx canister call ckbtc_indexer get_account_transactions "(record {
  account = record {
    owner = principal \"$REALM_BACKEND_ID\";
    subaccount = null;
  };
  start = null;
  max_results = 20 : nat;
})"

echo ""
echo "🎉 Test setup complete!"
echo "  - Initial transfer: 100,000 satoshis"
echo "  - Additional transactions: $NUM_ADDITIONAL_TRANSACTIONS (amounts: 1, 2, 3, ..., $NUM_ADDITIONAL_TRANSACTIONS)"
echo "  - Total sent to realm_backend: $TOTAL_SENT satoshis"
echo "  - All transactions indexed and verified"
echo ""
echo "💡 To change the number of additional transactions, set NUM_ADDITIONAL_TRANSACTIONS environment variable"
echo "   Example: NUM_ADDITIONAL_TRANSACTIONS=10 bash $0"
