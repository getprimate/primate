'use strict';

/**
 * Provides controller constructor for listing services.
 *
 * @constructor
 *
 * @param {Window} window- window DOM object
 * @param {{
 *      serviceList: Object[],
 *      serviceNext: string,
 *      fetchServiceList: function
 *      }} scope - injected scope object
 * @param {AjaxProvider} ajax - custom AJAX provider
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message service
 */
export default function ServiceListController(window, scope, ajax, viewFrame, toast) {
    const {angular} = window;

    /** @type {AngularElement} */
    const table = angular.element('table#sv-ls__tab01');

    scope.serviceList = [];
    scope.serviceNext = '';

    scope.fetchServiceList = (resource) => {
        const request = ajax.get({resource});

        request.then(({data: response}) => {
            scope.serviceNext = (typeof response.next === 'string') ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let index = 0; index < response.data.length; index++) {
                scope.serviceList.push(response.data[index]);
            }
        });

        request.catch(() => {
            toast.error('Could not load list of services');
        });

        return true;
    };

    viewFrame.title = 'Service List';
    viewFrame.prevUrl = '';

    viewFrame.actionButtons.push({displayText: 'New Service', target: 'service', url: '/services', redirect: '#!/services/__create__', styles: 'btn success create'});

    table.on('click', 'i.state-highlight', (event) => {

        /** @type {AngularElement} */
        const icon = angular.element(event.target);
        const payload = {};
        const attribute = icon.data('attribute');

        payload[attribute] = !(icon.hasClass('success'));

        const request = ajax.patch({
            resource: '/services/' + icon.data('service-id'),
            data: payload
        });

        request.then(() => {
            if (payload[attribute] === true) icon.removeClass('default').addClass('success');
            else icon.removeClass('success').addClass('default');

            toast.success('Attribute ' + attribute + ' set to ' + payload[attribute]);
        });

        request.catch(() => {
            toast.error('Unable to update ' + attribute);
        });
    });

    scope.fetchServiceList('/services');
}
