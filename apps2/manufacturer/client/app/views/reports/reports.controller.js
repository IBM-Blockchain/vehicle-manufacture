angular.module('bc-manufacturer')

.controller('ReportsCtrl', ['$scope', '$http', '$interval', function ($scope, $http, $interval) {

    $scope.alerts = {};
    $scope.vehicles = {};
    $scope.latest_failure;
    $scope.similar_failures = [];
    $scope.nth_failure = '';
    $scope.not_shown = 0;

    $http.get('vehicles').then(function(response, err) {
        const vehicles = response.data;
        let alerts = {};

        vehicles.forEach((vehicle) => {
            vehicle.serialNumber = generateSN();
            vehicle.usageRecord.forEach((usageEvent) => {
                if (usageEvent.eventType === 'OVERHEATED') {
                    const model = vehicle.vehicleDetails.modelType;
                    if (!alerts.hasOwnProperty(model)) {
                        alerts[model] = [];
                    }
                    alerts[model].push({
                        vehicle: vehicle,
                        usageEvent: usageEvent
                    });
                }
            });

            $scope.vehicles[vehicle.vin] = vehicle;
        });

        let most_recent;

        for (let model in alerts) {
            alerts[model].sort((a, b) => {
                if (a.usageEvent.timestamp > b.usageEvent.timestamp) {
                    return -1;
                }
                if (a.usageEvent.timestamp < b.usageEvent.timestamp) {
                    return 1;
                }
                return 0;
            });
            if (!most_recent) {
                most_recent = alerts[model][0]
            } else if (most_recent.usageEvent.timestamp < alerts[model][0].usageEvent.timestamp) {
                most_recent = alerts[model][0]
            }
        }

        $scope.latest_failure = most_recent;
        $scope.alerts = alerts;
        updateReport();
    })

    function updateReport()
    {
        const alerts = $scope.alerts[$scope.latest_failure.vehicle.vehicleDetails.modelType];

        $scope.similar_failures = alerts.slice(0, 3);
        $scope.nth_failure = alerts.length+nth(alerts.length);
        $scope.not_shown = alerts.length - 3;

        if(!$scope.$$phase) {
            $scope.$apply();
        }
    } 

    let destroyed = false;

    function openWebSocket() {
        var wsUri = '';
        if (location.protocol === 'https:') {
          wsUri = 'wss://' + location.host;
        } else {
          wsUri = 'ws://' + location.hostname + ':' + location.port;
        }
        console.log(' Connecting to websocket', wsUri);
        var webSocketURL = wsUri;
        var websocket = new WebSocket(webSocketURL);
        websocket.onopen = function () {
          console.log('Websocket is open');
        }
    
        websocket.onclose = function () {
          console.log('Websocket closed');
          if (!destroyed) {
            openWebSocket();
          }
        }
    
        websocket.onmessage = function (event) {
          var message = JSON.parse(event.data);
          if(message.$class === 'org.acme.vehicle_network.AddUsageEventEvent') {
            const vin = message.vehicle.split('#')[1];
            const vehicle = $scope.vehicles[vin];

            if (typeof vehicle === 'undefined') {
                $http.get('vehicles/'+vin).then(function(response, err) {
                    addAlert(response.data, message.usageEvent)
                })
                .catch((err) => {
                    console.log('ERROR GETTING VEHICLE', err);
                });;
            } else {
                addAlert(vehicle, message.usageEvent)
            }
          }
        }
    }

    function addAlert(vehicle, usageEvent) {
        let alert = {
        vehicle: vehicle,
        usageEvent: usageEvent
        }
        alert.vehicle.serialNumber = generateSN();
        const model = alert.vehicle.vehicleDetails.modelType;
        if (!$scope.alerts.hasOwnProperty(model)) {
            $scope.alerts[model] = [];
        }
        $scope.alerts[model].unshift(alert);
        $scope.latest_failure = alert;
        updateReport();
    }

    $scope.$on('$destroy', function () {
        destroyed = true;
    });

    openWebSocket();
}]);

function nth(d) {
    if(d>3 && d<21) return 'th'; // thanks kennebec
    switch (d % 10) {
          case 1:  return "st";
          case 2:  return "nd";
          case 3:  return "rd";
          default: return "th";
      }
  } 

var generateSN = function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    function s1() {
      return Math.floor(Math.random() * 10);
    }
    return s4() + s4() + s1() + s1() + s1();
  }
