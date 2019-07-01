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

set -e

BASEDIR=$(dirname "$0")

if [[ "$(uname)" -eq "Linux" ]] &&  type gnome-terminal > /dev/null ; then
    #Inform the user demo being built in terminal window
    #Geometry= set window to size needed & not in front of desktop files
    gnome-terminal --geometry=39x10+300+100 -e "bash -c \"
    echo Vehicle Lifecycle Demo is now starting.;
    echo ;
    echo Please wait 5 min whilst we build the;
    echo network and apps for you. They will;
    echo open automatically.;
    echo ;
    echo Close this window at any time;
    exec bash\""
fi

source $BASEDIR/utils.sh

BASEDIR=$(get_full_path "$BASEDIR")

#################
# SETUP LOGGING #
#################
LOG_PATH=$BASEDIR/logs
mkdir -p $LOG_PATH

exec > >(tee -i $LOG_PATH/start.log)
exec 2>&1


APPS_DIR=$BASEDIR/../apps

REQUIRED_INSTALL_AND_BUILDS=("$BASEDIR/../contract" "$BASEDIR/cli_tools")
REQUIRED_APPS_WITH_CONNECTIONS=("$APPS_DIR/manufacturer" "$APPS_DIR/insurer" "$APPS_DIR/regulator")

MISSING=false
for REQUIRED in "${REQUIRED_INSTALL_AND_BUILDS[@]}"; do
    if [ ! -d "$REQUIRED/node_modules" ]; then
        MISSING=true
    elif [ ! -d "$REQUIRED/dist" ]; then
        MISSING=true
    fi
done

for REQUIRED in "${REQUIRED_APPS_WITH_CONNECTIONS[@]}"; do
    if [ ! -f "$REQUIRED/vehiclemanufacture_fabric/connection.json" ]; then
        MISSING=true
    fi
done

if [ "$MISSING" = true ]; then
    echo "###########################################"
    echo "# INSTALL NOT COMPLETE. RUNNING INSTALLER #"
    echo "###########################################"

    $BASEDIR/install.sh
fi

NETWORK_DOCKER_COMPOSE_DIR=$BASEDIR/network/docker-compose
APPS_DOCKER_COMPOSE_DIR=$BASEDIR/apps/docker-compose
CRYPTO_CONFIG=$BASEDIR/network/crypto-material/crypto-config

echo "###########################"
echo "# SET ENV VARS FOR DOCKER #"
echo "###########################"
set_docker_env $NETWORK_DOCKER_COMPOSE_DIR $APPS_DOCKER_COMPOSE_DIR

echo "###################"
echo "# GENERATE CRYPTO #"
echo "###################"
docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d

docker exec cli cryptogen generate --config=/etc/hyperledger/config/crypto-config.yaml --output /etc/hyperledger/config/crypto-config
docker exec cli configtxgen -profile SampleMultiNodeEtcdRaft -outputBlock /etc/hyperledger/config/genesis.block
docker exec cli configtxgen -profile ThreeOrgsChannel -outputCreateChannelTx /etc/hyperledger/config/channel.tx -channelID vehiclemanufacture
docker exec cli cp /etc/hyperledger/fabric/core.yaml /etc/hyperledger/config
docker exec cli sh /etc/hyperledger/config/rename_sk.sh

docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

echo "#################"
echo "# SETUP NETWORK #"
echo "#################"
docker-compose -f $NETWORK_DOCKER_COMPOSE_DIR/docker-compose.yaml -p node up -d

echo "################"
echo "# CHANNEL INIT #"
echo "################"
docker exec arium_cli peer channel create -o orderer.example.com:7050 -c vehiclemanufacture -f /etc/hyperledger/configtx/channel.tx \
    --outputBlock /etc/hyperledger/configtx/vehiclemanufacture.block \
    --tls true \
    --cafile /etc/hyperledger/config/crypto-config/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
wait_until 'docker exec arium_cli bash -c "[ -f /etc/hyperledger/configtx/vehiclemanufacture.block ] && exit 0 || exit 1"' 3 5

wait_until 'docker exec arium_cli peer channel join -b /etc/hyperledger/configtx/vehiclemanufacture.block --tls true --cafile /etc/hyperledger/config/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem' 3 5
wait_until 'docker exec vda_cli peer channel join -b /etc/hyperledger/configtx/vehiclemanufacture.block --tls true --cafile /etc/hyperledger/config/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem' 3 5
wait_until 'docker exec princeinsurance_cli peer channel join -b /etc/hyperledger/configtx/vehiclemanufacture.block --tls true --cafile /etc/hyperledger/config/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem' 3 5

echo "#####################"
echo "# CHAINCODE INSTALL #"
echo "#####################"
docker exec arium_cli peer chaincode install -l node -n vehicle-manufacture-chaincode -v 0 -p /etc/hyperledger/contract
docker exec vda_cli peer chaincode install -l node -n vehicle-manufacture-chaincode -v 0 -p /etc/hyperledger/contract
docker exec princeinsurance_cli  peer chaincode install -l node -n vehicle-manufacture-chaincode -v 0 -p /etc/hyperledger/contract

echo "#########################"
echo "# CHAINCODE INSTANTIATE #"
echo "#########################"
docker exec arium_cli peer chaincode instantiate -o orderer.example.com:7050 \
-l node -C vehiclemanufacture -n vehicle-manufacture-chaincode -v 0 \
--tls true \
--cafile /etc/hyperledger/config/crypto-config/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem \
-c '{"Args":[]}' -P 'AND ("AriumMSP.member", "VDAMSP.member", "PrinceInsuranceMSP.member")'

wait_until 'docker ps -a | grep dev-peer0.arium > /dev/null' 3 10

CHAINCODE_QUERY="peer chaincode query -o orderer.example.com:7050 \
-C vehiclemanufacture -n vehicle-manufacture-chaincode \
--tls true \
--cafile /etc/hyperledger/config/crypto-config/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem \
-c '{\"Args\":[\"org.hyperledger.fabric:GetMetadata\"]}' > /dev/null"

PRINCE_QUERY="docker exec princeinsurance_cli $CHAINCODE_QUERY"
VDA_QUERY="docker exec vda_cli $CHAINCODE_QUERY"

wait_until "$PRINCE_QUERY" 3 10

wait_until "$VDA_QUERY" 3 10

echo "####################"
echo "# ENROLLING ADMINS #"
echo "####################"
ARIUM_ADMIN_CERT=$BASEDIR/tmp/arium_cert.pem
ARIUM_ADMIN_KEY=$BASEDIR/tmp/arium_key.pem

VDA_ADMIN_CERT=$BASEDIR/tmp/vda_cert.pem
VDA_ADMIN_KEY=$BASEDIR/tmp/vda_key.pem

PRINCE_ADMIN_CERT=$BASEDIR/tmp/prince_cert.pem
PRINCE_ADMIN_KEY=$BASEDIR/tmp/prince_key.pem

mkdir -p $BASEDIR/tmp

FABRIC_CA_CLIENT_HOME=/root/fabric-ca/clients/admin

docker exec tlsca.arium.com bash -c "fabric-ca-client enroll -u https://admin:adminpw@tlsca.arium.com:7054 --tls.certfiles /etc/hyperledger/fabric-ca-server-tlsca/tlsca.arium.com-cert.pem"
docker exec tlsca.arium.com bash -c "cd $FABRIC_CA_CLIENT_HOME/msp/keystore; find ./ -name '*_sk' -exec mv {} key.pem \;"
docker cp tlsca.arium.com:$FABRIC_CA_CLIENT_HOME/msp/signcerts/cert.pem $BASEDIR/tmp
docker cp tlsca.arium.com:$FABRIC_CA_CLIENT_HOME/msp/keystore/key.pem $BASEDIR/tmp

mv $BASEDIR/tmp/cert.pem $ARIUM_ADMIN_CERT
mv $BASEDIR/tmp/key.pem $ARIUM_ADMIN_KEY

docker exec tlsca.vda.com bash -c "fabric-ca-client enroll -u https://admin:adminpw@tlsca.vda.com:7054 --tls.certfiles /etc/hyperledger/fabric-ca-server-tlsca/tlsca.vda.com-cert.pem"
docker exec tlsca.vda.com bash -c "cd $FABRIC_CA_CLIENT_HOME/msp/keystore; find ./ -name '*_sk' -exec mv {} key.pem \;"
docker cp tlsca.vda.com:$FABRIC_CA_CLIENT_HOME/msp/signcerts/cert.pem $BASEDIR/tmp
docker cp tlsca.vda.com:$FABRIC_CA_CLIENT_HOME/msp/keystore/key.pem $BASEDIR/tmp

mv $BASEDIR/tmp/cert.pem $VDA_ADMIN_CERT
mv $BASEDIR/tmp/key.pem $VDA_ADMIN_KEY

docker exec tlsca.prince-insurance.com bash -c "fabric-ca-client enroll -u https://admin:adminpw@tlsca.prince-insurance.com:7054 --tls.certfiles /etc/hyperledger/fabric-ca-server-tlsca/tlsca.prince-insurance.com-cert.pem"
docker exec tlsca.prince-insurance.com bash -c "cd $FABRIC_CA_CLIENT_HOME/msp/keystore; find ./ -name '*_sk' -exec mv {} key.pem \;"
docker cp tlsca.prince-insurance.com:$FABRIC_CA_CLIENT_HOME/msp/signcerts/cert.pem $BASEDIR/tmp
docker cp tlsca.prince-insurance.com:$FABRIC_CA_CLIENT_HOME/msp/keystore/key.pem $BASEDIR/tmp

mv $BASEDIR/tmp/cert.pem $PRINCE_ADMIN_CERT
mv $BASEDIR/tmp/key.pem $PRINCE_ADMIN_KEY

echo "####################"
echo "# IMPORTING ADMINS #"
echo "####################"
FABRIC_CONFIG_NAME=vehiclemanufacture_fabric

ARIUM_LOCAL_FABRIC=$APPS_DIR/manufacturer/$FABRIC_CONFIG_NAME
VDA_LOCAL_FABRIC=$APPS_DIR/regulator/$FABRIC_CONFIG_NAME
PRINCE_LOCAL_FABRIC=$APPS_DIR/insurer/$FABRIC_CONFIG_NAME

CLI_DIR=$BASEDIR/cli_tools

ARIUM_USERS=$APPS_DIR/manufacturer/config/users.json
VDA_USERS=$APPS_DIR/regulator/config/users.json
PRINCE_USERS=$APPS_DIR/insurer/config/users.json

node $CLI_DIR/dist/index.js import -w $ARIUM_LOCAL_FABRIC/wallet -m AriumMSP -n admin -c $ARIUM_ADMIN_CERT -k $ARIUM_ADMIN_KEY -o Arium
node $CLI_DIR/dist/index.js import -w $VDA_LOCAL_FABRIC/wallet -m VDAMSP -n admin -c $VDA_ADMIN_CERT -k $VDA_ADMIN_KEY -o VDA
node $CLI_DIR/dist/index.js import -w $PRINCE_LOCAL_FABRIC/wallet -m PrinceInsuranceMSP -n admin -c $PRINCE_ADMIN_CERT -k $PRINCE_ADMIN_KEY -o PrinceInsurance

echo "################"
echo "# STARTUP APPS #"
echo "################"

INSURER_DIR=$APPS_DIR/insurer
CAR_BUILDER_DIR=$APPS_DIR/car_builder
MANUFACTURER_DIR=$APPS_DIR/manufacturer
REGULATOR_DIR=$APPS_DIR/regulator

docker-compose -f $APPS_DOCKER_COMPOSE_DIR/docker-compose.yaml -p node up -d

CAR_BUILDER_PORT=6001
ARIUM_PORT=6002
VDA_PORT=6003
PRINCE_PORT=6004

cd $BASEDIR
for PORT in $CAR_BUILDER_PORT $ARIUM_PORT $VDA_PORT $PRINCE_PORT
do
    echo "WAITING FOR REST SERVER ON PORT $PORT"
    wait_until "curl --output /dev/null --silent --head --fail http://localhost:$PORT" 30 2
done

echo "##################################"
echo "# ENROLLING EVERYONE FOR NETWORK #"
echo "##################################"

VDA_REGISTER="$VDA_PORT|regulator|$VDA_USERS"
PRINCE_REGISTER="$PRINCE_PORT|insurer|$PRINCE_USERS"
ARIUM_REGISTER="$ARIUM_PORT|manufacturer|$ARIUM_USERS"

for REGISTRATION in $ARIUM_REGISTER $PRINCE_REGISTER $VDA_REGISTER
do
    PORT="$(cut -d'|' -f1 <<<"$REGISTRATION")"
    TYPE="$(cut -d'|' -f2 <<<"$REGISTRATION")"
    USER_LIST="$(cut -d'|' -f3 <<<"$REGISTRATION")"

    echo "=============================="
    echo "= REGISTERING FOR TYPE $TYPE ="
    echo "=============================="

    jq -c '.[]' $USER_LIST | while read row; do
        echo "ENROLLING $(echo $row | jq -r '.name' )"
        wait_until "echo '$row' | curl -s -H \"Content-Type: application/json\" -X POST -u admin:adminpw -d @- http://localhost:$PORT/api/users/enroll" 5 3
    done
done

echo "###################################"
echo "# SETTING MANUFACTURER PROPERTIES #"
echo "###################################"

docker exec arium_app node server/dist/setup.js

echo "#####################"
echo "# STARTING BROWSERS #"
echo "#####################"

URLS="http://localhost:$CAR_BUILDER_PORT http://localhost:$ARIUM_PORT http://localhost:$VDA_PORT http://localhost:$PRINCE_PORT http://localhost:$ARIUM_PORT/node-red"
case "$(uname)" in
    "Darwin")
        open ${URLS}
        ;;
    "Linux")
        if [ -n "$BROWSER" ] ; then
            $BROWSER ${URLS}
        elif which x-www-browser > /dev/null ; then
            nohup x-www-browser ${URLS} < /dev/null > /dev/null 2>&1 &
        elif which xdg-open > /dev/null ; then
            for URL in ${URLS} ; do
                xdg-open ${URL}
            done
        elif which gnome-open > /dev/null ; then
            gnome-open ${URLS}
        else
            echo "Could not detect web browser to use - please launch the demo in your chosen browser. See the README.md for which hosts/ports to open"
        fi
        ;;
    *)
        echo "Demo not launched. OS currently not supported"
        ;;
esac

echo "#############################"
echo "# CLEAN ENV VARS FOR DOCKER #"
echo "#############################"
unset $(cat $NETWORK_DOCKER_COMPOSE_DIR/.env | sed -E 's/(.*)=.*/\1/' | xargs)
unset $(cat $APPS_DOCKER_COMPOSE_DIR/.env | sed -E 's/(.*)=.*/\1/' | xargs)

echo "####################"
echo "# STARTUP COMPLETE #"
echo "####################"
