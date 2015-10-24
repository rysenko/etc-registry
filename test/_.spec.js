var mockery = require('mockery');

mockery.registerSubstitute('node-etcd', 'node-etcd-mock');

mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false
});