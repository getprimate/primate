export default class CertificateListController {
    constructor(window, scope, ajax, viewFrame, toast) {
        viewFrame.title = 'Class Certificate List';
        viewFrame.prevUrl = null;

        viewFrame.actionButtons.splice(0);
        viewFrame.actionButtons.push(
            { displayText: 'Module Certificate', target: '', url: '', redirect: '', styles: 'btn info' },
            { displayText: 'Module CA', target: '', url: '', redirect: '', styles: 'btn info' }
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
    }
};