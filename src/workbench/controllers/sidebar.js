/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Menu item options for the template.
 *
 * @typedef {Object} MenuItemOptions
 * @property {boolean} enabled - Determines if menu is enabled or not.
 * @property {string} displayText - The menu text to be displayed
 * @property {string} listView - The URL for the list view
 * @property {string} editView - The URL for the edit view
 * @property {string}  icon - The material icon name
 */

/**
 * Menu template object
 *
 * @typedef {Record<string, MenuItemOptions>} MenuItemRecord
 */

/**
 * The menu template.
 *
 * @typedef {[MenuItemOptions]} MenuTemplate
 */

const {/** @type {IPCBridge} */ ipcBridge} = window;

/**
 * Base menu item record.
 *
 * @type {MenuItemRecord}
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
 * @param {RESTClientFactory} restClient - Customised HTTP REST client factory.
 * @param {ViewFrameFactory} viewFrame - Factory for sharing UI details.
 * @param {ToastFactory} toast - Factory for displaying notifications.
 */
export default function SidebarController(scope, restClient, viewFrame, toast) {
    const {layoutName} = viewFrame.getState();

    scope.menuTemplate = [];
    scope.frameConfig = viewFrame.getFrameConfig();

    scope.emitDestroySessionEvent = function () {
        ipcBridge.sendRequest('Destroy-Workbench-Session');
        ipcBridge.removeListeners();
    };

    if (layoutName === 'dashboard' && restClient.isConfigured()) {
        const request = restClient.get('/endpoints');

        request.then(({data: response}) => {
            const {data: endpoints} = response;
            const template = buildMenuTemplate(endpoints);

            scope.menuTemplate = Object.values(template).filter((item) => {
                return item.enabled;
            });
        });

        request.catch(() => {
            toast.error('Unable to configure the sidebar menu.');
        });
    } else if (layoutName === 'bootstrap') {
        scope.menuTemplate.push(
            {enabled: false, displayText: 'Welcome', icon: 'view_quilt', listView: '#!/welcome'},
            {enabled: false, displayText: 'Connections', icon: 'cable', listView: '#!/'},
            {enabled: false, displayText: 'Release Notes', icon: 'description', listView: '#!/release-info/current'}
        );
    }
}
