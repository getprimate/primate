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
    out: 'releases',
    'app-version': packageJson.version,
    'win32metadata' : {
        ProductName : packageJson.name,
        CompanyName: packageJson.author,
        FileDescription: packageJson.description,
        OriginalFilename: packageJson.name + '.exe',
        ProductVersion : packageJson.version,
    },
    ignore : '/.gitignore|CHANGELOG.md|README.md|gulpfile.js|screenshot.png/',
    appPath : packageJson.main,
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

gulp.task('build-windows32', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'win32',
        arch: 'ia32',
        icon: 'resources/icons/kongdash-256x256.ico'
    }), next)
});

gulp.task('build-windows64', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'win32',
        arch: 'x64',
        icon: 'resources/icons/kongdash-256x256.ico'
    }), next)
});