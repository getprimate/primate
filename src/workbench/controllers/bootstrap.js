/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const {ipcRenderer} = require('electron');

/**
 * Provides controller constructor for setting up the application.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {Object} element - HTML Element to which controller is assigned.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI attributes.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function BootstrapController(scope, element, restClient, viewFrame, toast) {
    const kongConfig = ipcRenderer.sendSync('get-config', 'kong');

    let statusBar = element.find('footer.footer').children('span');
    statusBar.html('Reading configuration...');

    scope.kongConfig = kongConfig;
    scope.version = ipcRenderer.sendSync('get-config', 'VERSION');

    let form = element.find('form#configForm');
    let connect = function (config, writeConfig) {
        if (scope.kongConfig.host.charAt(scope.kongConfig.host.length - 1) === '/') {
            scope.kongConfig.host = scope.kongConfig.host.substring(0, scope.kongConfig.host.length - 1);
        }

        restClient.request({method: 'GET', ...config}).then(
            function (response) {
                try {
                    if (typeof response.data !== 'object' || typeof response.data.version === 'undefined') {
                        toast.error('Could not detect Kong Admin API running on the provided URL');
                        if (form.hasClass('hidden')) form.fadeIn(400);
                        return;
                    }
                } catch (e) {
                    toast.error('Could not detect Kong Admin API running on the provided URL');
                    if (form.hasClass('hidden')) form.fadeIn(400);
                    return;
                }

                if (writeConfig === true) {
                    ipcRenderer.send('write-config', {name: 'kong', config: scope.kongConfig});
                } else {
                    element.fadeOut({
                        duration: 300,
                        complete: function () {
                            window.location.href = 'dashboard.html';
                        }
                    });
                }
            },
            function (response) {
                if (form.hasClass('hidden')) form.fadeIn(400);

                if (response.status && 401 === parseInt(response.status)) {
                    toast.error('Please provide correct username and password');
                } else {
                    toast.error('Could not connect to ' + scope.kongConfig.host);
                }
            }
        );
    };

    ipcRenderer
        .on('write-config-success', function () {
            element.fadeOut({
                duration: 300,
                complete: function () {
                    window.location.href = 'index.html';
                }
            });
        })
        .on('write-config-error', function (event, arg) {
            toast.error(arg.message);

            let interval = setInterval(function () {
                clearInterval(interval);
                window.location.href = 'index.html';
            }, 2000);
        });

    form.on('submit', function (event) {
        event.preventDefault();

        let config = {url: scope.kongConfig.host, headers: {}};

        if (scope.kongConfig.username) {
            config.headers['Authorization'] = 'Basic ' + btoa(scope.kongConfig.username + ':' + (scope.kongConfig.password || ''));
        }

        connect(config, true);
        return false;
    });

    let timeout = setInterval(function () {
        statusBar.html('');
        element.find('.icon').slideUp({duration: 300});

        if (typeof scope.kongConfig.host === 'string' && scope.kongConfig.host) {
            connect({url: kongConfig.host}, false);
            clearInterval(timeout);
        } else {
            form.fadeIn({
                duration: 400,
                complete: function () {
                    clearInterval(timeout);
                }
            });
        }
    }, 2000);
}
