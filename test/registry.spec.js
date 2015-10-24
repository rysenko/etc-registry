var assert = require('assert');

describe('Registry', function() {
  it('should initialize etcd', function(done) {
    var Etcd = require('node-etcd');
    this.etcd = new Etcd();
    this.etcd.set('/registry/service/service:8080', 'localhost:8080', done);
  });
  it('should get from etcd', function(done) {
    var registry = require('../lib/registry');
    registry.load(function(err, result) {
      assert.ifError(err);
      assert.equal(result['service:8080'], 'localhost:8080');
      done();
    });
  });
});