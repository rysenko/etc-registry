var registryPath = '/registry';

var RegistryLoader = (function () {
  function RegistryLoader() {
    this.cachedRegistryLoaded = false;
    this.cachedRegistry = {};
    this.cachedRegistry.load = this.load.bind(this);
    return this.cachedRegistry;
  }
  RegistryLoader.prototype.getEtcdConfig = function(result) {
    var entries = result.node.nodes;
    var resultMap = {};
    entries.forEach(function(parent) {
      var childNode = parent.nodes && parent.nodes.length && parent.nodes[0];
      var childValue = childNode && childNode.value;
      var parentKeyMatch = parent.key.match(/_?([a-zA-Z0-9]+)(\-\d+)?$/);
      if (childValue && parentKeyMatch) {
        var portSpecification = childNode.key.substr(childNode.key.lastIndexOf(':'));
        resultMap[parentKeyMatch[1] + portSpecification] = childValue;
      }
    });
    return resultMap;
  };
  RegistryLoader.prototype.loadAndUpdateCache = function(callback) {
    this.etcdClient.get(registryPath, { maxRetries: 10, recursive: true }, (function(err, result) {
      if (err) {
        return callback(err);
      }
      var retrievedRegistry = this.getEtcdConfig(result);
      for (var prop in retrievedRegistry) {
        this.cachedRegistry[prop] = retrievedRegistry[prop];
      }
      for (var oldProp in this.cachedRegistry) {
        if (this.cachedRegistry.hasOwnProperty(oldProp) && typeof this.cachedRegistry[oldProp] === 'string' &&
          !retrievedRegistry[oldProp]) {
          delete this.cachedRegistry[oldProp]
        }
      }
      this.cachedRegistryLoaded = true;
      callback(null, retrievedRegistry);
    }).bind(this));
  };
  RegistryLoader.prototype.load = function (callback) {
    var host = process.env.ETCO_HOST || 'etcd';
    if (this.cachedRegistryLoaded) {
      return setImmediate((function () {
        callback(null, this.cachedRegistry);
      }).bind(this));
    }
    var Etcd = require('node-etcd');
    this.etcdClient = new Etcd(host);
    var watcher = this.etcdClient.watcher(registryPath, null, { recursive: true });
    watcher.on('change', this.loadAndUpdateCache.bind(this, function () {}));
    this.loadAndUpdateCache(callback);
  };
  return RegistryLoader;
})();

module.exports = new RegistryLoader();
