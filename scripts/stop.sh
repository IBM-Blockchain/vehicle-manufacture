#!/bin/bash
BASEDIR=$(dirname "$0")

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
export $(cat $NETWORK_DOCKER_COMPOSE_DIR/.env | xargs)
export $(cat $APPS_DOCKER_COMPOSE_DIR/.env | xargs)

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