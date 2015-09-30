var registry = require('./lib/registry');

registry.load(function(err, result) {
  console.log(JSON.stringify(result, 4, 4));
});