#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`

if [ "${ABORT_BUILD}" = "true" ]; then
  echo "-#- Exiting early from ${ME}"
  exit ${ABORT_CODE}
fi

APPS_DIR=$DIR/apps
COMMON_DIR=$APPS_DIR/common
BUILDER_DIR_CLIENT=$APPS_DIR/car_builder/client
BUILDER_DIR_SERVER=$APPS_DIR/car_builder/server
INSURER_DIR=$APPS_DIR/insurer
MANUFACTURER_DIR=$APPS_DIR/manufacturer
REGULATOR_DIR=$APPS_DIR/regulator
CONTRACT_DIR=$DIR/contract

cd ${DIR}
npm install
npm run licchkadd

echo "==> Running install & build"
for dir in $COMMON_DIR $BUILDER_DIR_CLIENT $BUILDER_DIR_SERVER $INSURER_DIR $MANUFACTURER_DIR $REGULATOR_DIR $CONTRACT_DIR
do
    cd ${dir}
    echo "==> $dir"
    npm install
    npm run build
done

cd ${DIR}
