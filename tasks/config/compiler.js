'use strict';

module.exports = {
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
