'use strict';

import _ from '../../lib/core-utils.js';

/**
 * Provides controller constructor for listing all certificates and SNIs.
 *
 * @constructor
 *
 * @param {Window} window- window DOM object
 * @param {{
 *      certList: [Object], caList: [Object], sniList: [Object],
 *      certNext: string, caNext: string, sniNext: string,
 *      fetchCertList: function, fetchCaList: function, fetchSniList: function
 *      }} scope
 * @param {K_Ajax} ajax - custom AJAX provider
 * @param {K_ViewFrame} viewFrame - custom view frame factory
 * @param {K_Toast} toast - custom toast message service
 * @param {K_Logger} logger - custom logger factory service
 */
export default function CertificateListController(window, scope, ajax, viewFrame, toast, logger) {
    scope.certList = [];
    scope.certNext = '';
    scope.caList = [];
    scope.caNext = '';
    scope.sniList = [];
    scope.sniNext = '';

    /**
     * Retrieves certificates from the specified resource.
     *
     * @param {string} resource - the resource identifier
     * @returns {boolean} - true on success
     */
    scope.fetchCertList = (resource) => {
        const request = ajax.get({resource});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            scope.certNext = typeof response.next === 'string' ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let certificate of response.data) {
                certificate.name = _.objectName(certificate.id);
                certificate.tags =
                    certificate.tags !== null && certificate.tags.length >= 1 ? certificate.tags.join(', ') : 'No tags added';

                scope.certList.push(certificate);
            }

            logger.info({source: 'http-response', httpConfig, statusCode, statusText});
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load certificates.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    /**
     * Retrieves CAs from the specified resource.
     *
     * @param {string} resource - the resource identifier
     * @returns {boolean} - true on success
     */
    scope.fetchCaList = (resource) => {
        const request = ajax.get({resource});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            scope.caNext = typeof response.next === 'string' ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let ca of response.data) {
                ca.name = _.objectName(ca.id);
                ca.tags = ca.tags.length >= 1 ? ca.tags.join(', ') : 'No tags added';

                scope.caList.push(ca);
            }

            logger.info({source: 'http-response', httpConfig, statusCode, statusText});
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load CA list.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    /**
     * Retrieves SNI objects from the specified resource.
     *
     * @param {string} resource - the resource identifier
     * @returns {boolean} - true on success
     */
    scope.fetchSniList = (resource) => {
        const request = ajax.get({resource});

        request.then(({data: response, config: httpConfig, status: statusCode, statusText}) => {
            scope.sniNext = typeof response.next === 'string' ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let sni of response.data) {
                if (typeof sni.certificate !== 'object' || sni.certificate === null) {
                    sni.certificate = {id: null};
                }

                sni.certificate.name = _.objectName(sni.certificate.id);
                scope.sniList.push(sni);
            }

            logger.info({source: 'http-response', httpConfig, statusCode, statusText});
        });

        request.catch(({data: exception, config: httpConfig, status: statusCode, statusText}) => {
            toast.error('Could not load SNIs.');
            logger.error({source: 'admin-error', statusCode, statusText, httpConfig, exception});
        });

        return true;
    };

    viewFrame.title = 'Certificate List';
    viewFrame.prevUrl = '';

    viewFrame.actionButtons.push(
        {
            displayText: 'Add Certificate',
            target: 'certificate',
            url: '/certificates',
            redirect: '#!/certificates/__create__',
            styles: 'btn success create'
        },
        {
            displayText: 'Add Trusted CA',
            target: 'CA',
            url: '/ca_certificates',
            redirect: '#!/trusted-cas/__create__',
            styles: 'btn success create'
        }
    );

    scope.fetchCertList('/certificates');
    scope.fetchCaList('/ca_certificates');
    scope.fetchSniList('/snis');
}
