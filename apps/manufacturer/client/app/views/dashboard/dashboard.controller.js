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

.controller('DashboardCtrl', ['$scope', '$http', '$interval', function ($scope, $http, $interval) {
  $scope.statuses = ['PLACED', 'SCHEDULED_FOR_MANUFACTURE', 'VIN_ASSIGNED', 'OWNER_ASSIGNED', 'DELIVERED'];

  const baseUrl = '/api';
  const baseOrderUrl = baseUrl + '/orders';
  var ignoreTxnsBefore;

  const originCode = 'S';
  const manufacturerCode = 'G';

  if(supports_html5_storage()) {
    try {
      ignoreTxnsBefore = localStorage.getItem('ignoreTxnsBefore');
      if (ignoreTxnsBefore) {
        ignoreTxnsBefore = Date.parse(ignoreTxnsBefore);
        orderUrl = '/orders';
      }
    } catch (err) {
      console.error('Local storage item not a date', err);
    }
  }

  $http.get(baseOrderUrl, {headers: {'Authorization': `Basic ${btoa('production:productionpw')}`}})
    .then(async function(response, err) {
    if (err) {
      console.log(err);
    } else if (response.data.error) {
      console.log(response.data.error.message);
    } else {
      if (Array.isArray(response.data)) {
        $scope.orders = response.data.map(function(o) {
          return bcOrderToManuOrder(o);
        });

        $scope.orders.sort((a, b) => {
          if (a.placed < b.placed) {
            return 1;
          } else if (a.placed > b.placed) {
            return -1;
          }
          return 0;
        })

        if ($scope.orders.length > 0) {
          const history = await getOrderHistory($scope.orders[0].orderId);

          history.forEach((historicState) => {
            handleUpdateOrderEvent(historicState.timestamp, historicState.value.orderStatus, historicState.value.id)
          });
        }
      }
    }
  })

  async function getOrderHistory(orderId) {
    const resp = await new Promise((resolve, reject) => {
      return $http.get(`${baseOrderUrl}/${orderId}/history`, {headers: {Authorization: `Basic ${btoa('production:productionpw')}`}})
        .then((res, err) => {
          if (err) {
            return reject(err);
          }
          return resolve(res);
        })
    });
    return resp.data;
  }

  // Websockets

  let connectRetries = 0;

  function setupPlaceOrderListener() {
    const orderUpdates = new EventSource(baseOrderUrl + '/events/placed');

      orderUpdates.onopen = (evt) => {
        console.log('OPEN', evt);
        connectRetries = 0;
      }

      orderUpdates.onerror = (evt) => {
        console.log('ERROR', evt);

        connectRetries++;

        if (connectRetries < 600) {
          console.log('RETRYING CONNECTION', connectRetries);

          setTimeout(() => {
            setupPlaceOrderListener();
          }, 100);
        } else {
          console.log('CONNECTION TIMED OUT');
        }
      }

      orderUpdates.onclose = (evt) => {
        setupPlaceOrderListener();
      }
      
      orderUpdates.onmessage = (evt) => {
        const data = JSON.parse(evt.data);

        handlePlaceOrderEvent(data);
      }
  }
  setupPlaceOrderListener();

  function handlePlaceOrderEvent(newOrder) {
    $scope.orders.unshift(bcOrderToManuOrder(newOrder));
    $scope.$apply();
  }

  function handleUpdateOrderEvent(timestamp, status, id) {
    var o = $scope.orders[0];
    if (o.orderId === id) {
      o.status = status;
      if (status === 1) {

        o.manufacture = {
          chassis:timestamp,
          interior: timestamp,
          paint: timestamp
        };
      } else if (status === 2) {
        o.manufacture.vinIssue = timestamp;
      } else if (status === 3) {
        o.manufacture.vinPrinting = timestamp;
      } else if (status === 4) {
        o.delivery = {
          shipping: timestamp
        };
      }
      // break;
    }

    if (!$scope.$$phase) {
      $scope.$apply();
    }
  }

  // openWebSocket();

  var generateVIN = function() {
    const yearChars = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y',
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ];

    const yearChar = yearChars[(new Date().getFullYear() - 1980) % yearChars.length];
    
    const vin = originCode + manufacturerCode + (Math.floor(Math.random()*9000000) + 1000000) + yearChar + (Math.floor(Math.random()*9000000) + 1000000);

    return vin;
  }

  var updateOrderStatus = async function(orderId, count) {
    let status = {
      status: count
    }

    if (count === 2) {
      status.vin = generateVIN();
    }

    const timestamp = Date.now();
    console.log('PUTTING', status);

    $http.put(`${baseOrderUrl}/${orderId}/status`, status, {headers: {'Authorization': 'Basic ' + btoa('production:productionpw')}}).then(function(response, err) {
      if(err) {
        console.log(err.message);
      }

      handleUpdateOrderEvent(timestamp, response.data.orderStatus, response.data.id);
    });
  }

  $scope.start = function(order) {
    var delay = 5000;
    var count = 1;

    order.manufacture = {};

    $interval(function() {
      updateOrderStatus(order.orderId, count)
      count++;
    }, delay, $scope.statuses.length - 1);

  }

  $scope.$on('$destroy', function () {
    destroyed = true;
  });
}])
.filter('relativeDate', function() {
  return function(input, start) {
    console.log(start, input)
    if (input) {
      var diff = input - start;
      diff = diff / 1000
      diff = Math.round(diff);

      var result = '+' + diff +  ' secs'

      return result;
    }
  };
})

function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

function bcOrderToManuOrder(o) {
  return {
    orderId: o.id,
    status: o.orderStatus,
    car: {
      vin: o.vin,
      name: o.vehicleDetails.modelType,
      serial: 'S/N ' + generateSN(),
      colour: o.vehicleDetails.colour
    },
    configuration: {
      trim: o.options.trim,
      interior: o.options.interior,
      colour: o.vehicleDetails.colour,
      extras: o.options.extras
    },
    placed: o.placed
  };
}