'use strict';

import {Chart, CategoryScale, BarElement, BarController, LinearScale} from '../static/chart-esm.js';
Chart.register(CategoryScale, BarElement, BarController, LinearScale);

function _createChart(container, data) {
    if (typeof data.options === 'undefined')
        data.options = {responsive: true, scales: {x: {ticks: {beginAtZero: true}}}};
    return new Chart(container.getContext('2d'), data);
}

export default function OverviewController(scope, restClient, toast, viewFrame) {
    const {document} = window;

    viewFrame.setTitle('Overview');
    viewFrame.clearRoutes();

    scope.refreshTimer = function (master) {
        restClient.get('/').then(
            function (response) {
                scope.kongStat = response.data;

                _createChart(document.getElementById('timersChart'), {
                    type: 'bar',
                    data: {
                        labels: ['Running', 'Pending'],
                        datasets: [
                            {
                                data: [scope.kongStat.timers.running, scope.kongStat.timers.pending],
                                label: 'Timers',
                                backgroundColor: ['#10C469', '#FFCE56']
                            }
                        ]
                    }
                });

                if (!master || master !== true) toast.success('Timers data has been updated');
            },
            function () {
                toast.error('Could not populate data');
            }
        );
    };

    scope.refreshStatus = function (master) {
        restClient.get('/status').then(
            function (response) {
                let server = response.data.server;

                _createChart(document.getElementById('clusterStatChart'), {
                    type: 'bar',
                    data: {
                        labels: ['Handled', 'Accepted', 'Active', 'Waiting', 'Reading', 'Writing'],
                        datasets: [
                            {
                                data: [
                                    server.connections_handled,
                                    server.connections_accepted,
                                    server.connections_active,
                                    server.connections_waiting,
                                    server.connections_reading,
                                    server.connections_writing
                                ],
                                backgroundColor: [
                                    'rgba(24, 138, 226, 0.5)',
                                    'rgba(16, 196, 105, 0.5)',
                                    'rgba(128, 197, 218, 0.5)',
                                    'rgba(248, 142, 15, 0.5)',
                                    'rgba(207, 32, 241, 0.5)',
                                    'rgba(91, 105, 188, 0.5)'
                                ],
                                borderColor: ['#188AE2', '#10C469', '#80C5DA', '#F88E0F', '#CF20F1', '#5B69BC'],
                                borderWidth: 1,
                                label: 'Connections'
                            }
                        ]
                    }
                });

                if (!master || master !== true) toast.success('Node Status data has been updated');
            },
            function () {
                toast.error('Could not populate chart data');
            }
        );
    };

    scope.refreshStatus(true);
    scope.refreshTimer(true);
}
