#!/bin/bash

COMPANY_NAME=$1
LOGGING_LEVEL="info"

if [ ! -z "$CORE_CHAINCODE_LOGGING_LEVEL" ]
then
    LOGGING_LEVEL=$CORE_CHAINCODE_LOGGING_LEVEL
fi

docker exec -d $COMPANY_NAME"_cli" bash -c "pkill -9 node; export CORE_CHAINCODE_LOGGING_LEVEL=$LOGGING_LEVEL; cd /etc/hyperledger/contract; npm run start:$COMPANY_NAME"

echo 'HELLO';