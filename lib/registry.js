var registryPath = '/registry';

var RegistryLoader = (function () {
  function RegistryLoader() {
    this.cachedRegistryLoaded = false;
    this.cachedRegistry = {};
    this.cachedRegistry.load = this.load.bind(this);
    return this.cachedRegistry;
  }
  RegistryLoader.prototype.loadEtcd = function (callback) {
    var host = process.env.ETCO_HOST || 'etcd';
    if (this.cachedRegistryLoaded) {
      return setImmediate((function () {
        callback(null, this.cachedRegistry);
      }).bind(this));
    }
    var Etcd = require('node-etcd');
    this.etcdClient = new Etcd(host);
    this.etcdClient.get(registryPath, { maxRetries: 10, recursive: true }, function(err, result) {
      if (err) {
        return callback(err);
      }
      var entries = result.node.nodes;
      var resultMap = {};
      entries.forEach(function(entry) {
        var nodeValue = entry.nodes && entry.nodes.length && entry.nodes[0] && entry.nodes[0].value;
        var nodeKeyMatch = entry.key.match(/_?([a-zA-Z0-9]+)(\-\d+)?$/);
        if (nodeValue && nodeKeyMatch) {
          resultMap[nodeKeyMatch[1]] = nodeValue;
        }
      });
      callback(null, resultMap);
    });
  };
  RegistryLoader.prototype.load = function (callback) {
    this.loadEtcd((function (err, retrievedRegistry) {
      if (err) {
        return callback(err);
      }
      for (var prop in retrievedRegistry) {
        this.cachedRegistry[prop] = retrievedRegistry[prop];
      }
      this.cachedRegistryLoaded = true;
      callback(null, retrievedRegistry);
    }).bind(this));
  };
  return RegistryLoader;
})();

module.exports = new RegistryLoader();
