'use strict';

/**
 * @typedef {Object} UpstreamBaseModel
 * @property {string} name - Name
 * @property {string} hash_on - Hash on
 * @property {string} hash_on_value - Hash on value
 * @property {string} hash_fallback_value - Hash fallback value
 * @property {string} hash_fallback - Hash on
 * @property {string} host_header - Hash on
 * @property {string|Array} tags - Tags
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

/**
 *
 * @param to
 * @param from
 * @returns {{}}
 */
const _buildFromResponse =(to = {}, from = {}) => {
    for (let key of Object.keys(from)) {
        if (typeof to[key] === 'undefined') {
            continue;
        }

        let current = from[key];

        if (typeof current === 'string' || current === null) {
            to[key] =  (current === null) ? '' : `${current}`;
            continue;
        }

        if (typeof current === 'boolean' || typeof current === 'number') {
            to[key] = current;
            continue;
        }

        if (typeof current === 'object' && Array.isArray(current)) {
            to[key] = current.join(', ');

        } else if (typeof current === 'object') {
            _buildFromResponse(to[key], from[key]);
        }
    }

    return to;
};

/**
 * Controller for editing upstreams.
 *
 * @param {Object} window - the global window object
 * @param {{ENUM_ALGORITHMS: Array, ENUM_HASH_INPUTS: Array, ENUM_PROTOCOL: Array,
 *          upstreamId: string, upstreamModel: UpstreamScopeModel, fetchTargetList: function}} scope - the injected scope object
 * @param {{path: function}} location - the angular location service
 * @param {{upstreamId: string, certificateId: string}} routeParams - the route parameters
 * @param ajax
 * @param viewFrame
 * @param toast
 * @constructor
 */
export default function UpstreamEditController(window, scope, location, routeParams, ajax, viewFrame, toast) {
    const {angular} = window;

    const httpOptions = { method: 'POST', resource: '/upstreams' };
    const formUpstream = angular.element('form#us-edit__form01'), formTarget = angular.element('form#us-edit__form02');

    scope.ENUM_ALGORITHMS = ['consistent-hashing', 'least-connections', 'round-robin'];
    scope.ENUM_HASH_INPUTS = ['none', 'consumer', 'ip', 'header', 'cookie'];
    scope.ENUM_PROTOCOL = ['http', 'https', 'grpc', 'grpcs', 'tcp'];

    /**
     * @type UpstreamScopeModel
     */
    scope.upstreamModel = angular.copy(require(`${__dirname}/controllers/upstream-model.json`));
    scope.upstreamId = '__none__';

    scope.targetModel = { nextUrl: null, properties: '' };
    scope.targetList = [];
    scope.targetNext = '';

    scope.fetchTargetList = (url) => {
        ajax.get({
            resource: url
        }).then(({ data: response }) => {
            scope.targetNext = (typeof response.next === 'string') ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let target of response.data) {
                scope.targetList.push(target);
            }
        }).catch(({ data: error }) => {
            toast.error(`Could not load targets. ${error.message}`);
        });
    };

    if (typeof routeParams.certificateId === 'string') {
        httpOptions.resource = `/certificates/${routeParams.certificateId}/upstreams`;
        scope.upstreamModel.client_certificate = routeParams.certificateId;
    }

    viewFrame.actionButtons.splice(0);

    switch (routeParams.upstreamId) {
        case '__create__':
            viewFrame.title = 'Create Upstream';
            break;

        default:
            httpOptions.method = 'PATCH';
            httpOptions.resource = `${httpOptions.resource}/${routeParams.upstreamId}`;

            scope.upstreamId = routeParams.upstreamId;

            viewFrame.title = 'Edit Upstream';
            break;
    }

    if (httpOptions.method === 'PATCH' && scope.upstreamId !== '__none__') {
        ajax.get({
            resource: httpOptions.resource
        }).then((response) => {
            _buildFromResponse(scope.upstreamModel, response.data);

            if (response.data.hash_on === 'header') {
                scope.upstreamModel.hash_on_value = `${response.data.hash_on_header}`;
            }

            if (response.data.hash_fallback === 'header') {
                scope.upstreamModel.hash_fallback_value = (response.data.hash_fallback_header === null) ? '' : `${response.data.hash_fallback_header}`;
            }

            if (response.data.hash_on === 'cookie' || response.data.hash_fallback === 'cookie') {
                scope.upstreamModel.hash_fallback_value = `${response.data.hash_on_cookie}`;
            }

            if (response.data.client_certificate !== null && typeof response.data.client_certificate.id === 'string') {
                scope.upstreamModel.client_certificate = response.data.client_certificate.id;
            }

            viewFrame.actionButtons.push({
                target: 'Upstream',
                url: httpOptions.resource,
                redirect: '#!/upstreams',
                styles: 'btn danger delete',
                displayText: 'Delete'
            });
        }).catch(() => {
            toast.error('Could not load upstream details');
            window.location.href = '#!/upstreams';
        });

        scope.fetchTargetList(`/upstreams/${scope.upstreamId}/targets?limit=5`);
    }

    formUpstream.on('submit', (event) => {
        event.preventDefault();

        scope.upstreamModel.name = scope.upstreamModel.name.trim();
        scope.upstreamModel.host_header = scope.upstreamModel.host_header.trim();
        scope.upstreamModel.healthchecks.active.https_sni = scope.upstreamModel.healthchecks.active.https_sni.trim();

        if (scope.upstreamModel.name.length <= 0) {
            formUpstream.find('input#up-ed__txt01').focus();
            return false;
        }

        /**
         * @type {UpstreamPayload}
         */
        const payload = angular.copy(scope.upstreamModel);

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
        const statuses = [ ['active', 'healthy'], ['active', 'unhealthy'], ['passive', 'healthy'], ['passive', 'unhealthy'] ];

        for (let child of statuses) {
            let current = scope.upstreamModel.healthchecks[child[0]][child[1]]['http_statuses'];

            payload.healthchecks[child[0]][child[1]]['http_statuses'] = current.split(',').reduce((codes, value) => {
                let code = parseInt(value.trim());

                if ((!isNaN(code)) && code >= 200 && code <= 999) {
                    codes.push(code);
                }

                return codes;
            }, []);
        }

        if (scope.upstreamModel.client_certificate.length > 5) {
            payload.client_certificate = { id: scope.upstreamModel.client_certificate };

        } else {
            delete payload.client_certificate;
        }

        /* Split comma-separated list of tags into array and sanitise each tag. */
        payload.tags = scope.upstreamModel.tags.split(',').reduce((tags, current) => {
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

        ajax.request({
            method: httpOptions.method,
            resource: httpOptions.resource,
            data: payload
        }).then(({ data: response }) => {

            switch (scope.upstreamId) {
                case '__none__':
                    toast.success(`Created new upstream ${response.name}`);
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info(`Updated upstream ${payload.name}.`);
            }

        }).catch(({ data: error }) => {
            toast.error('Could not ' + ((scope.upstreamId === '__none__') ? 'create new' : 'update') + ` upstream. ${error.message}`);
        });

        return false;
    });

    formTarget.on('submit', (event) => {
        event.preventDefault();
        const payload = { target: '', weight: 100, tags: [] };

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

        ajax.post({
            resource: `/upstreams/${scope.upstreamId}/targets`,
            data: payload
        }).then(({ data: response }) => {

            toast.success(`Added new target ${response.target}`);
            scope.targetList.push(response);

        }).catch(({ data: error }) => {
            toast.error(error);

        }).finally(() => {
            scope.targetModel.properties = '';
        });
    });

    angular.element('span#btnAddTarget').on('click', () => {
        if (scope.upstreamId === '__none__') {
            return false;
        }

        formTarget.slideToggle(300);
        return true;
    });
}
