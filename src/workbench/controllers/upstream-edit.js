/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */
'use strict';

import * as _ from '../lib/core-toolkit.js';
import * as rsUtils from '../helpers/rest-toolkit.js';
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

            continue;
        }

        if (field === 'client_certificate') {
            model.client_certificate = _.get(source.client_certificate, 'id', '__none__');
            continue;
        }

        if (_.isObject(current)) {
            refreshUpstreamModel(model[field], source[field]);
        }
    }

    const hashFields = ['hash_fallback', 'hash_on'];

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
 * Prepares upstream object after sanitising values in a specified upstream model.
 *
 * Technically, this function does the inverse of {@link refreshUpstreamModel} function.
 * The function validates upstream model before preparing the payload.
 * Throws an error if the validation fails.
 *
 * @see https://docs.konghq.com/gateway/2.7.x/admin-api/#upstream-object
 *
 * @param {UpstreamModel} model - The source upstream model.
 * @return {Object} The prepared upstream object.
 */
function buildUpstreamObject(model) {
    if (model.name.length === 0) {
        throw new Error('Please provide a name for this upstream.');
    }

    const payload = _.deepClone(model);

    const hashFields = ['hash_fallback', 'hash_on'];

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
    scope.certList = [];

    /**
     * Retrieves target objects mapped under this upstream.
     *
     * @param {string|object|null} filters - Filters to the Admin API endpoint.
     * @return boolean - True if request could be made, false otherwise
     */
    scope.fetchTargetList = (filters = null) => {
        const request = restClient.get(`/upstreams/${scope.upstreamId}/targets` + rsUtils.urlQuery(filters));

        viewFrame.setLoaderSteps(1);

        request.then(({data: response}) => {
            scope.targetNext.offset = rsUtils.urlOffset(response.next);

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

    /**
     * Submits changes made to the upstream model.
     *
     * The upstream object payload is prepared and POST or PATCH
     * requests are triggered create or edit mode respectively.
     *
     * @param {SubmitEvent} event - The form submit event.
     * @return {boolean} True if the request could be made, false otherwise
     */
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
            const redirectURL = rsUtils.editViewURL(location.path(), response.id);
            const displayText = _.isText(response.name) ? response.name : rsUtils.simplifyObjectId(response.id);

            if (_.isNone(scope.upstreamId)) {
                scope.upstreamId = response.id;

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
     * Displays confirmation dialog before clearing the form.
     *
     * @param {Event} event - The button click event.
     * @return boolean - True if reset confirmed, false otherwise.
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
        const request = restClient.get('/certificates' + rsUtils.urlQuery(filters));

        request.then(({data: response}) => {
            for (let current of response.data) {
                scope.certList.push({
                    nodeValue: current.id,
                    displayText: rsUtils.simplifyObjectId(current.id) + ' - ' + _.implode(current.tags, 64)
                });
            }
        });

        request.catch(() => {
            toast.warning('Unable to fetch certificates.');
        });

        return true;
    };

    /**
     * Updates input placeholders upon switching hash input select boxes.
     *
     * @param {string} inputId - The target input box id.
     * @return {boolean} Always true.
     */
    scope.updateInputHint = function (inputId) {
        const textInput = document.getElementById(inputId);
        const hashField = inputId === 'up-ed__txt04' ? scope.upstreamModel.hash_on : scope.upstreamModel.hash_fallback;

        switch (hashField) {
            case 'header':
                textInput.placeholder = 'X-Some-Header-Name';
                return true;

            case 'cookie':
                textInput.placeholder = 'some_cookie_name, /cookie-path';

                if (inputId === 'up-ed__txt04') {
                    scope.upstreamModel.hash_fallback = 'none';

                    document.getElementById(
                        'up-ed__txt05'
                    ).placeholder = `Not required when set to '${scope.upstreamModel.hash_fallback}'`;
                }

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
    scope.deleteTableRow = rsUtils.deleteMethodInitiator(restClient, (err) => {
        if (_.isText(err)) toast.error(err);
        else toast.success('Target deleted successfully.');
    });

    if (_.isText(routeParams.certId)) {
        scope.certId = routeParams.certId;
        scope.upstreamModel.client_certificate = routeParams.certId;

        restConfig.endpoint = `/certificates/${routeParams.certId}/upstreams`;
    } else {
        viewFrame.clearBreadcrumbs();
    }

    viewFrame.addBreadcrumb('/upstreams', 'Upstreams');

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

    /* Fetch the upstream details if the view is in edit mode. */
    if (restConfig.method === 'PATCH' && !_.isNone(scope.upstreamId)) {
        const request = restClient.get(restConfig.endpoint);

        request.then(({data: response}) => {
            refreshUpstreamModel(scope.upstreamModel, response);

            for (let hashField of ['up-ed__txt04', 'up-ed__txt05']) {
                scope.updateInputHint(hashField);
            }

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

        scope.fetchTargetList();
    }

    if (_.isNone(scope.certId)) {
        scope.fetchCertificates();
    }

    scope.$on('$destroy', () => {
        scope.certList.length = 0;
        scope.targetList.length = 0;

        delete scope.upstreamModel;
        delete scope.deleteTableRow;
    });
}
