/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
angular.module('bc-vda')

.controller('AssetActivityCtrl', ['$scope', '$http', function ($scope, $http) {
  const EventTypes = ['ACTIVATED', 'CRASHED', 'OVERHEATED', 'OIL_FREEZING', 'ENGINE_FAILURE'];

  $scope.transactions = [];

  var txUrl = '/api/histories/blocks';

  $http.get(txUrl, { headers: { 'Authorization': `Basic ${btoa('audit:auditpw')}` } })
    .then(function (response, err) {
      if (err) {
        console.log(err);
      } else if (Array.isArray(response.data)) {
        response.data.forEach((block) => {
          $scope.addBlock(block);
        });

        $scope.transactions.sort((a, b) => a.timestamp - b.timestamp);
      }
    });

  function setupBlockListener() {
    const blockUpdates = new EventSource(txUrl + '/events/created');

    blockUpdates.onopen = (evt) => {
      console.log('OPEN', evt);
    }

    blockUpdates.onerror = (evt) => {
      console.log('ERROR', evt);
      setupBlockListener();
    }

    blockUpdates.onclose = (evt) => {
      setupBlockListener();
    }

    blockUpdates.onmessage = (evt) => {
      const data = JSON.parse(evt.data);

      $scope.addBlock(data, true);

      $scope.$apply();
    }
  }
  setupBlockListener();

  $scope.addBlock = function (block, isNew = false) {
    block.transactions.forEach((transaction) => {
      if (transaction.contract === 'org.acme.vehicle_network.vehicles') {
        const { activity, validator_1, validator_2, sign } = get_activity_from_type(transaction.name)

        $scope.transactions.push({
          timestamp: transaction.timestamp,
          transaction_id: transaction.txId,
          transaction_type: transaction.name,
          transaction_validator_1: validator_1,
          transaction_validator_2: validator_2,
          transaction_sign: sign,
          transaction_action: activity,
          transaction_submitter: transaction.caller.identity + '@' + transaction.caller.org,
          transaction_class: isNew ? "new-row" : "existing-row",
          block_number: block.number,
          additional_info: transaction.name === 'addUsageEvent' ? EventTypes[transaction.parameters.eventType] : null
        });
      }
    });
  };

  function get_activity_from_type(type)
  {
    var activity = "";
    var validator_1 = "";
    var validator_2 = "";
    var sign = "+";

    switch(type)
    {
      case "createPolicy": activity = "New Insurance Issued"; validator_1 = "Insurer"; validator_2 = "Vehicle Owner"; break;
      case "placeOrder": activity = "New Vehicle Request"; validator_1="Vehicle Owner"; validator_2 = "Manufacturer"; break;
      case "scheduleOrderForManufacture": activity = "Vehicle Manufacture (Manufacture Scheduled)"; validator_1="Manufacturer"; validator_2 = ""; sign=""; break;
      case "registerVehicleForOrder": activity = "Vehicle Manufacture (Vin Assigned)"; validator_1="Manufacturer"; validator_2 = "Regulator"; break;
      case "assignOwnershipForOrder": activity = "Vehicle Manufacture (Owner Assigned)"; validator_1="Manufacturer"; validator_2 = ""; sign=""; break;
      case "deliverOrder": activity = "Vehicle Manufacture (Delivered)"; validator_1="Vehicle Owner"; validator_2 = "Vehicle"; break;
      case "addUsageEvent": activity="Alert"; validator_1="Vehicle"; validator_2=""; sign=""; break;
    }

    return {"activity": activity, "validator_1": validator_1, "validator_2": validator_2, "sign": sign}
  }

}]);

// TO DO MAKE USE OF WEB SOCKETS TO MAKE PAGE LIVE UPDATE
