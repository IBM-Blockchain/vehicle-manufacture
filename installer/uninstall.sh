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
docker exec arium_cli bash -c 'cd /etc/hyperledger/contract; rm -rf dist; rm -rf node_modules; rm -f package-lock.json'

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
# CLEANUP CLI_TOOLS
################
# rm -rf $BASEDIR/cli_tools/node_modules
# rm -f $BASEDIR/cli_tools/package-lock.json
rm -rf $BASEDIR/cli_tools/dist

################
# CLEANUP WALLET
################
rm -rf $BASEDIR/tmp
rm -rf $BASEDIR/vehiclemanufacture_fabric

################
# CLEANUP REST SERVERS
################
ARIUM_REST_PORT=3000
VDA_REST_PORT=3001
PRINCE_REST_PORT=3002

# rm -rf $BASEDIR/../apps/rest_server/node_modules
# rm -f $BASEDIR/../apps/rest_server/package-lock.json
rm -rf $BASEDIR/../apps/rest_server/dist

for PORT in $ARIUM_REST_PORT $VDA_REST_PORT $PRINCE_REST_PORT
do
    lsof -i :$PORT | awk '{if(NR>1)print $2}' | xargs kill
done
