'use strict';

import {
    Chart,
    CategoryScale,
    BarElement,
    BarController,
    LinearScale,
    DoughnutController,
    ArcElement
} from '../static/chart-esm.js';

import {isNil, isObject} from '../lib/core-toolkit.js';

Chart.register(CategoryScale, LinearScale, BarElement, BarController, DoughnutController, ArcElement);

const styles = window.getComputedStyle(window.document.documentElement);

/**
 * @type {Object}
 * @property {Chart} server - The server chart instance.
 * @property {Chart} timer - The timer chart instance.
 */
const CHARTS = {};

const stdColors = {
    stdDefault: styles.getPropertyValue('--std__default').trim(),
    stdPrimary: styles.getPropertyValue('--std__primary').trim(),
    stdSuccess: styles.getPropertyValue('--std__success').trim(),
    stdInfo: styles.getPropertyValue('--std__info').trim(),
    stdWarning: styles.getPropertyValue('--std__warning').trim(),
    stdCritical: styles.getPropertyValue('--std__critical').trim()
};

function createChart(canvas, payload, context = '2d') {
    if (!isObject(payload)) {
        return null;
    }

    const baseOptions = {responsive: true, maintainAspectRatio: false, scales: {x: {ticks: {beginAtZero: true}}}};

    if (isNil(payload.options)) {
        payload.options = baseOptions;
    } else {
        payload.options = {...baseOptions, ...payload.options};
    }

    const element = document.getElementById(canvas);

    if (isNil(element) || element.nodeName !== 'CANVAS') {
        return null;
    }

    return new Chart(element.getContext(context), payload);
}

function generateServerChart(chartData) {
    const datasets = [
        {
            backgroundColor: [
                `${stdColors.stdSuccess}7F`,
                `${stdColors.stdInfo}7F`,
                `${stdColors.stdPrimary}7F`,
                `${stdColors.stdCritical}7F`,
                `${stdColors.stdInfo}7F`,
                `${stdColors.stdWarning}7F`
            ],
            borderColor: [
                stdColors.stdSuccess,
                stdColors.stdInfo,
                stdColors.stdPrimary,
                stdColors.stdCritical,
                stdColors.stdInfo,
                stdColors.stdWarning
            ],
            borderWidth: 1,
            label: 'Connections',
            data: chartData
        }
    ];

    if (CHARTS.server instanceof Chart) {
        CHARTS.server.data.datasets = datasets;
        CHARTS.server.update();

        return true;
    }

    CHARTS.server = createChart('chart_ServerStat', {
        type: 'bar',
        data: {
            labels: ['Handled', 'Accepted', 'Active', 'Waiting', 'Reading', 'Writing'],
            datasets
        }
    });
}

function generateTimerChart(chartData) {
    const datasets = [
        {
            backgroundColor: [stdColors.stdWarning, stdColors.stdCritical],
            label: 'Timers',
            data: chartData,
            hoverOffset: 4
        }
    ];

    if (CHARTS.timer instanceof Chart) {
        CHARTS.timer.data.datasets = datasets;
        CHARTS.timer.update();

        return true;
    }

    CHARTS.timer = createChart('chart_TimerStat', {
        type: 'doughnut',
        data: {
            labels: ['Running', 'Pending'],
            datasets
        },
        options: {
            plugins: {
                legend: {position: 'top'},
                title: {display: true, text: 'Server Timers'}
            }
        }
    });
}

/**
 * Provides controller constructor for displaying overview.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function OverviewController(scope, restClient, viewFrame, toast) {
    scope.adminListeners = [];
    scope.proxyListeners = [];
    scope.memWorkerVMs = [];
    scope.metadata = {
        apiVersion: 'Loading...',
        luaVersion: 'Loading...',
        nodeId: 'Loading',
        isDBLess: false,
        database: {
            server: 'DB-Less',
            url: '',
            dbName: '',
            reachable: true
        }
    };

    scope.fetchServerInfo = function () {
        const request = restClient.get('/');

        request.then(({data: response}) => {
            const {timers, configuration} = response;

            if (Array.isArray(configuration.admin_listeners)) {
                scope.adminListeners = configuration.admin_listeners;
            }

            if (Array.isArray(configuration.proxy_listeners)) {
                scope.proxyListeners = configuration.proxy_listeners;
            }

            scope.metadata.apiVersion = response.version;
            scope.metadata.luaVersion = response.lua_version;
            scope.metadata.nodeId = response.node_id;

            viewFrame.setState('kongVersion', scope.metadata.apiVersion);

            if (configuration.database === 'off') {
                scope.metadata.isDBLess = true;
                scope.metadata.database.server = 'DB-Less Configuration';

                viewFrame.setState('kongDatabase', 'DB-Less');
            } else if (configuration.database === 'postgres') {
                scope.metadata.database.server = 'Postgres';
                scope.metadata.database.url = `${configuration.pg_host}:${configuration.pg_port}`;
                scope.metadata.database.dbName = configuration.pg_database;

                viewFrame.setState('kongDatabase', 'Postgres');
            }

            generateTimerChart([timers.running, timers.pending]);
        });

        request.catch(() => {
            toast.warning('Unable to fetch server information.');
        });
    };

    /**
     * Retrieves the node status and updates the chart.
     */
    scope.fetchServerStatus = function () {
        const request = restClient.get('/status');

        request.then(({data: response}) => {
            const {server} = response;
            const {workers_lua_vms: workerVMs = []} = response.memory;

            const chartData = [
                server.connections_handled,
                server.connections_accepted,
                server.connections_active,
                server.connections_waiting,
                server.connections_reading,
                server.connections_writing
            ];

            generateServerChart(chartData);

            scope.memWorkerVMs = workerVMs;
        });

        request.catch(() => {
            toast.warning('Unable to fetch server status.');
        });
    };

    viewFrame.clearBreadcrumbs();
    viewFrame.setTitle('Overview');
    viewFrame.addBreadcrumb('#!/overview', 'Overview');

    scope.fetchServerStatus();
    scope.fetchServerInfo();

    scope.$on('$destroy', () => {
        const chartNames = Object.keys(CHARTS);

        for (let name of chartNames) {
            if (CHARTS[name] instanceof Chart) {
                CHARTS[name].destroy();
                delete CHARTS[name];
            }
        }
    });
}
