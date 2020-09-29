#!/bin/bash

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

echo "#########################"
echo "# STARTING DOCKER BUILD #"
echo "#########################"

BASEDIR=$(dirname "$0")
VERSION="$1"

if [ -z "$1" ]
then
    echo "No version supplied"
    exit 1
fi

if [ $BASEDIR = '.' ]
then
    BASEDIR=$(pwd)
elif [ ${BASEDIR:0:2} = './' ]
then
    BASEDIR=$(pwd)${BASEDIR:1}
elif [ ${BASEDIR:0:1} = '/' ]
then
    BASEDIR=${BASEDIR}
else
    BASEDIR=$(pwd)/${BASEDIR}
fi

LOG_PATH=$BASEDIR/logs
rm -r $LOG_PATH
mkdir -p $LOG_PATH

cd $BASEDIR/../..

BUILDING_CAR_BUILDER=false
BUILDING_MANUFACTURER=false
BUILDING_INSURER=false
BUILDING_REGULATOR=false

if [ -z "$2" ]
then
    BUILDING_CAR_BUILDER=true
    BUILDING_MANUFACTURER=true
    BUILDING_INSURER=true
    BUILDING_REGULATOR=true
elif [ "$2" = "--car-builder" ]; then
    BUILDING_CAR_BUILDER=true
elif [ "$2" = "--manufacture" ]; then
    BUILDING_MANUFACTURER=true
elif [ "$2" = "--insurer" ]; then
    BUILDING_INSURER=true
elif [ "$2" = "--regulator" ]; then
    BUILDING_REGULATOR=true
fi

show_spinner() {
    PID="${1}"
    SPIN='\|/-'
    TEMP=""
    DELAY='0.75'
    while ps a | awk '{print $1}' | grep -q "${PID}"; do
        TEMP="${SPIN#?}"
    printf "[%c]  " "${SPIN}"
    SPIN=${TEMP}${SPIN%"${TEMP}"}
    sleep ${DELAY}
    printf "\b\b\b\b\b\b"
    done
}

if [ "$BUILDING_CAR_BUILDER" = true ] ; then
    docker build -t awjh/vehicle-manufacture-iot-extension-car-builder:$VERSION -f ./apps/car_builder/Dockerfile . --no-cache > $LOG_PATH/car-builder.log 2>&1 &
    CAR_PROCESS_ID=$!
fi

if [ "$BUILDING_MANUFACTURER" = true ] ; then
    docker build -t awjh/vehicle-manufacture-iot-extension-manufacturer:$VERSION -f ./apps/manufacturer/Dockerfile . --no-cache > $LOG_PATH/manufacturer.log 2>&1 &
    MANUFACTURER_ID=$!
fi

if [ "$BUILDING_INSURER" = true ] ; then
    docker build -t awjh/vehicle-manufacture-iot-extension-insurer:$VERSION -f ./apps/insurer/Dockerfile . --no-cache > $LOG_PATH/insurer.log 2>&1 &
    INSURER_ID=$!
fi

if [ "$BUILDING_REGULATOR" = true ] ; then
    docker build -t awjh/vehicle-manufacture-iot-extension-regulator:$VERSION -f ./apps/regulator/Dockerfile . --no-cache > $LOG_PATH/regulator.log 2>&1 &
    REGULATOR_ID=$!
fi

if [ "$BUILDING_CAR_BUILDER" = true ] ; then
    show_spinner $CAR_PROCESS_ID
    wait $CAR_PROCESS_ID
    CAR_EXIT=$?
else 
    CAR_EXIT=0
fi

if [ "$BUILDING_MANUFACTURER" = true ] ; then
    show_spinner $MANUFACTURER_ID
    wait $MANUFACTURER_ID
    MANUFACTURER_EXIT=$?
else
    MANUFACTURER_EXIT=0
fi

if [ "$BUILDING_INSURER" = true ] ; then
    show_spinner $INSURER_ID
    wait $INSURER_ID
    INSURER_EXIT=$?
else 
    INSURER_EXIT=0
fi

if [ "$BUILDING_REGULATOR" = true ] ; then
    show_spinner $REGULATOR_ID
    wait $REGULATOR_ID
    REGULATOR_EXIT=$?
else
    REGULATOR_EXIT=0
fi

if [ "$CAR_EXIT" != 0 ] || [ "$MANUFACTURER_EXIT" != 0 ] || [ "$INSURER_EXIT" != 0 ] || [ $REGULATOR_EXIT != 0 ]
then
    echo "Failed to build docker images. Build processes exited with:"
    if [ "$BUILDING_CAR_BUILDER" = true ] ; then
        echo "Car Builder: $CAR_EXIT"
    fi

    if [ "$BUILDING_MANUFACTURER" = true ] ; then
        echo "Manufacturer: $MANUFACTURER_EXIT"
    fi

    if [ "$BUILDING_INSURER" = true ] ; then
        echo "Insurer: $INSURER_EXIT"
    fi

    if [ "$BUILDING_REGULATOR" = true ] ; then
        echo "Regulator: $REGULATOR_EXIT"
    fi

    echo "Check the logs for more details: $LOG_PATH"

    exit 1
fi

echo "#########################"
echo "# DOCKER BUILD FINISHED #"
echo "#########################"

exit 0
