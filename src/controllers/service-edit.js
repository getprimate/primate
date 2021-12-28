/* global app:true */

'use strict';

(function (controller, app) {
    if (typeof app === 'undefined') throw (`${controller}: app is undefined`);

    app.controller(controller, ['$window', '$scope', '$routeParams', 'ajax', 'toast' ,'viewFrame',
        function (window, scope, $routeParams, ajax, toast, viewFrame) {

        const { angular } = window;
        const serviceForm = angular.element('form#formEdit');

        scope.PROTOCOL_ENUM = ['http', 'https', 'grpc', 'grpcs', 'tcp', 'udp', 'tls'];

        viewFrame.title = 'Edit Service';

        scope.serviceId = $routeParams.serviceId;
        scope.formInput = {
            name: 'Loading...',
            retries: 5,
            protocol: 'Loading...',
            host: 'Loading...',
            port: 0,
            path: 'Loading...',
            connectTimeout: 60000,
            readTimeout: 60000,
            writeTimeout: 60000,
            tags: '',
            clientCertificate: null,
            tlsVerifyFlag: null,
            tlsVerifyDepth: null,
            caCertificates: []
        };
        scope.pluginList = [];

        scope.fetchPluginList = function (url) {
            ajax.get({ resource: url }).then((response) => {
                scope.nextPluginUrl = (typeof response.data.next === 'string') ?
                    response.data.next.replace(new RegExp(viewFrame.host), '') : '';

                for (let index = 0; index < response.data.data.length; index++) {
                    scope.pluginList.push(response.data.data[index]);
                }

            }, function () {
                toast.error('Could not load plugin list');
            });
        };

        ajax.get({ resource: `/services/${scope.serviceId}` }).then((response) => {
            const { data: service } = response;

            scope.formInput.name = service.name;
            scope.formInput.protocol = service.protocol;
            scope.formInput.host = service.host;
            scope.formInput.port = service.port;
            scope.formInput.path = service.path;
            scope.formInput.retries = service.retries;
            scope.formInput.connectTimeout = service.connect_timeout;
            scope.formInput.readTimeout = service.read_timeout;
            scope.formInput.writeTimeout = service.write_timeout;
            scope.formInput.tags = service.tags;
            scope.formInput.tlsVerifyFlag = service.tls_verify;
            scope.formInput.tlsVerifyDeph = service.tls_verify_depth;
            scope.formInput.caCertificates = service.ca_certificates;

            viewFrame.deleteAction = {target: 'service', url: `/services/${scope.serviceId}`, redirect: '#!/services'};

        }, () => {
            toast.error('Could not load service details');
            window.location.href = '#!/services';
        });

        serviceForm.on('submit', (event) => {
            event.preventDefault();

            let payload = {};

            if (scope.formInput.name.trim().length > 1) {
                payload.name = scope.formInput.name;

            } else {
                serviceForm.find('input[name="serviceName"]').focus();
                return false;
            }

            payload.hosts = Array.isArray(scope.formInput.hosts) ? scope.formInput.hosts.join() : scope.formInput.hosts;
            payload.uris = Array.isArray(scope.formInput.uris) ? scope.formInput.uris.join() : scope.formInput.uris;
            payload.methods = Array.isArray(scope.formInput.methods) ? scope.formInput.methods.join() : scope.formInput.methods;

            if (typeof payload.hosts === 'undefined'
                && typeof payload.uris === 'undefined'
                && typeof payload.methods === 'undefined') {

                serviceForm.find('input[name="hosts"]').focus();
                return false;
            }

            if (scope.formInput.upstreamUrl.trim().length > 1) {
                payload.upstream_url = scope.formInput.upstreamUrl;

            } else {
                serviceForm.find('input[name="upstreamUrl"]').focus();
                return false;
            }

            payload.retries = (isNaN(scope.formInput.retries) || !scope.formInput.retries) ?
                5 : parseInt(scope.formInput.retries);

            payload.upstream_connect_timeout = (isNaN(scope.formInput.connectTimeout) || !scope.formInput.connectTimeout) ?
                60000 : parseInt(scope.formInput.connectTimeout);

            payload.upstream_send_timeout = (isNaN(scope.formInput.sendTimeout) || !scope.formInput.sendTimeout) ?
                60000 : parseInt(scope.formInput.sendTimeout);

            payload.upstream_read_timeout = (isNaN(scope.formInput.readTimeout) || !scope.formInput.readTimeout) ?
                60000 : parseInt(scope.formInput.readTimeout);

            payload.strip_uri = scope.formInput.stripUri;
            payload.preserve_host = scope.formInput.preserveHost;
            payload.https_only = scope.formInput.httpsOnly;
            payload.http_if_terminated = scope.formInput.httpIfTerminated;

            ajax.patch({
                resource: `/services/${scope.serviceId}`,
                data: payload
            }).then(() => {
                toast.success('Service details updated');

            }, (response) => {
                toast.error(response.data);
            });

            return false;
        });

        angular.element('table#pluginListTable').on('click', 'input[type="checkbox"].plugin-state', (event) => {
            let state = (event.target.checked) ? 'enabled' : 'disabled';

            ajax.patch({
                resource: `/services/${scope.serviceId}/plugins/${event.target.value}`,
                data: { enabled: (state === 'enabled') },
            }).then(() => {
                toast.success(`Plugin ${event.target.dataset.name} ${state}`);

            }, () => {
                toast.error('Status could not not be changed');
            });
        });

        scope.fetchPluginList(`/services/${scope.serviceId}/plugins`);
    }]);

})('ServiceEditController', app);