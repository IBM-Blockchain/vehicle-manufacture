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

.directive('bcVdaHeader', ['$location', '$http', function (location, $http) {
  return {
    restrict: 'E',
    templateUrl: 'regulator/app/directives/header/header.html',
    link: function (scope) {
      scope.registered_vehicles = 0;
      scope.vin_assigned = 0;
      scope.v5c_issued = 0;
      scope.total_events = 0;
      scope.stored_trans_ids = [];

      var vehicleUrl = '/vehicles';
      var ignoreTxnsBefore;

      if(supports_html5_storage()) {
        try {
          ignoreTxnsBefore = localStorage.getItem('ignoreTxnsBefore');
          if (ignoreTxnsBefore) {
            ignoreTxnsBefore = Date.parse(ignoreTxnsBefore);
            vehicleUrl = '/vehicles?notBefore='+ignoreTxnsBefore;
          }
        } catch (err) {
          console.error('Local storage item not a date', err);
        }
      }

      $http.get(vehicleUrl).then(function(response) {
        if (response && response.data) {
            scope.registered_vehicles = response.data.registered_vehicles;
            scope.vin_assigned = response.data.vin_assigned;
            scope.v5c_issued= response.data.v5c_issued;
        }
      });

      scope.isActive = function(route) {
        return route === location.path();
      }

      scope.$watch('transactions', function () {
        if(scope.transactions.length)
        {
          for(var i = scope.total_events; i < scope.transactions.length; i++)
          {
            if(scope.transactions[i].transaction_class == "new-row" && !scope.stored_trans_ids.includes(scope.transactions[i].transaction_id)) {
              console.log(scope.transactions[i].status);
              if(scope.transactions[i].status == "SCHEDULED_FOR_MANUFACTURE")
              {
                scope.stored_trans_ids.push(scope.transactions[i].transaction_id)
              }
              else if(scope.transactions[i].status == "VIN_ASSIGNED")
              {
                scope.vin_assigned++;
                scope.registered_vehicles++;
                scope.stored_trans_ids.push(scope.transactions[i].transaction_id)
              } else if (scope.transactions[i].status == "OWNER_ASSIGNED") {
                scope.v5c_issued++;
                scope.stored_trans_ids.push(scope.transactions[i].transaction_id)
              }
            }
            if(scope.transactions[i].transaction_validator_1)
            {
              scope.total_events = scope.transactions.length; // ASSET ACTIVITY PAGE
            }
            else
            {
              scope.total_events = scope.transactions.length-1; // DASHBOARD PAGE
            }
          }
        }
      }, true);
    }
  };
}])
