'use strict';

const semver = require('semver');
const {ipcRenderer} = require('electron');

const version = ipcRenderer.sendSync('get-config', 'VERSION');

export default function FooterController(window, scope, element, http, viewFrame, toast) {
    const {angular} = window;
    const request = http({method: 'GET', url : 'https://api.github.com/repos/ajaysreedhar/kongdash/releases/latest'});

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
