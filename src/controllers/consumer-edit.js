'use strict';

export default function ConsumerEditController(window, scope, routeParams, ajax, viewFrame, toast) {
    const {angular} = window;
    
    viewFrame.title = 'Edit Consumer';

    scope.consumerId = routeParams.consumerId;
    scope.formInput = {};
    scope.authMethods = {};

    scope.fetchAuthList = (authName, dataModel) => {
        const request = ajax.get({resource: `/consumers/${scope.consumerId}/${authName}`});

        request.then((response) => {
            scope.authMethods[dataModel]  = response.data.data;
        });

        request.catch(() => {
            toast.error('Could not load authentication details');
        });

        return true;
    };

    let consumerEditForm = angular.element('form#consumerEditForm'),
        authNotebook = angular.element('#authNotebook.notebook'),
        authName = 'key-auth',
        dataModel = 'keyAuthList';

    consumerEditForm.on('submit', function (event) {
        event.preventDefault();

        ajax.patch({
            resource: '/consumers/' + scope.consumerId + '/',
            data: scope.formInput
        }).then(function () {
            toast.success('Consumer updated');

        }, function (response) {
            toast.error(response.data);
        });

        return false;
    });

    const notebook = angular.element('#cs-ed__nbk01.well.notebook');
    const tabsList = notebook.children().first();

    tabsList.on('click', 'li', (event) => {
        const {target} = event;
        const {page} = target.dataset;

        if (typeof page !== 'string') {
            return false;
        }

        angular.forEach(tabsList.children(), (child) => {
            child.classList.remove('active');
        });

        target.classList.add('active');

        angular.forEach(notebook.children(), (child) => {
            const {id} = child;

            if (child.nodeName === 'SECTION') {
                child.classList.remove('active');
            }

            if (typeof id === 'string'
                && page === `#${id}`
                && !child.classList.contains('active')) {
                child.classList.add('active');
            }
        });
    });

    authNotebook.on('click', '.col.tab', function (event) {
        let tab = angular.element(event.target);
        let targetView = authNotebook.find(tab.data('target-view'));

        authNotebook.children('.row').children('.tab').removeClass('active');
        tab.addClass('active');

        authNotebook.find('.auth-view:visible').hide({ duration:300, direction: 'left' });
        targetView.show({ duration:300, direction:'right' });

        dataModel = targetView.data('list-model');
        authName  = targetView.data('auth-name');

        if (typeof scope.authMethods[dataModel] === 'undefined' || scope.authMethods[dataModel].length <= 0) {
            scope.fetchAuthList(authName, dataModel);
        }
    }).on('submit', 'form.form-new-auth', function (event) {
        event.preventDefault();

        let form = angular.element(event.target), payload = {};

        form.find('input.param').each(function (index, element) {
            payload[element.name] = element.value;
        });

        ajax.post({
            resource: '/consumers/' + scope.consumerId + '/' + authName,
            data: payload
        }).then(function (response) {
            scope.authMethods[dataModel].push(response.data);
            toast.success('Authentication saved');

        }, function (response) {
            toast.error(response.data);
        });

        return false;
    });

    if (scope.consumerId !== '__none__') {
        const request = ajax.get({ resource: `/consumers/${scope.consumerId}`});

        request.then(({data: response}) => {
            scope.formInput.username = response.username;
            scope.formInput.custom_id = response.custom_id;

            viewFrame.deleteAction = { target: 'consumer', url: '/consumers/' + scope.consumerId, redirect: '#!/consumers' };
        });

        request.catch(() => {
            toast.error('Could not load consumer details');
            window.location.href = '#!/consumers';
        });
    }

    scope.fetchAuthList('key-auth', 'keyAuthList');
}
    