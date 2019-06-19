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

BASEDIR=$(dirname "$0")

source $BASEDIR/utils.sh

BASEDIR=$(get_full_path "$BASEDIR")

NETWORK_DOCKER_COMPOSE_DIR=$BASEDIR/network/docker-compose
APPS_DOCKER_COMPOSE_DIR=$BASEDIR/apps/docker-compose

echo "###########################"
echo "# SET ENV VARS FOR DOCKER #"
echo "###########################"
set_docker_env $NETWORK_DOCKER_COMPOSE_DIR $APPS_DOCKER_COMPOSE_DIR

ALIVE_FABRIC_DOCKER_IMAGES=$(docker-compose --log-level ERROR -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose.yaml -p node ps -q | wc -l)
ALIVE_APP_DOCKER_IMAGES=$(docker-compose --log-level ERROR -f $APPS_DOCKER_COMPOSE_DIR/docker-compose.yaml -p node ps -q | wc -l)
if [ "$ALIVE_FABRIC_DOCKER_IMAGES" -ne 0 ] || [ "$ALIVE_APP_DOCKER_IMAGES" -ne 0 ]; then
    echo "###################################"
    echo "# STOP NOT COMPLETE. RUNNING STOP #"
    echo "###################################"

    source $BASEDIR/stop.sh
fi

echo '###############################'
echo '# REMOVE CONNECTION PROFILES #'
echo '##############################'
TYPES=("DOCKER" "LOCAL")

LOCAL_CONNECTION_NAME="local_connection.json"
DOCKER_CONNECTION_NAME="connection.json"

APPS_DIR="${BASEDIR}/../apps"

for APP_NAME in "manufacturer" "insurer" "regulator"; do
    for TYPE in "${TYPES[@]}"; do
        OUTPUT_FOLDER="$APPS_DIR/${APP_NAME}/vehiclemanufacture_fabric"
        OUTPUT_FILE_NAME="${TYPE}_CONNECTION_NAME"

        rm -f $OUTPUT_FOLDER/${!OUTPUT_FILE_NAME}
    done
done

echo '########################################'
echo '# REMOVE NODE LEFTOVERS FROM CHAINCODE #'
echo '########################################'
docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d
docker exec cli bash -c 'cd /etc/hyperledger/contract; rm -rf dist; rm -rf tmp; rm -rf node_modules; rm -f package-lock.json'
docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

echo '#####################'
echo '# CLEANUP CLI_TOOLS #'
echo '#####################'
rm -rf $BASEDIR/cli_tools/node_modules
rm -f $BASEDIR/cli_tools/package-lock.json
rm -rf $BASEDIR/cli_tools/dist

echo '################'
echo '# CLEANUP LOGS #'
echo '################'
rm -rf $BASEDIR/logs

echo "#############################"
echo "# CLEAN ENV VARS FOR DOCKER #"
echo "#############################"
unset $(cat $NETWORK_DOCKER_COMPOSE_DIR/.env | sed -E 's/(.*)=.*/\1/' | xargs)
unset $(cat $APPS_DOCKER_COMPOSE_DIR/.env | sed -E 's/(.*)=.*/\1/' | xargs)


echo "######################"
echo "# UNINSTALL COMPLETE #"
echo "######################"
