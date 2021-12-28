'use strict';

export default function CertificateListController (window, scope, ajax, viewFrame, toast) {
    const { angular } = window;

    viewFrame.title = 'Certificate List';
    viewFrame.prevUrl = null;

    viewFrame.actionButtons.splice(0);
    viewFrame.actionButtons.push(
        { displayText: 'Create Certificate', target: '', url: '', redirect: '', styles: 'btn info' },
        { displayText: 'Add Certificate', target: '', url: '', redirect: '', styles: 'btn info' }
    );

    scope.certList = [];
    scope.formInput = {
        primaryCert: '',
        primaryKey: '',
        alternateCert: '',
        alternateKey: '',
        tags: '',
        snis: []
    };

    scope.fetchCertList = (resource) => {
        ajax.get({ resource: resource }).then((response) => {
            const { data } = response;
            const { data: certList } = data;

            scope.nextUrl = (typeof data.next === 'string') ?
                data.next.replace(new RegExp(viewFrame.host), '') : '';

            for (let index = 0; index < certList.length; index++ ) {
                scope.certList.push(certList[index]);
            }

        }, () => {
            toast.error('Could not load certificates');
        });
    };

    const panelAdd = angular.element('div#panelAdd');
    const certForm = panelAdd.children('div.panel__body').children('form');

    panelAdd.children('div.panel__heading').on('click', () => {
        certForm.slideToggle(300);
    });

    certForm.on('submit', (event) => {
        event.preventDefault();

        const primaryCert = scope.formInput.primaryCert.trim();
        const primaryKey = scope.formInput.primaryKey.trim();

        if (primaryCert.length < 10) {
            certForm.find('textarea#ce-ls__t01').focus();
            return false;
        }

        if (primaryKey.length < 10) {
            certForm.find('textarea#ce-ls__t02').focus();
            return false;
        }

        const payload = {
            cert: primaryCert,
            key: primaryKey,
            snis: []
        };

        if (scope.formInput.snis.length > 0) {
            const sniList = scope.formInput.snis.split(',');

            for (let sni of sniList) {
                let sanitized = sni.trim();

                if (sanitized.length > 0) {
                    payload.snis.push(sni);
                }
            }
        }

        if (scope.formInput.alternateCert.length > 10) payload.cert_alt = scope.formInput.alternateCert.trim();
        if (scope.formInput.alternateKey.length > 10) payload.key_alt = scope.formInput.alternateKey.trim();

        console.log('Payload: ' + JSON.stringify(payload, null, 4));

        ajax.post({
            resource: '/certificates',
            data: payload
        }).then((response) => {
            scope.certList.push(response.data);
            toast.success('Added new certificate');

        }, (response) => {
            console.error('Error: ', JSON.stringify(response.data, null, 4));
            toast.error(response.data);
        });

        return false;
    });

    certForm.on('click', 'button#ce-ls__b01', () => {
        certForm.slideUp(300);
    });

    scope.fetchCertList('/certificates');
}