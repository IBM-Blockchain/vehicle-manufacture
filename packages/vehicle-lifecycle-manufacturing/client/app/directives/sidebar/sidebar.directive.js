angular.module('bc-manufacturer')

.directive('bcManSidebar', [function () {
  return {
    restrict: 'E',
    templateUrl: 'app/directives/sidebar/sidebar.html',
    link: function ($scope, element, attrs) {
          var locations = window.location;
          locations = locations.toString().split('/');
          $scope.selected = locations[locations.length - 1];
        }
      }
}])
