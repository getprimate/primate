'use strict';

import utils from '../lib/utils.js';

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
 * @param {AjaxProvider} ajax - custom AJAX provider
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message service
 */
export default function CertificateListController(window, scope, ajax, viewFrame, toast) {
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

        request.then(({data: response}) => {
            scope.certNext = (typeof response.next === 'string') ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let certificate of response.data) {
                certificate.name = utils.objectName(certificate.id);
                certificate.tags = (certificate.tags !== null && certificate.tags.length >= 1) ? certificate.tags.join(', ') : 'No tags added';

                scope.certList.push(certificate);
            }
        });

        request.catch(() => {
            toast.error('Could not load certificates');
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

        request.then(({data: response}) => {
            scope.caNext = (typeof response.next === 'string') ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let ca of response.data) {
                ca.name = utils.objectName(ca.id);
                ca.tags = (ca.tags.length >= 1) ? ca.tags.join(', ') : 'No tags added';

                scope.caList.push(ca);
            }
        });

        request.catch(() => {
            toast.error('Could not load CA list.');
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

        request.then(({data: response}) => {
            scope.sniNext = (typeof response.next === 'string') ? response.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let sni of response.data) {
                if (typeof sni.certificate !== 'object' || sni.certificate === null) {
                    sni.certificate = {id: null};
                }

                sni.certificate.name = utils.objectName(sni.certificate.id);
                scope.sniList.push(sni);
            }
        });

        request.catch(({data: error}) => {
            toast.error(`Could not load SNIs. ${error.message}`);
        });

        return true;
    };

    viewFrame.title = 'Certificate List';
    viewFrame.prevUrl = '';

    viewFrame.actionButtons.push(
        {displayText: 'Add Certificate', target: 'certificate', url: '/certificates', redirect: '#!/certificates/__create__', styles: 'btn success create'},
        {displayText: 'Add Trusted CA', target: 'CA', url: '/ca_certificates', redirect: '#!/trusted-cas/__create__', styles: 'btn success create'}
    );

    scope.fetchCertList('/certificates');
    scope.fetchCaList('/ca_certificates');
    scope.fetchSniList('/snis');
}
