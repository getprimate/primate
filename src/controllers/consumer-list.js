'use strict';

/**
 * Provides controller constructor for editing CA certificates.
 *
 * @constructor
 *
 * @param {{consumerList: Object[],
 *      consumerNext: string,
 *      fetchConsumerList: function}} scope - injected scope object
 * @param {AjaxProvider} ajax - custom AJAX provider
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message factory
 */
export default function ConsumerListController(scope, ajax, viewFrame, toast) {
    scope.consumerList = [];
    scope.consumerNext = '';

    /**
     * Retrieves the consumer list.
     *
     * @param {string} resource - the consumer API endpoint
     */
    scope.fetchConsumerList = (resource = '/consumers') => {
        const request = ajax.get({ resource: resource });

        request.then(({data: response}) => {
            let {next} = response;
            scope.consumerNext = (typeof next === 'string') ? next.replace(viewFrame.host, '') : '';

            for (let index = 0; index < response.data.length; index++) {
                scope.consumerList.push(response.data[index]);
            }
        });

        request.catch(() => {
            toast.error('Could not load list of consumers');
        });

        return true;
    };

    viewFrame.title = 'Consumer List';
    viewFrame.prevUrl = '';

    scope.fetchConsumerList('/consumers');

    viewFrame.actionButtons.push({
        displayText: 'New Consumer',
        target: 'consumer',
        url: '/consumers',
        redirect: '#!/consumers/__create__',
        styles: 'btn success create'
    });
}
