'use strict';

import _ from '../lib/utils.js';
import RouteModel from '../models/route-model.js';

const protocols = {
    _exclusive_: ['methods', 'hosts', 'headers', 'paths', 'sources', 'destinations'],
    http: ['methods', 'hosts', 'headers', 'paths'],
    https: ['methods', 'hosts', 'headers', 'paths', 'snis'],
    tcp: ['sources', 'destinations'],
    tls: ['sources', 'destinations', 'snis'],
    tls_passthrough: ['snis'],
    grpc: ['hosts', 'headers', 'paths'],
    grpcs: ['hosts', 'headers', 'paths', 'snis']
};

const _splitIPSources = (sources = []) => sources.reduce((collection, current) => {
    let [ip, port = '-1'] = current.split(':');
    let item = {ip: ip.trim(), port: parseInt(port)};

    if (isNaN(item.port) || port <= -1 || port >= 65536) {
        delete item.port;
    }

    if (item.ip.length >= 1) {
        collection.push(item);
    }

    return collection;
}, []);

const _mergeIPSources = ((sources = []) => sources.map((current) => {
    let {ip, port} = current;

    port = (port === null) ? '' : `${port}`;
    return `${ip}:${port}`;
}));

const _buildRoutePayload = (model) => {
    if (model.protocols.length === 0) {
        throw 'Please check at least one protocol from the list.';
    }

    const payload = Object.assign({}, model);

    for (let key of Object.keys(model)) {
        if (typeof model[key] === 'string') {
            model[key] = model[key].trim();
        }

        switch (key) {
            case 'sources':
            case 'destinations':
                delete payload[key];
                payload[key] = _splitIPSources(model[key]);
                break;

            case 'https_redirect_status_code':
                payload[key] = parseInt(model[key]);
                break;

            case 'service':
                delete payload[key];
                if (model[key].length >= 5) payload[key] = {id: model[key]};
                break;

            default:
                break;
        }
    }

    for (let current of model.protocols) {
        let isValidated = false;

        for (let field of protocols[current]) {
            if (Array.isArray(model[field]) && model[field].length >= 1) {
                isValidated = true;
                break;
            }
        }

        if (isValidated === false) {
            throw 'At least one of <strong>' + protocols[current].join(', ') + '</strong> is required if ' + current.toUpperCase() + ' is selected.';
        }

        /* Remove the mutually exclusive fields depending on the protocols to avoid a validation error.
         *
         * For example: The payload should not contain "hosts", "paths", "methods" and "headers" fields
         * if either of TCP, UDP, TLS or TLS Pass-through are selected.
         *
         * Similarly, the payload should not contain "sources" and "destinations" fields
         * if HTTP, HTTPS, GRPC or GRPCS are selected. */
        switch (current) {
            case 'grpc':
            case 'grpcs':
                delete payload.strip_path;
                break;
        }

        const excluded = protocols._exclusive_.filter(item => !(protocols[current].includes(item)));

        for (let field of excluded) {
            if (typeof payload[field] === 'undefined') continue;
            delete payload[field];
        }
    }

    return payload;
};

const _buildRouteModel = (input, model) => {
    for (let key of Object.keys(input)) {
        if (typeof model[key] === 'undefined' || input[key] === null) {
            continue;
        }

        switch (key) {
            case 'sources':
            case 'destinations':
                model[key] = _mergeIPSources(input[key]);
                break;

            case 'service':
                model[key] = _.get(input[key], 'id', '');
                break;

            case 'https_redirect_status_code':
                model[key] = `${input[key]}`;
                break;

            default:
                model[key] = input[key];
                break;
        }
    }

    console.log('Model ', JSON.stringify(model, null, 4));

    return model;
};

export default function RouteEditController(window, scope, location, routeParams, ajax, viewFrame, toast) {
    const {angular} = window;
    const ajaxConfig = { method: 'POST', resource: '/routes' };

    /** @type {AngularElement} */
    const routeForm = angular.element('form#rt-ed__frm01');

    scope.ENUM_PROTOCOL = ['http', 'https', 'grpc', 'grpcs', 'tcp', 'tls', 'tls_passthrough'];
    scope.ENUM_METHOD = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTION'];
    scope.ENUM_REDIRECT_CODE = [426, 301, 302, 307, 308];

    scope.routeId = '__none__';
    scope.routeModel = angular.copy(RouteModel);

    scope.serviceId = '__none__';

    viewFrame.prevUrl = '#!/routes';

    if (typeof routeParams.serviceId === 'string') {
        ajaxConfig.resource = `/services/${routeParams.serviceId}/routes`;

        scope.serviceId = routeParams.serviceId;
        scope.routeModel.service = {id: routeParams.serviceId};

        viewFrame.prevUrl = `#!/services/${routeParams.serviceId}`;
    }

    switch (routeParams.routeId) {
        case '__create__':
            viewFrame.title = 'Create new Route';
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.resource = `${ajaxConfig.resource}/${routeParams.routeId}`;

            scope.routeId = routeParams.routeId;
            viewFrame.title = 'Edit Route';
            break;
    }

    routeForm.on('submit', (event) => {
        event.preventDefault();

        try {
            const payload = _buildRoutePayload(scope.routeModel);
            const request = ajax.request({method: ajaxConfig.method, resource: ajaxConfig.resource, data: payload});

            request.then(({data: response}) => {
                switch (scope.routeId) {
                    case '__none__':
                        toast.success('New route added.');
                        window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                        break;

                    default:
                        toast.info('Route details updated.');
                }
            });

            request.catch(() => {
                toast.error('Could not create new route.');
            });

        } catch (error) {
            toast.error(`${error}`);
        }

        return false;
    });

    if (ajaxConfig.method === 'PATCH' && scope.routeId !== '__none__') {
        const request = ajax.get({resource: ajaxConfig.resource});

        request.then(({data: response}) => {

            _buildRouteModel(response, scope.routeModel);

            viewFrame.actionButtons.push({
                target: 'route',
                url: ajaxConfig.resource,
                redirect: viewFrame.prevUrl,
                styles: 'btn danger delete',
                displayText: 'Delete'
            });

            return true;
        });

        request.catch(() => {
            toast.error('Could not load route details.');
            window.location.href = viewFrame.prevUrl;

            return false;
        });
    }
}
