'use strict';

const path = require('path');
const rimraf = require('rimraf');

const ROOT_DIR = path.dirname(__dirname);

/* eslint-disable no-console */
function cleanBuild() {
    const done = this.async();

    rimraf(path.join(ROOT_DIR, 'dist'), () => {
        console.log('Removed build and release directories.');
        done();
    });
}

module.exports = {cleanBuild};
