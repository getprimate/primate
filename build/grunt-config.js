/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Provides compiler configurations for babel plugin.
 */
const babelConfig = {
    options: {
        comments: false,
        sourceMap: false,
        presets: [
            [
                '@babel/preset-env',
                {
                    modules: false,
                    exclude: [
                        '@babel/plugin-proposal-async-generator-functions',
                        '@babel/plugin-transform-block-scoping',
                        'babel-plugin-transform-async-to-generator',
                        'babel-plugin-transform-regenerator'
                    ]
                }
            ],
            [
                'minify',
                {
                    keepFnName: false,
                    builtIns: false
                }
            ]
        ],
        targets: {
            chrome: 98,
            esmodules: true
        }
    },
    platform: {
        files: [
            {
                expand: true,
                cwd: 'src/platform',
                src: ['**/*.js'],
                dest: 'dist/platform'
            }
        ]
    },
    workbench: {
        files: [
            {
                expand: true,
                cwd: 'src/workbench',
                src: ['**/*.js'],
                dest: 'dist/workbench',
                ignore: ['static/*.js']
            }
        ]
    }
};

/**
 * Provides static file configuration for babel-contrib-copy plugin.
 */
const copyConfig = {
    static: {
        files: [
            {
                expand: true,
                cwd: 'src/workbench/static',
                src: ['css/*.css', 'fonts/*.woff2', 'fonts/*.ttf', 'images/*.png', 'views/*.html', '*.js'],
                dest: 'dist/workbench/static'
            },

            {
                expand: true,
                cwd: 'src/workbench',
                src: ['*.html'],
                dest: 'dist/workbench'
            }
        ]
    }
};

module.exports = {babelConfig, copyConfig};
