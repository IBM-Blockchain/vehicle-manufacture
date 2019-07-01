#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

# Grab the parent (root) directory.
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`

if [ "${ABORT_BUILD}" = "true" ]; then
  echo "-#- exiting early from ${ME}"
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

# Start the X virtual frame buffer used by Karma.
if [ -r "/etc/init.d/xvfb" ]; then
    export DISPLAY=:99.0
    sh -e /etc/init.d/xvfb start
fi

echo "==> Running tests"
for dir in $COMMON_DIR $BUILDER_DIR_CLIENT $BUILDER_DIR_SERVER $INSURER_DIR $MANUFACTURER_DIR $REGULATOR_DIR $CONTRACT_DIR
do
    cd ${dir}
    echo "==> $dir"
    npm test 2>&1
    npm run test:functional --if-present 2>&1
done

cd ${DIR}

if [ ! -z "$TRAVIS_TAG" ]; then
  if [[ $TRAVIS_TAG =~ ([0-9]+\.){2}[0-9]+ ]]; then
    ./.travis/branch-release.sh
  else
    echo "INVALID TAG. SHOULD BE OF FORMAT x.x.x"
    exit 1
  fi
fi

./.travis/image-deploy.sh
