/* global app:true Chart:true */
(function (angular, app) {
    'use strict';

    var controller = 'DashboardController';

    if (typeof app === 'undefined') {
        throw ( controller + ': app is undefined');
    }

    app.controller(controller, ['$scope', 'ajax', 'toast', 'viewFactory', function ($scope, ajax, toast, viewFactory) {

        viewFactory.title = 'Dashboard';
        viewFactory.prevUrl = null;

        ajax.get({
            resource: '/'
        }).then(function (response) {
            $scope.kongStat = response.data;
            $scope.database = $scope.kongStat.configuration.database;

            new Chart(angular.element('#timersChart')[0].getContext('2d'), {
                type: 'horizontalBar',
                data: {
                    labels: ['Running', 'Pending'],
                    datasets: [{
                        label: 'Timers',
                        data: [2, 1],
                        backgroundColor:['#10C469', '#FFCE56']
                    }]
                },
                options: {responsive: true, scales: {xAxes: [{ticks: {beginAtZero: true}}]}}
            });

        }, function () {
            toast.error('Could not populate data');
        });

        ajax.get({ resource: '/status' }).then(function (response) {
            var server = response.data.server;

            Chart.defaults.global.defaultFontColor = '#9db4be';
            Chart.defaults.global.defaultFontStyle = 'bold';

            var chart = {
                labels: ['Handled', 'Accepted', 'Active', 'Waiting', 'Reading', 'Writing'],
                data: [20,
                    20,
                    10,
                    3,
                    8,
                    2],
                backgrounds: ['rgba(24, 138, 226, 0.5)',
                    'rgba(16, 196, 105, 0.5)',
                    'rgba(128, 197, 218, 0.5)',
                    'rgba(248, 142, 15, 0.5)',
                    'rgba(207, 32, 241, 0.5)',
                    'rgba(91, 105, 188, 0.5)'],
                borders: ['#188AE2', '#10C469', '#80C5DA', '#F88E0F', '#CF20F1', '#5B69BC']
            };

            new Chart(angular.element('#clusterStatChart')[0].getContext('2d'), {
                type: 'bar',
                data: {
                    labels: chart.labels,
                    datasets: [{
                        label: 'Connections',
                        data: chart.data,
                        backgroundColor: chart.backgrounds,
                        borderColor: chart.borders,
                        borderWidth: 1
                    }]
                },
                options: {responsive: true, scales: {yAxes: [{ticks: {beginAtZero: true}}]}}
            });
        }, function () {

        });
    }]);
})(window.angular, app);