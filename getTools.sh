#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
mkdir ${DIR}/fabric-tools && cd ${DIR}/fabric-tools
curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/tree/beb56997d73d2501c7af481fbf36a79206c75365/packages/fabric-dev-servers/fabric-dev-servers.zip
unzip -q fabric-dev-servers.zip
rm fabric-dev-servers.zip
cd ${DIR}
