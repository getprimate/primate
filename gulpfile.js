'use strict';

const gulp = require('gulp');
const packageJson = require('./package.json');

require('gulp-task-list')(gulp);

require('./tasks/start')(gulp);
require('./tasks/pack')(gulp, packageJson);
