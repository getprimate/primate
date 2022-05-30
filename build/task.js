/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const path = require('path');
const grunt = require('grunt');
const rimraf = require('rimraf');

/* eslint-disable no-console */
function cleanBuild() {
    const done = this.async();

    rimraf(path.join(ROOT_DIR, '{dist,release}'), {disableGlob: false}, (error) => {
        if (error) {
            grunt.log.errorln(`rimraf: ${error}`);
            return false;
        }

        grunt.log.oklns('Removed dist and release directories.');
        done();

        return true;
    });
}

module.exports = {
    cleanBuild
};
