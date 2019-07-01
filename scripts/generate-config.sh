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


BASEDIR=$(dirname "$0")

source $BASEDIR/utils.sh
BASEDIR=$(get_full_path "$BASEDIR")


echo "####################################################"
echo "# COPY AND TEMPLATE LOCAL AND APPS connection.json #"
echo "####################################################"

CONNECTION_TMPL_LOCATION="${BASEDIR}/network/connection.tmpl.json"
APPS_DIR="${BASEDIR}/../apps"

LOCAL_MSP="${BASEDIR}/network/crypto-material/crypto-config"
DOCKER_MSP="/msp"

PEER_LOCAL_URL="localhost"

ORDERER_DOCKER_URL="orderer.example.com"
ORDERER_LOCAL_URL=$PEER_LOCAL_URL
ORDERER_PORT="7050"

ARIUM_ORG_NAME="Arium"
ARIUM_APP_NAME="manufacturer"
ARIUM_PEER_DOCKER_URL="peer0.arium.com"
ARIUM_PEER_PORT="7051"
ARIUM_PEER_EVENT_PORT="7053"
ARIUM_CA_DOCKER_URL="tlsca.arium.com"
ARIUM_CA_DOCKER_PORT="7054"
ARIUM_CA_LOCAL_PORT="7054"

VDA_ORG_NAME="VDA"
VDA_APP_NAME="regulator"
VDA_PEER_DOCKER_URL="peer0.vda.com"
VDA_PEER_PORT="8051"
VDA_PEER_EVENT_PORT="8053"
VDA_CA_DOCKER_URL="tlsca.vda.com"
VDA_CA_DOCKER_PORT="7054"
VDA_CA_LOCAL_PORT="8054"

PRINCE_ORG_NAME="PrinceInsurance"
PRINCE_APP_NAME="insurer"
PRINCE_PEER_DOCKER_URL="peer0.prince-insurance.com"
PRINCE_PEER_PORT="9051"
PRINCE_PEER_EVENT_PORT="9053"
PRINCE_CA_DOCKER_URL="tlsca.prince-insurance.com"
PRINCE_CA_DOCKER_PORT="7054"
PRINCE_CA_LOCAL_PORT="9054"

ORGS=("ARIUM" "VDA" "PRINCE") # MUST MATCH STARTS OF VARS ABOVE TO MAKE LOOPS WORK
TYPES=("DOCKER" "LOCAL") # MUST MATCH THE _TYPE IN THE ABOVE VARS TO MAKE LOOPS WORK

# SETS LOCALHOST FOR ALL OF THE ORGS
for ORG in "${ORGS[@]}"; do
    eval "${ORG}_PEER_LOCAL_URL"="$PEER_LOCAL_URL"
    eval "${ORG}_CA_LOCAL_URL"="$PEER_LOCAL_URL"
done

LOCAL_CONNECTION_NAME="local_connection.json"
DOCKER_CONNECTION_NAME="connection.json"

SHARED_CONNECTION_TMP="$BASEDIR/tmp/shared_connection.json"
LOCAL_CONNECTION_TMP="$BASEDIR/tmp/$LOCAL_CONNECTION_NAME"
DOCKER_CONNECTION_TMP="$BASEDIR/tmp/$DOCKER_CONNECTION_NAME"

mkdir -p $BASEDIR/tmp

##############
# SET SHARED #
##############
touch $SHARED_CONNECTION_TMP
cp $CONNECTION_TMPL_LOCATION $SHARED_CONNECTION_TMP
sed_inplace 's#{{ORDERER_PORT}}#'${ORDERER_PORT}'#g' $SHARED_CONNECTION_TMP

for ORG in "${ORGS[@]}"; do
    PEER_PORT="${ORG}_PEER_PORT"
    PEER_EVENT_PORT="${ORG}_PEER_EVENT_PORT"

    sed_inplace 's#{{'${PEER_PORT}'}}#'${!PEER_PORT}'#g' $SHARED_CONNECTION_TMP
    sed_inplace 's#{{'${PEER_EVENT_PORT}'}}#'${!PEER_EVENT_PORT}'#g' $SHARED_CONNECTION_TMP
done

#####################
# SET OTHER FORMATS #
#####################
for TYPE in "${TYPES[@]}"; do
    TMP_VAR="${TYPE}_CONNECTION_TMP"
    TMP_FILE=${!TMP_VAR}

    touch $TMP_FILE
    cp $SHARED_CONNECTION_TMP $TMP_FILE

    ORDER_URL="ORDERER_${TYPE}_URL"
    sed_inplace 's#{{ORDERER_URL}}#'${!ORDER_URL}'#g' $TMP_FILE

    MSP_DIR="${TYPE}_MSP"
    sed_inplace 's#{{MSP_DIR}}#'${!MSP_DIR}'#g' $TMP_FILE

    for ORG in "${ORGS[@]}"; do
        PEER_URL="${ORG}_PEER_${TYPE}_URL"
        CA_URL="${ORG}_CA_${TYPE}_URL"
        CA_PORT="${ORG}_CA_${TYPE}_PORT"

        sed_inplace 's#{{'${ORG}'_PEER_URL}}#'${!PEER_URL}'#g' $TMP_FILE
        sed_inplace 's#{{'${ORG}'_CA_URL}}#'${!CA_URL}'#g' $TMP_FILE
        sed_inplace 's#{{'${ORG}'_CA_PORT}}#'${!CA_PORT}'#g' $TMP_FILE
    done
done

rm -f $SHARED_CONNECTION_TMP

for ORG in "${ORGS[@]}"; do
    ORG_NAME="${ORG}_ORG_NAME"
    APP_NAME="${ORG}_APP_NAME"

    OUTPUT_FOLDER="$APPS_DIR/${!APP_NAME}/vehiclemanufacture_fabric"

    for TYPE in "${TYPES[@]}"; do
        OUTPUT_FILE_NAME="${TYPE}_CONNECTION_NAME"
        TMP_FILE="${TYPE}_CONNECTION_TMP"

        sed 's#{{ORGANISATION}}#'${!ORG_NAME}'#g' ${!TMP_FILE} > $OUTPUT_FOLDER/${!OUTPUT_FILE_NAME}
    done
done

for TYPE in "${TYPES[@]}"; do
    TMP_FILE="${TYPE}_CONNECTION_TMP"
    rm -f ${!TMP_FILE}
done
