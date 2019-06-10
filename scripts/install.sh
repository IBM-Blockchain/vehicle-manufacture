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

NETWORK_DOCKER_COMPOSE_DIR=$BASEDIR/network/docker-compose

#################
# SETUP LOGGING #
#################
LOG_PATH=$BASEDIR/logs
mkdir $LOG_PATH

exec > >(tee -i $LOG_PATH/install.log)
exec 2>&1

echo "###########################"
echo "# SET ENV VARS FOR DOCKER #"
echo "###########################"
export $(cat $NETWORK_DOCKER_COMPOSE_DIR/.env | xargs)

echo "#####################"
echo "# CHAINCODE INSTALL #"
echo "#####################"

docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d

docker exec cli bash -c "apk add nodejs nodejs-npm python make g++"
docker exec cli bash -c 'cd /etc/hyperledger/contract; npm install; npm run build'

docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

echo "###################"
echo "# BUILD CLI_TOOLS #"
echo "###################"
cd $BASEDIR/cli_tools
npm install
npm run build
cd $BASEDIR

echo "#############################"
echo "# CLEAN ENV VARS FOR DOCKER #"
echo "#############################"
unset $(cat $NETWORK_DOCKER_COMPOSE_DIR/.env | sed -E 's/(.*)=.*/\1/' | xargs)

echo "####################"
echo "# INSTALL COMPLETE #"
echo "####################"
