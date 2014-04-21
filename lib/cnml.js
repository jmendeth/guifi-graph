var Q = require("q");
var path = require("path");
var parseXML = Q.denodeify(require("xml2js").parseString);
var readFile = Q.denodeify(require("fs").readFile);
var writeFile = Q.denodeify(require("fs").writeFile);


// Utilities
// ---------

var dirpath = path.join.bind(path, __dirname, "..");

function parseDate(str) {
  str = str.match(/^(\d{4})(\d{2})(\d{2}) (\d{2})(\d{2})$/);
  str = new Date(str[1], str[2]-1, str[3], str[4], str[5]);
  return str.getTime()/60000;
}

function isSupernode(node) {
  // The criteria is a lot more permissive (and IMHO more useful)
  // than the official web, since it takes services into account.
  return node.$.services || node.$.devices > 1 || node.$.links > 1;
}

function ipv4ShortForm(interface) {
  var ip = interface.$.ipv4
    , mask = interface.$.mask.split(".");
  
  mask = mask.map(function(byte) {
    return parseInt(byte);
  });
  
  // Determine mask bits
  for (var i=0; i<32; i++) {
    var byte = mask[Math.floor(i/8)];
    var bit = (byte >> (7-i%8)) & 1;
    if (!bit) break;
  }
  
  return ip+"/"+i;
}

function enumMapper(item, values) {
  return function enumMapper(value) {
    var idx = values.indexOf(value);
    if (idx === -1)
      throw new Error("Invalid "+item+" '"+value+"' found.");
    return idx;
  }
}

var getStatusID = enumMapper("status", ["Planned","Building","Testing","Working", "Inactive","Reserved","Dropped"]);
//var getInterfaceTypeID = enumMapper("interface type", ["wds/p2p","wLan/Lan","wLan","Wan"]);
var getLinkTypeID = enumMapper("link type", ["ap/client","wds"]);
var getRadioModeID = enumMapper("radio mode", ["client","ap","ad-hoc","bridge","routedclient","mesh"]);


// Main logic
// ----------

function cnml(file) {
  return Q.fcall(function() {
    return readFile(dirpath(file));
  }).then(function(cnml) {
    return parseXML(cnml);
  }).then(function(cnml) {
    cnml = cnml.cnml;
    if (cnml.$.version !== "0.1")
      throw new Error("Wrong CNML version!");

    if (cnml.class.length != 1)
      throw new Error("CNML should have one <class> element.");
    if (cnml.class[0].$.network_description !== "detail")
      throw new Error("CNML is not detailed.");

    if (cnml.network.length != 1)
      throw new Error("CNML should have exactly one network!");
    var net = cnml.network[0];

    var header = {};
    header.url = cnml.$.server_url;
    header.date = parseDate(cnml.$.generated);

    header.zones = {};
    var nodes = "{";
    var links = "["

    processZone(net);
    function processZone(zone) {
      zone.zone && zone.zone.forEach(function(child) {
        header.zones[child.$.id] = [zone.$.id || null, child.$.title, child.$.box];
        processZone(child);
      });
      zone.node && zone.node.forEach(function(node) {
        // Iterate over radios and interfaces
        var radios = [];
        node.device && node.device.forEach(function(device) {
          device.radio && device.radio.forEach(function(radio) {
            var interfaces = [];

            radio.interface && radio.interface.forEach(function(interface) {
              interfaces.push([interface.$.mac, ipv4ShortForm(interface)]);
              if (radio.link) radio.link.forEach(function(link) {

                if (link.$.linked_node_id === node.$.id) throw new Error("TODO remove this");
                if (interface.$.id < link.$.linked_interface_id) {
                  links += "["+[
                    interface.$.id, link.$.linked_interface_id,
                    node.$.id, link.$.linked_node_id,
                    getStatusID(link.$.link_status),
                    getLinkTypeID(link.$.link_type),
                  ].join(",")+"],";
                }

              });
            });

            radios.push([getRadioModeID(radio.$.mode), radio.$.ssid, radio.$.channel||null, interfaces]);
          });
        });

        // List the actual node
        nodes += node.$.id+":[";
        nodes += [
          zone.$.id,
          JSON.stringify(node.$.title),
          getStatusID(node.$.status),
          Number(isSupernode(node)),
          parseDate(node.$.created),
          node.$.lat, node.$.lon,
          node.$.devices || 0,
          node.$.services || 0,
          JSON.stringify(radios)
        ].join(",");
        nodes += "],";
      });
    }

    nodes += "}";
    links += "]";
    return [header, nodes, links];
  }).spread(function (header, nodes, links) {
    var headerData = "((typeof window!=='undefined')?window:exports).header="+JSON.stringify(header)+";";
    var contentData = "((typeof window!=='undefined')?window:exports).contents={nodes:"+nodes+",links:"+links+"};";
    return Q.all([
      writeFile(dirpath("build/header.js"), headerData),
      writeFile(dirpath("build/content.js"), contentData)
    ]);
  });
}
module.exports = cnml;
