'use strict';

const {build, Platform} = require('electron-builder');

/* eslint-disable no-console */
function makeRelease() {
    const done = this.async();

    const config = {
        compression: 'normal',
        removePackageScripts: true,
        nodeGypRebuild: false,
        buildDependenciesFromSource: false,
        files: ['dist'],
        directories: {
            output: 'release/linux'
        },
        linux: {
            target: ['dir']
        }
    };

    const resolver = build({
        targets: Platform.LINUX.createTarget(),
        config
    });

    resolver.then((result) => {
        console.log(JSON.stringify(result, null, 4));
    });

    resolver.catch((error) => {
        console.error(JSON.stringify(error, null, 4));
    });

    resolver.finally(() => {
        done();
    });
}

module.exports = {makeRelease};
