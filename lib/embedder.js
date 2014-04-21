var Q = require("q")
  , url = require("url")
  , cheerio = require("cheerio")
  , css = require("css")
  , util = require("./util");

// Get a Base64 data URI for a resource
function getDataURI(file, type) {
  return Q.fcall(function() {
    return util.get(file);
  }).spread(function (res, data) {
    // FIXME: don't assume same type
    return "data:"+type+";base64,"+data.toString("base64");
  });
}

// Embed a CSS snippet (shouldn't be used directly)
function embedCSS(file, str, options) {
  return Q.fcall(function() {
    var imports = [];
    var ast = css.parse(str);
    var promises = [];

    ast.stylesheet.rules = ast.stylesheet.rules.filter(function(rule) {
      if (rule.type === 'import') {
        // Deal with an @import rule
        var dest = rule.import.match(/url\((.+)\)/)[1];
        var destfile = url.resolve(file, dest);
        
        var imp = {};
        imports.push(imp);
        promises.push(
          Q.fcall(function() {
            return util.get(destfile);
          }).spread(function(res, data) {
            return embedCSS(destfile, data, options);
          }).then(function(str) {
            imp.css = str;
          })
        );
        return false;
      } else if (rule.type === 'rule') {
        // Deal with a regular rule, inline appropiate values
        rule.declarations.forEach(function(declaration) {
          //FIXME: do things right.
          promises.push(
            Q.fcall(function() {
              var urls = [];
              declaration.value.replace(/(^|\w)url\((.+)\)(\w|$)/g, function(match) {
                var dest = arguments[2];
                var destfile = url.resolve(file, dest);
                urls.push(getDataURI(destfile, "image"));
                return match;
              });
              return Q.all(urls);
            }).then(function(urls) {
              var i = 0;
              declaration.value = declaration.value.replace(/(^|\w)url\((.+)\)(\w|$)/g, function(match) {
                return urls[i++];
              });
            })
          );
        });
      } else console.error("CSS: Unsupported rule type:", rule.type);
      
      return true;
    });

    // Wait for all promises to complete
    return Q.all(promises).then(function() {
      imports = imports.map(function(imp) {
        return imp.css;
      }).join("");
      return imports + css.stringify(ast);
    });
  });
}

// Embed a whole CSS stylesheet
function embedCSSStylesheet(file, str, options) {
  return Q.fcall(function() {
    return embedCSS(file, str, options);
  }).then(function(str) {
    if (options.compressors.css)
      str = options.compressors.css(str);
    return str;
  });
}

// Embed an inline CSS value (i.e. `style` attribute)
function embedCSSInline(file, str, options) {
  return Q.fcall(function() {
    return embedCSS(file, "a {"+str+"}", options);
  }).then(function(str) {
    return str.substring(3, str.length-4);
  }).then(function(str) {
    if (options.compressors.css)
      str = options.compressors.css(str);
    return str;
  });
}

// Embed a JS snippet
function embedJS(file, str, options) {
  return Q.fcall(function() {
    return str; //currently nothing to do
  }).then(function(str) {
    if (options.compressors.js)
      str = options.compressors.js(str);
    return str;
  });
}

// Embed an HTML snippet
function embedHTML(file, str, options) {
  return Q.fcall(function() {
    var $ = cheerio.load();
    var promises = [];

    $("script[src]").each(function() {
      var script = $(this);
      var dest = script.attr("src");
      var destfile = url.resolve(file, dest);
      promises.push(
        Q.fcall(function() {
          return util.get(destfile);
        }).spread(function(res, data) {
          return embedJS(destfile, data, options);
        }).then(function(str) {
          script.attr("src", null);
          script.attr("type", "text/javascript");
          script.html(str); //FIXME: protection
        })
      );
    });

    $("style").each(function() {
      var style = $(this);
      promises.push(
        Q.fcall(function() {
          return embedCSSStylesheet(file, style.html(), options);
        }).then(function(str) {
          style.html(str); //FIXME: protection
        })
      );
    });

    $("img").each(function() {
      var img = $(this);
      var dest = script.attr("src");
      var destfile = url.resolve(file, dest);
      promises.push(
        Q.fcall(function() {
          return getDataURI(destfile, util.mimetype(destfile, "image"));
        }).then(function(str) {
          script.attr("src", str);
        })
      );
    });

    $("[style]").each(function() {
      var elem = $(this);
      var str = elem.attr("style");
      promises.push(
        Q.fcall(function() {
          return embedCSSInline(file, str, options);
        }).then(function(str) {
          elem.attr("style", str);
        })
      );
    });

    $("link[rel='stylesheet']").each(function() {
      var link = $(this);
      var dest = script.attr("href");
      var destfile = url.resolve(file, dest);
      promises.push(
        Q.fcall(function() {
          return util.get(destfile);
        }).spread(function(res, data) {
          return embedCSSStylesheet(destfile, data, options);
        }).then(function(str) {
          var style = $("<style type='text/css'>");
          style.html(str);
          link.replaceWith(style);
        })
      );
    });

    $("link[rel='icon'], link[rel='shortcut icon']").each(function() {
      var link = $(this);
      var dest = script.attr("href");
      var destfile = url.resolve(file, dest);
      promises.push(
        Q.fcall(function() {
          return getDataURI(destfile, util.mimetype(destfile, "image"));
        }).then(function(str) {
          link.attr("href", str);
        })
      );
    });

    return Q.all(promises).then(function() {
      return $.html();
    });
  }).then(function(str) {
    if (options.compressors.html)
      str = options.compressors.html(str);
    return str;
  });
}



exports.getDataURI = getDataURI;
exports.embedCSS = embedCSS;
exports.embedCSSStylesheet = embedCSSStylesheet;
exports.embedCSSInline = embedCSSInline;
exports.embedJS = embedJS;
exports.embedHTML = embedHTML;
