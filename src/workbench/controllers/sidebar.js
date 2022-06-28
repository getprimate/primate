'use strict';

import {isNone} from '../lib/core-toolkit.js';

const {/** @type {IPCBridge} */ ipcBridge} = window;

/**
 * Menu template object
 *
 * @typedef {Record<string, MenuItemOptions>} MenuItemRecord
 */
const menuItemRecord = {
    search: {
        enabled: true,
        displayText: 'Tag Search',
        icon: {text: 'search', styles: 'warning'},
        listView: '#!/tag-search'
    },
    services: {
        enabled: false,
        displayText: 'Services',
        listView: '',
        editView: '',
        icon: 'settings_input_component'
    },
    routes: {enabled: false, displayText: 'Routes', icon: 'directions', listView: '', editView: ''},
    plugins: {enabled: false, displayText: 'Plugins', icon: 'extension', listView: '', editView: ''},
    certificates: {
        enabled: false,
        displayText: 'Certificates',
        icon: 'local_police',
        listView: '',
        editView: ''
    },
    upstreams: {enabled: false, displayText: 'Upstreams', icon: 'backup', listView: '', editView: ''},
    consumers: {enabled: false, displayText: 'Consumers', icon: 'person_pin', listView: '', editView: ''}
};

/**
 * Builds the menu template from the list of
 * available endpoints  retrieved from the Admin API.
 *
 * @param {[string]} endpoints - An array of available endpoints
 * @returns {MenuItemRecord} The menu template object
 */
function buildMenuTemplate(endpoints = []) {
    for (let endpoint of endpoints) {
        switch (endpoint) {
            case '/services':
                menuItemRecord.services.enabled = true;
                menuItemRecord.services.listView = `#!${endpoint}`;
                break;

            case '/services/{services}':
                menuItemRecord.services.editView = '#!' + endpoint.replace('{services}', '__create__');
                break;

            case '/routes':
                menuItemRecord.routes.enabled = true;
                menuItemRecord.routes.listView = `#!${endpoint}`;
                break;

            case '/routes/{routes}':
                menuItemRecord.routes.editView = '#!' + endpoint.replace('{routes}', '__create__');
                break;

            case '/plugins':
                menuItemRecord.plugins.enabled = true;
                menuItemRecord.plugins.listView = `#!${endpoint}`;
                break;

            case '/plugins/{plugins}':
                menuItemRecord.plugins.editView = '#!' + endpoint.replace('{plugins}', '__create__');
                break;

            case '/ca_certificates':
            case '/certificates':
            case '/snis':
                menuItemRecord.certificates.enabled = true;
                menuItemRecord.certificates.listView = '#!/certificates';
                break;

            case '/consumers':
                menuItemRecord.consumers.enabled = true;
                menuItemRecord.consumers.listView = `#!${endpoint}`;
                break;

            case '/consumers/{consumers}':
                menuItemRecord.consumers.editView = '#!' + endpoint.replace('{consumers}', '__create__');
                break;

            case '/upstreams':
                menuItemRecord.upstreams.enabled = true;
                menuItemRecord.upstreams.listView = `#!${endpoint}`;
                break;

            case '/upstreams/{upstreams}':
                menuItemRecord.upstreams.editView = '#!' + endpoint.replace('{upstreams}', '__create__');
                break;

            default:
                break;
        }
    }

    return menuItemRecord;
}

/**
 * Provides controller constructor for sidebar activities.
 *
 * @constructor
 * @param {Object} scope - Injected scope object.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 */
export default function SidebarController(scope, restClient, viewFrame, toast) {
    scope.menuTemplate = [];
    scope.frameConfig = viewFrame.getFrameConfig();

    scope.emitDestroySessionEvent = function () {
        ipcBridge.sendRequest('Destroy-Workbench-Session');
        ipcBridge.removeListeners();
    };

    if (restClient.isConfigured() && !isNone(viewFrame.getConfig('sessionId'))) {
        const request = restClient.get('/endpoints');

        request.then(({data: response}) => {
            const {data: endpoints} = response;
            const template = buildMenuTemplate(endpoints);

            scope.menuTemplate = Object.values(template).filter((item) => {
                return item.enabled;
            });
        });

        request.catch(() => {
            toast.error('An error occurred while configuring the Admin API objects.');
        });
    } else {
        scope.menuTemplate.push(
            {enabled: false, displayText: 'Welcome', icon: 'view_quilt', listView: '#!/welcome'},
            {enabled: false, displayText: 'Connections', icon: 'cable', listView: '#!/'},
            {enabled: false, displayText: 'Release Notes', icon: 'description', listView: '#!/release-info/current'}
        );
    }
}
