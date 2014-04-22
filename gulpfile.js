// Generates a portable HTML interactive graph representing
// the network's nodes and their links, based on the CNML.

var gulp = require("gulp")
  , sass = require("gulp-sass")
  , autoprefixer = require("gulp-autoprefixer")
  , uglify = require("gulp-uglify")
  , clean = require("gulp-clean")
  , minify = require("gulp-minify-html")
  , embedder = require("./lib/gulp-embedder")

  , cnml = require("./lib/cnml");

var env = process.env["NODE_ENV"] || "production";


gulp.task("clean", function() {
  return gulp.src("build", {read: false})
    .pipe(clean());
});

gulp.task("styles", function() {
  var sassOptions = {};
  if (env === "development")
    sassOptions.sourceComments = "map";

  return gulp.src("styles.scss")
    .pipe(sass(sassOptions))
    .pipe(autoprefixer("last 1 version", "> 1%", "ie 8"))
    .pipe(gulp.dest("build"));
});

gulp.task("scripts", function() {
  var file = gulp.src("main.js");
  
  if (env === "production")
    file = file.pipe(uglify());
  
  return file.pipe(gulp.dest("build"));
});

gulp.task("content", function() {
  //FIXME: only on change
  return cnml("guifi.cnml");
})

gulp.task("render", ["styles", "scripts", "content"],  function() {
  if (env === "development") {
    console.log("Not embedding since we're in development.");
    return;
  }

  var date = new Date(require("./build/header").header.date * 60000);
  return gulp.src("view.html")
    .pipe(embedder({
      compressCss: {keepSpecialComments: 0}
    }))
    .pipe(minify())
    .pipe(gulp.dest("build/guifi."+date.toISOString()+".html"));
});

gulp.task("default", ["render"], function() {});
