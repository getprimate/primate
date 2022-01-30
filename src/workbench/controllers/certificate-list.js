'use strict';

import _ from '../../lib/core-utils.js';
import {urlQuery, urlOffset} from '../../lib/rest-utils.js';

/**
 * Provides controller constructor for listing all certificates and SNIs.
 *
 * @constructor
 *
 * @param {Object} scope - Injected scope object.
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function CertificateListController(scope, restClient, viewFrame, toast) {
    scope.certList = [];
    scope.certNext = {offset: ''};
    scope.caList = [];
    scope.caNext = {offset: ''};
    scope.sniList = [];
    scope.sniNext = {offset: ''};

    /**
     * Retrieves certificates from the specified resource.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchCertList = (filters = null) => {
        const request = restClient.get('/certificates' + urlQuery(filters));

        request.then(({data: response}) => {
            scope.certNext.offset = urlOffset(response.next);

            for (let certificate of response.data) {
                certificate.name = _.objectName(certificate.id);
                certificate.tags =
                    certificate.tags !== null && certificate.tags.length >= 1
                        ? certificate.tags.join(', ')
                        : 'No tags added';

                scope.certList.push(certificate);
            }
        });

        request.catch(() => {
            toast.error('Could not load certificates.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves CAs from the specified resource.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchCaList = (filters = null) => {
        const request = restClient.get('/ca_certificates' + urlQuery(filters));

        request.then(({data: response}) => {
            scope.caNext.offset = urlOffset(response.next);

            for (let ca of response.data) {
                ca.name = _.objectName(ca.id);
                ca.tags = ca.tags.length >= 1 ? ca.tags.join(', ') : 'No tags added';

                scope.caList.push(ca);
            }
        });

        request.catch(() => {
            toast.error('Could not load CA list.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    /**
     * Retrieves SNI objects from the specified resource.
     *
     * @param {string|object|null} filters - Filters to the Admin API.
     * @return {boolean} True if request could be made, false otherwise.
     */
    scope.fetchSniList = (filters = null) => {
        const request = restClient.get('/snis' + urlQuery(filters));

        request.then(({data: response}) => {
            scope.sniNext.offset = urlOffset(response.next);

            for (let sni of response.data) {
                if (typeof sni.certificate !== 'object' || sni.certificate === null) {
                    sni.certificate = {id: null};
                }

                sni.certificate.name = _.objectName(sni.certificate.id);
                scope.sniList.push(sni);
            }
        });

        request.catch(() => {
            toast.error('Could not load SNIs.');
        });

        request.finally(() => {
            viewFrame.incrementLoader();
        });

        return true;
    };

    viewFrame.setTitle('Services');
    viewFrame.setLoaderSteps(3);

    viewFrame.clearBreadcrumbs();
    viewFrame.addBreadcrumb('#!/certificates', 'Certificates');

    viewFrame.addAction('New Certificate', '#!/certificates/__create__');
    viewFrame.addAction('New Trusted CA', '#!/trusted-cas/__create__');

    scope.fetchCertList();
    scope.fetchCaList();
    scope.fetchSniList();
}
