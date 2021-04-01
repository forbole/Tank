!bash

rm -rf ~/.desmosd
rm -rf ~/.desmoscli

desmosd init spam --chain-id=testchain

desmoscli config output json
desmoscli config indent true
desmoscli config trust-node true
desmoscli config chain-id mindsmall
desmoscli config keyring-backend test

desmoscli keys add user1
desmoscli keys add user2

desmosd add-genesis-account $(desmoscli keys show user1 -a) 1000daric,100000000stake
desmosd add-genesis-account $(desmoscli keys show user2 -a) 1000daric,100000000stake

desmosd gentx --name user1 --keyring-backend test

echo "Collecting genesis txs..."
desmosd collect-gentxs

echo "Validating genesis file..."
desmosd validate-genesis