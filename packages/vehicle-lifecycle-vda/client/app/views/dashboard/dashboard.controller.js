angular.module('bc-vda')

.controller('DashboardCtrl', ['$scope', '$http', function ($scope, $http) {


  $scope.chain = [];
  $scope.transactions = [];

  // USED TO CALL /transactions ON THIS SERVER BUT THAT STOPPED WORKING UNKNOWN REASON WHY
  $http.get('transactions').then(function(response, err) {
    if (err) {
      console.log(err);
    } else if (Array.isArray(response.data)) {
      var i = 138;

      $scope.chain = response.data.map(function(transaction) {
        var split = transaction.transactionType.split('.');
        var type = split[split.length - 1];
        var time = Date.parse(transaction.transactionTimestamp);

        var transaction_submitter = "Arium Vehicles"
        switch(type)
        {
          case "SetupDemo": transaction_submitter = "Admin"; break;
          case "PlaceOrder": transaction_submitter = "Paul Harris"; break;
          case "CreatePolicy": transaction_submitter = "Prince Insurance"; break;
          case "AddUsageEvent": transaction_submitter = "Vehicle ("+transaction.eventsEmitted[0].vin+")"; break;
        }

        $scope.transactions.push({
          timestamp: time,
          transaction_id: transaction.transactionId,
          transaction_type: type,
          transaction_submitter: transaction_submitter,
          transaction_class: "existing-row"
        });
        
        console.log(transaction)

        var status = ""
        try{
          var status = (type == 'AddUsageEvent') ? transaction.eventsEmitted[0].usageEvent.eventType : transaction.eventsEmitted[0].order.orderStatus
        }
        catch(err)
        {
        }

        return {
          transID: transaction.transactionId,
          type: type,
          status: status,
          time: time
        };
      });

      $scope.chain.sort(function(t1, t2) {
        return t1.time - t2.time;
      })

      $scope.chain.map(function(transaction) {
        transaction.id = i++;
        return transaction;
      })
    }
  });

  // Websockets

  var placeOrder;
  var updateOrder;
  var createPolicy;
  var createUsageRecord;
  var addUsageEvent;
  var destroyed = false;

  function openPlaceOrderWebSocket() {
    placeOrder = new WebSocket('ws://' + location.host + '/ws/placeorder');

    placeOrder.onopen = function() {
      console.log('placeOrder websocket open!');
      // Notification('PlaceOrder WebSocket connected');
    };

    placeOrder.onclose = function() {
      console.log('closed');
      // Notification('PlaceOrder WebSocket disconnected');
      if (!destroyed) {
        openPlaceOrderWebSocket();
      }
    }

    placeOrder.onmessage = function(event) {
      if (event.data === '__pong__') {
        return;
      }

      var order = JSON.parse(event.data);
      $scope.addBlock(order.transactionId, 'PlaceOrder', 'Paul Harris');
      $scope.$apply();
    }
  }

  function openUpdateOrderWebSocket() {
    updateOrder = new WebSocket('ws://' + location.host + '/ws/updateorderstatus');

    updateOrder.onopen = function() {
      console.log('updateOrder websocket open!');
      // Notification('UpdateOrderStatus WebSocket connected');
    };

    updateOrder.onclose = function() {
      console.log('closed');
      // Notification('UpdateOrderStatus WebSocket disconnected');
      if (!destroyed) {
        openUpdateOrderWebSocket();
      }
    }

    updateOrder.onmessage = function(event) {
      if (event.data === '__pong__') {
        return;
      }
      var status = JSON.parse(event.data);
      $scope.addBlock(status.transactionId, 'UpdateOrderStatus', 'Arium Vehicles', status.orderStatus);
      $scope.$apply();
    }
  }

  function openPolicyWebSocket() {
    createPolicy = new WebSocket('ws://' + location.host + '/ws/createpolicy');

    createPolicy.onopen = function() {
      console.log('createPolicy websocket open!');
      // Notification('PlaceOrder WebSocket connected');
    };

    createPolicy.onclose = function() {
      console.log('closed');
      // Notification('PlaceOrder WebSocket disconnected');
      if (!destroyed) {
        openPolicyWebSocket();
      }
    }

    createPolicy.onmessage = function(event) {

      var order = JSON.parse(event.data);
      $scope.addBlock(order.eventId.split('#')[0], 'CreatePolicy', 'Prince Insurance');
      $scope.$apply();
    }
  }
  
  function openCreateUsageWebSocket() {
    console.log("HELLO WORLD")
    createUsageRecord = new WebSocket('ws://' + location.host + '/ws/createusagerecord');

    createUsageRecord.onopen = function() {
      console.log('CreateUsageRecord websocket open!');
      // Notification('PlaceOrder WebSocket connected');
    };

    createUsageRecord.onclose = function() {
      console.log('closed');
      // Notification('PlaceOrder WebSocket disconnected');
      if (!destroyed) {
        openCreateUsageWebSocket();
      }
    }

    createUsageRecord.onmessage = function(event) {

      var order = JSON.parse(event.data);
      $scope.addBlock(order.eventId.split('#')[0], 'CreateUsageRecord', 'Arium Vehicles');
      $scope.$apply();
    }
  }

  function openAddUsageEventWebSocket() {
    addUsageEvent = new WebSocket('ws://' + location.host + '/ws/addusageevent');

    addUsageEvent.onopen = function() {
      console.log('addusageevent websocket open!');
      // Notification('PlaceOrder WebSocket connected');
    };

    addUsageEvent.onclose = function() {
      console.log('closed');
      // Notification('PlaceOrder WebSocket disconnected');
      if (!destroyed) {
        openCreateUsageWebSocket();
      }
    }

    addUsageEvent.onmessage = function(event) {
      
      var order = JSON.parse(event.data);
      $scope.addBlock(order.eventId.split('#')[0], 'AddUsageEvent', 'Vehicle('+order.vin+')', order.usageEvent.eventType);
      $scope.$apply();
    }
  }

  openPlaceOrderWebSocket();
  openUpdateOrderWebSocket();
  openPolicyWebSocket();
  openCreateUsageWebSocket();
  openAddUsageEventWebSocket();

  $scope.addBlock = function (tranactionId, type, submitter, status) {
    var id = $scope.chain[$scope.chain.length - 1].id + 1;
    $scope.chain.push({
      id: id,
      transID: tranactionId,
      type: type,
      status: status
    });
    $scope.transactions.push({
      timestamp: Date.now(),
      transaction_id: tranactionId,
      transaction_type: type,
      transaction_submitter: submitter,
      transaction_class: "new-row",
      status: status
    });
  };

  $scope.$on('$destroy', function () {
    destroyed = true;
    if (placeOrder) {
      placeOrder.close();
    }
    if (updateOrder) {
      updateOrder.close();
    }
  });
}]);
