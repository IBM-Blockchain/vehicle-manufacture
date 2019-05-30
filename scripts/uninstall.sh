#!/bin/sh
BASEDIR=$(dirname "$0")

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
APP_DOCKER_COMPOSE_DIR=$BASEDIR/apps/docker-compose

ALIVE_FABRIC_DOCKER_IMAGES=$(docker-compose --log-level ERROR -f $DOCKER_COMPOSE_DIR/docker-compose.yaml -p node ps -q | wc -l)
ALIVE_APP_DOCKER_IMAGES=$(docker-compose --log-level ERROR -f $APP_DOCKER_COMPOSE_DIR/docker-compose.yaml -p node ps -q | wc -l)
if [ "$ALIVE_FABRIC_DOCKER_IMAGES" -ne 0 ] || [ "$ALIVE_APP_DOCKER_IMAGES" -ne 0 ]; then
    echo "###################################"
    echo "# STOP NOT COMPLETE. RUNNING STOP #"
    echo "###################################"

    source $BASEDIR/stop.sh
fi

echo '########################################'
echo '# REMOVE NODE LEFTOVERS FROM CHAINCODE #'
echo '########################################'
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d
docker exec cli bash -c 'cd /etc/hyperledger/contract; rm -rf dist; rm -rf tmp; rm -rf node_modules; rm -f package-lock.json'
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

echo '#####################'
echo '# CLEANUP CLI_TOOLS #'
echo '#####################'
rm -rf $BASEDIR/cli_tools/node_modules
rm -f $BASEDIR/cli_tools/package-lock.json
rm -rf $BASEDIR/cli_tools/dist

echo "######################"
echo "# UNINSTALL COMPLETE #"
echo "######################"