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
	'version-string': {
		ProductName : packageJson.name,
        CompanyName: packageJson.author,
        FileDescription: packageJson.name,
        OriginalFilename: packageJson.name + '.exe',
        ProductVersion : packageJson.version,
		'file-version': packageJson.version,
		'product-version': packageJson.version,
		LegalCopyright: 'Copyright (c) 2016 ' + packageJson.author
	},
    win32metadata : {
        ProductName : packageJson.name,
        CompanyName: packageJson.author,
        FileDescription: packageJson.name,
        OriginalFilename: packageJson.name + '.exe',
        ProductVersion : packageJson.version,
		'file-version': packageJson.version,
		'product-version': packageJson.version,
		LegalCopyright: 'Copyright (c) 2016 ' + packageJson.author
    },
    ignore : '/.gitignore|releases|dist|CHANGELOG.md|README.md|gulpfile.js|screenshot.png/',
    appPath : packageJson.main,
    overwrite: true,
    asar: true,
    prune: true
};

require('gulp-task-list')(gulp);

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


gulp.task('pack-linux32', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'linux',
        arch: 'ia32'
    }), next)
});

gulp.task('pack-linux64', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'linux',
        arch: 'x64'
    }), next)
});

gulp.task('pack-windows32', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'win32',
        arch: 'ia32',
		icon: 'resources/icons/kongdash-256x256.ico'
    }), next)
});

gulp.task('pack-windows64', (next) => {
    electronPackager(_.extend(RELEASE_SETTINGS, {
        platform: 'win32',
        arch: 'x64',
		icon: 'resources/icons/kongdash-256x256.ico'
    }), next)
});
