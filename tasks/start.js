/* eslint-disable no-console */
module.exports = function (gulp) { 'use strict';

    const childProcess = require('child_process');
    const electron = require('electron');

    gulp.task('start', (next) => {
        let child = childProcess.spawn(electron, ['./']);

        child.stdout.on('data', (data) => {
            console.log(data.toString('utf-8'));
        });

        child.on('exit', (code) => {
            console.log('Child exited with code: ' + code);
            return next(code === 1 ? new Error('Error running run task') : null);
        });
    });
};