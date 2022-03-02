'use strict';

module.exports = {
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
