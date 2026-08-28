process.env.NODE_ENV = 'normal';

var gulp = require('gulp'),
    tinypng = require('./index'),
    plumber = require('gulp-plumber'),
    cwd = __dirname,
    sigs = process.env.TINYPNG_SIGS ? true : false;

gulp.task('tinypng', function() {
    return gulp.src(cwd + '/test/assets/**/*.{png,jpg,jpeg,webp,avif}')
        .pipe(plumber())
        .pipe(tinypng({
            key: process.env.TINYPNG_KEY,
            log: true,
            sigFile: (sigs ? '.sigs' : false)
        }).on('error', function(err) {
            console.error(err.message);
        }))
        .pipe(gulp.dest(cwd + '/test/assets/tmp'));
});

process.env.NODE_ENV = 'test';
