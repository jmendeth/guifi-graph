var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var embed = require("./embedder");
var CleanCSS = require("clean-css");

const PLUGIN_NAME = 'gulp-embedder';

function embedder(options) {
  var embedderOptions = {compressors:{}};
  if (!options) options = {};

  if (options.compressCss) {
    var cleaner = new CleanCSS(options.compressCss);
    embedderOptions.compressors.css = cleaner.minify.bind(cleaner);
  }

  return through.obj(function(file, enc, callback) {
    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    if (file.isBuffer()) {
      var contents = file.contents.toString(options.encoding);
      var result = embed.embedHTML(file.path, contents, embedderOptions);
      file.contents = Buffer(result, options.encoding);
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return callback();
    }
  });
};