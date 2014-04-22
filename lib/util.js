var Q = require("q")
  , curler = require("curler/build/Release/curler").Curler //FIXME: curler doesn't have main properly set
  , mime = require("mime")
  , url = require("url")
  , fs = require("fs");

// Enhanced, promise-ready interface to curler
exports.get = function get(options) {
  if (typeof options === "string")
    options = {url: options};

  var parsed = url.parse(options.url);
  if (parsed.protocol === "file:") {
    // libcurl doesn't support file:// protocol
    return Q.nfcall(fs.readFile, parsed.pathname).then(function(data) {
      return [{}, data];
    });
  }
  
  var deferred = Q.defer();
  var curl = new curler();
  curl.request(options, function(err, res, data) {
    if (err) return deferred.reject(new Error(err));
    console.log("Retrieved: %s (%s)", options.url, res.statusCode);
    deferred.resolve([res, data]);
  });
  return deferred.promise;
}

exports.mimetype = function mimetype(url, type) {
  var mimetype = mime.lookup(url);
  if (typeof mimetype !== "string")
    throw new Error("Can't guess MIME of "+url);
  if (type && mimetype.split(/\//g)[0] !== type)
    throw new Error("Mime "+mimetype+" is not of type "+type);
  return mimetype;
}

