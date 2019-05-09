#!/bin/sh
BASEDIR=$(dirname "$0")

BASEDIR=$(dirname "$0")

if [ $BASEDIR = '.' ]
then
    BASEDIR=$(pwd)
elif [ $BASEDIR:1:2 = './' ]
then
    BASEDIR=$(pwd)${BASEDIR:1}
elif [ $BASEDIR:1:1 = '/' ]
then
    BASEDIR=$(pwd)${BASEDIR}
else
    BASEDIR=$(pwd)/${BASEDIR}
fi

DOCKER_COMPOSE_DIR=$BASEDIR/network/docker-compose

################
# REMOVE NODE LEFTOVERS FROM CHAINCODE
################
# TODO - REMEMEBER TO ADD BACK IN rm -rf node_modules; AND rm -f package-lock.json TO BELOW COMMAND
docker exec arium_cli bash -c 'cd /etc/hyperledger/contract; rm -rf dist; rm -rf tmp'

################
# REMOVE DOCKER CONTAINERS
################
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose.yaml -p node down --volumes
docker rm -f $(docker ps -a | grep "dev-peer0.arium" | awk '{print $1}')
docker rm -f $(docker ps -a | grep "dev-peer0.vda" | awk '{print $1}')
docker rm -f $(docker ps -a | grep "dev-peer0.prince-insurance" | awk '{print $1}')

################
# REMOVE DEPLOYED CHAINCODE
################
docker rmi $(docker images | grep "^dev-peer0.arium" | awk '{print $3}')
docker rmi $(docker images | grep "^dev-peer0.vda" | awk '{print $3}')
docker rmi $(docker images | grep "^dev-peer0.prince-insurance" | awk '{print $3}')

################
# CLEANUP CRYPTO
################
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d
docker exec cli bash -c 'cd /etc/hyperledger/config; rm -rf crypto-config; rm -f channel.tx; rm -f core.yaml; rm -f genesis.block; rm -f vehicle_manufacture.block'
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

################
# CLEANUP WALLET API
################
rm -rf $BASEDIR/../node_modules
rm -f $BASEDIR/../wallet-api/package-lock.json
rm -rf $BASEDIR/../wallet-api/dist

################
# CLEANUP CLI_TOOLS
################
rm -rf $BASEDIR/cli_tools/node_modules
rm -f $BASEDIR/cli_tools/package-lock.json
rm -rf $BASEDIR/cli_tools/dist

################
# CLEANUP WALLET
################
rm -rf $BASEDIR/tmp
rm -rf $BASEDIR/vehiclemanufacture_fabric

################
# CLEANUP APPS
################
CAR_BUILDER_REST_PORT=8100
ARIUM_REST_PORT=6001
VDA_REST_PORT=6002
PRINCE_REST_PORT=4200

ps | grep 'nodemon' | awk '{print $1}' | xargs kill -9

APPS_PATH=$BASEDIR/../apps2

# find $APPS_PATH -name "node_modules" -type d -prune -exec rm -rf '{}' +
# find $APPS_PATH -name "dist" -type d -prune -exec rm -rf '{}' +
# find $APPS_PATH -name "checkpointers" -type d -prune -exec rm -rf '{}' +
# find $APPS_PATH -name "package-lock.json" -depth -exec rm {} \;

# find $APPS_PATH/car_builder/client -name "platforms" -type d -prune -exec rm -rf '{}' +
# find $APPS_PATH/car_builder/client -name "plugins" -type d -prune -exec rm -rf '{}' +
# find $APPS_PATH/car_builder/client -name "www" -type d -prune -exec rm -rf '{}' +



for PORT in $CAR_BUILDER_REST_PORT $ARIUM_REST_PORT $VDA_REST_PORT $PRINCE_REST_PORT
do
    lsof -i :$PORT | awk '{if(NR>1)print $2}' | xargs kill
done
