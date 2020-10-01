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

  .controller('DashboardCtrl', ['$scope', '$http', function ($scope, $http) {

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

    let connectRetries = 0;

    function setupBlockListener() {
      const blockUpdates = new EventSource(txUrl + '/events/created');

      blockUpdates.onopen = (evt) => {
        console.log('OPEN', evt);
        connectRetries = 0;
      }

      blockUpdates.onerror = (evt) => {
        console.log('ERROR', evt);

        connectRetries++;

        if (connectRetries < 600) {
          console.log('RETRYING CONNECTION', connectRetries);

          setTimeout(() => {
            setupBlockListener();
          }, 100);
        } else {
          console.log('CONNECTION TIMED OUT');
        }
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
          $scope.transactions.push({
            timestamp: transaction.timestamp,
            transaction_id: transaction.txId,
            transaction_type: transaction.name,
            transaction_submitter: transaction.caller.identity + '@' + transaction.caller.org,
            transaction_class: isNew ? "new-row" : "existing-row",
            block_number: block.number,
            additional_info: transaction.name === 'addUsageEvent' ? EventTypes[transaction.parameters.eventType] : null
          });
        }
      });
    };
  }]);
