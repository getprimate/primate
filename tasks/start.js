module.exports = function (gulp) { 'use strict';

    var childProcess = require('child_process');
    var electron = require('electron-prebuilt');

    gulp.task('start', (next) => {
        var child = childProcess.spawn(electron, ['./']);

        child.stdout.on('data', (data) => {
            console.log(data.toString('utf-8'));
        });

        child.on('exit', (code) => {
            console.log('Child exited with code: ' + code);
            return next(code === 1 ? new Error('Error running run task') : null);
        });
    });
};