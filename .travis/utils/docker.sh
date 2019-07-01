#!/bin/bash

build() {
    VERSION="${1}"
    echo "==> Building docker images"
    ./apps/build/docker_build.sh ${VERSION}
}

export -f build

tag() {
    TAGGED="${1}"
    TOTAG="${2}"

    docker tag awjh/vehicle-manufacture-iot-extension-car-builder:$TAGGED awjh/vehicle-manufacture-iot-extension-car-builder:$TOTAG
    docker tag awjh/vehicle-manufacture-iot-extension-manufacturer:$TAGGED awjh/vehicle-manufacture-iot-extension-manufacturer:$TOTAG
    docker tag awjh/vehicle-manufacture-iot-extension-insurer:$TAGGED awjh/vehicle-manufacture-iot-extension-insurer:$TOTAG
    docker tag awjh/vehicle-manufacture-iot-extension-regulator:$TAGGED awjh/vehicle-manufacture-iot-extension-regulator:$TOTAG
}

export -f tag

deploy() {
    echo "==> Logging in to Docker"
    echo "$DOCKER_PASSWORD" | docker login -u "${DOCKER_USERNAME}" --password-stdin
    VERSION="${1}"
    echo "==> Pushing docker images. Version: ${VERSION}"
    docker push awjh/vehicle-manufacture-iot-extension-car-builder:$VERSION &
    CAR_PROCESS_ID=$!
    docker push awjh/vehicle-manufacture-iot-extension-manufacturer:$VERSION &
    MANUFACTURER_ID=$!
    docker push awjh/vehicle-manufacture-iot-extension-insurer:$VERSION &
    INSURER_ID=$!
    docker push awjh/vehicle-manufacture-iot-extension-regulator:$VERSION &
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
}

export -f deploy
