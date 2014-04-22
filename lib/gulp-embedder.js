var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var embed = require("./embedder");
var url = require("url");
var CleanCSS = require("clean-css");

const PLUGIN_NAME = 'gulp-embedder';

module.exports = function embedder(options) {
  if (!options) options = {};
  var embedderOptions = {compressors:{}, encoding: options.encoding};

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
      var fileurl = url.format({protocol: "file:", pathname: file.path});
      var contents = file.contents.toString(options.encoding);
      embed.embedHTML(fileurl, contents, embedderOptions).then(function(result) {
        file.contents = Buffer(result, options.encoding);
        this.push(file);
        return callback();
      }.bind(this)).done();
    }

    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return callback();
    }
  });
};
