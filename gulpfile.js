var buildDir = '_site'
var config = {
    paths: {
        build: buildDir + '/**',
        img: ['./img/**/*'],
        haml: {
            src: ['**/_haml/*.haml']
        },
        html: {
            src: ['**/*.html'],
            build: [buildDir + '/**/*.html'],
            dest: './'
        },
        sass: {
            main: '_scss/main.scss',
            src: '_scss/*.scss',
            dest: 'css/'
        },
        css: {
            main: 'styles.css',
            src: 'css/*.css',
            dest: buildDir + '/css/'
        },
        js: {
            main: 'scripts.js',
            src: ['./js/*.js'],
            dest: '_site/js/'
        }
    }
}
config.paths.watch = [
    '_config.yml',
    config.paths.html.src,
    config.paths.sass.src,
    config.paths.js.src
]

var browserSync = require('browser-sync')
var combiner = require('stream-combiner2')
var cp = require('child_process')
var gulp = require('gulp')
var haml = require('gulp-ruby-haml')
var task = require('gulp-task')
var rename = require('gulp-rename')
var runSequence = require('run-sequence')
var sass = require('gulp-sass')
var watch = require('gulp-watch')
var prefix = require('gulp-autoprefixer')
var concat = require('gulp-concat')

var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
}

gulp.task('jekyll', function (done) {
    browserSync.notify(messages.jekyllBuild)
    return cp.spawn('jekyll', ['build'], {stdio: 'inherit'}).on('close', done)
})

gulp.task('reload', function () {
    browserSync.reload()
})

gulp.task('browser-sync', function () {
    browserSync({
        server: {
            baseDir: '_site'
        },
        browser: 'safari'
    })
})

/* hamlBuild() contains the shared logic used by haml-watch and haml-build */
function hamlBuild() {
    return combiner(
        haml(),
        rename(function (path) {
            path.dirname += '/../'
        })
    )
}

/* Watch and compile only changed HAML files to HTML.
 * haml-watch has its own task to avoid doing a full HAML build on each .haml file change, since a full HAML build
 * can be quite slow.
 */
gulp.task('haml-watch', function () {
    gulp.src(config.paths.haml.src, {read: false})
        .pipe(watch(config.paths.haml.src))
        .pipe(hamlBuild())
        .pipe(gulp.dest('./'))
})

/* Compile all HAML files to HTML. */
gulp.task('haml-build', function () {
    return gulp.src(config.paths.haml.src)
        .pipe(hamlBuild())
        .pipe(gulp.dest('./'))
})

/* Compile all SASS to CSS */
gulp.task('sass', function () {
    return gulp.src(config.paths.sass.main)
        .pipe(sass({
            includePaths: [config.paths.sass.src],
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {cascade: true}))
        .pipe(gulp.dest(config.paths.sass.dest))
})

gulp.task('css', function (done) {
    return gulp.src(config.paths.css.src)
        .pipe(concat(config.paths.css.main))
        .pipe(gulp.dest(config.paths.css.dest))
})

gulp.task('js', function (done) {
    return gulp.src(config.paths.js.src)
        .pipe(concat(config.paths.js.main))
        .pipe(gulp.dest(config.paths.js.dest))
})

gulp.task('build', function (done) {
    runSequence('haml-build', 'jekyll', 'sass', ['css', 'js'], 'reload', done)
})

gulp.task('fast-build', function (done) {
    runSequence('jekyll', 'sass', ['css', 'js'], 'reload', done)
})

gulp.task('watch', ['haml-watch'], function () {
    gulp.watch(config.paths.watch, ['fast-build'])
})

gulp.task('default', function (done) {
    runSequence('build', 'watch', 'browser-sync', done)
})