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
#!/bin/bash

COMPANY_NAME=$1
LOGGING_LEVEL="info"

if [ ! -z "$CORE_CHAINCODE_LOGGING_LEVEL" ]
then
    LOGGING_LEVEL=$CORE_CHAINCODE_LOGGING_LEVEL
fi

docker exec -d $COMPANY_NAME"_cli" bash -c "pkill -9 node; export CORE_CHAINCODE_LOGGING_LEVEL=$LOGGING_LEVEL; cd /etc/hyperledger/contract; npm run start:$COMPANY_NAME"
