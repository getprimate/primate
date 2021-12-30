'use strict';

import utils from '../lib/utils.js';

/**
 * Provides controller constructor for editing CA certificates.
 *
 * @constructor
 *
 * @param {Window} window- window DOM object
 * @param {{
 *      caModel: {cert: string, cert_digest: string, tags: string},
 *      caId: string,
 *      tags: [string]
 *      }} scope - injected scope object
 * @param {{path: function}} location - injected location service
 * @param {{caId: string}} routeParams - injected route parameters service
 * @param {AjaxProvider} ajax - custom AJAX provider
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message service
 */
export default function TrustedCAEditController(window, scope, location, routeParams, ajax, viewFrame, toast) {
    const {angular} = window;
    const ajaxConfig = {method: 'POST', resource: '/ca_certificates'};

    const formCa = angular.element('form#ca-ed__frm01');

    scope.caId = '__none__';
    scope.caModel = {cert: '', cert_digest: '', /* TODO : tag-input-directive - Declare as an array. */ tags: ''};

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

        /* TODO : tag-input-directive - No need to explode to array. */
        payload.tags = utils.explode(scope.caModel.tags);

        if (scope.caModel.cert_digest.length <= 10) {
            delete payload.cert_digest;
        }

        ajax.request({method: ajaxConfig.method, resource: ajaxConfig.resource, data: payload})
            .then(({ data: response }) => {
                switch (scope.caId) {
                    case '__none__':
                        toast.success('New CA added');
                        window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                        break;

                    default:
                        toast.info('CA details updated');
                }
            })
            .catch(({ data: response }) => {
                toast.error(response.data);
            });

        return false;
    });

    /* Load the CA certificate details if a valid certificate id is provided. */
    if (ajaxConfig.method === 'PATCH' && scope.caId !== '__none__') {
        ajax.get({ resource: ajaxConfig.resource })
            .then(({data: response}) => {
                for (let key of Object.keys(response)) {
                    if (typeof scope.caModel[key] === 'undefined') {
                        continue;
                    }

                    if (response[key] === null) {
                        scope.caModel[key] = '';
                        continue;
                    }

                    /* TODO : tag-input-directive - No need to join array to string. */
                    scope.caModel[key] = Array.isArray(response[key]) ? response[key].join(', ') : response[key];
                }

                viewFrame.actionButtons.push({
                    target: 'CA',
                    url: `/ca_certificates/${scope.caId}`,
                    redirect: '#!/certificates',
                    styles: 'btn danger delete',
                    displayText: 'Delete'
                });
            })
            .catch(() => {
                toast.error('Could not load CA details');
                window.location.href = '#!/certificates';
            });
    }
}
