## Etcd client to fetch registry populated by [registrator](http://github.com/gliderlabs/registrator)

This will fetch services map and update it once changes.

### Usage:

```
var registry = require('etc-registry');
registry.load({host: 'localhost', path: '/registry'}, function(err) {
    console.log(registry.get('service:3000')); // could be 10.0.0.75:32456
});
```