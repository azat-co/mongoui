
These files were copied and modified from Express version 3.2.4 to make them work in Browserify. In addition, `methods` and `debug` were added as dependencies to `package.json`.

Changes:

1. In `/router/index.js`, replace

```
  parse = require('connect').utils.parseUrl;
```

with

```
var urlParse = require('url').parse;
function parse(req) {
  var parsed = req._parsedUrl;
  if (parsed && parsed.href == req.url) {
    return parsed;
  } else {
    return req._parsedUrl = urlParse(req.url);
  }
}
```

and at the beginning of `Router.prototype._dispatch`, add

```
  delete req._parsedUrl;
```


2. In `/utils.js`, remove

```
var mime = require('connect').mime
  , crc32 = require('buffer-crc32');
```
