'use strict';

const gulp  = require('gulp'),
    less  = require('gulp-less'),
    concat  = require('gulp-concat'),
    uglify  = require('gulp-uglify'),
    rename  = require('gulp-rename'),
    handlebars = require('gulp-handlebars'),
    declare = require('gulp-declare'),
    cleanCSS = require('gulp-clean-css');

const paths = {
  styles: {
    src: 'src/less/*.less',
    dest: 'assets/css'
  },
  scripts: {
    src: 'src/js/*.js',
    dest: 'assets/js'
  },
  html: {
    src: 'views/*.hbs',
    dest: 'assets/'
  }
};

const packageJson = require('./package.json');

require('gulp-task-list')(gulp);

require('./tasks/start')(gulp);
require('./tasks/pack')(gulp, packageJson);

function styles() {
  return gulp
  	.src(paths.styles.src, {
      sourcemaps: true
    })
	.pipe(less())
	.pipe(rename({
	  basename: 'main',
	  suffix: '.min'
	}))
.pipe(cleanCSS({debug: true}))
.pipe(concat('main.min.css'))
.pipe(gulp.dest(paths.styles.dest));
}

function scripts() {
  return gulp
	.src(paths.scripts.src, {
		sourcemaps: true
	})
	.pipe(uglify())
	.pipe(concat('main.min.js'))
	.pipe(gulp.dest(paths.scripts.dest));
}

function templates(){
  gulp.src('views/*.hbs')
    .pipe(handlebars())
    //.pipe(wrap('Handlebars.template(<%= contents %>)'))
    .pipe(declare({
      namespace: 'MyApp.templates',
      noRedeclare: true, // Avoid duplicate declarations
    }))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('assets/js/'));
}

function watch() {
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.styles.src, styles);
}

const build = gulp.parallel(styles, scripts, templates, watch);

gulp.task(build);
gulp.task('default', build);

