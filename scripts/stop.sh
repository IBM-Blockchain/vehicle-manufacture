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

#################
# SETUP LOGGING #
#################
LOG_PATH=$BASEDIR/logs
mkdir $LOG_PATH

exec > >(tee -i $LOG_PATH/stop.log)
exec 2>&1

NETWORK_DOCKER_COMPOSE_DIR=$BASEDIR/network/docker-compose
APPS_DOCKER_COMPOSE_DIR=$BASEDIR/apps/docker-compose

echo "###########################"
echo "# SET ENV VARS FOR DOCKER #"
echo "###########################"
set_docker_env $NETWORK_DOCKER_COMPOSE_DIR $APPS_DOCKER_COMPOSE_DIR

echo '############################'
echo '# REMOVE DOCKER CONTAINERS #'
echo '############################'
docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose.yaml -p node down --volumes
docker rm -f $(docker ps -a | grep "dev-peer0.arium" | awk '{print $1}')
docker rm -f $(docker ps -a | grep "dev-peer0.vda" | awk '{print $1}')
docker rm -f $(docker ps -a | grep "dev-peer0.prince-insurance" | awk '{print $1}')

echo '#############################'
echo '# REMOVE DEPLOYED CHAINCODE #'
echo '#############################'
docker rmi $(docker images | grep "^dev-peer0.arium" | awk '{print $3}')
docker rmi $(docker images | grep "^dev-peer0.vda" | awk '{print $3}')
docker rmi $(docker images | grep "^dev-peer0.prince-insurance" | awk '{print $3}')

echo '##################'
echo '# CLEANUP CRYPTO #'
echo '##################'
docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d
docker exec cli bash -c 'cd /etc/hyperledger/config; rm -rf crypto-config; rm -f channel.tx; rm -f core.yaml; rm -f genesis.block; rm -f vehiclemanufacture.block'
docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

echo '###############'
echo '# CLEANUP TMP #'
echo '###############'
rm -rf $BASEDIR/tmp

echo '################'
echo '# CLEANUP APPS #'
echo '################'
CAR_BUILDER_PORT=6001
ARIUM_PORT=6002
VDA_PORT=6003
PRINCE_PORT=6004

docker-compose -f $APPS_DOCKER_COMPOSE_DIR/docker-compose.yaml -p node down --volumes

for PORT in $CAR_BUILDER_PORT $ARIUM_PORT $VDA_PORT $PRINCE_PORT
do
    lsof -i :$PORT | awk '{if(NR>1)print $2}' | xargs kill
done

docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d
docker exec cli bash -c 'rm -rf /etc/apps/manufacturer/vehiclemanufacture_fabric/wallet/*/'
docker exec cli bash -c 'rm -rf /etc/apps/insurer/vehiclemanufacture_fabric/wallet/*/'
docker exec cli bash -c 'rm -rf /etc/apps/regulator/vehiclemanufacture_fabric/wallet/*/'
docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

echo "#############################"
echo "# CLEAN ENV VARS FOR DOCKER #"
echo "#############################"
unset $(cat $NETWORK_DOCKER_COMPOSE_DIR/.env | sed -E 's/(.*)=.*/\1/' | xargs)
unset $(cat $APPS_DOCKER_COMPOSE_DIR/.env | sed -E 's/(.*)=.*/\1/' | xargs)

echo "#################"
echo "# STOP COMPLETE #"
echo "#################"