'use strict';

import utils from '../lib/utils.js';
import ServiceModel from '../models/service-model.js';

const _buildServiceModel = (model, from = {}) => {
    const keys = Object.keys(from);

    for (let key of keys) {
        if ((typeof model[key] === 'undefined')
            || (Array.isArray(model[key]) && from[key] === null)) {
            continue;
        }

        switch (key) {
            case 'tls_verify':
            case 'tls_verify_depth':
                model[key] = String(from[key]);
                break;

            case 'client_certificate':
                model[key] = (from[key] !== null && typeof from[key]['id'] === 'string') ? from[key]['id'] : '';
                break;

            case 'ca_certificates':
            case 'tags':
                model[key] = Array.isArray(from[key]) ? from[key] : [];
                break;

            default:
                model[key] = from[key];
                break;
        }
    }
};

export default function ServiceEditController(window, scope, location, routeParams, ajax, viewFrame, toast) {
    const {angular} = window;
    const ajaxConfig = { method: 'POST', resource: '/services' };

    /** @type {AngularElement} */
    const formService = angular.element('form#sv-ed__frm01');

    scope.ENUM_PROTOCOL = ['http', 'https', 'grpc', 'grpcs', 'tcp', 'udp', 'tls'];

    scope.serviceId = '__none__';
    scope.serviceModel = angular.copy(ServiceModel);

    scope.pbCertList = [];
    scope.caCertList = [];

    scope.routeList = [];

    scope.pluginList = [];

    switch (routeParams.serviceId) {
        case '__create__':
            viewFrame.title = 'Create new Service';
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.resource = `${ajaxConfig.resource}/${routeParams.serviceId}`;

            scope.serviceId = routeParams.serviceId;
            viewFrame.title = 'Edit Service';
            break;
    }

    scope.fetchPublicCertificates= (resource = '/certificates')=> {
        const request =ajax.get({resource});

        request.then(({data: response}) => {
            for (let current of response.data) {
                current.displayName = (utils.objectName(current.id) + ' - ' + current.tags.join(', ')).substring(0, 64);
                scope.pbCertList.push(current);
            }
        });

        request.catch(() => {
            toast.error('Could not load public certificates');
        });
    };

    scope.fetchCACertificates = (resource = '/ca_certificates') => {
        const request =ajax.get({resource});

        request.then(({data: response}) => {
            for (let current of response.data) {
                current.displayName = (utils.objectName(current.id) + ' - ' + current.tags.join(', ')).substring(0, 64);
                scope.caCertList.push(current);
            }
        });

        request.catch(() => {
            toast.error('Could not load CA certificates');
        });
    };

    scope.fetchRoutes = (resource = '/routes')=> {
        const request =ajax.get({resource});

        request.then(({data: response}) => {
            for (let current of response.data) {
                scope.routeList.push(current);
            }
        });

        request.catch(() => {
            toast.warning('Could not load associated routes');
        });
    };

    /**
     * Handle service form submit event.
     */
    formService.on('submit', (event) => {
        event.preventDefault();

        Object.keys(scope.serviceModel).forEach((key) => {
            if (typeof scope.serviceModel[key] === 'string') scope.serviceModel[key] = scope.serviceModel[key].trim();
        });

        if (scope.serviceModel.host.length === 0) {
            formService.find('input#sv-ed__txt01').focus();
            return false;
        }

        const payload = angular.copy(scope.serviceModel);
        delete payload.client_certificate;

        if (scope.serviceModel.client_certificate.length > 10) {
            payload.client_certificate = {id: scope.serviceModel.client_certificate};
        }

        payload.tls_verify = utils.typeCast(scope.serviceModel.tls_verify);
        payload.tls_verify_depth = utils.typeCast(scope.serviceModel.tls_verify_depth);

        const request = ajax.request({
            method: ajaxConfig.method,
            resource: ajaxConfig.resource,
            data: payload
        });

        request.then(({data: response}) => {
            switch (scope.serviceId) {
                case '__none__':
                    toast.success(`Created new service ${response.name}`);
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info(`Updated service ${payload.name}.`);
            }
        });

        request.catch(({data: error}) => {
            toast.error('Could not ' + ((scope.serviceId === '__none__') ? 'create new' : 'update') + ` service. ${error.message}`);
        });

        return false;
    });

    if (ajaxConfig.method === 'PATCH' && scope.serviceId !== '__none__') {
        const request = ajax.get({resource: ajaxConfig.resource});

        request.then(({ data: response }) => {
            _buildServiceModel(scope.serviceModel, response);

            viewFrame.actionButtons.push({
                target: 'service',
                url: ajaxConfig.resource,
                redirect: '#!/services',
                styles: 'btn danger delete',
                displayText: 'Delete'
            });
        });

        request.catch(() => {
            toast.error('Could not load service details');
            window.location.href = '#!/services';
        });

        scope.fetchRoutes(`/services/${scope.serviceId}/routes`);
    }

    scope.fetchPublicCertificates();
    scope.fetchCACertificates();
}

/*
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
*/