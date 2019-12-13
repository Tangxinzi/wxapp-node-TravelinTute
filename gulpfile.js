const gulp = require('gulp');
const shell = require('gulp-shell');
const nodemon = require('gulp-nodemon');

gulp.task('default', ['watch']);

gulp.task('node', shell.task([
  'clear',
  'echo \n',
  'node index.js',
  'echo \n'
]));

gulp.task('server', function () {
  nodemon({
    script: 'server.js'
  });
});

gulp.task('watch', () => {
  gulp.watch('index.js', ['node']);
})
