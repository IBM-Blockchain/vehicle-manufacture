#!/bin/bash

# Exit on first error, print all commands.
set -ev
set -o pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
ME=`basename "$0"`


if [[ "$TRAVIS_PULL_REQUEST" = "false" ]]; then
    if [[ "$TRAVIS_BRANCH" = "master" ]]; then
        echo "==> Building docker images"
        ./../apps/build/docker_build.sh unstable
        docker login -u="${DOCKER_USERNAME}" -p="${DOCKER_PASSWORD}"
        echo "==> Pushing docker images"
        VERSION=unstable

        docker push awjh/vehicle-manufacture-iot-extension-car-builder:$VERSION
        CAR_PROCESS_ID=$!
        docker push awjh/vehicle-manufacture-iot-extension-manufacturer:$VERSION
        MANUFACTURER_ID=$!
        docker push awjh/vehicle-manufacture-iot-extension-insurer:$VERSION
        INSURER_ID=$!
        docker push awjh/vehicle-manufacture-iot-extension-regulator:$VERSION
        REGULATOR_ID=$!

        wait $CAR_PROCESS_ID
        CAR_EXIT=$?

        wait $MANUFACTURER_ID
        MANUFACTURER_EXIT=$?

        wait $INSURER_ID
        INSURER_EXIT=$?

        wait $REGULATOR_ID
        REGULATOR_EXIT=$?

        if [ "$CAR_EXIT" != 0 ] || [ "$MANUFACTURER_EXIT" != 0 ] || [ "$INSURER_EXIT" != 0 ] || [ $REGULATOR_EXIT != 0 ]
        then
            echo "Failed to push docker images. Build processes exited with:"
            echo "Car Builder: $CAR_EXIT"
            echo "Manufacturer: $MANUFACTURER_EXIT"
            echo "Insurer: $INSURER_EXIT"
            echo "Regulator: $REGULATOR_EXIT"
            echo "Check the logs for more details: $LOG_PATH"

            exit 1
        fi

        echo "#########################"
        echo "# DOCKER PUSH FINISHED #"
        echo "#########################"

        exit 0
    else
        echo "==> Skipping deploy. Not merging into master"
    fi
else
    echo "==> Skipping deploy. Not a pull request"
fi
