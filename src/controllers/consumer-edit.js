'use strict';

export default function ConsumerEditController(window, scope, location, routeParams, ajax, viewFrame, toast) {
    const {angular} = window;
    const ajaxConfig = {method: 'POST', resource: '/consumers'};

    const editForm = angular.element('form#cs-ed__frm01');
    const notebook = angular.element('#cs-ed__nbk01.well.notebook');
    const tabsList = notebook.children().first();

    scope.consumerId = '__none__';
    scope.consumerModel = {};

    if (typeof routeParams.pluginId === 'string') {
        viewFrame.prevUrl = `#!/plugins/${routeParams.pluginId}`;
    }

    switch (routeParams.consumerId) {
        case '__create__':
            viewFrame.title = 'Add New Consumer';
            viewFrame.prevUrl = '#!/consumers';

            notebook.addClass('hidden');
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.resource = `${ajaxConfig.resource}/${routeParams.consumerId}`;

            scope.consumerId = routeParams.consumerId;

            viewFrame.title = 'Edit Consumer';
            break;
    }

    scope.authMethods = {
        key_Res: `/consumers/${scope.consumerId}/key-auth`,
        key_Model: {key: '', ttl: 0},
        key_List: [],
        basic_Res: `/consumers/${scope.consumerId}/basic-auth`,
        basic_Model: {username: '', password: ''},
        basic_List: [],
        oauth_Res: `/consumers/${scope.consumerId}/oauth2`,
        oauth_Model: {name: '', redirect_uris: [], client_id: '', client_secret: ''},
        oauth_List: [],
        hmac_Res: `/consumers/${scope.consumerId}/hmac-auth`,
        hmac_Model: {username: '', secret: ''},
        hmac_List: [],
        jwt_Res: `/consumers/${scope.consumerId}/jwt`,
        jwt_Model: {key: '', secret: ''},
        jwt_List: [],
        acl_Res: `/consumers/${scope.consumerId}/acls`,
        acl_Model: {group: ''},
        acl_List: []
    };

    scope.fetchAuthList = (method) => {
        if (typeof scope.authMethods[`${method}_Res`] === 'undefined') {
            return false;
        }

        const resource = scope.authMethods[`${method}_Res`];
        const request = ajax.get({resource});

        request.then(({data: response}) => {
            scope.authMethods[`${method}_List`]  = response.data;
        });

        request.catch(() => {
            toast.error('Could not load authentication details');
        });

        return true;
    };

    editForm.on('submit', (event) => {
        const payload = angular.copy(scope.consumerModel);
        const request = ajax.request({method: ajaxConfig.method, resource: ajaxConfig.resource, data: payload});

        event.preventDefault();

        request.then(({data: response}) => {
            switch (scope.consumerId) {
                case '__none__':
                    toast.success('Added new consumer');
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info('Consumer details updated');
                    break;
            }

            return true;
        });

        request.catch(() => {
            toast.error('Unable to save consumer details.');
            return false;
        });

        return false;
    });

    tabsList.on('click', 'li', (event) => {
        const target = angular.element(event.target);
        const page = target.data('page');
        const method = target.data('auth-method');

        if (typeof page !== 'string') {
            return false;
        }

        const section = notebook.children(`section${page}`);

        tabsList.children().each((index, child)=> {
            angular.element(child).removeClass('active');
        });

        target.addClass('active');

        notebook.children('section.notebook__page').removeClass('active');
        section.addClass('active');

        if (Array.isArray(scope.authMethods[`${method}_List`])
            &&  scope.authMethods[`${method}_List`].length === 0) {
            return scope.fetchAuthList(method);
        }

        return true;
    });

    notebook.on('submit', 'form.form.form-new-auth', (event) => {
        const target = angular.element(event.target);
        const method = target.data('auth-method');

        if (typeof method !== 'string'
            || typeof scope.authMethods[`${method}_Model`] === 'undefined') {
            return false;
        }

        const resource = scope.authMethods[`${method}_Res`];
        const payload = scope.authMethods[`${method}_Model`];
        const request = ajax.post({resource, data: payload});

        event.preventDefault();

        request.then(({data: response}) => {
            scope.authMethods[`${method}_List`].push(response);

            for (let key of Object.keys(payload)) {
                switch (typeof payload[key]) {
                    case 'string':
                    case 'number':
                        payload[key] = (typeof payload[key] === 'string') ? '' : 0;
                        break;

                    case 'object':
                        payload[key] = Array.isArray(payload[key]) ? [] : {};
                        break;

                    default:
                        break;
                }
            }

            toast.success('Added authentication method.');
            return true;
        });

        request.catch(() => {
            toast.error('Unable to add authentication method.');
            return false;
        });

        return false;
    });

    if (ajaxConfig.method === 'PATCH' && scope.consumerId !== '__none__') {
        const request = ajax.get({ resource: `/consumers/${scope.consumerId}`});

        request.then(({data: response}) => {
            scope.consumerModel.username = response.username;
            scope.consumerModel.custom_id = response.custom_id;

            viewFrame.actionButtons.push({
                target: 'consumer',
                url: `/ca_certificates/${scope.consumerId}`,
                redirect: '#!/consumers',
                styles: 'btn danger delete',
                displayText: 'Delete'
            });

            return true;
        });

        request.catch(() => {
            toast.error('Could not load consumer details');
            window.location.href = '#!/consumers';

            return false;
        });

        scope.fetchAuthList('key');
    }
}
    