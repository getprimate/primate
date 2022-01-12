'use strict';

const semver = require('semver');
const {ipcRenderer} = require('electron');

const version = ipcRenderer.sendSync('get-config', 'VERSION');

/**
 * Provides controller constructor for footer view.
 *
 * @constructor
 *
 * @param {Window} window- window DOM object
 * @param {{eventLogs: Array}} scope - injected scope object
 * @param {AngularElement} element - current controller element wrapped in jQuery
 * @param {function} http - angular http provider
 * @param {LoggerFactory} logger - custom logger factory
 * @param {ViewFrameFactory} viewFrame - custom view frame factory
 * @param {ToastFactory} toast - custom toast message service
 * @constructor
 */
export default function FooterController(window, scope, element, http, logger, viewFrame, toast) {
    const {angular, document} = window;

    scope.eventLogs = logger.getCache();

    const request = http({method: 'GET', url : 'https://api.github.com/repos/ajaysreedhar/kongdash/releases/latest'});

    const footerBase = element.children('section#index__ftBase');

    footerBase.on('change', 'input#index__chk01', (event) => {
        const {target} = event;

        if (target.checked === true) {
            logger.resume();

            element.addClass('maximized');
            document.getElementById('index__ngView').classList.add('resized');

        } else {
            logger.pause();

            element.removeClass('maximized');
            document.getElementById('index__ngView').classList.remove('resized');
        }
    });

    request.then(({ data: release }) => {
        if (release.draft === false && release.prerelease === false && semver.gt(release.tag_name, version)) {
            toast.info('New version ' + release.name + ' available');

            element.find('#staticMessage').html(angular.element('<a></a>', {
                href: release.html_url
            }).html('New version ' + release.name + ' available'));
        }
    });

    request.catch(() => {});
}
