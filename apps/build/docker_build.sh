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
mkdir -p $LOG_PATH

cd $BASEDIR/../..

docker build -t awjh/vehicle-manufacture-iot-extension-car-builder:$VERSION -f ./apps/car_builder/Dockerfile . --no-cache > $LOG_PATH/car_builder.log 2>&1 &
CAR_PROCESS_ID=$!
docker build -t awjh/vehicle-manufacture-iot-extension-manufacturer:$VERSION -f ./apps/manufacturer/Dockerfile . --no-cache > $LOG_PATH/manufacturer.log 2>&1 &
MANUFACTURER_ID=$!
docker build -t awjh/vehicle-manufacture-iot-extension-insurer:$VERSION -f ./apps/insurer/Dockerfile . --no-cache > $LOG_PATH/insurer.log 2>&1 &
INSURER_ID=$!
docker build -t awjh/vehicle-manufacture-iot-extension-regulator:$VERSION -f ./apps/regulator/Dockerfile . --no-cache > $LOG_PATH/regulator.log 2>&1 &
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
    echo "Failed to build docker images. Build processes exited with:"
    echo "Car Builder: $CAR_EXIT"
    echo "Manufacturer: $MANUFACTURER_EXIT"
    echo "Insurer: $INSURER_EXIT"
    echo "Regulator: $REGULATOR_EXIT"
    echo "Check the logs for more details: $LOG_PATH"

    exit 1
fi

echo "#########################"
echo "# DOCKER BUILD FINISHED #"
echo "#########################"

exit 0