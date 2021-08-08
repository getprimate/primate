'use strict';

function _CertificateListController(window, scope, ajax, viewFactory, toast) {
    const { angular } = window;

    viewFactory.title = 'Certificate List';
    viewFactory.prevUrl = null;

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
                data.next.replace(new RegExp(viewFactory.host), '') : '';

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

        let payload = {};

        if (scope.formInput.certificate.trim().length > 10) {
            payload.cert = scope.formInput.certificate;

        } else {
            certForm.find('textarea[name="certificate"]').focus();
            return false;
        }

        if (scope.formInput.privateKey.trim().length > 10) {
            payload.key = scope.formInput.privateKey;

        } else {
            certForm.find('textarea[name="privateKey"]').focus();
            return false;
        }

        if (scope.formInput.snis.trim().length > 0) {
            payload.snis = scope.formInput.snis;
        }

        ajax.post({
            resource: '/certificates/',
            data: payload
        }).then((response) => {
            scope.certList.push(response.data);
            toast.success('Added new certificate');

        }, (response) => {
            toast.error(response.data);
        });

        return false;
    });

    certForm.on('click', 'button[name="actionCancel"]', () => {
        certForm.slideUp(300);
    });

    scope.fetchCertList('/certificates');
}

/* global app:true */
(function (controller, app) {
    if (typeof app === 'undefined') throw (`${controller}: app is undefined`);

    app.controller(controller, ['$window', '$scope', 'ajax', 'viewFactory', 'toast', _CertificateListController]);
})('CertificateListController', app);