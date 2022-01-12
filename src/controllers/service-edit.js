'use strict';

import utils from '../lib/utils.js';
import ServiceModel from '../models/service-model.js';

const ENUM_PROTOCOL = {
    'http': {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth']},
    'grpc': {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth', 'path']},
    'tcp': {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth', 'path']},
    'udp': {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth', 'path']},
    'tls': {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth', 'path']},
    'tls_passthrough': {excluded: ['ca_certificates', 'tls_verify', 'tls_verify_depth']}
};

const _buildServiceModel = (model, source = {}) => {
    const keys = Object.keys(source);

    for (let key of keys) {
        if ((typeof model[key] === 'undefined')
            || (Array.isArray(model[key]) && source[key] === null)) {
            continue;
        }

        switch (key) {
            case 'tls_verify':
            case 'tls_verify_depth':
                model[key] = String(source[key]);
                break;

            case 'client_certificate':
                model[key] = (source[key] !== null && typeof source[key]['id'] === 'string') ? source[key]['id'] : '';
                break;

            case 'ca_certificates':
            case 'tags':
                model[key] = Array.isArray(source[key]) ? source[key] : [];
                break;

            default:
                model[key] = source[key];
                break;
        }
    }

    return model;
};

/**
 * Provides controller constructor for editing CA certificates.
 *
 * @constructor
 *
 * @param {Window} window- window DOM object
 * @param {{
 *      ENUM_PROTOCOL: [string],
 *      serviceId: string,
 *      serviceModel: App_ServiceModel,
 *      pbCertList: [Object], caCertList: [Object], routeList: [Object], pluginList: [Object],
 *      fetchPublicCertificates: function, fetchCACertificates: function, fetchRoutes: function,
 *      submitServiceForm: function, resetServiceForm: function,
 *      }} scope - injected scope object
 * @param {{path: function}} location - injected location service
 * @param {{serviceId: string}} routeParams - injected route parameters service
 * @param {AjaxProvider} ajax - custom AJAX provider
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message service
 * @param {LoggerFactory} logger - custom logger factory service
 */
export default function ServiceEditController(window, scope, location, routeParams, ajax, viewFrame, toast, logger) {
    const {angular} = window;
    const ajaxConfig = { method: 'POST', resource: '/services' };

    scope.ENUM_PROTOCOL = Object.keys(ENUM_PROTOCOL);

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

    /**
     * Retrieves the public client certificates.
     *
     * @param {string} resource - The resource endpoint
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchPublicCertificates= (resource = '/certificates')=> {
        const request =ajax.get({resource});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            for (let current of response.data) {
                scope.pbCertList.push({
                    nodeValue: current.id,
                    displayText: (utils.objectName(current.id) + ' - ' + current.tags.join(', ')).substring(0, 64)
                });
            }

            logger.info({ source: 'http-response', httpConfig, statusCode, statusText });
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load public certificates.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    /**
     * Retrieves the CA certificates.
     *
     * @param {string} resource - The resource endpoint
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchCACertificates = (resource = '/ca_certificates') => {
        const request = ajax.get({resource});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            const certificates = [];

            for (let current of response.data) {
                certificates.push({
                    nodeValue: current.id,
                    displayText: (utils.objectName(current.id) + ' - ' + current.tags.join(', ')).substring(0, 64)
                });

                scope.caCertList = certificates;
            }

            logger.info({ source: 'http-response', httpConfig, statusCode, statusText });
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load CA certificates.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    /**
     * Retrieves the routes added under this service.
     *
     * @param {string} resource - The resource endpoint
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchRoutes = (resource = '/routes')=> {
        const request =ajax.get({resource});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            for (let current of response.data) {
                scope.routeList.push(current);
            }

            logger.info({ source: 'http-response', httpConfig, statusCode, statusText });
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load routes under the service.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    scope.submitServiceForm = (event) => {
        if (typeof event ==='undefined') {
            return false;
        }

        /** @type {AngularElement} */
        const formService = angular.element(event.target);

        event.preventDefault();

        Object.keys(scope.serviceModel).forEach((key) => {
            if (typeof scope.serviceModel[key] === 'string') scope.serviceModel[key] = scope.serviceModel[key].trim();
        });

        if (scope.serviceModel.host.length === 0) {
            formService.find('input#sv-ed__txt01').focus();
            return false;
        }

        const payload = angular.copy(scope.serviceModel);
        const {excluded} = ENUM_PROTOCOL[payload.protocol];

        delete payload.client_certificate;

        if (scope.serviceModel.client_certificate.length > 10) {
            payload.client_certificate = {id: scope.serviceModel.client_certificate};
        }

        if (Array.isArray(excluded)) {
            for (let field of excluded) {
                delete payload[field];
            }
        }

        const request = ajax.request({
            method: ajaxConfig.method,
            resource: ajaxConfig.resource,
            data: payload
        });

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            logger.info({ source: 'http-response', httpConfig, statusCode, statusText });

            switch (scope.serviceId) {
                case '__none__':
                    toast.success(`Created new service ${response.name}`);
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info(`Updated service ${payload.name}.`);
            }
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not ' + ((scope.serviceId === '__none__') ? 'create new' : 'update') + ' service.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return false;
    };

    /**
     * Handles form reset event.
     *
     * Displays confirmation dialog before clearing the form.
     *
     * @param {Object} event - The current event object
     * @return boolean - True if reset confirmed, false otherwise
     */
    scope.resetServiceForm = (event) => {
        if (confirm('This will clear the values from the form. Proceed?')) {

            scope.serviceModel = angular.copy(ServiceModel);
            return true;
        }

        event.preventDefault();
        return false;
    };

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