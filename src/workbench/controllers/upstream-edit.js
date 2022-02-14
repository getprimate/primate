/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */
'use strict';

import * as _ from '../../lib/core-toolkit.js';
import {epochToDate} from '../helpers/date-lib.js';
import {urlQuery, urlOffset, simplifyObjectId, editViewURL, deleteMethodInitiator} from '../helpers/rest-toolkit.js';

import upstreamModel from '../models/upstream-model.js';

/**
 * Populates upstream model after sanitising values in the service object.
 *
 * Health check attributes are populated recursively.
 *
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#upstream-object
 *
 * @param {Object} model - An upstream model object or a sub object.
 * @param {Object} source - The source object.
 * @return {UpstreamModel} The updated upstream model.
 */
function refreshUpstreamModel(model, source = {}) {
    const fieldList = Object.keys(source);

    for (let field of fieldList) {
        if (_.isNil(model[field]) || _.isNil(source[field])) {
            continue;
        }

        let current = source[field];

        if (_.isText(current) || typeof current === 'boolean' || typeof current === 'number') {
            model[field] = current;
            continue;
        }

        if (Array.isArray(current)) {
            model[field] = current.map((value) => {
                return `${value}`;
            });
        }

        if (field === 'client_certificate') {
            model.client_certificate = _.get(source.client_certificate, 'id', '');
        }

        if (_.isObject(current)) {
            refreshUpstreamModel(model[field], source[field]);
        }
    }

    const hashFields = ['hash_on', 'hash_fallback'];

    for (let field of hashFields) {
        if (source[field] === 'header') {
            model[`${field}_value`] = source[`${field}_value`];
            continue;
        }

        if (source[field] === 'cookie') {
            model[`${field}_value`] = `${source.hash_on_cookie}, ${source.hash_on_cookie_path}`;
        }
    }

    return model;
}

/**
 *
 * @param {UpstreamModel} model
 * @return {Object}
 */
function buildUpstreamObject(model) {
    if (model.name.length === 0) {
        throw new Error('Please provide a name for this upstream.');
    }

    const payload = _.deepClone(model);

    const hashFields = ['hash_on', 'hash_fallback'];

    for (let field of hashFields) {
        if (model[field] === 'header') {
            payload[`${field}_header`] = model[`${field}_value`];
            continue;
        }

        if (model[field] === 'cookie') {
            let cookiePair = model[`${field}_value`].split(',', 2);

            payload.hash_on_cookie = _.trim(_.first(cookiePair));
            payload.hash_on_cookie_path = cookiePair.length >= 2 ? _.trim(_.last(cookiePair)) : '/';
        }
    }

    /* Sanitise health check http statuses */
    const statuses = [
        ['active', 'healthy'],
        ['active', 'unhealthy'],
        ['passive', 'healthy'],
        ['passive', 'unhealthy']
    ];

    for (let child of statuses) {
        let type = _.first(child);
        let state = _.last(child);

        let current = model.healthchecks[type][state]['http_statuses'];

        payload.healthchecks[type][state]['http_statuses'] = current.reduce((codes, value) => {
            let code = parseInt(value.trim());

            if (!isNaN(code) && code >= 200 && code <= 999) {
                codes.push(code);
            }

            return codes;
        }, []);

        /* If status codes are empty, remove them from payload for defaults to be applied. */
        if (payload.healthchecks[type][state]['http_statuses'].length === 0) {
            delete payload.healthchecks[type][state]['http_statuses'];
        }
    }

    payload.client_certificate = null;

    if (model.client_certificate.length >= 12) {
        payload.client_certificate = {id: model.client_certificate};
    }

    /* Split comma-separated list of tags into array and sanitise each tag. */
    payload.tags = model.tags.reduce((tags, current) => {
        current = current.trim();

        if (current.length >= 1) {
            tags.push(`${current}`);
        }

        return tags;
    }, []);

    /* Set optional fields to null if their values are empty. */
    if (model.healthchecks.active.https_sni.length === 0) {
        payload.healthchecks.active.https_sni = null;
    }

    if (model.host_header.length === 0) {
        payload.host_header = null;
    }

    /* Remove the fields that are present in upstreamModel
     * but not required to be sent in the request payload. */
    delete payload.hash_on_value;
    delete payload.hash_fallback_value;

    return payload;
}

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
    const eventLocks = {submitUpstreamForm: false, submitTargetForm: false};

    let loaderSteps = 0;

    scope.ENUM_ALGORITHMS = ['consistent-hashing', 'least-connections', 'round-robin'];
    scope.ENUM_HASH_INPUTS = ['none', 'consumer', 'ip', 'header', 'cookie'];
    scope.ENUM_PROTOCOL = ['http', 'https', 'grpc', 'grpcs', 'tcp'];

    scope.upstreamModel = _.deepClone(upstreamModel);
    scope.upstreamId = '__none__';

    scope.targetModel = {properties: ''};
    scope.targetList = [];
    scope.targetNext = {offset: ''};

    scope.certId = '__none__';
    scope.certList = [{id: '', displayName: '- None -'}];
    scope.certNext = {offset: ''};

    scope.metadata = {createdAt: ''};

    scope.fetchTargetList = (endpoint) => {
        const request = restClient.get(endpoint);

        request.then(({data: response}) => {
            scope.targetNext.offset = urlOffset(response.next);

            for (let target of response.data) {
                scope.targetList.push(target);
            }
        });

        request.catch(() => {
            toast.warning('Unable to fetch upstream targets.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });
    };

    scope.submitUpstreamForm = function (event) {
        event.preventDefault();

        if (eventLocks.submitUpstreamForm === true) {
            return false;
        }

        const fieldList = Object.keys(scope.upstreamModel);

        for (let field of fieldList) {
            if (_.isText(scope.upstreamModel[field])) {
                scope.upstreamModel[field] = scope.upstreamModel[field].trim();
            }
        }

        let payload = null;

        try {
            payload = buildUpstreamObject(scope.upstreamModel);

            eventLocks.submitUpstreamForm = true;
            viewFrame.setLoaderSteps(1);
        } catch (error) {
            toast.error(error.message);
            return false;
        }

        const request = restClient.request({method: restConfig.method, resource: restConfig.endpoint, payload});

        request.then(({data: response}) => {
            const redirectURL = editViewURL(location.path(), response.id);
            const displayText = _.isText(response.name) ? response.name : simplifyObjectId(response.id);

            if (_.isNone(scope.upstreamId)) {
                const createdAt = epochToDate(response.created_at, viewFrame.getFrameConfig('dateFormat'));

                scope.upstreamId = response.id;
                scope.metadata.createdAt = `Created on ${createdAt}`;

                restConfig.method = 'PATCH';
                restConfig.endpoint = `${restConfig.endpoint}/${scope.upstreamId}`;
            }

            viewFrame.popBreadcrumb();
            viewFrame.addBreadcrumb(redirectURL, displayText);

            toast.success('Upstream details saved successfully.');
        });

        request.catch(() => {
            toast.error('Unable to save upstream details.');
        });

        request.finally(() => {
            eventLocks.submitUpstreamForm = false;
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Creates new targets under the current upstream.
     *
     * @param {SubmitEvent} event - Current form submit event
     * @return {boolean} True if the request could be made, false otherwise.
     */
    scope.submitTargetForm = function (event) {
        event.preventDefault();

        if (eventLocks.submitTargetForm === true) {
            return false;
        }

        const payload = {target: '', weight: 100, tags: []};

        if (scope.targetModel.properties.trim().length === 0) {
            return false;
        }

        eventLocks.submitTargetForm = true;
        viewFrame.setLoaderSteps(1);

        const properties = _.explode(scope.targetModel.properties);
        payload.target = _.first(properties);

        for (let index = 1; index < properties.length; index++) {
            let current = properties[index];

            if (index === 1) {
                let weight = parseInt(current);
                payload.weight = isNaN(weight) ? 100 : weight;
                continue;
            }

            payload.tags.push(current);
        }

        const request = restClient.post(`/upstreams/${scope.upstreamId}/targets`, payload);

        request.then(({data: response}) => {
            toast.success(`New target ${response.target} saved successfully.`);
            scope.targetList.push(response);
        });

        request.catch(() => {
            toast.error('Unable to save target.');
        });

        request.finally(() => {
            eventLocks.submitTargetForm = false;
            scope.targetModel.properties = '';

            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Handles form reset event.
     *
     * Displays confirmation dialog before clearing the form.
     *
     * @param {Event} event - The current event object
     * @return boolean - True if reset confirmed, false otherwise
     */
    scope.resetServiceForm = function (event) {
        event.preventDefault();

        if (eventLocks.submitUpstreamForm === true) {
            return false;
        }

        const proceed = confirm('Proceed to clear the form?');

        if (proceed) {
            scope.upstreamModel = _.deepClone(upstreamModel);
        }

        return proceed;
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
                cert.displayName = (simplifyObjectId(cert.id) + ' - ' + cert.tags.join(', ')).substring(0, 64);
                scope.certList.push(cert);
            }
        });

        request.catch(() => {
            toast.warning('Unable to fetch certificates.');
        });

        return true;
    };

    scope.updateInputHint = function (inputId) {
        const textInput = document.getElementById(inputId);
        const hashField = inputId === 'up-ed__txt04' ? scope.upstreamModel.hash_on : scope.upstreamModel.hash_fallback;

        switch (hashField) {
            case 'header':
                textInput.placeholder = 'X-Some-Header-Name';
                return true;

            case 'cookie':
                textInput.placeholder = 'some_cookie_name, /cookie-path';
                return true;
        }

        textInput.placeholder = `Not required when set to '${hashField}'`;
        return true;
    };

    /**
     * Deletes the table row entry upon clicking the bin icon.
     *
     * @type {function(Event): boolean}
     */
    scope.deleteTableRow = deleteMethodInitiator(restClient, (err) => {
        if (_.isText(err)) toast.error(err);
        else toast.success('Target deleted successfully.');
    });

    if (_.isText(routeParams.certId)) {
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

    if (restConfig.method === 'PATCH' && !_.isNone(scope.upstreamId)) {
        const request = restClient.get(restConfig.endpoint);

        request.then(({data: response}) => {
            const createdAt = epochToDate(response.created_at, viewFrame.getFrameConfig('dateFormat'));

            refreshUpstreamModel(scope.upstreamModel, response);

            for (let hashField of ['up-ed__txt04', 'up-ed__txt05']) {
                scope.updateInputHint(hashField);
            }

            scope.metadata.createdAt = `Created on ${createdAt}`;

            viewFrame.addAction('Delete', '#!/upstreams', 'critical delete', 'upstream', restConfig.endpoint);
            viewFrame.addBreadcrumb(location.path(), response.name);
        });

        request.catch(() => {
            toast.error('Unable to fetch upstream details.');
            window.location.href = '#!/upstreams';
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        scope.fetchTargetList(`/upstreams/${scope.upstreamId}/targets`);
    }

    scope.$on('$destroy', () => {
        scope.certList.length = 0;
        scope.targetList.length = 0;

        delete scope.upstreamModel;
    });
}
