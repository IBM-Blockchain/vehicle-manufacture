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

      var ignoreTxnsBefore;

      scope.$watch('transactions', function () {
        if (scope.transactions.length) {
          scope.registered_vehicles = scope.transactions.filter((transaction) => transaction.transaction_type === 'registerVehicleForOrder').length;
          scope.vin_assigned = scope.registered_vehicles;
          scope.v5c_issued = scope.transactions.filter((transaction) => transaction.transaction_type === 'assignOwnershipForOrder').length;
        }
      }, true);

      scope.isActive = function(route) {
        return route === location.path();
      }
    }
  };
}])
