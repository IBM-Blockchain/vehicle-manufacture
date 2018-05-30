angular.module('bc-vda')

.controller('AssetActivityCtrl', ['$scope', '$http', function ($scope, $http) {

  $scope.greeting = ["hello", "world"]

  $scope.chain = [];
  $scope.transactions = [];

  $scope.newrow = "";

  $http.get('transactions').then(function(response, err) {
    if (err) {
      console.log(err);
    } else if (Array.isArray(response.data)) {
      var i = 138;

      $scope.chain = response.data.map(function(transaction) {
        var split = transaction.transactionType.split('.');
        var type = split[split.length - 1];
        var time = Date.parse(transaction.transactionTimestamp);

        var extraText = "";
        var status = "";

        if(type == "UpdateOrderStatus")
        {
          type += "_"+transaction.eventsEmitted[0].order.orderStatus;
          status = transaction.eventsEmitted[0].order.orderStatus;
          // MAKE IT USE THIS NEW TYPE WHEN GETTING ACTIVITY TO DIFFERENTIATE ON MANUFACTURE SECTION FOR VALIDATORS
        }

        var details = get_activity_from_type(type);

        if(details.activity == "Alert")
        {
          extraText = "Vehicle "+transaction.eventsEmitted[0].usageEvent.eventType.split('_').join(' ').toLowerCase()+" "
        }

        if(details.activity != "")
        {
          $scope.transactions.push({
            timestamp: time,
            transaction_id: transaction.transactionId,
            transaction_type: extraText+details.activity,
            transaction_validator_1: details.validator_1,
            transaction_validator_2: details.validator_2,
            transaction_sign: details.sign,
            transaction_class: "existing-row",
            status: status
          });
  
          return {
            transID: transaction.transactionId,
            type: type,
            status: transaction.orderStatus,
            time: time
          };
        }
      });

      $scope.chain.sort(function(t1, t2) {
        return t1.time - t2.time;
      })

    }
  });


  // Websockets
  var destroyed = false;
  var websocket;
  
  function openWebSocket() {
    var wsUri = '';
    if (location.protocol === 'https:') {
      wsUri = 'wss://' + location.host;
    } else {
      wsUri = 'ws://' + location.hostname + ':' + location.port;
    }
    console.log(' Connecting to websocket', wsUri);
    var webSocketURL = wsUri;
    websocket = new WebSocket(webSocketURL);

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
      
      let usageEvent = null;
      let status = null

      message.$class = message.$class.replace('org.acme.vehicle_network.', '').replace('Event', '');

      switch (message.$class) {
        case 'PlaceOrder':
        case "CreatePolicy":      break;
        case 'UpdateOrderStatus': message.$class = message.$class+"_"+message.orderStatus;
                                  status = message.orderStatus;
                                  break;
        case "AddUsageEvent":     usageEvent = message.usageEvent;
                                  break;
      }

      $scope.addBlock(message.eventId.split('#')[0], message.$class, usageEvent, status);
      $scope.$apply();
    }
  }
  openWebSocket();

  $scope.addBlock = function (transactionId, type, usageEvent, status) {
    var details = get_activity_from_type(type)
    var extraText = '';

    if(details.activity === 'Alert')
    {
      extraText = "Vehicle "+usageEvent.eventType.split('_').join(' ').toLowerCase()+" "
    }
    if(details.activity != "")
    {
      $scope.transactions.push({
        timestamp: new Date(),
        transaction_id: transactionId,
        transaction_type: extraText+details.activity,
        transaction_validator_1: details.validator_1,
        transaction_validator_2: details.validator_2,
        transaction_sign: details.sign,
        transaction_class: "new-row",
        status: status
      });
    }
  };

  function get_activity_from_type(type)
  {
    var activity = "";
    var validator_1 = "";
    var validator_2 = "";
    var sign = "+";

    switch(type)
    {
      case "CreatePolicy": activity = "New Insurance Issued"; validator_1 = "Insurer"; validator_2 = "Vehicle Owner"; break;
      case "PlaceOrder": activity = "New Vehicle Request"; validator_1="Vehicle Owner"; validator_2 = "Manufacturer"; break;
      case "UpdateOrderStatus_PLACED": activity = "Vehicle Manufacture (Order Placed)"; validator_1="Manufacturer"; validator_2 = ""; sign=""; break;
      case "UpdateOrderStatus_SCHEDULED_FOR_MANUFACTURE": activity = "Vehicle Manufacture (Manufacture Scheduled)"; validator_1="Manufacturer"; validator_2 = ""; sign=""; break;
      case "UpdateOrderStatus_VIN_ASSIGNED": activity = "Vehicle Manufacture (Vin Assigned)"; validator_1="Manufacturer"; validator_2 = "Regulator"; break;
      case "UpdateOrderStatus_OWNER_ASSIGNED": activity = "Vehicle Manufacture (Owner Assigned)"; validator_1="Manufacturer"; validator_2 = ""; sign=""; break;
      case "UpdateOrderStatus_DELIVERED": activity = "Vehicle Manufacture (Delivered)"; validator_1="Vehicle Owner"; validator_2 = "Vehicle"; break;
      case "AddUsageEvent": activity="Alert"; validator_1="Vehicle"; validator_2=""; sign=""; break;
    }

    return {"activity": activity, "validator_1": validator_1, "validator_2": validator_2, "sign": sign}
  }

}]);

// TO DO MAKE USE OF WEB SOCKETS TO MAKE PAGE LIVE UPDATE
