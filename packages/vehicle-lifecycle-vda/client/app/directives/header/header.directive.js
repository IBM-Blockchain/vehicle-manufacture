angular.module('bc-vda')

.directive('bcVdaHeader', ['$location', '$http', function (location, $http) {

  return {
    restrict: 'E',
    templateUrl: 'app/directives/header/header.html',
    link: function (scope) {
      scope.registered_vehicles = 0;
      scope.vin_assigned = 0;
      scope.total_events = 0;
      scope.suspicious_vehicles = 0;
      scope.stored_trans_ids = [];

      $http.get('/vehicles').then(function(response) {
        console.log(response);

        if (response && response.data) {
          for (var i = 0; i < response.data.length; ++i) {
            var vehicle = response.data[i];

            scope.registered_vehicles++;

            if (vehicle.vehicleDetails.vin) {
              scope.vin_assigned++;
            }

            if (vehicle.suspiciousMessage) {
              scope.suspicious_vehicles++;
            }
          }
        }
      });

      $http.get('transactions').then(function(response, err) {
        if (err) {
          console.log(err);
        } else if (Array.isArray(response.data)) {
          scope.total_events = response.data.length-1; // -1 as not counting setup demo
        }
      })

      scope.$watch('transactions', function () {
        if(scope.transactions.length)
        {
          for(var i = scope.total_events; i < scope.transactions.length; i++)
          {
            if(scope.transactions[i].status == "SCHEDULED_FOR_MANUFACTURE" && scope.transactions[i].transaction_class == "new-row" && !scope.stored_trans_ids.includes(scope.transactions[i].transaction_id))
            {
              scope.registered_vehicles++;
              scope.stored_trans_ids.push(scope.transactions[i].transaction_id)
            }
            else if(scope.transactions[i].status == "VIN_ASSIGNED" && scope.transactions[i].transaction_class == "new-row" && !scope.stored_trans_ids.includes(scope.transactions[i].transaction_id))
            {
              scope.vin_assigned++;
              scope.stored_trans_ids.push(scope.transactions[i].transaction_id)
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

      scope.isActive = function(route) {
        return route === location.path();
      }
    }
  };

}])
