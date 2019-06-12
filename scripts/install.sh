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
echo "# set env vars for docker #"
echo "###########################"
export $(cat $NETWORK_DOCKER_COMPOSE_DIR/.env | xargs)

echo "####################################################"
echo "# COPY AND TEMPLATE LOCAL AND APPS connection.json #"
echo "####################################################"

CONNECTION_TMPL_LOCATION="${BASEDIR}/../apps/build/connection.tmpl.json"

for APP in "insurer" "manufacturer" "regulator"; do
    APP_LOCATION="${BASEDIR}/../apps/${APP}"
    CONFIG_LOCATION="${APP_LOCATION}/vehiclemanufacture_fabric"
    APP_ABSOLUTE_DIR=$(pwd | sed 's/app.*//g')
    LOCAL_MSP="${APP_ABSOLUTE_DIR}/scripts/network/crypto-material/crypto-config"
    touch $CONFIG_LOCATION/local_connection.json
    sed 's#/MSP_DIR#'${LOCAL_MSP}'#g' $CONNECTION_TMPL_LOCATION > $CONFIG_LOCATION/local_connection.json
    # sed 's#://.*.com#://localhost#g' $CONFIG_LOCATION/local_connection.json > $CONFIG_LOCATION/local_connection.json
    sed 's#://.*.com#://localhost#g' $CONFIG_LOCATION/local_connection.json > $CONFIG_LOCATION/local_connection.tmp
    mv $CONFIG_LOCATION/local_connection.tmp $CONFIG_LOCATION/local_connection.json
done

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
