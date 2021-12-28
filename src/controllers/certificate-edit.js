'use strict';

import utils from '../lib/utils.js';

export default function CertificateEditController(window, scope, location, routeParams, ajax, viewFrame, toast) {
    const {angular} = window;
    const ajaxConfig = {method: 'POST', resource: '/certificates'};

    const formCert = angular.element('form#cf-ed__frm01'), formSnis = angular.element('form#cf-ed__frm02');

    scope.certId = '__none__';
    scope.certModel = {cert: '', key: '', cert_alt: '', key_alt: '', tags: '', snis: ''};

    scope.sniModel = {shorthand: ''};
    scope.sniList = [];
    scope.sniNext = '';

    viewFrame.actionButtons.splice(0);

    if (typeof routeParams.upstreamId === 'string') {
        ajaxConfig.resource = `/upstreams/${routeParams.upstreamId}/client_certificate`;
    }

    switch (routeParams.certificateId) {
        case '__create__':
            viewFrame.title = 'Add New Certificate';
            break;

        default:
            ajaxConfig.method = 'PATCH';
            ajaxConfig.resource = `${ajaxConfig.resource}/${routeParams.certificateId}`;

            scope.certId = routeParams.certificateId;

            viewFrame.title = 'Edit Certificate';
            break;
    }

    scope.fetchSniList = (url) => {
        ajax.get({resource: url})
            .then(({ data: response }) => {
                scope.sniNext = (typeof response.next === 'string') ? response.next.replace(new RegExp(viewFrame.host), '') : '';

                for (let sni of response.data) {
                    sni.tags = (sni.tags.length >= 1) ? sni.tags.join(', ') : 'No tags added.';
                    scope.sniList.push(sni);
                }
            })
            .catch(({ data: error }) => {
                toast.error(`Could not load SNIs. ${error.message}`);
            });

        return true;
    };

    formCert.on('submit', (event) => {
        event.preventDefault();

        if (scope.certModel.cert.length <= 10) {
            formCert.find('textarea#cf-ed__txa01').focus();
            return false;
        }

        if (scope.certModel.key.length <= 10) {
            formCert.find('textarea#cf-ed__txa02').focus();
            return false;
        }

        const payload = Object.assign({}, scope.certModel);

        if (scope.certModel.tags.length > 0) {
            payload.tags = utils.explode(scope.certModel.tags);
        }

        if (ajaxConfig.method === 'PATCH') {
            delete payload.snis;

        } else {
            payload.snis = utils.explode(scope.certModel.snis);
        }

        ajax.request({method: ajaxConfig.method, resource: ajaxConfig.resource, data: payload})
            .then(({ data: response }) => {
                switch (scope.certId) {
                    case '__none__':
                        toast.success('New certificate added');
                        window.location.href = '#!' + location.path().replace('/__create__', `/${response.id}`);
                        break;

                    default:
                        toast.info('Certificate details updated');
                }
            })
            .catch(({ data: response }) => {
                toast.error(response.data);
            });

        return false;
    });

    formSnis.on('submit', (event) => {
       event.preventDefault();

       const exploded = utils.explode(scope.sniModel.shorthand);

       if (exploded.length <= 0) {
           return false;
       }

       const payload = {name: exploded[0], certificate: {id: scope.certId}, tags: []};

       for (let index = 1; index < exploded.length; index++) {
           payload.tags.push(exploded[index]);
       }

       ajax.post({ resource: `/certificates/${scope.certId}/snis`, data: payload })
           .then(({data: response}) => {
               response.tags = (response.tags.length >= 1) ? response.tags.join(', ') : 'No tags added.';

               scope.sniList.push(response);
               toast.success(`Added new SNI ${response.name}`);
           })
           .catch(({ status, data: error }) => {
               toast.error((status === 409) ? 'SNI already added to this certificate' : error);
           })
           .finally(() => {
               scope.sniModel.shorthand = '';
           });

       return false;
    });

    angular.element('span#btnAddSNI').on('click', function () {
        formSnis.slideToggle(300);
    });

    if (ajaxConfig.method === 'PATCH' && scope.certId !== '__none__') {
        ajax.get({ resource: ajaxConfig.resource })
            .then(({data: response}) => {
                for (let key of Object.keys(response)) {
                    if (typeof scope.certModel[key] === 'undefined') {
                        continue;
                    }

                    scope.certModel[key] = Array.isArray(response[key]) ? response[key].join(', ') : response[key];
                }

                viewFrame.actionButtons.push({
                    target: 'Certificate',
                    url: `/certificates/${scope.certId}`,
                    redirect: '#!/certificates',
                    styles: 'btn danger delete',
                    displayText: 'Delete'
                });
            })
            .catch(() => {
                toast.error('Could not load certificate details');
                window.location.href = '#!/certificates';
            });

        scope.fetchSniList(`/certificates/${scope.certId}/snis`);
    }
}
