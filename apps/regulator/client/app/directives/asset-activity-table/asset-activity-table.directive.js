angular.module('bc-vda')

.directive('bcAssetActivityTable', [function () {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'regulator/app/directives/asset-activity-table/asset-activity-table.html',
    scope: {
      transactions: '=',
    },
    controller: ['$scope', function($scope) {
      $scope.order = {
        key: 'timestamp',
        reverse: true
      }
    }]
  };
}]);
