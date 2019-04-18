#!/bin/bash

COMPANY_NAME=$1
LOGGING_LEVEL="info"

if [ ! -z "$CORE_CHAINCODE_LOGGING_LEVEL" ]
then
    LOGGING_LEVEL=$CORE_CHAINCODE_LOGGING_LEVEL
fi

docker exec -d $COMPANY_NAME"_cli" bash -c "export CORE_CHAINCODE_LOGGING_LEVEL=$LOGGING_LEVEL; cd /etc/hyperledger/contract; npm rebuild; pkill -9 node; ./node_modules/concurrently/bin/concurrently.js \"npm run build:watch\" \"npm run dev:watch:$COMPANY_NAME\""