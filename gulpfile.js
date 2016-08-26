'use strict';

const gulp = require('gulp');
const electron = require('electron-prebuilt');
const electronPackager = require('electron-packager');
var childProcess = require('child_process');

const packageJson = require('./package.json');

const _ = require('underscore');

const RELEASE_SETTINGS = {
    dir: '.',
    name: packageJson.name,
    out: 'dist',
    'app-version': '0.1.0',
    'version-string' : {
        ProductVersion : '0.1.0',
        ProductName : 'KongDash'
    },
    ignore : '/node_modules/(' + _.keys(packageJson.devDependencies).join('|') + ')',
    appPath : 'src/main.js',
    overwrite: true,
    asar: true,
    prune: true
};

require('gulp-task-list')(gulp);

gulp.task('start', (next) => {
    var child = childProcess.spawn(electron, ['./']);

    child.stdout.on('data', (data) => {
        console.log(data);
    });

    child.on('exit', (code) => {
        console.log('Child exited with code: ' + code);
        return next(code === 1 ? new Error('Error running run task') : null);
    });
});

gulp.task('build-linux', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'linux',
        arch: 'all'
    }), next)
});

gulp.task('build-linux32', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'linux',
        arch: 'ia32'
    }), next)
});

gulp.task('build-linux64', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'linux',
        arch: 'x64'
    }), next)
});

gulp.task('build-win', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'win32',
        arch: 'all'
    }), next)
});