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
APPS_DOCKER_COMPOSE_DIR=$BASEDIR/apps/docker-compose

echo "###########################"
echo "# SET ENV VARS FOR DOCKER #"
echo "###########################"
export $(cat $NETWORK_DOCKER_COMPOSE_DIR/.env | xargs)
export $(cat $APPS_DOCKER_COMPOSE_DIR/.env | xargs)

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
