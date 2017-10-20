angular.module('bc-manufacturer')

.controller('ReportsCtrl', ['$scope', '$http', '$interval', function ($scope, $http, $interval) {

    $scope.vehicles = {};
    $scope.usageEvents = {};
    $scope.event = {
        not_shown: 0,
        similar_failures: []
    };

    $http.get('vehicles_query').then(function(response, err) {
        // REPSPONSE IS ALL CARS MADE BY ARIUM NO GET ALL USAGE RECORDS FOR VIN
        var data = response.data;
        for(var i = 0; i < data.length; i++)
        {
            // PUSH MODEL TO SCOPE IF NOT EXISTING
            var vin = data[i].vin;
            $scope.vehicles[vin] = {}
            $scope.vehicles[vin]['vehicleDetails'] = data[i].vehicleDetails
        }
        $http.get('usage_records').then(function(response, err) {
            // REPSPONSE IS ALL USAGE RECORDS
            var data = response.data;
            for(var i = 0; i < data.length; i++)
            {
                var vin = data[i].vehicleDetails.split('#')
                vin = vin[vin.length-1];
                for(var j = 0; j < data[i].usageEvents.length; j++)
                {
                    if(typeof $scope.usageEvents[data[i].usageEvents[j].eventType] == "undefined")
                    {
                        $scope.usageEvents[data[i].usageEvents[j].eventType] = [];
                    }
                    $scope.usageEvents[data[i].usageEvents[j].eventType].push({
                        vin: vin,
                        usageEvent: data[i].usageEvents[j]
                        })
                }
            }              
            $scope.$applyAsync()
            updateReport();
        })
    })

    function updateReport()
    {
        $scope.usageEvents["OVERHEATED"] = $scope.usageEvents["OVERHEATED"].sort(function(t1, t2) {
            return new Date(t1.usageEvent.timestamp) - new Date(t2.usageEvent.timestamp);
          }).reverse()
        try
        {
            var usage_event = $scope.usageEvents["OVERHEATED"][0];
        }
        catch(error)
        {
            return;
            // NO ELEMENT 0 SO NO OVERHEATS
        }
        var usage_event = $scope.usageEvents["OVERHEATED"][0];
        var vin = usage_event.vin;
        var vehicleDetails = $scope.vehicles[vin].vehicleDetails;

        $scope.event = {}
        $scope.event.not_shown = 0;
        $scope.event.similar_failures = []
        
        $scope.event.car_model = vehicleDetails.modelType;
        $scope.event.time = new Date(usage_event.usageEvent.timestamp).toLocaleString();
        $scope.event.serial_number = generateSN();
        $scope.event.engine_temperature = usage_event.usageEvent.engine_temperature.toFixed(2)
        $scope.event.air_temperature = usage_event.usageEvent.air_temperature.toFixed(2)
        $scope.event.acceleration = usage_event.usageEvent.acceleration.toFixed(2)
        $scope.event.roll = usage_event.usageEvent.roll.toFixed(2)
        $scope.event.pitch = usage_event.usageEvent.pitch.toFixed(2)
        $scope.event.light_level = usage_event.usageEvent.light_level.toFixed(2)

        var counter = 1;
        for(var i = 1; i < $scope.usageEvents["OVERHEATED"].length; i++)
        {
            var usage_event = $scope.usageEvents["OVERHEATED"][i];
            var vin = usage_event.vin;
            var vehicleDetails = $scope.vehicles[vin].vehicleDetails;

            if(vehicleDetails.modelType == $scope.event.car_model)
            {
                counter++;
                if($scope.event.similar_failures.length < 3)
                {
                    $scope.event.similar_failures.push({
                        car_model: vehicleDetails.modelType,
                        serial_number: generateSN(),
                        time: new Date(usage_event.usageEvent.timestamp).toLocaleString(),
                        engine_temperature: usage_event.usageEvent.engine_temperature
                    })
                }
                else
                {
                    $scope.event.not_shown++;
                }
            }
        }
        $scope.event.num_failed = counter+nth(counter)
        $scope.$applyAsync()
    }

    var addusagevent;
    var destroyed;

    function openAddUsageWebSocket() {
        addusagevent = new WebSocket('ws://'+location.host+'/ws/addusageevent');
    
        addusagevent.onopen = function () {
          console.log('addusagevent websocket open!');
          // Notification('UpdateOrderStatus WebSocket connected');
        };
    
        addusagevent.onclose = function() {
          console.log('closed');
          // Notification('addusagevent WebSocket disconnected');
          if (!destroyed) {
            openAddUsageWebSocket();
          }
        }
    
        addusagevent.onmessage = function(event) {
            console.log('CALLED')
            var data = JSON.parse(event.data)
            var vin = data.vin;
            var usage_event = data.usageEvent;
            console.log($scope.vehicles[vin])
            if(typeof $scope.vehicles[vin] == "undefined")
            {
                // CAR DOESN'T EXIST BEST GO GET IT
                $http.get('vehicles/'+vin).then(function(response, err) {
                    var data = response.data;
                    $scope.vehicles[vin] = {}
                    $scope.vehicles[vin]['vehicleDetails'] = data.vehicleDetails
                    if(typeof $scope.usageEvents[usage_event.eventType] == "undefined")
                    {
                        $scope.usageEvents[usage_event.eventType] = [];
                    }
                    $scope.usageEvents[usage_event.eventType].push({
                        vin: vin,
                        usageEvent: usage_event
                    })
                    console.log('UPDATED ROUTE 1')
                    updateReport();
                })
            }
            else
            {
                if(typeof $scope.usageEvents[usage_event.eventType] == "undefined")
                {
                    $scope.usageEvents[usage_event.eventType] = [];
                }
                $scope.usageEvents[usage_event.eventType].push({
                    vin: vin,
                    usageEvent: usage_event
                })
                console.log('UPDATED ROUTE 2')
                updateReport();
            }
        }
      }

      openAddUsageWebSocket()

      $scope.$on('$destroy', function () {
        destroyed = true;
        if(addusagevent)
        {
            addusagevent.close();
        }
      })
  
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
