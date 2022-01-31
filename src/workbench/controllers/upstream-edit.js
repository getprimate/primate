/** TODO : Reactor the whole file. */

/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */
'use strict';

/**
 * @typedef {Object} UpstreamBaseModel
 * @property {string} name - Name
 * @property {string} hash_on - Hash on
 * @property {string} hash_on_value - Hash on value
 * @property {string} hash_fallback_value - Hash fallback value
 * @property {string} hash_fallback - Hash on
 * @property {string} host_header - Hash on
 * @property {string[]} tags - Tags
 * @property {{active: { healthy: Object, unhealthy: Object }, passive: { healthy: Object, unhealthy: Object }}} healthchecks - Health check options
 */

/**
 * @typedef {UpstreamBaseModel} UpstreamScopeModel
 * @property {string} client_certificate - The certificate to be used as client certificate while TLS handshaking to the upstream server
 */

/**
 * @typedef {UpstreamBaseModel} UpstreamPayload
 * @property {string} hash_on_header - Hash on
 * @property {string} hash_fallback_header - Hash on
 * @property {string} hash_on_cookie - Hash on
 * @property {string} hash_on_cookie_path - Hash on
 * @property {{id: string}} client_certificate - The certificate to be used as client certificate while TLS handshaking to the upstream server
 */

import _ from '../../lib/core-utils.js';
import {urlQuery, urlOffset} from '../../lib/rest-utils.js';

import upstreamModel from '../models/upstream-model.js';

/**
 *
 * @param to
 * @param from
 * @returns {{}}
 */
const _buildFromResponse = (to = {}, from = {}) => {
    for (let key of Object.keys(from)) {
        if (typeof to[key] === 'undefined' || from[key] === null) {
            continue;
        }

        let current = from[key];

        if (typeof current === 'string' || typeof current === 'boolean' || typeof current === 'number') {
            to[key] = current;
            continue;
        }

        if (Array.isArray(current)) {
            to[key] = current.map((value) => {
                return `${value}`;
            });
        }

        if (_.isObject(current)) _buildFromResponse(to[key], from[key]);
    }

    return to;
};

/**
 * Provides controller constructor for editing upstream and target objects.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {Object} location - Injected Angular location service.
 * @param {function} location.path - Tells the current view path.
 * @param {{
 *     upstreamId: string,
 *     certId: string
 * }} routeParams - Object containing route parameters.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function UpstreamEditController(scope, location, routeParams, restClient, viewFrame, toast) {
    const restConfig = {method: 'POST', endpoint: '/upstreams'};
    let loaderSteps = 0;

    scope.ENUM_ALGORITHMS = ['consistent-hashing', 'least-connections', 'round-robin'];
    scope.ENUM_HASH_INPUTS = ['none', 'consumer', 'ip', 'header', 'cookie'];
    scope.ENUM_PROTOCOL = ['http', 'https', 'grpc', 'grpcs', 'tcp'];

    /**
     * @type UpstreamScopeModel
     */
    scope.upstreamModel = _.deepClone(upstreamModel);
    scope.upstreamId = '__none__';

    scope.targetModel = {properties: ''};
    scope.targetList = [];
    scope.targetNext = {offset: ''};

    scope.certId = '__none__';
    scope.certList = [{id: '', displayName: '- None -'}];
    scope.certNext = {offset: ''};

    scope.fetchTargetList = (endpoint) => {
        const request = restClient.get(endpoint);

        request.then(({data: response}) => {
            scope.targetNext.offset = urlOffset(response.next);

            for (let target of response.data) {
                scope.targetList.push(target);
            }
        });

        request.catch(() => {
            toast.error('Could not load targets.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    scope.submitUpstreamForm = function (event) {
        scope.upstreamModel.name = scope.upstreamModel.name.trim();
        scope.upstreamModel.host_header = scope.upstreamModel.host_header.trim();
        scope.upstreamModel.healthchecks.active.https_sni = scope.upstreamModel.healthchecks.active.https_sni.trim();

        event.preventDefault();

        if (scope.upstreamModel.name.length <= 0) {
            toast.error('Please provide a name for this upstream.');
            return false;
        }

        /**
         * @type {UpstreamPayload}
         */
        const payload = _.deepClone(scope.upstreamModel);

        switch (scope.upstreamModel.hash_on) {
            case 'header':
                payload.hash_on_header = scope.upstreamModel.hash_on_value;
                break;

            case 'cookie':
                payload.hash_on_cookie = scope.upstreamModel.hash_on_value;
                payload.hash_on_cookie_path = '/';
                break;

            default:
                break;
        }

        switch (scope.upstreamModel.hash_fallback) {
            case 'header':
                payload.hash_fallback_header = scope.upstreamModel.hash_fallback_value;
                break;

            case 'cookie':
                payload.hash_on_cookie = scope.upstreamModel.hash_fallback_value;
                payload.hash_on_cookie_path = '/';
                break;

            default:
                break;
        }

        /* Sanitise health check http statuses */
        const statuses = [
            ['active', 'healthy'],
            ['active', 'unhealthy'],
            ['passive', 'healthy'],
            ['passive', 'unhealthy']
        ];

        for (let child of statuses) {
            let current = scope.upstreamModel.healthchecks[child[0]][child[1]]['http_statuses'];

            payload.healthchecks[child[0]][child[1]]['http_statuses'] = current.reduce((codes, value) => {
                let code = parseInt(value.trim());

                if (!isNaN(code) && code >= 200 && code <= 999) {
                    codes.push(code);
                }

                return codes;
            }, []);

            /* If status codes are empty, remove them from payload for defaults to be applied. */
            if (payload.healthchecks[child[0]][child[1]]['http_statuses'].length === 0) {
                delete payload.healthchecks[child[0]][child[1]]['http_statuses'];
            }
        }

        if (scope.upstreamModel.client_certificate.length > 5) {
            payload.client_certificate = {id: scope.upstreamModel.client_certificate};
        } else {
            delete payload.client_certificate;
        }

        /* Split comma-separated list of tags into array and sanitise each tag. */
        payload.tags = scope.upstreamModel.tags.reduce((tags, current) => {
            current = current.trim();

            if (current.length >= 1) {
                tags.push(`${current}`);
            }

            return tags;
        }, []);

        /* Delete optional fields if their values are empty. */
        if (scope.upstreamModel.healthchecks.active.https_sni.length === 0) {
            delete payload.healthchecks.active.https_sni;
        }

        if (scope.upstreamModel.host_header.length === 0) {
            delete payload.host_header;
        }

        /* Delete the fields that are present in upstreamModel
         * but not required to be sent in the request payload. */
        delete payload.hash_on_value;
        delete payload.hash_fallback_value;

        const request = restClient.request({
            method: restConfig.method,
            resource: restConfig.endpoint,
            payload
        });

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            switch (scope.upstreamId) {
                case '__none__':
                    toast.success(`Created new upstream ${response.name}`);
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info(`Updated upstream ${payload.name}.`);
            }
        });

        request.catch(({data: error}) => {
            toast.error(
                'Could not ' +
                    (scope.upstreamId === '__none__' ? 'create new' : 'update') +
                    ` upstream. ${error.message}`
            );
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return false;
    };

    scope.submitTargetForm = function (event) {
        event.preventDefault();
        const payload = {target: '', weight: 100, tags: []};

        if (scope.targetModel.properties.trim().length <= 0) {
            return false;
        }

        const properties = scope.targetModel.properties.split(',');
        payload.target = properties[0];

        for (let index = 1; index < properties.length; index++) {
            let current = properties[index].trim();

            if (index === 1) {
                let weight = parseInt(current);
                payload.weight = isNaN(weight) ? 100 : weight;
                continue;
            }

            payload.tags.push(current);
        }

        const request = restClient.post(`/upstreams/${scope.upstreamId}/targets`, payload);

        request.then(({data: response}) => {
            toast.success(`Added new target ${response.target}`);
            scope.targetList.push(response);
        });

        request.catch(({data: error}) => {
            toast.error(error);
        });

        request.finally(() => {
            scope.targetModel.properties = '';
            viewFrame.incrementLoader();
        });
    };

    /**
     * Retrieves certificates for applying on upstream.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchCertificates = (filters = null) => {
        const request = restClient.get('/certificates' + urlQuery(filters));

        request.then(({data: response}) => {
            scope.certNext.offset = urlOffset(response.next);

            for (let cert of response.data) {
                cert.displayName = (_.objectName(cert.id) + ' - ' + cert.tags.join(', ')).substring(0, 64);
                scope.certList.push(cert);
            }
        });

        request.catch(() => {
            toast.warning('Could not load certificates');
        });

        return true;
    };

    if (typeof routeParams.certId === 'string') {
        restConfig.endpoint = `/certificates/${routeParams.certId}/upstreams`;
        scope.certId = routeParams.certId;
        scope.upstreamModel.client_certificate = routeParams.certId;
    } else {
        scope.fetchCertificates();
        viewFrame.clearBreadcrumbs();
    }

    viewFrame.addBreadcrumb('#!/upstreams', 'Upstreams');

    switch (routeParams.upstreamId) {
        case '__create__':
            viewFrame.setTitle('Create Upstream');
            viewFrame.addBreadcrumb(location.path(), 'Create +');
            break;

        default:
            restConfig.method = 'PATCH';
            restConfig.endpoint = `${restConfig.endpoint}/${routeParams.upstreamId}`;

            scope.upstreamId = routeParams.upstreamId;
            viewFrame.setTitle('Edit Upstream');
            loaderSteps++;
            break;
    }

    viewFrame.setLoaderSteps(loaderSteps);

    if (restConfig.method === 'PATCH' && scope.upstreamId !== '__none__') {
        const request = restClient.get(restConfig.endpoint);

        request.then(({data: response}) => {
            _buildFromResponse(scope.upstreamModel, response);

            if (response.hash_on === 'header') {
                scope.upstreamModel.hash_on_value = `${response.hash_on_header}`;
            }

            if (response.hash_fallback === 'header') {
                scope.upstreamModel.hash_fallback_value =
                    response.hash_fallback_header === null ? '' : `${response.hash_fallback_header}`;
            }

            if (response.hash_on === 'cookie' || response.hash_fallback === 'cookie') {
                scope.upstreamModel.hash_fallback_value = `${response.hash_on_cookie}`;
            }

            if (response.client_certificate !== null && typeof response.client_certificate.id === 'string') {
                scope.upstreamModel.client_certificate = response.client_certificate.id;
            }

            viewFrame.addAction('Delete', '#!/upstreams', 'critical delete', 'upstream', restConfig.endpoint);
            viewFrame.addBreadcrumb(location.path(), response.name);
        });

        request.catch(() => {
            toast.error('Could not load upstream details');
            window.location.href = '#!/upstreams';
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        scope.fetchTargetList(`/upstreams/${scope.upstreamId}/targets?limit=5`);
    }
}