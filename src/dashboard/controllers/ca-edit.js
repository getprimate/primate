'use strict';

/**
 * Provides controller constructor for editing CA certificates.
 *
 * @constructor
 *
 * @param {Window} window- window DOM object
 * @param {{
 *      caModel: {cert: string, cert_digest: string, tags: [string]},
 *      caId: string
 *      }} scope - injected scope object
 * @param {{path: function}} location - injected location service
 * @param {{caId: string}} routeParams - injected route parameters service
 * @param {AjaxProvider} ajax - custom AJAX provider
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message service
 * @param {LoggerFactory} logger - custom logger factory service
 */
export default function TrustedCAEditController(window, scope, location, routeParams, ajax, viewFrame, toast, logger) {
    const {angular} = window;
    const ajaxConfig = {method: 'POST', resource: '/ca_certificates'};

    const formCa = angular.element('form#ca-ed__frm01');

    scope.caId = '__none__';
    scope.caModel = {cert: '', cert_digest: '', tags: []};

    viewFrame.prevUrl = '#!/certificates';

    switch (routeParams.caId) {
        case '__create__':
            viewFrame.title = 'Add New CA';
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.resource = `${ajaxConfig.resource}/${routeParams.caId}`;

            scope.caId = routeParams.caId;

            viewFrame.title = 'Edit CA';
            break;
    }

    /* Handle form#ca-ed__frm01 form submit event. */
    formCa.on('submit', (event) => {
        event.preventDefault();

        if (scope.caModel.cert.length <= 10) {
            formCa.find('textarea#cf-ed__txa01').focus();
            return false;
        }

        const payload = Object.assign({}, scope.caModel);

        if (scope.caModel.cert_digest.length <= 10) {
            delete payload.cert_digest;
        }

        const request = ajax.request({method: ajaxConfig.method, resource: ajaxConfig.resource, data: payload});

        request.then(({data: response}) => {
            switch (scope.caId) {
                case '__none__':
                    toast.success('New CA added');
                    window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                    break;

                default:
                    toast.info('CA details updated');
                    break;
            }
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Unable to save CA certificate details.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return false;
    });

    /* Load the CA certificate details if a valid certificate id is provided. */
    if (ajaxConfig.method === 'PATCH' && scope.caId !== '__none__') {
        const request = ajax.get({resource: ajaxConfig.resource});

        request.then(({data: response}) => {
            for (let key of Object.keys(response)) {
                if (typeof scope.caModel[key] === 'undefined') {
                    continue;
                }

                if (response[key] === null) {
                    scope.caModel[key] = '';
                    continue;
                }

                scope.caModel[key] = response[key];
            }

            viewFrame.actionButtons.push({
                target: 'CA',
                url: `/ca_certificates/${scope.caId}`,
                redirect: '#!/certificates',
                styles: 'btn critical delete',
                displayText: 'Delete'
            });
        });

        request.catch(() => {
            toast.error('Could not load CA details');
            window.location.href = '#!/certificates';
        });
    }
}
