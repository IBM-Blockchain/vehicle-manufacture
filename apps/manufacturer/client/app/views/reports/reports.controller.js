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
angular.module('bc-manufacturer')

.controller('ReportsCtrl', ['$scope', '$http', '$interval', function ($scope, $http, $interval) {

    const baseUrl = '/api';

    $scope.vehicles = {};
    $scope.usageEvents = [];

    const headers = { headers: { 'Authorization': `Basic ${btoa('reports:reportspw')}` } }

    $scope.getSimilar = (event) => {
        if (event) {
            let similar = 1;
            const targetVehicle = $scope.vehicles[event.vin];

            console.log('GETTING SIMILAR')

            if (targetVehicle) {
                $scope.usageEvents.forEach((usageEvent) => {
                    const vehicle = $scope.vehicles[usageEvent.vin];
    
                    if (!vehicle) {
                        return;
                    }
    
                    if (vehicle.vehicleDetails.makeId === targetVehicle.vehicleDetails.makeId &&
                        vehicle.vehicleDetails.modelType === targetVehicle.vehicleDetails.modelType &&
                        usageEvent.id !== event.id
                    ) {
                        similar++;
                    }
                });
            }

            return similar + nth(similar);
        }
    }

    getData();

    async function getData() {
        try {
            const vehicles = await $http.get(`${baseUrl}/vehicles`, headers);
            const usageEvents = await $http.get(`${baseUrl}/vehicles/usage`, headers)

            vehicles.data.forEach((vehicle) => {
                vehicle.serialNumber = generateSN();
                $scope.vehicles[vehicle.id] = vehicle;
            });

            $scope.usageEvents = usageEvents.data.filter((event) => {
                return event.eventType === 2;
            }).sort((a, b) => b.timestamp - a.timestamp);

            $scope.$apply();

            setupPlaceOrderListener();

        } catch (err) {
            console.log(err);
        }
    }

    function setupPlaceOrderListener() {
        const orderUpdates = new EventSource(baseUrl + '/vehicles/usage/events/added');

        orderUpdates.onopen = (evt) => {
            console.log('OPEN', evt);
        }

        orderUpdates.onerror = (evt) => {
            console.log('ERROR', evt);
            setupPlaceOrderListener();
        }

        orderUpdates.onclose = (evt) => {
            setupPlaceOrderListener();
        }

        orderUpdates.onmessage = async (evt) => {
            const data = JSON.parse(evt.data);

            if (data.eventType === 2) {
                if (!$scope.vehicles.hasOwnProperty(data.vin)) {
                    const vehicle = (await $http.get(`${baseUrl}/vehicles/${data.vin}`, headers)).data;
                    vehicle.serialNumber = generateSN();

                    $scope.vehicles[vehicle.id] = vehicle;
                }

                $scope.usageEvents.unshift(data);

                $scope.$apply();
            }
        }
    }
}]);

function nth(d) {
    if (d > 3 && d < 21) return 'th'; // thanks kennebec
    switch (d % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}
