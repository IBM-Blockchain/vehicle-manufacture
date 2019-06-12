#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`


export ALL_DOCKER_IMAGES=("awjh/vehicle-manufacture-iot-extension-car-builder" "awjh/vehicle-manufacture-iot-extension-manufacturer" "awjh/vehicle-manufacture-iot-extension-regulator" "awjh/vehicle-manufacture-iot-extension-insurer")


if [[ "$TRAVIS_PULL_REQUEST" = "false" ]]; then
    if [[ "$TRAVIS_BRANCH" = "master" ]]; then
        echo "==> Building docker images"
        ./../apps/build/docker_build.sh unstable
        docker login -u="${DOCKER_USERNAME}" -p="${DOCKER_PASSWORD}"
        echo "==> Deploying docker images"
    else
        echo "==> Skipping deploy. Not merging into master"
    fi
else
    echo "==> Skipping deploy. Not a pull request"
fi
