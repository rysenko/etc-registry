var ERROR_NOT_LOADED = 'Registry is not loaded, use load()';

var Balancers = {
  random: function() {
    return this[Math.floor(Math.random() * this.length)]
  }
};

var RegistryLoader = (function() {
  function RegistryLoader() {
    this.cachedRegistryLoaded = false;
    this.cachedRegistry = {};
    this.cachedRegistry.load = this.load.bind(this);
    this.cachedRegistry.get = this.getEntry.bind(this);
    return this.cachedRegistry;
  }
  RegistryLoader.prototype.getEntry = function(key) {
    if (!this.cachedRegistryLoaded) {
      throw new Error(ERROR_NOT_LOADED);
    }
    return String(this.cachedRegistry[key]);
  };
  RegistryLoader.prototype.getEtcdConfig = function(result) {
    var entries = result.node.nodes;
    var resultMap = {};
    entries.forEach(function(parent) {
      parent.nodes && parent.nodes.forEach(function(childNode) {
        var childValue = childNode && childNode.value;
        var parentKeyMatch = parent.key.match(/_?([a-zA-Z0-9]+)(\-\d+)?$/);
        if (childValue && parentKeyMatch && !childValue.endsWith(':0')) {
          var portSpecification = childNode.key.substr(childNode.key.lastIndexOf(':'));
          var resultKey = parentKeyMatch[1] + portSpecification;
          resultMap[resultKey] = resultMap[resultKey] || [];
          resultMap[resultKey].push(childValue);
        }
      });
    });
    return resultMap;
  };
  RegistryLoader.prototype.loadAndUpdateCache = function(callback) {
    this.etcdClient.get(this.options.path, { maxRetries: 10, recursive: true }, (function(err, result) {
      if (err) {
        return callback(err);
      }
      var retrievedRegistry = this.getEtcdConfig(result);
      for (var oldProp in this.cachedRegistry) {
        if (this.cachedRegistry.hasOwnProperty(oldProp) && typeof this.cachedRegistry[oldProp] !== 'function') {
          delete this.cachedRegistry[oldProp]
        }
      }
      for (var prop in retrievedRegistry) {
        this.cachedRegistry[prop] = retrievedRegistry[prop];
        this.cachedRegistry[prop].toString = Balancers.random;
      }
      this.cachedRegistryLoaded = true;
      callback(null, this.cachedRegistry);
    }).bind(this));
  };
  RegistryLoader.prototype.load = function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    this.options = options;
    this.options.host = this.options.host || process.env.ETCO_HOST || 'etcd';
    this.options.path = this.options.path || process.env.ETCO_PATH || '/registry';
    if (this.cachedRegistryLoaded) {
      return setImmediate((function() {
        callback(null, this.cachedRegistry);
      }).bind(this));
    }
    var Etcd = require('node-etcd');
    this.etcdClient = new Etcd(this.options.host);
    var watcher = this.etcdClient.watcher(this.options.path, null, { recursive: true });
    watcher.on('change', this.loadAndUpdateCache.bind(this, function() {}));
    setInterval(this.loadAndUpdateCache.bind(this, function() {}), 1000 * 60 * 5); // resync every 5 minutes
    this.loadAndUpdateCache(callback);
  };
  return RegistryLoader;
})();

module.exports = new RegistryLoader();
