module.exports = function (gulp, packageJson) { 'use strict';
    const _ = require('underscore');
    const electronPackager = require('electron-packager');

    const RELEASE_SETTINGS = {
        dir: '.',
        name: packageJson.name,
        out: 'release',
        'appVersion': packageJson.version,
        'appCopyright': 'Copyright (c) 2016 ' + packageJson.author,
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
        ignore : /.idea|release|resources|tasks|.gitignore|.eslintrc.json|gulpfile.js|screenshot.png|README.md|CHANGELOG.md$/,
        appPath : packageJson.main,
        overwrite: true,
        asar: true,
        prune: true
    };

    gulp.task('pack-linux32', (next) => {
        electronPackager(_.extend(RELEASE_SETTINGS, {
            platform: 'linux',
            arch: 'ia32'
        }), next);
    });

    gulp.task('pack-linux64', (next) => {
        electronPackager(_.extend(RELEASE_SETTINGS, {
            platform: 'linux',
            arch: 'x64'
        }), next);
    });

    gulp.task('pack-windows32', (next) => {
        electronPackager(_.extend(RELEASE_SETTINGS, {
            platform: 'win32',
            arch: 'ia32',
            icon: 'resources/icons/kongdash-256x256.ico'
        }), next);
    });

    gulp.task('pack-windows64', (next) => {
        electronPackager(_.extend(RELEASE_SETTINGS, {
            platform: 'win32',
            arch: 'x64',
            icon: 'resources/icons/kongdash-256x256.ico'
        }), next);
    });

    gulp.task('pack-osx', (next) => {
        electronPackager(_.extend(RELEASE_SETTINGS, {
            appBundleId: 'io.kongdash',
            platform: 'darwin',
            arch: 'all',
            icon: 'resources/icons/kongdash-256x256.icns'
        }), next);
    });
};
