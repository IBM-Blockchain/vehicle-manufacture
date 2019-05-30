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

DOCKER_COMPOSE_DIR=$BASEDIR/network/docker-compose

echo "#####################"
echo "# CHAINCODE INSTALL #"
echo "#####################"

echo "$DOCKER_COMPOSE_DIR/docker-compose-cli.yaml"

docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d

docker exec cli bash -c "apk add nodejs nodejs-npm python make g++"
docker exec cli bash -c 'cd /etc/hyperledger/contract; npm install; npm run build'

docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

echo "###################"
echo "# BUILD CLI_TOOLS #"
echo "###################"
cd $BASEDIR/cli_tools
npm install
npm run build
cd $BASEDIR

echo "####################"
echo "# INSTALL COMPLETE #"
echo "####################"
