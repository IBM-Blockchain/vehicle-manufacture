#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`

cd $DIR

APPS_DIR="$DIR/apps"

CAR_CLIENT="$APPS_DIR/car_builder/client"
CAR_SERVER="$APPS_DIR/car_builder/server"
COMMON="$APPS_DIR/common"
INSURER="$APPS_DIR/insurer"
MANUFACTURER="$APPS_DIR/manufacturer"
REGULATOR="$APPS_DIR/regulator"
MAIN="$DIR"

PACKAGES=($CAR_CLIENT $CAR_SERVER $COMMON $INSURER $MANUFACTURER $REGULATOR $MAIN)

version_set() {
    VERSION="${1}"

    for PACKAGE in "${PACKAGES[@]}"; do
        PACKAGE_JSON="$PACKAGE/package.json"
        jq -r ".version=\"$VERSION\"" "$PACKAGE_JSON" | cat > tmp.json

        mv tmp.json $PACKAGE_JSON
    done
}

update_env() {
    VERSION="${1}"

    sed -i -e "s/unstable/$VERSION/g" $DIR/scripts/apps/docker-compose/.env
}

version_bump() {
    VERSION="${1}"

    MAJOR_VERSION=$(cut -d '.' -f 1 <<< "$VERSION")
    MINOR_VERSION=$(cut -d '.' -f 2 <<< "$VERSION")
    PATCH_VERSION=$(cut -d '.' -f 3 <<< "$VERSION")

    NEW_VERSION="$MAJOR_VERSION.$MINOR_VERSION.$((PATCH_VERSION + 1))"

    version_set $NEW_VERSION
}

RELEASE_BRANCH="v$TRAVIS_TAG"

git remote add repo https://${GH_TOKEN}@github.com/ibm-blockchain/vehicle-manufacture-iot-extension

git checkout -b "$RELEASE_BRANCH"
version_set $TRAVIS_TAG
update_env $TRAVIS_TAG
git add .
git commit -s -m "Release $TRAVIS_TAG"
git push repo "$RELEASE_BRANCH"

git fetch repo
git checkout master
version_bump $TRAVIS_TAG
git add .
git commit -s -m "Version bump for release $TRAVIS_TAG"
git push repo master
