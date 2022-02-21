'use strict';

const {/** @type {IPCBridge} */ ipcBridge} = window;

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
    scope.frameConfig = viewFrame.getFrameConfig();
    scope.navMenuObjects = [];

    scope.fetchAvailableEndpoints = function () {
        const menuTemplate = {
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
        const request = restClient.get('/endpoints');

        request.then(({data: response}) => {
            const {data: endpoints} = response;

            for (let endpoint of endpoints) {
                switch (endpoint) {
                    case '/services':
                        menuTemplate.services.enabled = true;
                        menuTemplate.services.listView = `#!${endpoint}`;
                        break;

                    case '/services/{services}':
                        menuTemplate.services.editView = '#!' + endpoint.replace('{services}', '__create__');
                        break;

                    case '/routes':
                        menuTemplate.routes.enabled = true;
                        menuTemplate.routes.listView = `#!${endpoint}`;
                        break;

                    case '/routes/{routes}':
                        menuTemplate.routes.editView = '#!' + endpoint.replace('{routes}', '__create__');
                        break;

                    case '/plugins':
                        menuTemplate.plugins.enabled = true;
                        menuTemplate.plugins.listView = `#!${endpoint}`;
                        break;

                    case '/plugins/{plugins}':
                        menuTemplate.plugins.editView = '#!' + endpoint.replace('{plugins}', '__create__');
                        break;

                    case '/ca_certificates':
                    case '/certificates':
                    case '/snis':
                        menuTemplate.certificates.enabled = true;
                        menuTemplate.certificates.listView = '#!/certificates';
                        break;

                    case '/consumers':
                        menuTemplate.consumers.enabled = true;
                        menuTemplate.consumers.listView = `#!${endpoint}`;
                        break;

                    case '/consumers/{consumers}':
                        menuTemplate.consumers.editView = '#!' + endpoint.replace('{consumers}', '__create__');
                        break;

                    case '/upstreams':
                        menuTemplate.upstreams.enabled = true;
                        menuTemplate.upstreams.listView = `#!${endpoint}`;
                        break;

                    case '/upstreams/{upstreams}':
                        menuTemplate.upstreams.editView = '#!' + endpoint.replace('{upstreams}', '__create__');
                        break;

                    default:
                        break;
                }
            }

            scope.navMenuObjects = Object.values(menuTemplate).filter((item) => {
                return item.enabled;
            });
        });

        request.catch(() => {
            toast.error('An error occurred while configuring the Admin API objects.');
        });
    };

    scope.redirectNav = function (event) {
        const {currentTarget: nav, target} = event;

        if (target.nodeName === 'SPAN' || target.nodeName === 'A') {
            for (let li of nav.querySelectorAll('li')) {
                li.classList.remove('active');
            }

            target.closest('li').classList.add('active');
        }
    };

    scope.emitDestroySessionEvent = function () {
        ipcBridge.sendRequest('Destroy-Workbench-Session');
        ipcBridge.removeListeners();
    };

    scope.fetchAvailableEndpoints();
}
