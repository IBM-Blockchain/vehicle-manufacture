angular.module('bc-vda')

.directive('bcAssetActivityTable', [function () {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'app/directives/asset-activity-table/asset-activity-table.html',
    scope: {
      transactions: '=',
      newrow: '='
    },
    controller: ['$scope', function($scope) {
      $scope.order = {
        key: 'timestamp',
        reverse: true
      }
    }]
  };
}]);
