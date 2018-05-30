#!/bin/bash

set -ev
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

ROOT=$DIR/../..

cd $ROOT
npm install

cd "${DIR}"
cat install.sh.in | sed \
-e 's/{{ENV}}/0.19.5/g' \
-e "s/{{NETWORK-VERSION}}/0.2.4/g" \
> install.sh
echo "PAYLOAD:" >> install.sh
tar czf - -C ${DIR} vehicle-manufacture-network.bna -C $DIR flows.json fabric-dev-servers >> install.sh