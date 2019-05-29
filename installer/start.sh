#!/bin/bash
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

if [ ! -d "$BASEDIR/../contract/node_modules" ] || [ ! -d "$BASEDIR/../contract/dist" ] || [ ! -d "$BASEDIR/cli_tools/node_modules" ] || [ ! -d "$BASEDIR/cli_tools/dist" ]; then
    echo "###########################################"
    echo "# INSTALL NOT COMPLETE. RUNNING INSTALLER #"
    echo "###########################################"

    source $BASEDIR/install.sh
fi

DOCKER_COMPOSE_DIR=$BASEDIR/network/docker-compose
CRYPTO_CONFIG=$BASEDIR/network/crypto-material/crypto-config

echo "################"
echo "# GENERATE CRYPTO"
echo "################"
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml up -d

docker exec cli cryptogen generate --config=/etc/hyperledger/config/crypto-config.yaml --output /etc/hyperledger/config/crypto-config
docker exec cli configtxgen -profile SampleMultiNodeEtcdRaft -outputBlock /etc/hyperledger/config/genesis.block
docker exec cli configtxgen -profile ThreeOrgsChannel -outputCreateChannelTx /etc/hyperledger/config/channel.tx -channelID vehiclemanufacture
docker exec cli cp /etc/hyperledger/fabric/core.yaml /etc/hyperledger/config
docker exec cli sh /etc/hyperledger/config/rename_sk.sh

docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose-cli.yaml down --volumes

echo "#################"
echo "# SETUP NETWORK #"
echo "#################"
docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose.yaml -p node up -d

echo "################"
echo "# CHANNEL INIT #"
echo "################"
docker exec arium_cli peer channel create -o orderer.example.com:7050 -c vehiclemanufacture -f /etc/hyperledger/configtx/channel.tx \
    --outputBlock /etc/hyperledger/configtx/vehiclemanufacture.block \
    --tls true \
    --cafile /etc/hyperledger/config/crypto-config/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
sleep 5

docker exec arium_cli peer channel join -b /etc/hyperledger/configtx/vehiclemanufacture.block --tls true --cafile /etc/hyperledger/config/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
docker exec vda_cli peer channel join -b /etc/hyperledger/configtx/vehiclemanufacture.block --tls true --cafile /etc/hyperledger/config/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
docker exec princeinsurance_cli peer channel join -b /etc/hyperledger/configtx/vehiclemanufacture.block --tls true --cafile /etc/hyperledger/config/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem

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

echo "####################"
echo "# ENROLLING ADMINS #"
echo "####################"
ARIUM_ADMIN_CERT=$BASEDIR/tmp/arium_cert.pem
ARIUM_ADMIN_KEY=$BASEDIR/tmp/arium_key.pem

VDA_ADMIN_CERT=$BASEDIR/tmp/vda_cert.pem
VDA_ADMIN_KEY=$BASEDIR/tmp/vda_key.pem

PRINCE_ADMIN_CERT=$BASEDIR/tmp/prince_cert.pem
PRINCE_ADMIN_KEY=$BASEDIR/tmp/prince_key.pem

mkdir $BASEDIR/tmp

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
APPS_DIR=$BASEDIR/../apps

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

docker-compose -f $BASEDIR/apps/docker-compose/docker-compose.yaml -p node up -d

CAR_BUILD_PORT=8100
ARIUM_REST_PORT=6001
VDA_REST_PORT=6002
PRINCE_REST_PORT=4200

cd $BASEDIR
for PORT in $CAR_BUILDER_PORT $ARIUM_REST_PORT $PRINCE_REST_PORT $VDA_REST_PORT 
do
    printf "WAITING FOR REST SERVER ON PORT $PORT"
    until $(curl --output /dev/null --silent --head --fail http://localhost:$PORT);
    do
        printf '.'
        sleep 2
    done
    printf '\n'
done

echo "##################################"
echo "# REGISTER EVERYONE IN CHAINCODE #"
echo "##################################"

VDA_REGISTER="$VDA_REST_PORT|regulator|$VDA_USERS"
PRINCE_REGISTER="$PRINCE_REST_PORT|insurer|$PRINCE_USERS"
ARIUM_REGISTER="$ARIUM_REST_PORT|manufacturer|$ARIUM_USERS"

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
        echo $row | curl -H "Content-Type: application/json" -X POST -u admin:adminpw -d @- http://localhost:$PORT/api/users/enroll
    done

    echo "REGISTERING REGISTRAR"
    if [ "$TYPE" == "manufacturer" ]; then # Special case for manufacturer
        curl -X POST -H "Content-Type: application/json" -d '{"originCode": "S", "manufacturerCode": "G"}' -u registrar:registrarpw http://localhost:$PORT/api/users/registrar/register
    else
        curl -X POST -H "Content-Type: application/json" -d '{}' -u registrar:registrarpw http://localhost:$PORT/api/users/registrar/register
    fi

    for row in $(jq -r ".[] | .name" $USER_LIST); do # GET ALL OF TYPE PEOPLE FROM JSON
        if [ "$row" != "registrar" ]; then

            echo "REGISTERING USER $row"

            ATTRS="["

            for attr in $(jq -r '[.[] | select(.name == "'"$row"'") | .attrs[] | select(.name | contains("vehicle_manufacture.role."))] | .[] | .name' $USER_LIST); do
                ATTRS="$ATTRS\"$attr\","
            done

            if [ "$ATTRS" != "[" ]; then
                ATTRS=${ATTRS%?}
            fi

            ATTRS="$ATTRS]"

            curl -X POST -H "Content-Type: application/json" -d '{"name":"'"$row"'", "roles": '"$ATTRS"'}' -u registrar:registrarpw http://localhost:$PORT/api/users/task/register
        fi
    done
done

echo "#####################"
echo "# STARTING BROWSERS #"
echo "#####################"

URLS="http://localhost:8100 http://localhost:6001/ http://localhost:6002 http://localhost:4200 http://localhost:6001/node-red"
case "$(uname)" in
    "Darwin")
        open ${URLS}
        ;;
    "Linux")
        if [ -n "$BROWSER" ] ; then
            $BROWSER http://localhost:8100 http://localhost:6001/ http://localhost:6002 http://localhost:4200 http://localhost:6001/node-red
        elif which x-www-browser > /dev/null ; then
            nohup x-www-browser ${URLS} < /dev/null > /dev/null 2>&1 &
        elif which xdg-open > /dev/null ; then
            for URL in ${URLS} ; do
                xdg-open ${URL}
            done
        elif which gnome-open > /dev/null ; then
            gnome-open http://localhost:8100 http://localhost:6001/ http://localhost:6002 http://localhost:4200 http://localhost:6001/node-red
        else
            echo "Could not detect web browser to use - please launch the demo in your chosen browser. See the README.md for which hosts/ports to open"
        fi
        ;;
    *) 
        echo "Demo not launched. OS currently not supported"
        ;;
esac

echo "####################"
echo "# STARTUP COMPLETE #"
echo "####################"
