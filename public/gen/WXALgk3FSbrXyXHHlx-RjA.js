/*! Socket.IO.js build:0.9.11, development. Copyright(c) 2011 LearnBoost <dev@learnboost.com> MIT Licensed */

var io = ('undefined' === typeof module ? {} : module.exports);
(function() {

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * IO namespace.
   *
   * @namespace
   */

  var io = exports;

  /**
   * Socket.IO version
   *
   * @api public
   */

  io.version = '0.9.11';

  /**
   * Protocol implemented.
   *
   * @api public
   */

  io.protocol = 1;

  /**
   * Available transports, these will be populated with the available transports
   *
   * @api public
   */

  io.transports = [];

  /**
   * Keep track of jsonp callbacks.
   *
   * @api private
   */

  io.j = [];

  /**
   * Keep track of our io.Sockets
   *
   * @api private
   */
  io.sockets = {};


  /**
   * Manages connections to hosts.
   *
   * @param {String} uri
   * @Param {Boolean} force creation of new socket (defaults to false)
   * @api public
   */

  io.connect = function (host, details) {
    var uri = io.util.parseUri(host)
      , uuri
      , socket;

    if (global && global.location) {
      uri.protocol = uri.protocol || global.location.protocol.slice(0, -1);
      uri.host = uri.host || (global.document
        ? global.document.domain : global.location.hostname);
      uri.port = uri.port || global.location.port;
    }

    uuri = io.util.uniqueUri(uri);

    var options = {
        host: uri.host
      , secure: 'https' == uri.protocol
      , port: uri.port || ('https' == uri.protocol ? 443 : 80)
      , query: uri.query || ''
    };

    io.util.merge(options, details);

    if (options['force new connection'] || !io.sockets[uuri]) {
      socket = new io.Socket(options);
    }

    if (!options['force new connection'] && socket) {
      io.sockets[uuri] = socket;
    }

    socket = socket || io.sockets[uuri];

    // if path is different from '' or /
    return socket.of(uri.path.length > 1 ? uri.path : '');
  };

})('object' === typeof module ? module.exports : (this.io = {}), this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, global) {

  /**
   * Utilities namespace.
   *
   * @namespace
   */

  var util = exports.util = {};

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api public
   */

  var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password',
               'host', 'port', 'relative', 'path', 'directory', 'file', 'query',
               'anchor'];

  util.parseUri = function (str) {
    var m = re.exec(str || '')
      , uri = {}
      , i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    return uri;
  };

  /**
   * Produces a unique url that identifies a Socket.IO connection.
   *
   * @param {Object} uri
   * @api public
   */

  util.uniqueUri = function (uri) {
    var protocol = uri.protocol
      , host = uri.host
      , port = uri.port;

    if ('document' in global) {
      host = host || document.domain;
      port = port || (protocol == 'https'
        && document.location.protocol !== 'https:' ? 443 : document.location.port);
    } else {
      host = host || 'localhost';

      if (!port && protocol == 'https') {
        port = 443;
      }
    }

    return (protocol || 'http') + '://' + host + ':' + (port || 80);
  };

  /**
   * Mergest 2 query strings in to once unique query string
   *
   * @param {String} base
   * @param {String} addition
   * @api public
   */

  util.query = function (base, addition) {
    var query = util.chunkQuery(base || '')
      , components = [];

    util.merge(query, util.chunkQuery(addition || ''));
    for (var part in query) {
      if (query.hasOwnProperty(part)) {
        components.push(part + '=' + query[part]);
      }
    }

    return components.length ? '?' + components.join('&') : '';
  };

  /**
   * Transforms a querystring in to an object
   *
   * @param {String} qs
   * @api public
   */

  util.chunkQuery = function (qs) {
    var query = {}
      , params = qs.split('&')
      , i = 0
      , l = params.length
      , kv;

    for (; i < l; ++i) {
      kv = params[i].split('=');
      if (kv[0]) {
        query[kv[0]] = kv[1];
      }
    }

    return query;
  };

  /**
   * Executes the given function when the page is loaded.
   *
   *     io.util.load(function () { console.log('page loaded'); });
   *
   * @param {Function} fn
   * @api public
   */

  var pageLoaded = false;

  util.load = function (fn) {
    if ('document' in global && document.readyState === 'complete' || pageLoaded) {
      return fn();
    }

    util.on(global, 'load', fn, false);
  };

  /**
   * Adds an event.
   *
   * @api private
   */

  util.on = function (element, event, fn, capture) {
    if (element.attachEvent) {
      element.attachEvent('on' + event, fn);
    } else if (element.addEventListener) {
      element.addEventListener(event, fn, capture);
    }
  };

  /**
   * Generates the correct `XMLHttpRequest` for regular and cross domain requests.
   *
   * @param {Boolean} [xdomain] Create a request that can be used cross domain.
   * @returns {XMLHttpRequest|false} If we can create a XMLHttpRequest.
   * @api private
   */

  util.request = function (xdomain) {

    if (xdomain && 'undefined' != typeof XDomainRequest && !util.ua.hasCORS) {
      return new XDomainRequest();
    }

    if ('undefined' != typeof XMLHttpRequest && (!xdomain || util.ua.hasCORS)) {
      return new XMLHttpRequest();
    }

    if (!xdomain) {
      try {
        return new window[(['Active'].concat('Object').join('X'))]('Microsoft.XMLHTTP');
      } catch(e) { }
    }

    return null;
  };

  /**
   * XHR based transport constructor.
   *
   * @constructor
   * @api public
   */

  /**
   * Change the internal pageLoaded value.
   */

  if ('undefined' != typeof window) {
    util.load(function () {
      pageLoaded = true;
    });
  }

  /**
   * Defers a function to ensure a spinner is not displayed by the browser
   *
   * @param {Function} fn
   * @api public
   */

  util.defer = function (fn) {
    if (!util.ua.webkit || 'undefined' != typeof importScripts) {
      return fn();
    }

    util.load(function () {
      setTimeout(fn, 100);
    });
  };

  /**
   * Merges two objects.
   *
   * @api public
   */

  util.merge = function merge (target, additional, deep, lastseen) {
    var seen = lastseen || []
      , depth = typeof deep == 'undefined' ? 2 : deep
      , prop;

    for (prop in additional) {
      if (additional.hasOwnProperty(prop) && util.indexOf(seen, prop) < 0) {
        if (typeof target[prop] !== 'object' || !depth) {
          target[prop] = additional[prop];
          seen.push(additional[prop]);
        } else {
          util.merge(target[prop], additional[prop], depth - 1, seen);
        }
      }
    }

    return target;
  };

  /**
   * Merges prototypes from objects
   *
   * @api public
   */

  util.mixin = function (ctor, ctor2) {
    util.merge(ctor.prototype, ctor2.prototype);
  };

  /**
   * Shortcut for prototypical and static inheritance.
   *
   * @api private
   */

  util.inherit = function (ctor, ctor2) {
    function f() {};
    f.prototype = ctor2.prototype;
    ctor.prototype = new f;
  };

  /**
   * Checks if the given object is an Array.
   *
   *     io.util.isArray([]); // true
   *     io.util.isArray({}); // false
   *
   * @param Object obj
   * @api public
   */

  util.isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  };

  /**
   * Intersects values of two arrays into a third
   *
   * @api public
   */

  util.intersect = function (arr, arr2) {
    var ret = []
      , longest = arr.length > arr2.length ? arr : arr2
      , shortest = arr.length > arr2.length ? arr2 : arr;

    for (var i = 0, l = shortest.length; i < l; i++) {
      if (~util.indexOf(longest, shortest[i]))
        ret.push(shortest[i]);
    }

    return ret;
  };

  /**
   * Array indexOf compatibility.
   *
   * @see bit.ly/a5Dxa2
   * @api public
   */

  util.indexOf = function (arr, o, i) {

    for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0;
         i < j && arr[i] !== o; i++) {}

    return j <= i ? -1 : i;
  };

  /**
   * Converts enumerables to array.
   *
   * @api public
   */

  util.toArray = function (enu) {
    var arr = [];

    for (var i = 0, l = enu.length; i < l; i++)
      arr.push(enu[i]);

    return arr;
  };

  /**
   * UA / engines detection namespace.
   *
   * @namespace
   */

  util.ua = {};

  /**
   * Whether the UA supports CORS for XHR.
   *
   * @api public
   */

  util.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
    try {
      var a = new XMLHttpRequest();
    } catch (e) {
      return false;
    }

    return a.withCredentials != undefined;
  })();

  /**
   * Detect webkit.
   *
   * @api public
   */

  util.ua.webkit = 'undefined' != typeof navigator
    && /webkit/i.test(navigator.userAgent);

   /**
   * Detect iPad/iPhone/iPod.
   *
   * @api public
   */

  util.ua.iDevice = 'undefined' != typeof navigator
      && /iPad|iPhone|iPod/i.test(navigator.userAgent);

})('undefined' != typeof io ? io : module.exports, this);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.EventEmitter = EventEmitter;

  /**
   * Event emitter constructor.
   *
   * @api public.
   */

  function EventEmitter () {};

  /**
   * Adds a listener
   *
   * @api public
   */

  EventEmitter.prototype.on = function (name, fn) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = fn;
    } else if (io.util.isArray(this.$events[name])) {
      this.$events[name].push(fn);
    } else {
      this.$events[name] = [this.$events[name], fn];
    }

    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  /**
   * Adds a volatile listener.
   *
   * @api public
   */

  EventEmitter.prototype.once = function (name, fn) {
    var self = this;

    function on () {
      self.removeListener(name, on);
      fn.apply(this, arguments);
    };

    on.listener = fn;
    this.on(name, on);

    return this;
  };

  /**
   * Removes a listener.
   *
   * @api public
   */

  EventEmitter.prototype.removeListener = function (name, fn) {
    if (this.$events && this.$events[name]) {
      var list = this.$events[name];

      if (io.util.isArray(list)) {
        var pos = -1;

        for (var i = 0, l = list.length; i < l; i++) {
          if (list[i] === fn || (list[i].listener && list[i].listener === fn)) {
            pos = i;
            break;
          }
        }

        if (pos < 0) {
          return this;
        }

        list.splice(pos, 1);

        if (!list.length) {
          delete this.$events[name];
        }
      } else if (list === fn || (list.listener && list.listener === fn)) {
        delete this.$events[name];
      }
    }

    return this;
  };

  /**
   * Removes all listeners for an event.
   *
   * @api public
   */

  EventEmitter.prototype.removeAllListeners = function (name) {
    if (name === undefined) {
      this.$events = {};
      return this;
    }

    if (this.$events && this.$events[name]) {
      this.$events[name] = null;
    }

    return this;
  };

  /**
   * Gets all listeners for a certain event.
   *
   * @api publci
   */

  EventEmitter.prototype.listeners = function (name) {
    if (!this.$events) {
      this.$events = {};
    }

    if (!this.$events[name]) {
      this.$events[name] = [];
    }

    if (!io.util.isArray(this.$events[name])) {
      this.$events[name] = [this.$events[name]];
    }

    return this.$events[name];
  };

  /**
   * Emits an event.
   *
   * @api public
   */

  EventEmitter.prototype.emit = function (name) {
    if (!this.$events) {
      return false;
    }

    var handler = this.$events[name];

    if (!handler) {
      return false;
    }

    var args = Array.prototype.slice.call(arguments, 1);

    if ('function' == typeof handler) {
      handler.apply(this, args);
    } else if (io.util.isArray(handler)) {
      var listeners = handler.slice();

      for (var i = 0, l = listeners.length; i < l; i++) {
        listeners[i].apply(this, args);
      }
    } else {
      return false;
    }

    return true;
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Based on JSON2 (http://www.JSON.org/js.html).
 */

(function (exports, nativeJSON) {
  "use strict";

  // use native JSON if it's available
  if (nativeJSON && nativeJSON.parse){
    return exports.JSON = {
      parse: nativeJSON.parse
    , stringify: nativeJSON.stringify
    };
  }

  var JSON = exports.JSON = {};

  function f(n) {
      // Format integers to have at least two digits.
      return n < 10 ? '0' + n : n;
  }

  function date(d, key) {
    return isFinite(d.valueOf()) ?
        d.getUTCFullYear()     + '-' +
        f(d.getUTCMonth() + 1) + '-' +
        f(d.getUTCDate())      + 'T' +
        f(d.getUTCHours())     + ':' +
        f(d.getUTCMinutes())   + ':' +
        f(d.getUTCSeconds())   + 'Z' : null;
  };

  var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
      gap,
      indent,
      meta = {    // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"' : '\\"',
          '\\': '\\\\'
      },
      rep;


  function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

      escapable.lastIndex = 0;
      return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
          var c = meta[a];
          return typeof c === 'string' ? c :
              '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
      }) + '"' : '"' + string + '"';
  }


  function str(key, holder) {

// Produce a string from holder[key].

      var i,          // The loop counter.
          k,          // The member key.
          v,          // The member value.
          length,
          mind = gap,
          partial,
          value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

      if (value instanceof Date) {
          value = date(key);
      }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

      if (typeof rep === 'function') {
          value = rep.call(holder, key, value);
      }

// What happens next depends on the value's type.

      switch (typeof value) {
      case 'string':
          return quote(value);

      case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

          return isFinite(value) ? String(value) : 'null';

      case 'boolean':
      case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

          return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

      case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

          if (!value) {
              return 'null';
          }

// Make an array to hold the partial results of stringifying this object value.

          gap += indent;
          partial = [];

// Is the value an array?

          if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

              length = value.length;
              for (i = 0; i < length; i += 1) {
                  partial[i] = str(i, value) || 'null';
              }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

              v = partial.length === 0 ? '[]' : gap ?
                  '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                  '[' + partial.join(',') + ']';
              gap = mind;
              return v;
          }

// If the replacer is an array, use it to select the members to be stringified.

          if (rep && typeof rep === 'object') {
              length = rep.length;
              for (i = 0; i < length; i += 1) {
                  if (typeof rep[i] === 'string') {
                      k = rep[i];
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          } else {

// Otherwise, iterate through all of the keys in the object.

              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = str(k, value);
                      if (v) {
                          partial.push(quote(k) + (gap ? ': ' : ':') + v);
                      }
                  }
              }
          }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

          v = partial.length === 0 ? '{}' : gap ?
              '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
          gap = mind;
          return v;
      }
  }

// If the JSON object does not yet have a stringify method, give it one.

  JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

      var i;
      gap = '';
      indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

      if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
              indent += ' ';
          }

// If the space parameter is a string, it will be used as the indent string.

      } else if (typeof space === 'string') {
          indent = space;
      }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

      rep = replacer;
      if (replacer && typeof replacer !== 'function' &&
              (typeof replacer !== 'object' ||
              typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
      }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

      return str('', {'': value});
  };

// If the JSON object does not yet have a parse method, give it one.

  JSON.parse = function (text, reviver) {
  // The parse method takes a text and an optional reviver function, and returns
  // a JavaScript value if the text is a valid JSON text.

      var j;

      function walk(holder, key) {

  // The walk method is used to recursively walk the resulting structure so
  // that modifications can be made.

          var k, v, value = holder[key];
          if (value && typeof value === 'object') {
              for (k in value) {
                  if (Object.prototype.hasOwnProperty.call(value, k)) {
                      v = walk(value, k);
                      if (v !== undefined) {
                          value[k] = v;
                      } else {
                          delete value[k];
                      }
                  }
              }
          }
          return reviver.call(holder, key, value);
      }


  // Parsing happens in four stages. In the first stage, we replace certain
  // Unicode characters with escape sequences. JavaScript handles many characters
  // incorrectly, either silently deleting them, or treating them as line endings.

      text = String(text);
      cx.lastIndex = 0;
      if (cx.test(text)) {
          text = text.replace(cx, function (a) {
              return '\\u' +
                  ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
          });
      }

  // In the second stage, we run the text against regular expressions that look
  // for non-JSON patterns. We are especially concerned with '()' and 'new'
  // because they can cause invocation, and '=' because it can cause mutation.
  // But just to be safe, we want to reject all unexpected forms.

  // We split the second stage into 4 regexp operations in order to work around
  // crippling inefficiencies in IE's and Safari's regexp engines. First we
  // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
  // replace all simple value tokens with ']' characters. Third, we delete all
  // open brackets that follow a colon or comma or that begin the text. Finally,
  // we look to see that the remaining characters are only whitespace or ']' or
  // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

      if (/^[\],:{}\s]*$/
              .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                  .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                  .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

  // In the third stage we use the eval function to compile the text into a
  // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
  // in JavaScript: it can begin a block or an object literal. We wrap the text
  // in parens to eliminate the ambiguity.

          j = eval('(' + text + ')');

  // In the optional fourth stage, we recursively walk the new structure, passing
  // each name/value pair to a reviver function for possible transformation.

          return typeof reviver === 'function' ?
              walk({'': j}, '') : j;
      }

  // If the text is not JSON parseable, then a SyntaxError is thrown.

      throw new SyntaxError('JSON.parse');
  };

})(
    'undefined' != typeof io ? io : module.exports
  , typeof JSON !== 'undefined' ? JSON : undefined
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Parser namespace.
   *
   * @namespace
   */

  var parser = exports.parser = {};

  /**
   * Packet types.
   */

  var packets = parser.packets = [
      'disconnect'
    , 'connect'
    , 'heartbeat'
    , 'message'
    , 'json'
    , 'event'
    , 'ack'
    , 'error'
    , 'noop'
  ];

  /**
   * Errors reasons.
   */

  var reasons = parser.reasons = [
      'transport not supported'
    , 'client not handshaken'
    , 'unauthorized'
  ];

  /**
   * Errors advice.
   */

  var advice = parser.advice = [
      'reconnect'
  ];

  /**
   * Shortcuts.
   */

  var JSON = io.JSON
    , indexOf = io.util.indexOf;

  /**
   * Encodes a packet.
   *
   * @api private
   */

  parser.encodePacket = function (packet) {
    var type = indexOf(packets, packet.type)
      , id = packet.id || ''
      , endpoint = packet.endpoint || ''
      , ack = packet.ack
      , data = null;

    switch (packet.type) {
      case 'error':
        var reason = packet.reason ? indexOf(reasons, packet.reason) : ''
          , adv = packet.advice ? indexOf(advice, packet.advice) : '';

        if (reason !== '' || adv !== '')
          data = reason + (adv !== '' ? ('+' + adv) : '');

        break;

      case 'message':
        if (packet.data !== '')
          data = packet.data;
        break;

      case 'event':
        var ev = { name: packet.name };

        if (packet.args && packet.args.length) {
          ev.args = packet.args;
        }

        data = JSON.stringify(ev);
        break;

      case 'json':
        data = JSON.stringify(packet.data);
        break;

      case 'connect':
        if (packet.qs)
          data = packet.qs;
        break;

      case 'ack':
        data = packet.ackId
          + (packet.args && packet.args.length
              ? '+' + JSON.stringify(packet.args) : '');
        break;
    }

    // construct packet with required fragments
    var encoded = [
        type
      , id + (ack == 'data' ? '+' : '')
      , endpoint
    ];

    // data fragment is optional
    if (data !== null && data !== undefined)
      encoded.push(data);

    return encoded.join(':');
  };

  /**
   * Encodes multiple messages (payload).
   *
   * @param {Array} messages
   * @api private
   */

  parser.encodePayload = function (packets) {
    var decoded = '';

    if (packets.length == 1)
      return packets[0];

    for (var i = 0, l = packets.length; i < l; i++) {
      var packet = packets[i];
      decoded += '\ufffd' + packet.length + '\ufffd' + packets[i];
    }

    return decoded;
  };

  /**
   * Decodes a packet
   *
   * @api private
   */

  var regexp = /([^:]+):([0-9]+)?(\+)?:([^:]+)?:?([\s\S]*)?/;

  parser.decodePacket = function (data) {
    var pieces = data.match(regexp);

    if (!pieces) return {};

    var id = pieces[2] || ''
      , data = pieces[5] || ''
      , packet = {
            type: packets[pieces[1]]
          , endpoint: pieces[4] || ''
        };

    // whether we need to acknowledge the packet
    if (id) {
      packet.id = id;
      if (pieces[3])
        packet.ack = 'data';
      else
        packet.ack = true;
    }

    // handle different packet types
    switch (packet.type) {
      case 'error':
        var pieces = data.split('+');
        packet.reason = reasons[pieces[0]] || '';
        packet.advice = advice[pieces[1]] || '';
        break;

      case 'message':
        packet.data = data || '';
        break;

      case 'event':
        try {
          var opts = JSON.parse(data);
          packet.name = opts.name;
          packet.args = opts.args;
        } catch (e) { }

        packet.args = packet.args || [];
        break;

      case 'json':
        try {
          packet.data = JSON.parse(data);
        } catch (e) { }
        break;

      case 'connect':
        packet.qs = data || '';
        break;

      case 'ack':
        var pieces = data.match(/^([0-9]+)(\+)?(.*)/);
        if (pieces) {
          packet.ackId = pieces[1];
          packet.args = [];

          if (pieces[3]) {
            try {
              packet.args = pieces[3] ? JSON.parse(pieces[3]) : [];
            } catch (e) { }
          }
        }
        break;

      case 'disconnect':
      case 'heartbeat':
        break;
    };

    return packet;
  };

  /**
   * Decodes data payload. Detects multiple messages
   *
   * @return {Array} messages
   * @api public
   */

  parser.decodePayload = function (data) {
    // IE doesn't like data[i] for unicode chars, charAt works fine
    if (data.charAt(0) == '\ufffd') {
      var ret = [];

      for (var i = 1, length = ''; i < data.length; i++) {
        if (data.charAt(i) == '\ufffd') {
          ret.push(parser.decodePacket(data.substr(i + 1).substr(0, length)));
          i += Number(length) + 1;
          length = '';
        } else {
          length += data.charAt(i);
        }
      }

      return ret;
    } else {
      return [parser.decodePacket(data)];
    }
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.Transport = Transport;

  /**
   * This is the transport template for all supported transport methods.
   *
   * @constructor
   * @api public
   */

  function Transport (socket, sessid) {
    this.socket = socket;
    this.sessid = sessid;
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Transport, io.EventEmitter);


  /**
   * Indicates whether heartbeats is enabled for this transport
   *
   * @api private
   */

  Transport.prototype.heartbeats = function () {
    return true;
  };

  /**
   * Handles the response from the server. When a new response is received
   * it will automatically update the timeout, decode the message and
   * forwards the response to the onMessage function for further processing.
   *
   * @param {String} data Response from the server.
   * @api private
   */

  Transport.prototype.onData = function (data) {
    this.clearCloseTimeout();

    // If the connection in currently open (or in a reopening state) reset the close
    // timeout since we have just received data. This check is necessary so
    // that we don't reset the timeout on an explicitly disconnected connection.
    if (this.socket.connected || this.socket.connecting || this.socket.reconnecting) {
      this.setCloseTimeout();
    }

    if (data !== '') {
      // todo: we should only do decodePayload for xhr transports
      var msgs = io.parser.decodePayload(data);

      if (msgs && msgs.length) {
        for (var i = 0, l = msgs.length; i < l; i++) {
          this.onPacket(msgs[i]);
        }
      }
    }

    return this;
  };

  /**
   * Handles packets.
   *
   * @api private
   */

  Transport.prototype.onPacket = function (packet) {
    this.socket.setHeartbeatTimeout();

    if (packet.type == 'heartbeat') {
      return this.onHeartbeat();
    }

    if (packet.type == 'connect' && packet.endpoint == '') {
      this.onConnect();
    }

    if (packet.type == 'error' && packet.advice == 'reconnect') {
      this.isOpen = false;
    }

    this.socket.onPacket(packet);

    return this;
  };

  /**
   * Sets close timeout
   *
   * @api private
   */

  Transport.prototype.setCloseTimeout = function () {
    if (!this.closeTimeout) {
      var self = this;

      this.closeTimeout = setTimeout(function () {
        self.onDisconnect();
      }, this.socket.closeTimeout);
    }
  };

  /**
   * Called when transport disconnects.
   *
   * @api private
   */

  Transport.prototype.onDisconnect = function () {
    if (this.isOpen) this.close();
    this.clearTimeouts();
    this.socket.onDisconnect();
    return this;
  };

  /**
   * Called when transport connects
   *
   * @api private
   */

  Transport.prototype.onConnect = function () {
    this.socket.onConnect();
    return this;
  };

  /**
   * Clears close timeout
   *
   * @api private
   */

  Transport.prototype.clearCloseTimeout = function () {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  };

  /**
   * Clear timeouts
   *
   * @api private
   */

  Transport.prototype.clearTimeouts = function () {
    this.clearCloseTimeout();

    if (this.reopenTimeout) {
      clearTimeout(this.reopenTimeout);
    }
  };

  /**
   * Sends a packet
   *
   * @param {Object} packet object.
   * @api private
   */

  Transport.prototype.packet = function (packet) {
    this.send(io.parser.encodePacket(packet));
  };

  /**
   * Send the received heartbeat message back to server. So the server
   * knows we are still connected.
   *
   * @param {String} heartbeat Heartbeat response from the server.
   * @api private
   */

  Transport.prototype.onHeartbeat = function (heartbeat) {
    this.packet({ type: 'heartbeat' });
  };

  /**
   * Called when the transport opens.
   *
   * @api private
   */

  Transport.prototype.onOpen = function () {
    this.isOpen = true;
    this.clearCloseTimeout();
    this.socket.onOpen();
  };

  /**
   * Notifies the base when the connection with the Socket.IO server
   * has been disconnected.
   *
   * @api private
   */

  Transport.prototype.onClose = function () {
    var self = this;

    /* FIXME: reopen delay causing a infinit loop
    this.reopenTimeout = setTimeout(function () {
      self.open();
    }, this.socket.options['reopen delay']);*/

    this.isOpen = false;
    this.socket.onClose();
    this.onDisconnect();
  };

  /**
   * Generates a connection url based on the Socket.IO URL Protocol.
   * See <https://github.com/learnboost/socket.io-node/> for more details.
   *
   * @returns {String} Connection url
   * @api private
   */

  Transport.prototype.prepareUrl = function () {
    var options = this.socket.options;

    return this.scheme() + '://'
      + options.host + ':' + options.port + '/'
      + options.resource + '/' + io.protocol
      + '/' + this.name + '/' + this.sessid;
  };

  /**
   * Checks if the transport is ready to start a connection.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  Transport.prototype.ready = function (socket, fn) {
    fn.call(this);
  };
})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.Socket = Socket;

  /**
   * Create a new `Socket.IO client` which can establish a persistent
   * connection with a Socket.IO enabled server.
   *
   * @api public
   */

  function Socket (options) {
    this.options = {
        port: 80
      , secure: false
      , document: 'document' in global ? document : false
      , resource: 'socket.io'
      , transports: io.transports
      , 'connect timeout': 10000
      , 'try multiple transports': true
      , 'reconnect': true
      , 'reconnection delay': 500
      , 'reconnection limit': Infinity
      , 'reopen delay': 3000
      , 'max reconnection attempts': 10
      , 'sync disconnect on unload': false
      , 'auto connect': true
      , 'flash policy port': 10843
      , 'manualFlush': false
    };

    io.util.merge(this.options, options);

    this.connected = false;
    this.open = false;
    this.connecting = false;
    this.reconnecting = false;
    this.namespaces = {};
    this.buffer = [];
    this.doBuffer = false;

    if (this.options['sync disconnect on unload'] &&
        (!this.isXDomain() || io.util.ua.hasCORS)) {
      var self = this;
      io.util.on(global, 'beforeunload', function () {
        self.disconnectSync();
      }, false);
    }

    if (this.options['auto connect']) {
      this.connect();
    }
};

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(Socket, io.EventEmitter);

  /**
   * Returns a namespace listener/emitter for this socket
   *
   * @api public
   */

  Socket.prototype.of = function (name) {
    if (!this.namespaces[name]) {
      this.namespaces[name] = new io.SocketNamespace(this, name);

      if (name !== '') {
        this.namespaces[name].packet({ type: 'connect' });
      }
    }

    return this.namespaces[name];
  };

  /**
   * Emits the given event to the Socket and all namespaces
   *
   * @api private
   */

  Socket.prototype.publish = function () {
    this.emit.apply(this, arguments);

    var nsp;

    for (var i in this.namespaces) {
      if (this.namespaces.hasOwnProperty(i)) {
        nsp = this.of(i);
        nsp.$emit.apply(nsp, arguments);
      }
    }
  };

  /**
   * Performs the handshake
   *
   * @api private
   */

  function empty () { };

  Socket.prototype.handshake = function (fn) {
    var self = this
      , options = this.options;

    function complete (data) {
      if (data instanceof Error) {
        self.connecting = false;
        self.onError(data.message);
      } else {
        fn.apply(null, data.split(':'));
      }
    };

    var url = [
          'http' + (options.secure ? 's' : '') + ':/'
        , options.host + ':' + options.port
        , options.resource
        , io.protocol
        , io.util.query(this.options.query, 't=' + +new Date)
      ].join('/');

    if (this.isXDomain() && !io.util.ua.hasCORS) {
      var insertAt = document.getElementsByTagName('script')[0]
        , script = document.createElement('script');

      script.src = url + '&jsonp=' + io.j.length;
      insertAt.parentNode.insertBefore(script, insertAt);

      io.j.push(function (data) {
        complete(data);
        script.parentNode.removeChild(script);
      });
    } else {
      var xhr = io.util.request();

      xhr.open('GET', url, true);
      if (this.isXDomain()) {
        xhr.withCredentials = true;
      }
      xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty;

          if (xhr.status == 200) {
            complete(xhr.responseText);
          } else if (xhr.status == 403) {
            self.onError(xhr.responseText);
          } else {
            self.connecting = false;            
            !self.reconnecting && self.onError(xhr.responseText);
          }
        }
      };
      xhr.send(null);
    }
  };

  /**
   * Find an available transport based on the options supplied in the constructor.
   *
   * @api private
   */

  Socket.prototype.getTransport = function (override) {
    var transports = override || this.transports, match;

    for (var i = 0, transport; transport = transports[i]; i++) {
      if (io.Transport[transport]
        && io.Transport[transport].check(this)
        && (!this.isXDomain() || io.Transport[transport].xdomainCheck(this))) {
        return new io.Transport[transport](this, this.sessionid);
      }
    }

    return null;
  };

  /**
   * Connects to the server.
   *
   * @param {Function} [fn] Callback.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.connect = function (fn) {
    if (this.connecting) {
      return this;
    }

    var self = this;
    self.connecting = true;
    
    this.handshake(function (sid, heartbeat, close, transports) {
      self.sessionid = sid;
      self.closeTimeout = close * 1000;
      self.heartbeatTimeout = heartbeat * 1000;
      if(!self.transports)
          self.transports = self.origTransports = (transports ? io.util.intersect(
              transports.split(',')
            , self.options.transports
          ) : self.options.transports);

      self.setHeartbeatTimeout();

      function connect (transports){
        if (self.transport) self.transport.clearTimeouts();

        self.transport = self.getTransport(transports);
        if (!self.transport) return self.publish('connect_failed');

        // once the transport is ready
        self.transport.ready(self, function () {
          self.connecting = true;
          self.publish('connecting', self.transport.name);
          self.transport.open();

          if (self.options['connect timeout']) {
            self.connectTimeoutTimer = setTimeout(function () {
              if (!self.connected) {
                self.connecting = false;

                if (self.options['try multiple transports']) {
                  var remaining = self.transports;

                  while (remaining.length > 0 && remaining.splice(0,1)[0] !=
                         self.transport.name) {}

                    if (remaining.length){
                      connect(remaining);
                    } else {
                      self.publish('connect_failed');
                    }
                }
              }
            }, self.options['connect timeout']);
          }
        });
      }

      connect(self.transports);

      self.once('connect', function (){
        clearTimeout(self.connectTimeoutTimer);

        fn && typeof fn == 'function' && fn();
      });
    });

    return this;
  };

  /**
   * Clears and sets a new heartbeat timeout using the value given by the
   * server during the handshake.
   *
   * @api private
   */

  Socket.prototype.setHeartbeatTimeout = function () {
    clearTimeout(this.heartbeatTimeoutTimer);
    if(this.transport && !this.transport.heartbeats()) return;

    var self = this;
    this.heartbeatTimeoutTimer = setTimeout(function () {
      self.transport.onClose();
    }, this.heartbeatTimeout);
  };

  /**
   * Sends a message.
   *
   * @param {Object} data packet.
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.packet = function (data) {
    if (this.connected && !this.doBuffer) {
      this.transport.packet(data);
    } else {
      this.buffer.push(data);
    }

    return this;
  };

  /**
   * Sets buffer state
   *
   * @api private
   */

  Socket.prototype.setBuffer = function (v) {
    this.doBuffer = v;

    if (!v && this.connected && this.buffer.length) {
      if (!this.options['manualFlush']) {
        this.flushBuffer();
      }
    }
  };

  /**
   * Flushes the buffer data over the wire.
   * To be invoked manually when 'manualFlush' is set to true.
   *
   * @api public
   */

  Socket.prototype.flushBuffer = function() {
    this.transport.payload(this.buffer);
    this.buffer = [];
  };
  

  /**
   * Disconnect the established connect.
   *
   * @returns {io.Socket}
   * @api public
   */

  Socket.prototype.disconnect = function () {
    if (this.connected || this.connecting) {
      if (this.open) {
        this.of('').packet({ type: 'disconnect' });
      }

      // handle disconnection immediately
      this.onDisconnect('booted');
    }

    return this;
  };

  /**
   * Disconnects the socket with a sync XHR.
   *
   * @api private
   */

  Socket.prototype.disconnectSync = function () {
    // ensure disconnection
    var xhr = io.util.request();
    var uri = [
        'http' + (this.options.secure ? 's' : '') + ':/'
      , this.options.host + ':' + this.options.port
      , this.options.resource
      , io.protocol
      , ''
      , this.sessionid
    ].join('/') + '/?disconnect=1';

    xhr.open('GET', uri, false);
    xhr.send(null);

    // handle disconnection immediately
    this.onDisconnect('booted');
  };

  /**
   * Check if we need to use cross domain enabled transports. Cross domain would
   * be a different port or different domain name.
   *
   * @returns {Boolean}
   * @api private
   */

  Socket.prototype.isXDomain = function () {

    var port = global.location.port ||
      ('https:' == global.location.protocol ? 443 : 80);

    return this.options.host !== global.location.hostname 
      || this.options.port != port;
  };

  /**
   * Called upon handshake.
   *
   * @api private
   */

  Socket.prototype.onConnect = function () {
    if (!this.connected) {
      this.connected = true;
      this.connecting = false;
      if (!this.doBuffer) {
        // make sure to flush the buffer
        this.setBuffer(false);
      }
      this.emit('connect');
    }
  };

  /**
   * Called when the transport opens
   *
   * @api private
   */

  Socket.prototype.onOpen = function () {
    this.open = true;
  };

  /**
   * Called when the transport closes.
   *
   * @api private
   */

  Socket.prototype.onClose = function () {
    this.open = false;
    clearTimeout(this.heartbeatTimeoutTimer);
  };

  /**
   * Called when the transport first opens a connection
   *
   * @param text
   */

  Socket.prototype.onPacket = function (packet) {
    this.of(packet.endpoint).onPacket(packet);
  };

  /**
   * Handles an error.
   *
   * @api private
   */

  Socket.prototype.onError = function (err) {
    if (err && err.advice) {
      if (err.advice === 'reconnect' && (this.connected || this.connecting)) {
        this.disconnect();
        if (this.options.reconnect) {
          this.reconnect();
        }
      }
    }

    this.publish('error', err && err.reason ? err.reason : err);
  };

  /**
   * Called when the transport disconnects.
   *
   * @api private
   */

  Socket.prototype.onDisconnect = function (reason) {
    var wasConnected = this.connected
      , wasConnecting = this.connecting;

    this.connected = false;
    this.connecting = false;
    this.open = false;

    if (wasConnected || wasConnecting) {
      this.transport.close();
      this.transport.clearTimeouts();
      if (wasConnected) {
        this.publish('disconnect', reason);

        if ('booted' != reason && this.options.reconnect && !this.reconnecting) {
          this.reconnect();
        }
      }
    }
  };

  /**
   * Called upon reconnection.
   *
   * @api private
   */

  Socket.prototype.reconnect = function () {
    this.reconnecting = true;
    this.reconnectionAttempts = 0;
    this.reconnectionDelay = this.options['reconnection delay'];

    var self = this
      , maxAttempts = this.options['max reconnection attempts']
      , tryMultiple = this.options['try multiple transports']
      , limit = this.options['reconnection limit'];

    function reset () {
      if (self.connected) {
        for (var i in self.namespaces) {
          if (self.namespaces.hasOwnProperty(i) && '' !== i) {
              self.namespaces[i].packet({ type: 'connect' });
          }
        }
        self.publish('reconnect', self.transport.name, self.reconnectionAttempts);
      }

      clearTimeout(self.reconnectionTimer);

      self.removeListener('connect_failed', maybeReconnect);
      self.removeListener('connect', maybeReconnect);

      self.reconnecting = false;

      delete self.reconnectionAttempts;
      delete self.reconnectionDelay;
      delete self.reconnectionTimer;
      delete self.redoTransports;

      self.options['try multiple transports'] = tryMultiple;
    };

    function maybeReconnect () {
      if (!self.reconnecting) {
        return;
      }

      if (self.connected) {
        return reset();
      };

      if (self.connecting && self.reconnecting) {
        return self.reconnectionTimer = setTimeout(maybeReconnect, 1000);
      }

      if (self.reconnectionAttempts++ >= maxAttempts) {
        if (!self.redoTransports) {
          self.on('connect_failed', maybeReconnect);
          self.options['try multiple transports'] = true;
          self.transports = self.origTransports;
          self.transport = self.getTransport();
          self.redoTransports = true;
          self.connect();
        } else {
          self.publish('reconnect_failed');
          reset();
        }
      } else {
        if (self.reconnectionDelay < limit) {
          self.reconnectionDelay *= 2; // exponential back off
        }

        self.connect();
        self.publish('reconnecting', self.reconnectionDelay, self.reconnectionAttempts);
        self.reconnectionTimer = setTimeout(maybeReconnect, self.reconnectionDelay);
      }
    };

    this.options['try multiple transports'] = false;
    this.reconnectionTimer = setTimeout(maybeReconnect, this.reconnectionDelay);

    this.on('connect', maybeReconnect);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);
/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io) {

  /**
   * Expose constructor.
   */

  exports.SocketNamespace = SocketNamespace;

  /**
   * Socket namespace constructor.
   *
   * @constructor
   * @api public
   */

  function SocketNamespace (socket, name) {
    this.socket = socket;
    this.name = name || '';
    this.flags = {};
    this.json = new Flag(this, 'json');
    this.ackPackets = 0;
    this.acks = {};
  };

  /**
   * Apply EventEmitter mixin.
   */

  io.util.mixin(SocketNamespace, io.EventEmitter);

  /**
   * Copies emit since we override it
   *
   * @api private
   */

  SocketNamespace.prototype.$emit = io.EventEmitter.prototype.emit;

  /**
   * Creates a new namespace, by proxying the request to the socket. This
   * allows us to use the synax as we do on the server.
   *
   * @api public
   */

  SocketNamespace.prototype.of = function () {
    return this.socket.of.apply(this.socket, arguments);
  };

  /**
   * Sends a packet.
   *
   * @api private
   */

  SocketNamespace.prototype.packet = function (packet) {
    packet.endpoint = this.name;
    this.socket.packet(packet);
    this.flags = {};
    return this;
  };

  /**
   * Sends a message
   *
   * @api public
   */

  SocketNamespace.prototype.send = function (data, fn) {
    var packet = {
        type: this.flags.json ? 'json' : 'message'
      , data: data
    };

    if ('function' == typeof fn) {
      packet.id = ++this.ackPackets;
      packet.ack = true;
      this.acks[packet.id] = fn;
    }

    return this.packet(packet);
  };

  /**
   * Emits an event
   *
   * @api public
   */
  
  SocketNamespace.prototype.emit = function (name) {
    var args = Array.prototype.slice.call(arguments, 1)
      , lastArg = args[args.length - 1]
      , packet = {
            type: 'event'
          , name: name
        };

    if ('function' == typeof lastArg) {
      packet.id = ++this.ackPackets;
      packet.ack = 'data';
      this.acks[packet.id] = lastArg;
      args = args.slice(0, args.length - 1);
    }

    packet.args = args;

    return this.packet(packet);
  };

  /**
   * Disconnects the namespace
   *
   * @api private
   */

  SocketNamespace.prototype.disconnect = function () {
    if (this.name === '') {
      this.socket.disconnect();
    } else {
      this.packet({ type: 'disconnect' });
      this.$emit('disconnect');
    }

    return this;
  };

  /**
   * Handles a packet
   *
   * @api private
   */

  SocketNamespace.prototype.onPacket = function (packet) {
    var self = this;

    function ack () {
      self.packet({
          type: 'ack'
        , args: io.util.toArray(arguments)
        , ackId: packet.id
      });
    };

    switch (packet.type) {
      case 'connect':
        this.$emit('connect');
        break;

      case 'disconnect':
        if (this.name === '') {
          this.socket.onDisconnect(packet.reason || 'booted');
        } else {
          this.$emit('disconnect', packet.reason);
        }
        break;

      case 'message':
      case 'json':
        var params = ['message', packet.data];

        if (packet.ack == 'data') {
          params.push(ack);
        } else if (packet.ack) {
          this.packet({ type: 'ack', ackId: packet.id });
        }

        this.$emit.apply(this, params);
        break;

      case 'event':
        var params = [packet.name].concat(packet.args);

        if (packet.ack == 'data')
          params.push(ack);

        this.$emit.apply(this, params);
        break;

      case 'ack':
        if (this.acks[packet.ackId]) {
          this.acks[packet.ackId].apply(this, packet.args);
          delete this.acks[packet.ackId];
        }
        break;

      case 'error':
        if (packet.advice){
          this.socket.onError(packet);
        } else {
          if (packet.reason == 'unauthorized') {
            this.$emit('connect_failed', packet.reason);
          } else {
            this.$emit('error', packet.reason);
          }
        }
        break;
    }
  };

  /**
   * Flag interface.
   *
   * @api private
   */

  function Flag (nsp, name) {
    this.namespace = nsp;
    this.name = name;
  };

  /**
   * Send a message
   *
   * @api public
   */

  Flag.prototype.send = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.send.apply(this.namespace, arguments);
  };

  /**
   * Emit an event
   *
   * @api public
   */

  Flag.prototype.emit = function () {
    this.namespace.flags[this.name] = true;
    this.namespace.emit.apply(this.namespace, arguments);
  };

})(
    'undefined' != typeof io ? io : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports.websocket = WS;

  /**
   * The WebSocket transport uses the HTML5 WebSocket API to establish an
   * persistent connection with the Socket.IO server. This transport will also
   * be inherited by the FlashSocket fallback as it provides a API compatible
   * polyfill for the WebSockets.
   *
   * @constructor
   * @extends {io.Transport}
   * @api public
   */

  function WS (socket) {
    io.Transport.apply(this, arguments);
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(WS, io.Transport);

  /**
   * Transport name
   *
   * @api public
   */

  WS.prototype.name = 'websocket';

  /**
   * Initializes a new `WebSocket` connection with the Socket.IO server. We attach
   * all the appropriate listeners to handle the responses from the server.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.open = function () {
    var query = io.util.query(this.socket.options.query)
      , self = this
      , Socket


    if (!Socket) {
      Socket = global.MozWebSocket || global.WebSocket;
    }

    this.websocket = new Socket(this.prepareUrl() + query);

    this.websocket.onopen = function () {
      self.onOpen();
      self.socket.setBuffer(false);
    };
    this.websocket.onmessage = function (ev) {
      self.onData(ev.data);
    };
    this.websocket.onclose = function () {
      self.onClose();
      self.socket.setBuffer(true);
    };
    this.websocket.onerror = function (e) {
      self.onError(e);
    };

    return this;
  };

  /**
   * Send a message to the Socket.IO server. The message will automatically be
   * encoded in the correct message format.
   *
   * @returns {Transport}
   * @api public
   */

  // Do to a bug in the current IDevices browser, we need to wrap the send in a 
  // setTimeout, when they resume from sleeping the browser will crash if 
  // we don't allow the browser time to detect the socket has been closed
  if (io.util.ua.iDevice) {
    WS.prototype.send = function (data) {
      var self = this;
      setTimeout(function() {
         self.websocket.send(data);
      },0);
      return this;
    };
  } else {
    WS.prototype.send = function (data) {
      this.websocket.send(data);
      return this;
    };
  }

  /**
   * Payload
   *
   * @api private
   */

  WS.prototype.payload = function (arr) {
    for (var i = 0, l = arr.length; i < l; i++) {
      this.packet(arr[i]);
    }
    return this;
  };

  /**
   * Disconnect the established `WebSocket` connection.
   *
   * @returns {Transport}
   * @api public
   */

  WS.prototype.close = function () {
    this.websocket.close();
    return this;
  };

  /**
   * Handle the errors that `WebSocket` might be giving when we
   * are attempting to connect or send messages.
   *
   * @param {Error} e The error.
   * @api private
   */

  WS.prototype.onError = function (e) {
    this.socket.onError(e);
  };

  /**
   * Returns the appropriate scheme for the URI generation.
   *
   * @api private
   */
  WS.prototype.scheme = function () {
    return this.socket.options.secure ? 'wss' : 'ws';
  };

  /**
   * Checks if the browser has support for native `WebSockets` and that
   * it's not the polyfill created for the FlashSocket transport.
   *
   * @return {Boolean}
   * @api public
   */

  WS.check = function () {
    return ('WebSocket' in global && !('__addTask' in WebSocket))
          || 'MozWebSocket' in global;
  };

  /**
   * Check if the `WebSocket` transport support cross domain communications.
   *
   * @returns {Boolean}
   * @api public
   */

  WS.xdomainCheck = function () {
    return true;
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('websocket');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   *
   * @api public
   */

  exports.XHR = XHR;

  /**
   * XHR constructor
   *
   * @costructor
   * @api public
   */

  function XHR (socket) {
    if (!socket) return;

    io.Transport.apply(this, arguments);
    this.sendBuffer = [];
  };

  /**
   * Inherits from Transport.
   */

  io.util.inherit(XHR, io.Transport);

  /**
   * Establish a connection
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.open = function () {
    this.socket.setBuffer(false);
    this.onOpen();
    this.get();

    // we need to make sure the request succeeds since we have no indication
    // whether the request opened or not until it succeeded.
    this.setCloseTimeout();

    return this;
  };

  /**
   * Check if we need to send data to the Socket.IO server, if we have data in our
   * buffer we encode it and forward it to the `post` method.
   *
   * @api private
   */

  XHR.prototype.payload = function (payload) {
    var msgs = [];

    for (var i = 0, l = payload.length; i < l; i++) {
      msgs.push(io.parser.encodePacket(payload[i]));
    }

    this.send(io.parser.encodePayload(msgs));
  };

  /**
   * Send data to the Socket.IO server.
   *
   * @param data The message
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.send = function (data) {
    this.post(data);
    return this;
  };

  /**
   * Posts a encoded message to the Socket.IO server.
   *
   * @param {String} data A encoded message.
   * @api private
   */

  function empty () { };

  XHR.prototype.post = function (data) {
    var self = this;
    this.socket.setBuffer(true);

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;
        self.posting = false;

        if (this.status == 200){
          self.socket.setBuffer(false);
        } else {
          self.onClose();
        }
      }
    }

    function onload () {
      this.onload = empty;
      self.socket.setBuffer(false);
    };

    this.sendXHR = this.request('POST');

    if (global.XDomainRequest && this.sendXHR instanceof XDomainRequest) {
      this.sendXHR.onload = this.sendXHR.onerror = onload;
    } else {
      this.sendXHR.onreadystatechange = stateChange;
    }

    this.sendXHR.send(data);
  };

  /**
   * Disconnects the established `XHR` connection.
   *
   * @returns {Transport}
   * @api public
   */

  XHR.prototype.close = function () {
    this.onClose();
    return this;
  };

  /**
   * Generates a configured XHR request
   *
   * @param {String} url The url that needs to be requested.
   * @param {String} method The method the request should use.
   * @returns {XMLHttpRequest}
   * @api private
   */

  XHR.prototype.request = function (method) {
    var req = io.util.request(this.socket.isXDomain())
      , query = io.util.query(this.socket.options.query, 't=' + +new Date);

    req.open(method || 'GET', this.prepareUrl() + query, true);

    if (method == 'POST') {
      try {
        if (req.setRequestHeader) {
          req.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        } else {
          // XDomainRequest
          req.contentType = 'text/plain';
        }
      } catch (e) {}
    }

    return req;
  };

  /**
   * Returns the scheme to use for the transport URLs.
   *
   * @api private
   */

  XHR.prototype.scheme = function () {
    return this.socket.options.secure ? 'https' : 'http';
  };

  /**
   * Check if the XHR transports are supported
   *
   * @param {Boolean} xdomain Check if we support cross domain requests.
   * @returns {Boolean}
   * @api public
   */

  XHR.check = function (socket, xdomain) {
    try {
      var request = io.util.request(xdomain),
          usesXDomReq = (global.XDomainRequest && request instanceof XDomainRequest),
          socketProtocol = (socket && socket.options && socket.options.secure ? 'https:' : 'http:'),
          isXProtocol = (global.location && socketProtocol != global.location.protocol);
      if (request && !(usesXDomReq && isXProtocol)) {
        return true;
      }
    } catch(e) {}

    return false;
  };

  /**
   * Check if the XHR transport supports cross domain requests.
   *
   * @returns {Boolean}
   * @api public
   */

  XHR.xdomainCheck = function (socket) {
    return XHR.check(socket, true);
  };

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

/**
 * socket.io
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

(function (exports, io, global) {

  /**
   * Expose constructor.
   */

  exports['xhr-polling'] = XHRPolling;

  /**
   * The XHR-polling transport uses long polling XHR requests to create a
   * "persistent" connection with the server.
   *
   * @constructor
   * @api public
   */

  function XHRPolling () {
    io.Transport.XHR.apply(this, arguments);
  };

  /**
   * Inherits from XHR transport.
   */

  io.util.inherit(XHRPolling, io.Transport.XHR);

  /**
   * Merge the properties from XHR transport
   */

  io.util.merge(XHRPolling, io.Transport.XHR);

  /**
   * Transport name
   *
   * @api public
   */

  XHRPolling.prototype.name = 'xhr-polling';

  /**
   * Indicates whether heartbeats is enabled for this transport
   *
   * @api private
   */

  XHRPolling.prototype.heartbeats = function () {
    return false;
  };

  /** 
   * Establish a connection, for iPhone and Android this will be done once the page
   * is loaded.
   *
   * @returns {Transport} Chaining.
   * @api public
   */

  XHRPolling.prototype.open = function () {
    var self = this;

    io.Transport.XHR.prototype.open.call(self);
    return false;
  };

  /**
   * Starts a XHR request to wait for incoming messages.
   *
   * @api private
   */

  function empty () {};

  XHRPolling.prototype.get = function () {
    if (!this.isOpen) return;

    var self = this;

    function stateChange () {
      if (this.readyState == 4) {
        this.onreadystatechange = empty;

        if (this.status == 200) {
          self.onData(this.responseText);
          self.get();
        } else {
          self.onClose();
        }
      }
    };

    function onload () {
      this.onload = empty;
      this.onerror = empty;
      self.retryCounter = 1;
      self.onData(this.responseText);
      self.get();
    };

    function onerror () {
      self.retryCounter ++;
      if(!self.retryCounter || self.retryCounter > 3) {
        self.onClose();  
      } else {
        self.get();
      }
    };

    this.xhr = this.request();

    if (global.XDomainRequest && this.xhr instanceof XDomainRequest) {
      this.xhr.onload = onload;
      this.xhr.onerror = onerror;
    } else {
      this.xhr.onreadystatechange = stateChange;
    }

    this.xhr.send(null);
  };

  /**
   * Handle the unclean close behavior.
   *
   * @api private
   */

  XHRPolling.prototype.onClose = function () {
    io.Transport.XHR.prototype.onClose.call(this);

    if (this.xhr) {
      this.xhr.onreadystatechange = this.xhr.onload = this.xhr.onerror = empty;
      try {
        this.xhr.abort();
      } catch(e){}
      this.xhr = null;
    }
  };

  /**
   * Webkit based browsers show a infinit spinner when you start a XHR request
   * before the browsers onload event is called so we need to defer opening of
   * the transport until the onload event is called. Wrapping the cb in our
   * defer method solve this.
   *
   * @param {Socket} socket The socket instance that needs a transport
   * @param {Function} fn The callback
   * @api private
   */

  XHRPolling.prototype.ready = function (socket, fn) {
    var self = this;

    io.util.defer(function () {
      fn.call(self);
    });
  };

  /**
   * Add the transport to your public io.transports array.
   *
   * @api private
   */

  io.transports.push('xhr-polling');

})(
    'undefined' != typeof io ? io.Transport : module.exports
  , 'undefined' != typeof io ? io : module.parent.exports
  , this
);

if (typeof define === "function" && define.amd) {
  define([], function () { return io; });
}
})();;(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",Function(['require','module','exports','__dirname','__filename','process','global'],"function filter (xs, fn) {\n    var res = [];\n    for (var i = 0; i < xs.length; i++) {\n        if (fn(xs[i], i, xs)) res.push(xs[i]);\n    }\n    return res;\n}\n\n// resolves . and .. elements in a path array with directory names there\n// must be no slashes, empty elements, or device names (c:\\) in the array\n// (so also no leading and trailing slashes - it does not distinguish\n// relative and absolute paths)\nfunction normalizeArray(parts, allowAboveRoot) {\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = parts.length; i >= 0; i--) {\n    var last = parts[i];\n    if (last == '.') {\n      parts.splice(i, 1);\n    } else if (last === '..') {\n      parts.splice(i, 1);\n      up++;\n    } else if (up) {\n      parts.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (allowAboveRoot) {\n    for (; up--; up) {\n      parts.unshift('..');\n    }\n  }\n\n  return parts;\n}\n\n// Regex to split a filename into [*, dir, basename, ext]\n// posix version\nvar splitPathRe = /^(.+\\/(?!$)|\\/)?((?:.+?)?(\\.[^.]*)?)$/;\n\n// path.resolve([from ...], to)\n// posix version\nexports.resolve = function() {\nvar resolvedPath = '',\n    resolvedAbsolute = false;\n\nfor (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {\n  var path = (i >= 0)\n      ? arguments[i]\n      : process.cwd();\n\n  // Skip empty and invalid entries\n  if (typeof path !== 'string' || !path) {\n    continue;\n  }\n\n  resolvedPath = path + '/' + resolvedPath;\n  resolvedAbsolute = path.charAt(0) === '/';\n}\n\n// At this point the path should be resolved to a full absolute path, but\n// handle relative paths to be safe (might happen when process.cwd() fails)\n\n// Normalize the path\nresolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {\n    return !!p;\n  }), !resolvedAbsolute).join('/');\n\n  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';\n};\n\n// path.normalize(path)\n// posix version\nexports.normalize = function(path) {\nvar isAbsolute = path.charAt(0) === '/',\n    trailingSlash = path.slice(-1) === '/';\n\n// Normalize the path\npath = normalizeArray(filter(path.split('/'), function(p) {\n    return !!p;\n  }), !isAbsolute).join('/');\n\n  if (!path && !isAbsolute) {\n    path = '.';\n  }\n  if (path && trailingSlash) {\n    path += '/';\n  }\n  \n  return (isAbsolute ? '/' : '') + path;\n};\n\n\n// posix version\nexports.join = function() {\n  var paths = Array.prototype.slice.call(arguments, 0);\n  return exports.normalize(filter(paths, function(p, index) {\n    return p && typeof p === 'string';\n  }).join('/'));\n};\n\n\nexports.dirname = function(path) {\n  var dir = splitPathRe.exec(path)[1] || '';\n  var isWindows = false;\n  if (!dir) {\n    // No dirname\n    return '.';\n  } else if (dir.length === 1 ||\n      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {\n    // It is just a slash or a drive letter with a slash\n    return dir;\n  } else {\n    // It is a full dirname, strip trailing slash\n    return dir.substring(0, dir.length - 1);\n  }\n};\n\n\nexports.basename = function(path, ext) {\n  var f = splitPathRe.exec(path)[2] || '';\n  // TODO: make this comparison case-insensitive on windows?\n  if (ext && f.substr(-1 * ext.length) === ext) {\n    f = f.substr(0, f.length - ext.length);\n  }\n  return f;\n};\n\n\nexports.extname = function(path) {\n  return splitPathRe.exec(path)[3] || '';\n};\n\nexports.relative = function(from, to) {\n  from = exports.resolve(from).substr(1);\n  to = exports.resolve(to).substr(1);\n\n  function trim(arr) {\n    var start = 0;\n    for (; start < arr.length; start++) {\n      if (arr[start] !== '') break;\n    }\n\n    var end = arr.length - 1;\n    for (; end >= 0; end--) {\n      if (arr[end] !== '') break;\n    }\n\n    if (start > end) return [];\n    return arr.slice(start, end - start + 1);\n  }\n\n  var fromParts = trim(from.split('/'));\n  var toParts = trim(to.split('/'));\n\n  var length = Math.min(fromParts.length, toParts.length);\n  var samePartsLength = length;\n  for (var i = 0; i < length; i++) {\n    if (fromParts[i] !== toParts[i]) {\n      samePartsLength = i;\n      break;\n    }\n  }\n\n  var outputParts = [];\n  for (var i = samePartsLength; i < fromParts.length; i++) {\n    outputParts.push('..');\n  }\n\n  outputParts = outputParts.concat(toParts.slice(samePartsLength));\n\n  return outputParts.join('/');\n};\n\n//@ sourceURL=path"
));

require.define("__browserify_process",Function(['require','module','exports','__dirname','__filename','process','global'],"var process = module.exports = {};\n\nprocess.nextTick = (function () {\n    var canSetImmediate = typeof window !== 'undefined'\n        && window.setImmediate;\n    var canPost = typeof window !== 'undefined'\n        && window.postMessage && window.addEventListener\n    ;\n\n    if (canSetImmediate) {\n        return function (f) { return window.setImmediate(f) };\n    }\n\n    if (canPost) {\n        var queue = [];\n        window.addEventListener('message', function (ev) {\n            if (ev.source === window && ev.data === 'browserify-tick') {\n                ev.stopPropagation();\n                if (queue.length > 0) {\n                    var fn = queue.shift();\n                    fn();\n                }\n            }\n        }, true);\n\n        return function nextTick(fn) {\n            queue.push(fn);\n            window.postMessage('browserify-tick', '*');\n        };\n    }\n\n    return function nextTick(fn) {\n        setTimeout(fn, 0);\n    };\n})();\n\nprocess.title = 'browser';\nprocess.browser = true;\nprocess.env = {};\nprocess.argv = [];\n\nprocess.binding = function (name) {\n    if (name === 'evals') return (require)('vm')\n    else throw new Error('No such module. (Possibly not yet loaded)')\n};\n\n(function () {\n    var cwd = '/';\n    var path;\n    process.cwd = function () { return cwd };\n    process.chdir = function (dir) {\n        if (!path) path = require('path');\n        cwd = path.resolve(dir, cwd);\n    };\n})();\n\n//@ sourceURL=__browserify_process"
));

require.define("/node_modules/derby/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./lib/derby.js\"}\n//@ sourceURL=/node_modules/derby/package.json"
));

require.define("/node_modules/derby/lib/derby.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var racer = require('racer')\n  , component = require('./component')\n  , derby = module.exports = Object.create(racer)\n  , derbyPlugin = racer.util.isServer ?\n      __dirname + '/derby.server' : require('./derby.browser');\n\n// Allow derby object to be targeted via plugin.decorate\nracer._makePlugable('derby', derby);\n\nderby\n  // Shared methods\n  .use(component)\n  // Server-side or browser-side methods\n  .use(derbyPlugin);\n\n//@ sourceURL=/node_modules/derby/lib/derby.js"
));

require.define("/node_modules/derby/node_modules/racer/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./lib/racer.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/racer/package.json"
));

require.define("/node_modules/derby/node_modules/racer/lib/racer.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./util')\n  , mergeAll = util.mergeAll\n  , isServer = util.isServer\n  , isClient = !isServer;\n\nif (isClient) require('es5-shim');\n\nvar EventEmitter = require('events').EventEmitter\n  , plugin = require('./plugin')\n  , uuid = require('node-uuid');\n\nvar racer = module.exports = new EventEmitter();\n\nmergeAll(racer, plugin, {\n  version: require('../package.json').version\n, isServer: isServer\n, isClient: isClient\n, protected: {\n    Model: require('./Model')\n  }\n, util: util\n, uuid: function () {\n    return uuid.v4();\n  }\n, transaction: require('./transaction')\n});\n\n// Note that this plugin is passed by string to prevent Browserify from\n// including it\nif (isServer) {\n  racer.use(__dirname + '/racer.server');\n}\n\nracer\n  .use(require('./mutators'))\n  .use(require('./refs'))\n  .use(require('./pubSub'))\n  .use(require('./computed'))\n  .use(require('./descriptor'))\n  .use(require('./context'))\n  .use(require('./txns'))\n  .use(require('./reconnect'));\n\nif (isServer) {\n  racer.use(__dirname + '/adapters/pubsub-memory');\n  racer.use(__dirname + '/accessControl')\n  racer.use(__dirname + '/hooks')\n}\n\n// The browser module must be included last, since it creates a model instance,\n// before which all plugins should be included\nif (isClient) {\n  racer.use(require('./racer.browser'));\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/racer.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/util/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var toString = Object.prototype.toString\n  , hasOwnProperty = Object.prototype.hasOwnProperty\n  , isServer = typeof window === 'undefined'\n  , isProduction = isServer && process.env.NODE_ENV === 'production';\n\nmodule.exports = {\n  isServer: isServer\n, isProduction: isProduction\n, isArguments: isArguments\n, mergeAll: mergeAll\n, merge: merge\n, hasKeys: hasKeys\n, escapeRegExp: escapeRegExp\n, deepEqual: deepEqual\n, deepCopy: deepCopy\n, indexOf: indexOf\n, indexOfFn: indexOfFn\n, deepIndexOf: deepIndexOf\n, equalsNaN: equalsNaN\n, equal: equal\n, countWhile: countWhile\n, noop: noop\n, Promise: require('./Promise')\n, async: require('./async')\n};\n\nfunction isArguments (obj) {\n  return toString.call(obj) === '[object Arguments]';\n}\n\nfunction mergeAll (to /*, froms... */) {\n  for (var i = 1, l = arguments.length, from, key; i < l; i++) {\n    from = arguments[i];\n    if (from) for (key in from) to[key] = from[key];\n  }\n  return to;\n}\n\nfunction merge (to, from) {\n  for (var key in from) to[key] = from[key];\n  return to;\n}\n\nfunction hasKeys (obj, ignore) {\n  for (var key in obj)\n    if (key !== ignore) return true;\n  return false;\n}\n\n/**\n   * Escape a string to be used as teh source of a RegExp such that it matches\n   * literally.\n   */\nfunction escapeRegExp (s) {\n  return s.replace(/[\\-\\[\\]{}()*+?.,\\\\\\^$|#\\s]/g, '\\\\$&');\n}\n\n/**\n * Modified from node's assert.js\n */\nfunction deepEqual (actual, expected, ignore) {\n  // 7.1. All identical values are equivalent, as determined by ===.\n  if (actual === expected) return true;\n\n  // 7.2. If the expected value is a Date object, the actual value is\n  // equivalent if it is also a Date object that refers to the same time.\n  if (actual instanceof Date && expected instanceof Date)\n    return actual.getTime() === expected.getTime();\n\n  if (typeof actual === 'function' && typeof expected === 'function')\n    return actual === expected || actual.toString() === expected.toString();\n\n  // 7.3. Other pairs that do not both pass typeof value == 'object',\n  // equivalence is determined by ==.\n  if (typeof actual !== 'object' && typeof expected !== 'object')\n    return actual === expected;\n\n  // 7.4. For all other Object pairs, including Array objects, equivalence is\n  // determined by having the same number of owned properties (as verified\n  // with Object.prototype.hasOwnProperty.call), the same set of keys\n  // (although not necessarily the same order), equivalent values for every\n  // corresponding key, and an identical 'prototype' property. Note: this\n  // accounts for both named and indexed properties on Arrays.\n  if (ignore) {\n    var ignoreMap = {}\n      , i = ignore.length\n    while (i--) {\n      ignoreMap[ignore[i]] = true;\n    }\n  }\n  return objEquiv(actual, expected, ignoreMap);\n}\n\nfunction keysWithout (obj, ignoreMap) {\n  var out = []\n    , key\n  for (key in obj) {\n    if (!ignoreMap[key] && hasOwnProperty.call(obj, key)) out.push(key);\n  }\n  return out;\n}\n\n/**\n * Modified from node's assert.js\n */\nfunction objEquiv (a, b, ignoreMap) {\n  var i, key, ka, kb;\n\n  if (a == null || b == null) return false;\n\n  // an identical 'prototype' property.\n  if (a.prototype !== b.prototype) return false;\n\n  //~~~I've managed to break Object.keys through screwy arguments passing.\n  //   Converting to array solves the problem.\n  if (isArguments(a)) {\n    if (! isArguments(b)) return false;\n    a = pSlice.call(a);\n    b = pSlice.call(b);\n    return deepEqual(a, b);\n  }\n  try {\n    if (ignoreMap) {\n      ka = keysWithout(a, ignoreMap);\n      kb = keysWithout(b, ignoreMap);\n    } else {\n      ka = Object.keys(a);\n      kb = Object.keys(b);\n    }\n  } catch (e) {\n    // happens when one is a string literal and the other isn't\n    return false;\n  }\n  // having the same number of owned properties (keys incorporates\n  // hasOwnProperty)\n  if (ka.length !== kb.length) return false;\n\n  // the same set of keys (although not necessarily the same order),\n  ka.sort();\n  kb.sort();\n\n  //~~~cheap key test\n  i = ka.length;\n  while (i--) {\n    if (ka[i] !== kb[i]) return false;\n  }\n\n  //equivalent values for every corresponding key, and\n  //~~~possibly expensive deep test\n  i = ka.length;\n  while (i--) {\n    key = ka[i];\n    if (! deepEqual(a[key], b[key])) return false;\n  }\n  return true;\n}\n\n// TODO Test this\nfunction deepCopy (obj) {\n  if (obj === null) return null;\n  if (obj instanceof Date) return new Date(obj);\n  if (typeof obj === 'object') {\n    var copy;\n    if (Array.isArray(obj)) {\n      copy = [];\n      for (var i = obj.length; i--; ) copy[i] = deepCopy(obj[i]);\n      return copy;\n    }\n    copy = {}\n    for (var k in obj) copy[k] = deepCopy(obj[k]);\n    return copy;\n  }\n  return obj;\n}\n\nfunction indexOf (list, obj, isEqual) {\n  for (var i = 0, l = list.length; i < l; i++)\n    if (isEqual(obj, list[i])) return i;\n  return -1;\n}\n\nfunction indexOfFn (list, fn) {\n  for (var i = 0, l = list.length; i < l; i++) {\n    if (fn(list[i])) return i;\n  }\n  return -1;\n}\n\nfunction deepIndexOf (list, obj) {\n  return indexOf(list, obj, deepEqual);\n}\n\nfunction equalsNaN (x) {\n  return x !== x;\n}\n\nfunction equal (a, b) {\n  return (a === b) || (equalsNaN(a) && equalsNaN(b));\n}\n\nfunction countWhile (array, predicate) {\n  var count = 0;\n  for (var i = 0, l = array.length; i < l; i++)\n    if (! predicate(array[i], i)) return count++;\n  return count;\n}\n\nfunction noop() {}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/util/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/util/Promise.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./index')\n  , finishAfter = require('./async').finishAfter;\n\nmodule.exports = Promise;\n\nfunction Promise () {\n  this.callbacks = [];\n  this.resolved = false;\n}\n\nPromise.prototype = {\n  resolve: function (err, value) {\n    if (this.resolved) {\n      throw new Error('Promise has already been resolved');\n    }\n    this.resolved = true;\n    this.err = err;\n    this.value = value;\n    var callbacks = this.callbacks;\n    for (var i = 0, l = callbacks.length; i < l; i++) {\n      callbacks[i](err, value);\n    }\n    this.callbacks = [];\n    return this;\n  }\n\n, on: function (callback) {\n    if (this.resolved) {\n      callback(this.err, this.value);\n    } else {\n      this.callbacks.push(callback);\n    }\n    return this;\n  }\n\n, clear: function () {\n    this.resolved = false;\n    delete this.value;\n    delete this.err;\n    return this;\n  }\n};\n\nPromise.parallel = function (promises) {\n  var composite = new Promise()\n    , didErr;\n\n  if (Array.isArray(promises)) {\n    var compositeValue = []\n      , remaining = promises.length;\n    promises.forEach( function (promise, i) {\n      promise.on( function (err, val) {\n        if (didErr) return;\n        if (err) {\n          didErr = true;\n          return composite.resolve(err);\n        }\n        compositeValue[i] = val;\n        --remaining || composite.resolve(null, compositeValue);\n      });\n    });\n  } else {\n    var compositeValue = {}\n      , remaining = Object.keys(promises).length;\n    for (var k in promises) {\n      var promise = promises[k];\n      (function (k) {\n        promise.on( function (err, val) {\n          if (didErr) return;\n          if (err) {\n            didErr = true;\n            return composite.resolve(err);\n          }\n          compositeValue[k] = val;\n          --remaining || composite.resolve(null, compositeValue);\n        });\n      })(k);\n    }\n  }\n\n  return composite;\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/util/Promise.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/util/async.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  finishAfter: finishAfter\n\n, forEach: function (items, fn, done) {\n    var finish = finishAfter(items.length, done);\n    for (var i = 0, l = items.length; i < l; i++) {\n      fn(items[i], finish);\n    }\n  }\n\n, bufferifyMethods: function (Klass, methodNames, opts) {\n    var await = opts.await\n      , fns = {}\n      , buffer = null;\n\n    methodNames.forEach( function (methodName) {\n      fns[methodName] = Klass.prototype[methodName];\n      Klass.prototype[methodName] = function () {\n        var didFlush = false\n          , self = this;\n\n        function flush () {\n          didFlush = true;\n\n          // When we call flush, we no longer need to buffer, so replace each\n          // method with the original method\n          methodNames.forEach( function (methodName) {\n            self[methodName] = fns[methodName];\n          });\n          delete await.alreadyCalled;\n\n          // Call the method with the first invocation arguments if this is\n          // during the first call to methodName, await called flush\n          // immediately, and we therefore have no buffered method calls.\n          if (!buffer) return;\n\n          // Otherwise, invoke the buffered method calls\n          for (var i = 0, l = buffer.length; i < l; i++) {\n            fns[methodName].apply(self, buffer[i]);\n          }\n          buffer = null;\n        } /* end flush */\n\n        // The first time we call methodName, run await\n        if (await.alreadyCalled) return;\n        await.alreadyCalled = true;\n        await.call(this, flush);\n\n        // If await decided we need no buffering and it called flush, then call\n        // the original function with the arguments to this first call to methodName.\n        if (didFlush) return this[methodName].apply(this, arguments);\n\n        // Otherwise, if we need to buffer calls to this method, then replace\n        // this method temporarily with code that buffers the method calls\n        // until `flush` is called\n        this[methodName] = function () {\n          if (!buffer) buffer = [];\n          buffer.push(arguments);\n        }\n        this[methodName].apply(this, arguments);\n      }\n    });\n  }\n\n, bufferify: function (methodName, opts) {\n    var fn = opts.fn\n      , await = opts.await\n      , buffer = null;\n\n    return function () {\n      var didFlush = false\n        , self = this;\n\n      function flush () {\n        didFlush = true;\n\n        // When we call flush, we no longer need to buffer, so replace this\n        // method with the original method\n        self[methodName] = fn;\n\n        // Call the method with the first invocation arguments if this is\n        // during the first call to methodName, await called flush immediately,\n        // and we therefore have no buffered method calls.\n        if (!buffer) return;\n\n        // Otherwise, invoke the buffered method calls\n        for (var i = 0, l = buffer.length; i < l; i++) {\n          fn.apply(self, buffer[i]);\n        }\n        buffer = null;\n      }\n\n      // The first time we call methodName, run awai\n      await.call(this, flush);\n\n      // If await decided we need no buffering and it called flush, then call\n      // the original function with the arguments to this first call to methodName\n      if (didFlush) return this[methodName].apply(this, arguments);\n\n      // Otherwise, if we need to buffer calls to this method, then replace\n      // this method temporarily with code that buffers the method calls until\n      // `flush` is called\n      this[methodName] = function () {\n        if (!buffer) buffer = [];\n        buffer.push(arguments);\n      }\n      this[methodName].apply(this, arguments);\n    }\n  }\n};\n\nfunction finishAfter (count, callback) {\n  if (!callback) callback = function (err) { if (err) throw err; };\n  if (!count || count === 1) return callback;\n  var err;\n  return function (_err) {\n    err || (err = _err);\n    --count || callback(err);\n  };\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/util/async.js"
));

require.define("/node_modules/derby/node_modules/racer/node_modules/es5-shim/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"es5-shim.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/racer/node_modules/es5-shim/package.json"
));

require.define("/node_modules/derby/node_modules/racer/node_modules/es5-shim/es5-shim.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Copyright 2009-2012 by contributors, MIT License\n// vim: ts=4 sts=4 sw=4 expandtab\n\n// Module systems magic dance\n(function (definition) {\n    // RequireJS\n    if (typeof define == \"function\") {\n        define(definition);\n    // YUI3\n    } else if (typeof YUI == \"function\") {\n        YUI.add(\"es5\", definition);\n    // CommonJS and <script>\n    } else {\n        definition();\n    }\n})(function () {\n\n/**\n * Brings an environment as close to ECMAScript 5 compliance\n * as is possible with the facilities of erstwhile engines.\n *\n * Annotated ES5: http://es5.github.com/ (specific links below)\n * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf\n * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/\n */\n\n//\n// Function\n// ========\n//\n\n// ES-5 15.3.4.5\n// http://es5.github.com/#x15.3.4.5\n\nfunction Empty() {}\n\nif (!Function.prototype.bind) {\n    Function.prototype.bind = function bind(that) { // .length is 1\n        // 1. Let Target be the this value.\n        var target = this;\n        // 2. If IsCallable(Target) is false, throw a TypeError exception.\n        if (typeof target != \"function\") {\n            throw new TypeError(\"Function.prototype.bind called on incompatible \" + target);\n        }\n        // 3. Let A be a new (possibly empty) internal list of all of the\n        //   argument values provided after thisArg (arg1, arg2 etc), in order.\n        // XXX slicedArgs will stand in for \"A\" if used\n        var args = slice.call(arguments, 1); // for normal call\n        // 4. Let F be a new native ECMAScript object.\n        // 11. Set the [[Prototype]] internal property of F to the standard\n        //   built-in Function prototype object as specified in 15.3.3.1.\n        // 12. Set the [[Call]] internal property of F as described in\n        //   15.3.4.5.1.\n        // 13. Set the [[Construct]] internal property of F as described in\n        //   15.3.4.5.2.\n        // 14. Set the [[HasInstance]] internal property of F as described in\n        //   15.3.4.5.3.\n        var bound = function () {\n\n            if (this instanceof bound) {\n                // 15.3.4.5.2 [[Construct]]\n                // When the [[Construct]] internal method of a function object,\n                // F that was created using the bind function is called with a\n                // list of arguments ExtraArgs, the following steps are taken:\n                // 1. Let target be the value of F's [[TargetFunction]]\n                //   internal property.\n                // 2. If target has no [[Construct]] internal method, a\n                //   TypeError exception is thrown.\n                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal\n                //   property.\n                // 4. Let args be a new list containing the same values as the\n                //   list boundArgs in the same order followed by the same\n                //   values as the list ExtraArgs in the same order.\n                // 5. Return the result of calling the [[Construct]] internal\n                //   method of target providing args as the arguments.\n\n                var result = target.apply(\n                    this,\n                    args.concat(slice.call(arguments))\n                );\n                if (Object(result) === result) {\n                    return result;\n                }\n                return this;\n\n            } else {\n                // 15.3.4.5.1 [[Call]]\n                // When the [[Call]] internal method of a function object, F,\n                // which was created using the bind function is called with a\n                // this value and a list of arguments ExtraArgs, the following\n                // steps are taken:\n                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal\n                //   property.\n                // 2. Let boundThis be the value of F's [[BoundThis]] internal\n                //   property.\n                // 3. Let target be the value of F's [[TargetFunction]] internal\n                //   property.\n                // 4. Let args be a new list containing the same values as the\n                //   list boundArgs in the same order followed by the same\n                //   values as the list ExtraArgs in the same order.\n                // 5. Return the result of calling the [[Call]] internal method\n                //   of target providing boundThis as the this value and\n                //   providing args as the arguments.\n\n                // equiv: target.call(this, ...boundArgs, ...args)\n                return target.apply(\n                    that,\n                    args.concat(slice.call(arguments))\n                );\n\n            }\n\n        };\n        if(target.prototype) {\n            Empty.prototype = target.prototype;\n            bound.prototype = new Empty();\n            // Clean up dangling references.\n            Empty.prototype = null;\n        }\n        // XXX bound.length is never writable, so don't even try\n        //\n        // 15. If the [[Class]] internal property of Target is \"Function\", then\n        //     a. Let L be the length property of Target minus the length of A.\n        //     b. Set the length own property of F to either 0 or L, whichever is\n        //       larger.\n        // 16. Else set the length own property of F to 0.\n        // 17. Set the attributes of the length own property of F to the values\n        //   specified in 15.3.5.1.\n\n        // TODO\n        // 18. Set the [[Extensible]] internal property of F to true.\n\n        // TODO\n        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).\n        // 20. Call the [[DefineOwnProperty]] internal method of F with\n        //   arguments \"caller\", PropertyDescriptor {[[Get]]: thrower, [[Set]]:\n        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and\n        //   false.\n        // 21. Call the [[DefineOwnProperty]] internal method of F with\n        //   arguments \"arguments\", PropertyDescriptor {[[Get]]: thrower,\n        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},\n        //   and false.\n\n        // TODO\n        // NOTE Function objects created using Function.prototype.bind do not\n        // have a prototype property or the [[Code]], [[FormalParameters]], and\n        // [[Scope]] internal properties.\n        // XXX can't delete prototype in pure-js.\n\n        // 22. Return F.\n        return bound;\n    };\n}\n\n// Shortcut to an often accessed properties, in order to avoid multiple\n// dereference that costs universally.\n// _Please note: Shortcuts are defined after `Function.prototype.bind` as we\n// us it in defining shortcuts.\nvar call = Function.prototype.call;\nvar prototypeOfArray = Array.prototype;\nvar prototypeOfObject = Object.prototype;\nvar slice = prototypeOfArray.slice;\n// Having a toString local variable name breaks in Opera so use _toString.\nvar _toString = call.bind(prototypeOfObject.toString);\nvar owns = call.bind(prototypeOfObject.hasOwnProperty);\n\n// If JS engine supports accessors creating shortcuts.\nvar defineGetter;\nvar defineSetter;\nvar lookupGetter;\nvar lookupSetter;\nvar supportsAccessors;\nif ((supportsAccessors = owns(prototypeOfObject, \"__defineGetter__\"))) {\n    defineGetter = call.bind(prototypeOfObject.__defineGetter__);\n    defineSetter = call.bind(prototypeOfObject.__defineSetter__);\n    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);\n    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);\n}\n\n//\n// Array\n// =====\n//\n\n// ES5 15.4.4.12\n// http://es5.github.com/#x15.4.4.12\n// Default value for second param\n// [bugfix, ielt9, old browsers]\n// IE < 9 bug: [1,2].splice(0).join(\"\") == \"\" but should be \"12\"\nif ([1,2].splice(0).length != 2) {\n    var array_splice = Array.prototype.splice;\n    Array.prototype.splice = function(start, deleteCount) {\n        if (!arguments.length) {\n            return [];\n        } else {\n            return array_splice.apply(this, [\n                start === void 0 ? 0 : start,\n                deleteCount === void 0 ? (this.length - start) : deleteCount\n            ].concat(slice.call(arguments, 2)))\n        }\n    };\n}\n\n// ES5 15.4.4.12\n// http://es5.github.com/#x15.4.4.13\n// Return len+argCount.\n// [bugfix, ielt8]\n// IE < 8 bug: [].unshift(0) == undefined but should be \"1\"\nif ([].unshift(0) != 1) {\n    var array_unshift = Array.prototype.unshift;\n    Array.prototype.unshift = function() {\n        array_unshift.apply(this, arguments);\n        return this.length;\n    };\n}\n\n// ES5 15.4.3.2\n// http://es5.github.com/#x15.4.3.2\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray\nif (!Array.isArray) {\n    Array.isArray = function isArray(obj) {\n        return _toString(obj) == \"[object Array]\";\n    };\n}\n\n// The IsCallable() check in the Array functions\n// has been replaced with a strict check on the\n// internal class of the object to trap cases where\n// the provided function was actually a regular\n// expression literal, which in V8 and\n// JavaScriptCore is a typeof \"function\".  Only in\n// V8 are regular expression literals permitted as\n// reduce parameters, so it is desirable in the\n// general case for the shim to match the more\n// strict and common behavior of rejecting regular\n// expressions.\n\n// ES5 15.4.4.18\n// http://es5.github.com/#x15.4.4.18\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach\n\n// Check failure of by-index access of string characters (IE < 9)\n// and failure of `0 in boxedString` (Rhino)\nvar boxedString = Object(\"a\"),\n    splitString = boxedString[0] != \"a\" || !(0 in boxedString);\n\nif (!Array.prototype.forEach) {\n    Array.prototype.forEach = function forEach(fun /*, thisp*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            thisp = arguments[1],\n            i = -1,\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(); // TODO message\n        }\n\n        while (++i < length) {\n            if (i in self) {\n                // Invoke the callback function with call, passing arguments:\n                // context, property value, property key, thisArg object\n                // context\n                fun.call(thisp, self[i], i, object);\n            }\n        }\n    };\n}\n\n// ES5 15.4.4.19\n// http://es5.github.com/#x15.4.4.19\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map\nif (!Array.prototype.map) {\n    Array.prototype.map = function map(fun /*, thisp*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0,\n            result = Array(length),\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self)\n                result[i] = fun.call(thisp, self[i], i, object);\n        }\n        return result;\n    };\n}\n\n// ES5 15.4.4.20\n// http://es5.github.com/#x15.4.4.20\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter\nif (!Array.prototype.filter) {\n    Array.prototype.filter = function filter(fun /*, thisp */) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                    object,\n            length = self.length >>> 0,\n            result = [],\n            value,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self) {\n                value = self[i];\n                if (fun.call(thisp, value, i, object)) {\n                    result.push(value);\n                }\n            }\n        }\n        return result;\n    };\n}\n\n// ES5 15.4.4.16\n// http://es5.github.com/#x15.4.4.16\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every\nif (!Array.prototype.every) {\n    Array.prototype.every = function every(fun /*, thisp */) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && !fun.call(thisp, self[i], i, object)) {\n                return false;\n            }\n        }\n        return true;\n    };\n}\n\n// ES5 15.4.4.17\n// http://es5.github.com/#x15.4.4.17\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some\nif (!Array.prototype.some) {\n    Array.prototype.some = function some(fun /*, thisp */) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0,\n            thisp = arguments[1];\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        for (var i = 0; i < length; i++) {\n            if (i in self && fun.call(thisp, self[i], i, object)) {\n                return true;\n            }\n        }\n        return false;\n    };\n}\n\n// ES5 15.4.4.21\n// http://es5.github.com/#x15.4.4.21\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce\nif (!Array.prototype.reduce) {\n    Array.prototype.reduce = function reduce(fun /*, initial*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        // no value to return if no initial value and an empty array\n        if (!length && arguments.length == 1) {\n            throw new TypeError(\"reduce of empty array with no initial value\");\n        }\n\n        var i = 0;\n        var result;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i++];\n                    break;\n                }\n\n                // if array contains no values, no initial value to return\n                if (++i >= length) {\n                    throw new TypeError(\"reduce of empty array with no initial value\");\n                }\n            } while (true);\n        }\n\n        for (; i < length; i++) {\n            if (i in self) {\n                result = fun.call(void 0, result, self[i], i, object);\n            }\n        }\n\n        return result;\n    };\n}\n\n// ES5 15.4.4.22\n// http://es5.github.com/#x15.4.4.22\n// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight\nif (!Array.prototype.reduceRight) {\n    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {\n        var object = toObject(this),\n            self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                object,\n            length = self.length >>> 0;\n\n        // If no callback function or if callback is not a callable function\n        if (_toString(fun) != \"[object Function]\") {\n            throw new TypeError(fun + \" is not a function\");\n        }\n\n        // no value to return if no initial value, empty array\n        if (!length && arguments.length == 1) {\n            throw new TypeError(\"reduceRight of empty array with no initial value\");\n        }\n\n        var result, i = length - 1;\n        if (arguments.length >= 2) {\n            result = arguments[1];\n        } else {\n            do {\n                if (i in self) {\n                    result = self[i--];\n                    break;\n                }\n\n                // if array contains no values, no initial value to return\n                if (--i < 0) {\n                    throw new TypeError(\"reduceRight of empty array with no initial value\");\n                }\n            } while (true);\n        }\n\n        do {\n            if (i in this) {\n                result = fun.call(void 0, result, self[i], i, object);\n            }\n        } while (i--);\n\n        return result;\n    };\n}\n\n// ES5 15.4.4.14\n// http://es5.github.com/#x15.4.4.14\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf\nif (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {\n    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {\n        var self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                toObject(this),\n            length = self.length >>> 0;\n\n        if (!length) {\n            return -1;\n        }\n\n        var i = 0;\n        if (arguments.length > 1) {\n            i = toInteger(arguments[1]);\n        }\n\n        // handle negative indices\n        i = i >= 0 ? i : Math.max(0, length + i);\n        for (; i < length; i++) {\n            if (i in self && self[i] === sought) {\n                return i;\n            }\n        }\n        return -1;\n    };\n}\n\n// ES5 15.4.4.15\n// http://es5.github.com/#x15.4.4.15\n// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf\nif (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {\n    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {\n        var self = splitString && _toString(this) == \"[object String]\" ?\n                this.split(\"\") :\n                toObject(this),\n            length = self.length >>> 0;\n\n        if (!length) {\n            return -1;\n        }\n        var i = length - 1;\n        if (arguments.length > 1) {\n            i = Math.min(i, toInteger(arguments[1]));\n        }\n        // handle negative indices\n        i = i >= 0 ? i : length - Math.abs(i);\n        for (; i >= 0; i--) {\n            if (i in self && sought === self[i]) {\n                return i;\n            }\n        }\n        return -1;\n    };\n}\n\n//\n// Object\n// ======\n//\n\n// ES5 15.2.3.14\n// http://es5.github.com/#x15.2.3.14\nif (!Object.keys) {\n    // http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation\n    var hasDontEnumBug = true,\n        dontEnums = [\n            \"toString\",\n            \"toLocaleString\",\n            \"valueOf\",\n            \"hasOwnProperty\",\n            \"isPrototypeOf\",\n            \"propertyIsEnumerable\",\n            \"constructor\"\n        ],\n        dontEnumsLength = dontEnums.length;\n\n    for (var key in {\"toString\": null}) {\n        hasDontEnumBug = false;\n    }\n\n    Object.keys = function keys(object) {\n\n        if (\n            (typeof object != \"object\" && typeof object != \"function\") ||\n            object === null\n        ) {\n            throw new TypeError(\"Object.keys called on a non-object\");\n        }\n\n        var keys = [];\n        for (var name in object) {\n            if (owns(object, name)) {\n                keys.push(name);\n            }\n        }\n\n        if (hasDontEnumBug) {\n            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {\n                var dontEnum = dontEnums[i];\n                if (owns(object, dontEnum)) {\n                    keys.push(dontEnum);\n                }\n            }\n        }\n        return keys;\n    };\n\n}\n\n//\n// Date\n// ====\n//\n\n// ES5 15.9.5.43\n// http://es5.github.com/#x15.9.5.43\n// This function returns a String value represent the instance in time\n// represented by this Date object. The format of the String is the Date Time\n// string format defined in 15.9.1.15. All fields are present in the String.\n// The time zone is always UTC, denoted by the suffix Z. If the time value of\n// this object is not a finite Number a RangeError exception is thrown.\nvar negativeDate = -62198755200000,\n    negativeYearString = \"-000001\";\nif (\n    !Date.prototype.toISOString ||\n    (new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1)\n) {\n    Date.prototype.toISOString = function toISOString() {\n        var result, length, value, year, month;\n        if (!isFinite(this)) {\n            throw new RangeError(\"Date.prototype.toISOString called on non-finite value.\");\n        }\n\n        year = this.getUTCFullYear();\n\n        month = this.getUTCMonth();\n        // see https://github.com/kriskowal/es5-shim/issues/111\n        year += Math.floor(month / 12);\n        month = (month % 12 + 12) % 12;\n\n        // the date time string format is specified in 15.9.1.15.\n        result = [month + 1, this.getUTCDate(),\n            this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];\n        year = (\n            (year < 0 ? \"-\" : (year > 9999 ? \"+\" : \"\")) +\n            (\"00000\" + Math.abs(year))\n            .slice(0 <= year && year <= 9999 ? -4 : -6)\n        );\n\n        length = result.length;\n        while (length--) {\n            value = result[length];\n            // pad months, days, hours, minutes, and seconds to have two\n            // digits.\n            if (value < 10) {\n                result[length] = \"0\" + value;\n            }\n        }\n        // pad milliseconds to have three digits.\n        return (\n            year + \"-\" + result.slice(0, 2).join(\"-\") +\n            \"T\" + result.slice(2).join(\":\") + \".\" +\n            (\"000\" + this.getUTCMilliseconds()).slice(-3) + \"Z\"\n        );\n    };\n}\n\n\n// ES5 15.9.5.44\n// http://es5.github.com/#x15.9.5.44\n// This function provides a String representation of a Date object for use by\n// JSON.stringify (15.12.3).\nvar dateToJSONIsSupported = false;\ntry {\n    dateToJSONIsSupported = (\n        Date.prototype.toJSON &&\n        new Date(NaN).toJSON() === null &&\n        new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&\n        Date.prototype.toJSON.call({ // generic\n            toISOString: function () {\n                return true;\n            }\n        })\n    );\n} catch (e) {\n}\nif (!dateToJSONIsSupported) {\n    Date.prototype.toJSON = function toJSON(key) {\n        // When the toJSON method is called with argument key, the following\n        // steps are taken:\n\n        // 1.  Let O be the result of calling ToObject, giving it the this\n        // value as its argument.\n        // 2. Let tv be toPrimitive(O, hint Number).\n        var o = Object(this),\n            tv = toPrimitive(o),\n            toISO;\n        // 3. If tv is a Number and is not finite, return null.\n        if (typeof tv === \"number\" && !isFinite(tv)) {\n            return null;\n        }\n        // 4. Let toISO be the result of calling the [[Get]] internal method of\n        // O with argument \"toISOString\".\n        toISO = o.toISOString;\n        // 5. If IsCallable(toISO) is false, throw a TypeError exception.\n        if (typeof toISO != \"function\") {\n            throw new TypeError(\"toISOString property is not callable\");\n        }\n        // 6. Return the result of calling the [[Call]] internal method of\n        //  toISO with O as the this value and an empty argument list.\n        return toISO.call(o);\n\n        // NOTE 1 The argument is ignored.\n\n        // NOTE 2 The toJSON function is intentionally generic; it does not\n        // require that its this value be a Date object. Therefore, it can be\n        // transferred to other kinds of objects for use as a method. However,\n        // it does require that any such object have a toISOString method. An\n        // object is free to use the argument key to filter its\n        // stringification.\n    };\n}\n\n// ES5 15.9.4.2\n// http://es5.github.com/#x15.9.4.2\n// based on work shared by Daniel Friesen (dantman)\n// http://gist.github.com/303249\nif (!Date.parse || \"Date.parse is buggy\") {\n    // XXX global assignment won't work in embeddings that use\n    // an alternate object for the context.\n    Date = (function(NativeDate) {\n\n        // Date.length === 7\n        function Date(Y, M, D, h, m, s, ms) {\n            var length = arguments.length;\n            if (this instanceof NativeDate) {\n                var date = length == 1 && String(Y) === Y ? // isString(Y)\n                    // We explicitly pass it through parse:\n                    new NativeDate(Date.parse(Y)) :\n                    // We have to manually make calls depending on argument\n                    // length here\n                    length >= 7 ? new NativeDate(Y, M, D, h, m, s, ms) :\n                    length >= 6 ? new NativeDate(Y, M, D, h, m, s) :\n                    length >= 5 ? new NativeDate(Y, M, D, h, m) :\n                    length >= 4 ? new NativeDate(Y, M, D, h) :\n                    length >= 3 ? new NativeDate(Y, M, D) :\n                    length >= 2 ? new NativeDate(Y, M) :\n                    length >= 1 ? new NativeDate(Y) :\n                                  new NativeDate();\n                // Prevent mixups with unfixed Date object\n                date.constructor = Date;\n                return date;\n            }\n            return NativeDate.apply(this, arguments);\n        };\n\n        // 15.9.1.15 Date Time String Format.\n        var isoDateExpression = new RegExp(\"^\" +\n            \"(\\\\d{4}|[\\+\\-]\\\\d{6})\" + // four-digit year capture or sign +\n                                      // 6-digit extended year\n            \"(?:-(\\\\d{2})\" + // optional month capture\n            \"(?:-(\\\\d{2})\" + // optional day capture\n            \"(?:\" + // capture hours:minutes:seconds.milliseconds\n                \"T(\\\\d{2})\" + // hours capture\n                \":(\\\\d{2})\" + // minutes capture\n                \"(?:\" + // optional :seconds.milliseconds\n                    \":(\\\\d{2})\" + // seconds capture\n                    \"(?:\\\\.(\\\\d{3}))?\" + // milliseconds capture\n                \")?\" +\n            \"(\" + // capture UTC offset component\n                \"Z|\" + // UTC capture\n                \"(?:\" + // offset specifier +/-hours:minutes\n                    \"([-+])\" + // sign capture\n                    \"(\\\\d{2})\" + // hours offset capture\n                    \":(\\\\d{2})\" + // minutes offset capture\n                \")\" +\n            \")?)?)?)?\" +\n        \"$\");\n\n        var months = [\n            0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365\n        ];\n\n        function dayFromMonth(year, month) {\n            var t = month > 1 ? 1 : 0;\n            return (\n                months[month] +\n                Math.floor((year - 1969 + t) / 4) -\n                Math.floor((year - 1901 + t) / 100) +\n                Math.floor((year - 1601 + t) / 400) +\n                365 * (year - 1970)\n            );\n        }\n\n        // Copy any custom methods a 3rd party library may have added\n        for (var key in NativeDate) {\n            Date[key] = NativeDate[key];\n        }\n\n        // Copy \"native\" methods explicitly; they may be non-enumerable\n        Date.now = NativeDate.now;\n        Date.UTC = NativeDate.UTC;\n        Date.prototype = NativeDate.prototype;\n        Date.prototype.constructor = Date;\n\n        // Upgrade Date.parse to handle simplified ISO 8601 strings\n        Date.parse = function parse(string) {\n            var match = isoDateExpression.exec(string);\n            if (match) {\n                // parse months, days, hours, minutes, seconds, and milliseconds\n                // provide default values if necessary\n                // parse the UTC offset component\n                var year = Number(match[1]),\n                    month = Number(match[2] || 1) - 1,\n                    day = Number(match[3] || 1) - 1,\n                    hour = Number(match[4] || 0),\n                    minute = Number(match[5] || 0),\n                    second = Number(match[6] || 0),\n                    millisecond = Number(match[7] || 0),\n                    // When time zone is missed, local offset should be used\n                    // (ES 5.1 bug)\n                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112\n                    offset = !match[4] || match[8] ?\n                        0 : Number(new NativeDate(1970, 0)),\n                    signOffset = match[9] === \"-\" ? 1 : -1,\n                    hourOffset = Number(match[10] || 0),\n                    minuteOffset = Number(match[11] || 0),\n                    result;\n                if (\n                    hour < (\n                        minute > 0 || second > 0 || millisecond > 0 ?\n                        24 : 25\n                    ) &&\n                    minute < 60 && second < 60 && millisecond < 1000 &&\n                    month > -1 && month < 12 && hourOffset < 24 &&\n                    minuteOffset < 60 && // detect invalid offsets\n                    day > -1 &&\n                    day < (\n                        dayFromMonth(year, month + 1) -\n                        dayFromMonth(year, month)\n                    )\n                ) {\n                    result = (\n                        (dayFromMonth(year, month) + day) * 24 +\n                        hour +\n                        hourOffset * signOffset\n                    ) * 60;\n                    result = (\n                        (result + minute + minuteOffset * signOffset) * 60 +\n                        second\n                    ) * 1000 + millisecond + offset;\n                    if (-8.64e15 <= result && result <= 8.64e15) {\n                        return result;\n                    }\n                }\n                return NaN;\n            }\n            return NativeDate.parse.apply(this, arguments);\n        };\n\n        return Date;\n    })(Date);\n}\n\n// ES5 15.9.4.4\n// http://es5.github.com/#x15.9.4.4\nif (!Date.now) {\n    Date.now = function now() {\n        return new Date().getTime();\n    };\n}\n\n\n//\n// String\n// ======\n//\n\n\n// ES5 15.5.4.14\n// http://es5.github.com/#x15.5.4.14\n// [bugfix, chrome]\n// If separator is undefined, then the result array contains just one String,\n// which is the this value (converted to a String). If limit is not undefined,\n// then the output array is truncated so that it contains no more than limit\n// elements.\n// \"0\".split(undefined, 0) -> []\nif(\"0\".split(void 0, 0).length) {\n    var string_split = String.prototype.split;\n    String.prototype.split = function(separator, limit) {\n        if(separator === void 0 && limit === 0)return [];\n        return string_split.apply(this, arguments);\n    }\n}\n\n// ECMA-262, 3rd B.2.3\n// Note an ECMAScript standart, although ECMAScript 3rd Edition has a\n// non-normative section suggesting uniform semantics and it should be\n// normalized across all browsers\n// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE\nif(\"\".substr && \"0b\".substr(-1) !== \"b\") {\n    var string_substr = String.prototype.substr;\n    /**\n     *  Get the substring of a string\n     *  @param  {integer}  start   where to start the substring\n     *  @param  {integer}  length  how many characters to return\n     *  @return {string}\n     */\n    String.prototype.substr = function(start, length) {\n        return string_substr.call(\n            this,\n            start < 0 ? ((start = this.length + start) < 0 ? 0 : start) : start,\n            length\n        );\n    }\n}\n\n// ES5 15.5.4.20\n// http://es5.github.com/#x15.5.4.20\nvar ws = \"\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\" +\n    \"\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\" +\n    \"\\u2029\\uFEFF\";\nif (!String.prototype.trim || ws.trim()) {\n    // http://blog.stevenlevithan.com/archives/faster-trim-javascript\n    // http://perfectionkills.com/whitespace-deviations/\n    ws = \"[\" + ws + \"]\";\n    var trimBeginRegexp = new RegExp(\"^\" + ws + ws + \"*\"),\n        trimEndRegexp = new RegExp(ws + ws + \"*$\");\n    String.prototype.trim = function trim() {\n        if (this === undefined || this === null) {\n            throw new TypeError(\"can't convert \"+this+\" to object\");\n        }\n        return String(this)\n            .replace(trimBeginRegexp, \"\")\n            .replace(trimEndRegexp, \"\");\n    };\n}\n\n//\n// Util\n// ======\n//\n\n// ES5 9.4\n// http://es5.github.com/#x9.4\n// http://jsperf.com/to-integer\n\nfunction toInteger(n) {\n    n = +n;\n    if (n !== n) { // isNaN\n        n = 0;\n    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {\n        n = (n > 0 || -1) * Math.floor(Math.abs(n));\n    }\n    return n;\n}\n\nfunction isPrimitive(input) {\n    var type = typeof input;\n    return (\n        input === null ||\n        type === \"undefined\" ||\n        type === \"boolean\" ||\n        type === \"number\" ||\n        type === \"string\"\n    );\n}\n\nfunction toPrimitive(input) {\n    var val, valueOf, toString;\n    if (isPrimitive(input)) {\n        return input;\n    }\n    valueOf = input.valueOf;\n    if (typeof valueOf === \"function\") {\n        val = valueOf.call(input);\n        if (isPrimitive(val)) {\n            return val;\n        }\n    }\n    toString = input.toString;\n    if (typeof toString === \"function\") {\n        val = toString.call(input);\n        if (isPrimitive(val)) {\n            return val;\n        }\n    }\n    throw new TypeError();\n}\n\n// ES5 9.9\n// http://es5.github.com/#x9.9\nvar toObject = function (o) {\n    if (o == null) { // this matches both null and undefined\n        throw new TypeError(\"can't convert \"+o+\" to object\");\n    }\n    return Object(o);\n};\n\n});\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/node_modules/es5-shim/es5-shim.js"
));

require.define("events",Function(['require','module','exports','__dirname','__filename','process','global'],"if (!process.EventEmitter) process.EventEmitter = function () {};\n\nvar EventEmitter = exports.EventEmitter = process.EventEmitter;\nvar isArray = typeof Array.isArray === 'function'\n    ? Array.isArray\n    : function (xs) {\n        return Object.prototype.toString.call(xs) === '[object Array]'\n    }\n;\nfunction indexOf (xs, x) {\n    if (xs.indexOf) return xs.indexOf(x);\n    for (var i = 0; i < xs.length; i++) {\n        if (x === xs[i]) return i;\n    }\n    return -1;\n}\n\n// By default EventEmitters will print a warning if more than\n// 10 listeners are added to it. This is a useful default which\n// helps finding memory leaks.\n//\n// Obviously not all Emitters should be limited to 10. This function allows\n// that to be increased. Set to zero for unlimited.\nvar defaultMaxListeners = 10;\nEventEmitter.prototype.setMaxListeners = function(n) {\n  if (!this._events) this._events = {};\n  this._events.maxListeners = n;\n};\n\n\nEventEmitter.prototype.emit = function(type) {\n  // If there is no 'error' event listener then throw.\n  if (type === 'error') {\n    if (!this._events || !this._events.error ||\n        (isArray(this._events.error) && !this._events.error.length))\n    {\n      if (arguments[1] instanceof Error) {\n        throw arguments[1]; // Unhandled 'error' event\n      } else {\n        throw new Error(\"Uncaught, unspecified 'error' event.\");\n      }\n      return false;\n    }\n  }\n\n  if (!this._events) return false;\n  var handler = this._events[type];\n  if (!handler) return false;\n\n  if (typeof handler == 'function') {\n    switch (arguments.length) {\n      // fast cases\n      case 1:\n        handler.call(this);\n        break;\n      case 2:\n        handler.call(this, arguments[1]);\n        break;\n      case 3:\n        handler.call(this, arguments[1], arguments[2]);\n        break;\n      // slower\n      default:\n        var args = Array.prototype.slice.call(arguments, 1);\n        handler.apply(this, args);\n    }\n    return true;\n\n  } else if (isArray(handler)) {\n    var args = Array.prototype.slice.call(arguments, 1);\n\n    var listeners = handler.slice();\n    for (var i = 0, l = listeners.length; i < l; i++) {\n      listeners[i].apply(this, args);\n    }\n    return true;\n\n  } else {\n    return false;\n  }\n};\n\n// EventEmitter is defined in src/node_events.cc\n// EventEmitter.prototype.emit() is also defined there.\nEventEmitter.prototype.addListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('addListener only takes instances of Function');\n  }\n\n  if (!this._events) this._events = {};\n\n  // To avoid recursion in the case that type == \"newListeners\"! Before\n  // adding it to the listeners, first emit \"newListeners\".\n  this.emit('newListener', type, listener);\n\n  if (!this._events[type]) {\n    // Optimize the case of one listener. Don't need the extra array object.\n    this._events[type] = listener;\n  } else if (isArray(this._events[type])) {\n\n    // Check for listener leak\n    if (!this._events[type].warned) {\n      var m;\n      if (this._events.maxListeners !== undefined) {\n        m = this._events.maxListeners;\n      } else {\n        m = defaultMaxListeners;\n      }\n\n      if (m && m > 0 && this._events[type].length > m) {\n        this._events[type].warned = true;\n        console.error('(node) warning: possible EventEmitter memory ' +\n                      'leak detected. %d listeners added. ' +\n                      'Use emitter.setMaxListeners() to increase limit.',\n                      this._events[type].length);\n        console.trace();\n      }\n    }\n\n    // If we've already got an array, just append.\n    this._events[type].push(listener);\n  } else {\n    // Adding the second element, need to change to array.\n    this._events[type] = [this._events[type], listener];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.on = EventEmitter.prototype.addListener;\n\nEventEmitter.prototype.once = function(type, listener) {\n  var self = this;\n  self.on(type, function g() {\n    self.removeListener(type, g);\n    listener.apply(this, arguments);\n  });\n\n  return this;\n};\n\nEventEmitter.prototype.removeListener = function(type, listener) {\n  if ('function' !== typeof listener) {\n    throw new Error('removeListener only takes instances of Function');\n  }\n\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (!this._events || !this._events[type]) return this;\n\n  var list = this._events[type];\n\n  if (isArray(list)) {\n    var i = indexOf(list, listener);\n    if (i < 0) return this;\n    list.splice(i, 1);\n    if (list.length == 0)\n      delete this._events[type];\n  } else if (this._events[type] === listener) {\n    delete this._events[type];\n  }\n\n  return this;\n};\n\nEventEmitter.prototype.removeAllListeners = function(type) {\n  // does not use listeners(), so no side effect of creating _events[type]\n  if (type && this._events && this._events[type]) this._events[type] = null;\n  return this;\n};\n\nEventEmitter.prototype.listeners = function(type) {\n  if (!this._events) this._events = {};\n  if (!this._events[type]) this._events[type] = [];\n  if (!isArray(this._events[type])) {\n    this._events[type] = [this._events[type]];\n  }\n  return this._events[type];\n};\n\n//@ sourceURL=events"
));

require.define("/node_modules/derby/node_modules/racer/lib/plugin.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./util')\n  , mergeAll = util.mergeAll\n  , isServer = util.isServer\n\n    // This tricks Browserify into not logging an error when bundling this file\n  , _require = require\n\n  , plugable = {};\n\nmodule.exports = {\n\n  _makePlugable: function (name, object) {\n    plugable[name] = object;\n  }\n\n  /**\n   * @param {Function} plugin(racer, options)\n   * @param {Object} options that we pass to the plugin invocation\n   */\n, use: function (plugin, options) {\n    if (typeof plugin === 'string') {\n      if (!isServer) return this;\n      plugin = _require(plugin);\n    }\n\n    var decorate = plugin.decorate\n      , target = (decorate === null || decorate === 'racer')\n               ? this\n               : plugable[decorate];\n\n    if (!target) {\n      throw new Error('Invalid plugin.decorate value: ' + decorate);\n    }\n\n    var plugins = target._plugins || (target._plugins = []);\n\n    // Don't include a plugin more than once -- useful in tests where race\n    // conditions exist regarding require and clearing require.cache\n    if (-1 === plugins.indexOf(plugin)) {\n      plugins.push(plugin);\n      plugin(target, options);\n    }\n    return this;\n  }\n\n  // A mixin is an object literal with:\n  //   type:     Name of the racer Klass in which to mixin\n  //   [static]: Class/static methods to add to Klass\n  //   [proto]:  Methods to add to Klass.prototype\n  //   [events]: Event callbacks including 'mixin', 'init', 'socket', etc.\n  //\n  // proto methods may be either a function or an object literal with:\n  //   fn:       The method's function\n  //   [type]:   Optionally add this method to a collection of methods accessible\n  //             via Klass.<type>. If type is a comma-separated string,\n  //             e.g., `type=\"foo,bar\", then this method is added to several\n  //             method collections, e.g., added to `Klass.foo` and `Klass.bar`.\n  //             This is useful for grouping several methods together.\n  //   <other>:  All other key-value pairings are added as properties of the method\n, mixin: function () {\n    var protected = this.protected;\n    for (var i = 0, l = arguments.length; i < l; i++) {\n      var mixin = arguments[i];\n      if (typeof mixin === 'string') {\n        if (!isServer) continue;\n        mixin = _require(mixin);\n      }\n\n      var type = mixin.type;\n      if (!type) throw new Error('Mixins require a type parameter');\n      var Klass = protected[type];\n      if (!Klass) throw new Error('Cannot find racer.protected.' + type);\n\n      if (Klass.mixins) {\n        Klass.mixins.push(mixin);\n      } else {\n        Klass.mixins = [mixin];\n        var self = this;\n        Klass.prototype.mixinEmit = function (name) {\n          var eventName = type + ':' + name\n            , eventArgs = Array.prototype.slice.call(arguments, 1);\n          self.emit.apply(self, [eventName].concat(eventArgs));\n        };\n      }\n\n      if (mixin.decorate) mixin.decorate(Klass);\n      mergeAll(Klass, mixin.static);\n      mergeProto(mixin.proto, Klass);\n\n      var server;\n      if (isServer && (server = mixin.server)) {\n        server = (typeof server === 'string')\n               ? _require(server)\n               : mixin.server;\n        mergeProto(server, Klass);\n      }\n\n      var events = mixin.events;\n      for (var name in events) {\n        var fn = events[name];\n        this.on(type + ':' + name, fn);\n      }\n\n      this.emit(type + ':mixin', Klass);\n    }\n    return this;\n  }\n};\n\nfunction mergeProto (protoSpec, Klass) {\n  var targetProto = Klass.prototype;\n  for (var name in protoSpec) {\n    var descriptor = protoSpec[name];\n    if (typeof descriptor === 'function') {\n      targetProto[name] = descriptor;\n      continue;\n    }\n    var fn = targetProto[name] = descriptor.fn;\n    for (var key in descriptor) {\n      var value = descriptor[key];\n      switch (key) {\n        case 'fn': continue;\n        case 'type':\n          var csGroups = value.split(',');\n          for (var i = 0, l = csGroups.length; i < l; i++) {\n            var groupName = csGroups[i]\n              , methods = Klass[groupName] || (Klass[groupName] = {});\n            methods[name] = fn;\n          }\n          break;\n        default:\n          fn[key] = value;\n      }\n    }\n  }\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/plugin.js"
));

require.define("/node_modules/derby/node_modules/racer/node_modules/node-uuid/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./uuid.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/racer/node_modules/node-uuid/package.json"
));

require.define("/node_modules/derby/node_modules/racer/node_modules/node-uuid/uuid.js",Function(['require','module','exports','__dirname','__filename','process','global'],"//     node-uuid/uuid.js\n//\n//     Copyright (c) 2010 Robert Kieffer\n//     Dual licensed under the MIT and GPL licenses.\n//     Documentation and details at https://github.com/broofa/node-uuid\n(function() {\n  var _global = this;\n\n  // Unique ID creation requires a high quality random # generator, but\n  // Math.random() does not guarantee \"cryptographic quality\".  So we feature\n  // detect for more robust APIs, normalizing each method to return 128-bits\n  // (16 bytes) of random data.\n  var mathRNG, nodeRNG, whatwgRNG;\n\n  // Math.random()-based RNG.  All platforms, very fast, unknown quality\n  var _rndBytes = new Array(16);\n  mathRNG = function() {\n    var r, b = _rndBytes, i = 0;\n\n    for (var i = 0, r; i < 16; i++) {\n      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;\n      b[i] = r >>> ((i & 0x03) << 3) & 0xff;\n    }\n\n    return b;\n  }\n\n  // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto\n  // WebKit only (currently), moderately fast, high quality\n  if (_global.crypto && crypto.getRandomValues) {\n    var _rnds = new Uint32Array(4);\n    whatwgRNG = function() {\n      crypto.getRandomValues(_rnds);\n\n      for (var c = 0 ; c < 16; c++) {\n        _rndBytes[c] = _rnds[c >> 2] >>> ((c & 0x03) * 8) & 0xff;\n      }\n      return _rndBytes;\n    }\n  }\n\n  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html\n  // Node.js only, moderately fast, high quality\n  try {\n    var _rb = require('crypto').randomBytes;\n    nodeRNG = _rb && function() {\n      return _rb(16);\n    };\n  } catch (e) {}\n\n  // Select RNG with best quality\n  var _rng = nodeRNG || whatwgRNG || mathRNG;\n\n  // Buffer class to use\n  var BufferClass = typeof(Buffer) == 'function' ? Buffer : Array;\n\n  // Maps for number <-> hex string conversion\n  var _byteToHex = [];\n  var _hexToByte = {};\n  for (var i = 0; i < 256; i++) {\n    _byteToHex[i] = (i + 0x100).toString(16).substr(1);\n    _hexToByte[_byteToHex[i]] = i;\n  }\n\n  // **`parse()` - Parse a UUID into it's component bytes**\n  function parse(s, buf, offset) {\n    var i = (buf && offset) || 0, ii = 0;\n\n    buf = buf || [];\n    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(byte) {\n      if (ii < 16) { // Don't overflow!\n        buf[i + ii++] = _hexToByte[byte];\n      }\n    });\n\n    // Zero out remaining bytes if string was short\n    while (ii < 16) {\n      buf[i + ii++] = 0;\n    }\n\n    return buf;\n  }\n\n  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**\n  function unparse(buf, offset) {\n    var i = offset || 0, bth = _byteToHex;\n    return  bth[buf[i++]] + bth[buf[i++]] +\n            bth[buf[i++]] + bth[buf[i++]] + '-' +\n            bth[buf[i++]] + bth[buf[i++]] + '-' +\n            bth[buf[i++]] + bth[buf[i++]] + '-' +\n            bth[buf[i++]] + bth[buf[i++]] + '-' +\n            bth[buf[i++]] + bth[buf[i++]] +\n            bth[buf[i++]] + bth[buf[i++]] +\n            bth[buf[i++]] + bth[buf[i++]];\n  }\n\n  // **`v1()` - Generate time-based UUID**\n  //\n  // Inspired by https://github.com/LiosK/UUID.js\n  // and http://docs.python.org/library/uuid.html\n\n  // random #'s we need to init node and clockseq\n  var _seedBytes = _rng();\n\n  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)\n  var _nodeId = [\n    _seedBytes[0] | 0x01,\n    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]\n  ];\n\n  // Per 4.2.2, randomize (14 bit) clockseq\n  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;\n\n  // Previous uuid creation time\n  var _lastMSecs = 0, _lastNSecs = 0;\n\n  // See https://github.com/broofa/node-uuid for API details\n  function v1(options, buf, offset) {\n    var i = buf && offset || 0;\n    var b = buf || [];\n\n    options = options || {};\n\n    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;\n\n    // UUID timestamps are 100 nano-second units since the Gregorian epoch,\n    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so\n    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'\n    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.\n    var msecs = options.msecs != null ? options.msecs : new Date().getTime();\n\n    // Per 4.2.1.2, use count of uuid's generated during the current clock\n    // cycle to simulate higher resolution clock\n    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;\n\n    // Time since last uuid creation (in msecs)\n    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;\n\n    // Per 4.2.1.2, Bump clockseq on clock regression\n    if (dt < 0 && options.clockseq == null) {\n      clockseq = clockseq + 1 & 0x3fff;\n    }\n\n    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new\n    // time interval\n    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {\n      nsecs = 0;\n    }\n\n    // Per 4.2.1.2 Throw error if too many uuids are requested\n    if (nsecs >= 10000) {\n      throw new Error('uuid.v1(): Can\\'t create more than 10M uuids/sec');\n    }\n\n    _lastMSecs = msecs;\n    _lastNSecs = nsecs;\n    _clockseq = clockseq;\n\n    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch\n    msecs += 12219292800000;\n\n    // `time_low`\n    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;\n    b[i++] = tl >>> 24 & 0xff;\n    b[i++] = tl >>> 16 & 0xff;\n    b[i++] = tl >>> 8 & 0xff;\n    b[i++] = tl & 0xff;\n\n    // `time_mid`\n    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;\n    b[i++] = tmh >>> 8 & 0xff;\n    b[i++] = tmh & 0xff;\n\n    // `time_high_and_version`\n    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version\n    b[i++] = tmh >>> 16 & 0xff;\n\n    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)\n    b[i++] = clockseq >>> 8 | 0x80;\n\n    // `clock_seq_low`\n    b[i++] = clockseq & 0xff;\n\n    // `node`\n    var node = options.node || _nodeId;\n    for (var n = 0; n < 6; n++) {\n      b[i + n] = node[n];\n    }\n\n    return buf ? buf : unparse(b);\n  }\n\n  // **`v4()` - Generate random UUID**\n\n  // See https://github.com/broofa/node-uuid for API details\n  function v4(options, buf, offset) {\n    // Deprecated - 'format' argument, as supported in v1.2\n    var i = buf && offset || 0;\n\n    if (typeof(options) == 'string') {\n      buf = options == 'binary' ? new BufferClass(16) : null;\n      options = null;\n    }\n    options = options || {};\n\n    var rnds = options.random || (options.rng || _rng)();\n\n    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`\n    rnds[6] = (rnds[6] & 0x0f) | 0x40;\n    rnds[8] = (rnds[8] & 0x3f) | 0x80;\n\n    // Copy bytes to buffer, if provided\n    if (buf) {\n      for (var ii = 0; ii < 16; ii++) {\n        buf[i + ii] = rnds[ii];\n      }\n    }\n\n    return buf || unparse(rnds);\n  }\n\n  // Export public API\n  var uuid = v4;\n  uuid.v1 = v1;\n  uuid.v4 = v4;\n  uuid.parse = parse;\n  uuid.unparse = unparse;\n  uuid.BufferClass = BufferClass;\n\n  // Export RNG options\n  uuid.mathRNG = mathRNG;\n  uuid.nodeRNG = nodeRNG;\n  uuid.whatwgRNG = whatwgRNG;\n\n  if (typeof(module) != 'undefined') {\n    // Play nice with node.js\n    module.exports = uuid;\n  } else {\n    // Play nice with browsers\n    var _previousRoot = _global.uuid;\n\n    // **`noConflict()` - (browser only) to reset global 'uuid' var**\n    uuid.noConflict = function() {\n      _global.uuid = _previousRoot;\n      return uuid;\n    }\n    _global.uuid = uuid;\n  }\n}());\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/node_modules/node-uuid/uuid.js"
));

require.define("crypto",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = require(\"crypto-browserify\")\n//@ sourceURL=crypto"
));

require.define("/node_modules/crypto-browserify/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {}\n//@ sourceURL=/node_modules/crypto-browserify/package.json"
));

require.define("/node_modules/crypto-browserify/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var sha = require('./sha')\nvar rng = require('./rng')\nvar md5 = require('./md5')\n\nvar algorithms = {\n  sha1: {\n    hex: sha.hex_sha1,\n    binary: sha.b64_sha1,\n    ascii: sha.str_sha1\n  },\n  md5: {\n    hex: md5.hex_md5,\n    binary: md5.b64_md5,\n    ascii: md5.any_md5\n  }\n}\n\nfunction error () {\n  var m = [].slice.call(arguments).join(' ')\n  throw new Error([\n    m,\n    'we accept pull requests',\n    'http://github.com/dominictarr/crypto-browserify'\n    ].join('\\n'))\n}\n\nexports.createHash = function (alg) {\n  alg = alg || 'sha1'\n  if(!algorithms[alg])\n    error('algorithm:', alg, 'is not yet supported')\n  var s = ''\n  var _alg = algorithms[alg]\n  return {\n    update: function (data) {\n      s += data\n      return this\n    },\n    digest: function (enc) {\n      enc = enc || 'binary'\n      var fn\n      if(!(fn = _alg[enc]))\n        error('encoding:', enc , 'is not yet supported for algorithm', alg)\n      var r = fn(s)\n      s = null //not meant to use the hash after you've called digest.\n      return r\n    }\n  }\n}\n\nexports.randomBytes = function(size, callback) {\n  if (callback && callback.call) {\n    try {\n      callback.call(this, undefined, rng(size));\n    } catch (err) { callback(err); }\n  } else {\n    return rng(size);\n  }\n}\n\n// the least I can do is make error messages for the rest of the node.js/crypto api.\n;['createCredentials'\n, 'createHmac'\n, 'createCypher'\n, 'createCypheriv'\n, 'createDecipher'\n, 'createDecipheriv'\n, 'createSign'\n, 'createVerify'\n, 'createDeffieHellman'\n, 'pbkdf2'].forEach(function (name) {\n  exports[name] = function () {\n    error('sorry,', name, 'is not implemented yet')\n  }\n})\n\n//@ sourceURL=/node_modules/crypto-browserify/index.js"
));

require.define("/node_modules/crypto-browserify/sha.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/*\n * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined\n * in FIPS PUB 180-1\n * Version 2.1a Copyright Paul Johnston 2000 - 2002.\n * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet\n * Distributed under the BSD License\n * See http://pajhome.org.uk/crypt/md5 for details.\n */\n\nexports.hex_sha1 = hex_sha1;\nexports.b64_sha1 = b64_sha1;\nexports.str_sha1 = str_sha1;\nexports.hex_hmac_sha1 = hex_hmac_sha1;\nexports.b64_hmac_sha1 = b64_hmac_sha1;\nexports.str_hmac_sha1 = str_hmac_sha1;\n\n/*\n * Configurable variables. You may need to tweak these to be compatible with\n * the server-side, but the defaults work in most cases.\n */\nvar hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */\nvar b64pad  = \"\"; /* base-64 pad character. \"=\" for strict RFC compliance   */\nvar chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */\n\n/*\n * These are the functions you'll usually want to call\n * They take string arguments and return either hex or base-64 encoded strings\n */\nfunction hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}\nfunction b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}\nfunction str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}\nfunction hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}\nfunction b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}\nfunction str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}\n\n/*\n * Perform a simple self-test to see if the VM is working\n */\nfunction sha1_vm_test()\n{\n  return hex_sha1(\"abc\") == \"a9993e364706816aba3e25717850c26c9cd0d89d\";\n}\n\n/*\n * Calculate the SHA-1 of an array of big-endian words, and a bit length\n */\nfunction core_sha1(x, len)\n{\n  /* append padding */\n  x[len >> 5] |= 0x80 << (24 - len % 32);\n  x[((len + 64 >> 9) << 4) + 15] = len;\n\n  var w = Array(80);\n  var a =  1732584193;\n  var b = -271733879;\n  var c = -1732584194;\n  var d =  271733878;\n  var e = -1009589776;\n\n  for(var i = 0; i < x.length; i += 16)\n  {\n    var olda = a;\n    var oldb = b;\n    var oldc = c;\n    var oldd = d;\n    var olde = e;\n\n    for(var j = 0; j < 80; j++)\n    {\n      if(j < 16) w[j] = x[i + j];\n      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);\n      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),\n                       safe_add(safe_add(e, w[j]), sha1_kt(j)));\n      e = d;\n      d = c;\n      c = rol(b, 30);\n      b = a;\n      a = t;\n    }\n\n    a = safe_add(a, olda);\n    b = safe_add(b, oldb);\n    c = safe_add(c, oldc);\n    d = safe_add(d, oldd);\n    e = safe_add(e, olde);\n  }\n  return Array(a, b, c, d, e);\n\n}\n\n/*\n * Perform the appropriate triplet combination function for the current\n * iteration\n */\nfunction sha1_ft(t, b, c, d)\n{\n  if(t < 20) return (b & c) | ((~b) & d);\n  if(t < 40) return b ^ c ^ d;\n  if(t < 60) return (b & c) | (b & d) | (c & d);\n  return b ^ c ^ d;\n}\n\n/*\n * Determine the appropriate additive constant for the current iteration\n */\nfunction sha1_kt(t)\n{\n  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :\n         (t < 60) ? -1894007588 : -899497514;\n}\n\n/*\n * Calculate the HMAC-SHA1 of a key and some data\n */\nfunction core_hmac_sha1(key, data)\n{\n  var bkey = str2binb(key);\n  if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);\n\n  var ipad = Array(16), opad = Array(16);\n  for(var i = 0; i < 16; i++)\n  {\n    ipad[i] = bkey[i] ^ 0x36363636;\n    opad[i] = bkey[i] ^ 0x5C5C5C5C;\n  }\n\n  var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);\n  return core_sha1(opad.concat(hash), 512 + 160);\n}\n\n/*\n * Add integers, wrapping at 2^32. This uses 16-bit operations internally\n * to work around bugs in some JS interpreters.\n */\nfunction safe_add(x, y)\n{\n  var lsw = (x & 0xFFFF) + (y & 0xFFFF);\n  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);\n  return (msw << 16) | (lsw & 0xFFFF);\n}\n\n/*\n * Bitwise rotate a 32-bit number to the left.\n */\nfunction rol(num, cnt)\n{\n  return (num << cnt) | (num >>> (32 - cnt));\n}\n\n/*\n * Convert an 8-bit or 16-bit string to an array of big-endian words\n * In 8-bit function, characters >255 have their hi-byte silently ignored.\n */\nfunction str2binb(str)\n{\n  var bin = Array();\n  var mask = (1 << chrsz) - 1;\n  for(var i = 0; i < str.length * chrsz; i += chrsz)\n    bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);\n  return bin;\n}\n\n/*\n * Convert an array of big-endian words to a string\n */\nfunction binb2str(bin)\n{\n  var str = \"\";\n  var mask = (1 << chrsz) - 1;\n  for(var i = 0; i < bin.length * 32; i += chrsz)\n    str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);\n  return str;\n}\n\n/*\n * Convert an array of big-endian words to a hex string.\n */\nfunction binb2hex(binarray)\n{\n  var hex_tab = hexcase ? \"0123456789ABCDEF\" : \"0123456789abcdef\";\n  var str = \"\";\n  for(var i = 0; i < binarray.length * 4; i++)\n  {\n    str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +\n           hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);\n  }\n  return str;\n}\n\n/*\n * Convert an array of big-endian words to a base-64 string\n */\nfunction binb2b64(binarray)\n{\n  var tab = \"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\";\n  var str = \"\";\n  for(var i = 0; i < binarray.length * 4; i += 3)\n  {\n    var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)\n                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )\n                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);\n    for(var j = 0; j < 4; j++)\n    {\n      if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;\n      else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);\n    }\n  }\n  return str;\n}\n\n\n//@ sourceURL=/node_modules/crypto-browserify/sha.js"
));

require.define("/node_modules/crypto-browserify/rng.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// Original code adapted from Robert Kieffer.\n// details at https://github.com/broofa/node-uuid\n(function() {\n  var _global = this;\n\n  var mathRNG, whatwgRNG;\n\n  // NOTE: Math.random() does not guarantee \"cryptographic quality\"\n  mathRNG = function(size) {\n    var bytes = new Array(size);\n    var r;\n\n    for (var i = 0, r; i < size; i++) {\n      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;\n      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;\n    }\n\n    return bytes;\n  }\n\n  // currently only available in webkit-based browsers.\n  if (_global.crypto && crypto.getRandomValues) {\n    var _rnds = new Uint32Array(4);\n    whatwgRNG = function(size) {\n      var bytes = new Array(size);\n      crypto.getRandomValues(_rnds);\n\n      for (var c = 0 ; c < size; c++) {\n        bytes[c] = _rnds[c >> 2] >>> ((c & 0x03) * 8) & 0xff;\n      }\n      return bytes;\n    }\n  }\n\n  module.exports = whatwgRNG || mathRNG;\n\n}())\n//@ sourceURL=/node_modules/crypto-browserify/rng.js"
));

require.define("/node_modules/crypto-browserify/md5.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/*\n * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message\n * Digest Algorithm, as defined in RFC 1321.\n * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009\n * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet\n * Distributed under the BSD License\n * See http://pajhome.org.uk/crypt/md5 for more info.\n */\n\n/*\n * Configurable variables. You may need to tweak these to be compatible with\n * the server-side, but the defaults work in most cases.\n */\nvar hexcase = 0;   /* hex output format. 0 - lowercase; 1 - uppercase        */\nvar b64pad  = \"\";  /* base-64 pad character. \"=\" for strict RFC compliance   */\n\n/*\n * These are the functions you'll usually want to call\n * They take string arguments and return either hex or base-64 encoded strings\n */\nfunction hex_md5(s)    { return rstr2hex(rstr_md5(str2rstr_utf8(s))); }\nfunction b64_md5(s)    { return rstr2b64(rstr_md5(str2rstr_utf8(s))); }\nfunction any_md5(s, e) { return rstr2any(rstr_md5(str2rstr_utf8(s)), e); }\nfunction hex_hmac_md5(k, d)\n  { return rstr2hex(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); }\nfunction b64_hmac_md5(k, d)\n  { return rstr2b64(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); }\nfunction any_hmac_md5(k, d, e)\n  { return rstr2any(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)), e); }\n\n/*\n * Perform a simple self-test to see if the VM is working\n */\nfunction md5_vm_test()\n{\n  return hex_md5(\"abc\").toLowerCase() == \"900150983cd24fb0d6963f7d28e17f72\";\n}\n\n/*\n * Calculate the MD5 of a raw string\n */\nfunction rstr_md5(s)\n{\n  return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));\n}\n\n/*\n * Calculate the HMAC-MD5, of a key and some data (raw strings)\n */\nfunction rstr_hmac_md5(key, data)\n{\n  var bkey = rstr2binl(key);\n  if(bkey.length > 16) bkey = binl_md5(bkey, key.length * 8);\n\n  var ipad = Array(16), opad = Array(16);\n  for(var i = 0; i < 16; i++)\n  {\n    ipad[i] = bkey[i] ^ 0x36363636;\n    opad[i] = bkey[i] ^ 0x5C5C5C5C;\n  }\n\n  var hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);\n  return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));\n}\n\n/*\n * Convert a raw string to a hex string\n */\nfunction rstr2hex(input)\n{\n  try { hexcase } catch(e) { hexcase=0; }\n  var hex_tab = hexcase ? \"0123456789ABCDEF\" : \"0123456789abcdef\";\n  var output = \"\";\n  var x;\n  for(var i = 0; i < input.length; i++)\n  {\n    x = input.charCodeAt(i);\n    output += hex_tab.charAt((x >>> 4) & 0x0F)\n           +  hex_tab.charAt( x        & 0x0F);\n  }\n  return output;\n}\n\n/*\n * Convert a raw string to a base-64 string\n */\nfunction rstr2b64(input)\n{\n  try { b64pad } catch(e) { b64pad=''; }\n  var tab = \"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\";\n  var output = \"\";\n  var len = input.length;\n  for(var i = 0; i < len; i += 3)\n  {\n    var triplet = (input.charCodeAt(i) << 16)\n                | (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0)\n                | (i + 2 < len ? input.charCodeAt(i+2)      : 0);\n    for(var j = 0; j < 4; j++)\n    {\n      if(i * 8 + j * 6 > input.length * 8) output += b64pad;\n      else output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);\n    }\n  }\n  return output;\n}\n\n/*\n * Convert a raw string to an arbitrary string encoding\n */\nfunction rstr2any(input, encoding)\n{\n  var divisor = encoding.length;\n  var i, j, q, x, quotient;\n\n  /* Convert to an array of 16-bit big-endian values, forming the dividend */\n  var dividend = Array(Math.ceil(input.length / 2));\n  for(i = 0; i < dividend.length; i++)\n  {\n    dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);\n  }\n\n  /*\n   * Repeatedly perform a long division. The binary array forms the dividend,\n   * the length of the encoding is the divisor. Once computed, the quotient\n   * forms the dividend for the next step. All remainders are stored for later\n   * use.\n   */\n  var full_length = Math.ceil(input.length * 8 /\n                                    (Math.log(encoding.length) / Math.log(2)));\n  var remainders = Array(full_length);\n  for(j = 0; j < full_length; j++)\n  {\n    quotient = Array();\n    x = 0;\n    for(i = 0; i < dividend.length; i++)\n    {\n      x = (x << 16) + dividend[i];\n      q = Math.floor(x / divisor);\n      x -= q * divisor;\n      if(quotient.length > 0 || q > 0)\n        quotient[quotient.length] = q;\n    }\n    remainders[j] = x;\n    dividend = quotient;\n  }\n\n  /* Convert the remainders to the output string */\n  var output = \"\";\n  for(i = remainders.length - 1; i >= 0; i--)\n    output += encoding.charAt(remainders[i]);\n\n  return output;\n}\n\n/*\n * Encode a string as utf-8.\n * For efficiency, this assumes the input is valid utf-16.\n */\nfunction str2rstr_utf8(input)\n{\n  var output = \"\";\n  var i = -1;\n  var x, y;\n\n  while(++i < input.length)\n  {\n    /* Decode utf-16 surrogate pairs */\n    x = input.charCodeAt(i);\n    y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;\n    if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF)\n    {\n      x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);\n      i++;\n    }\n\n    /* Encode output as utf-8 */\n    if(x <= 0x7F)\n      output += String.fromCharCode(x);\n    else if(x <= 0x7FF)\n      output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),\n                                    0x80 | ( x         & 0x3F));\n    else if(x <= 0xFFFF)\n      output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),\n                                    0x80 | ((x >>> 6 ) & 0x3F),\n                                    0x80 | ( x         & 0x3F));\n    else if(x <= 0x1FFFFF)\n      output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),\n                                    0x80 | ((x >>> 12) & 0x3F),\n                                    0x80 | ((x >>> 6 ) & 0x3F),\n                                    0x80 | ( x         & 0x3F));\n  }\n  return output;\n}\n\n/*\n * Encode a string as utf-16\n */\nfunction str2rstr_utf16le(input)\n{\n  var output = \"\";\n  for(var i = 0; i < input.length; i++)\n    output += String.fromCharCode( input.charCodeAt(i)        & 0xFF,\n                                  (input.charCodeAt(i) >>> 8) & 0xFF);\n  return output;\n}\n\nfunction str2rstr_utf16be(input)\n{\n  var output = \"\";\n  for(var i = 0; i < input.length; i++)\n    output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF,\n                                   input.charCodeAt(i)        & 0xFF);\n  return output;\n}\n\n/*\n * Convert a raw string to an array of little-endian words\n * Characters >255 have their high-byte silently ignored.\n */\nfunction rstr2binl(input)\n{\n  var output = Array(input.length >> 2);\n  for(var i = 0; i < output.length; i++)\n    output[i] = 0;\n  for(var i = 0; i < input.length * 8; i += 8)\n    output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);\n  return output;\n}\n\n/*\n * Convert an array of little-endian words to a string\n */\nfunction binl2rstr(input)\n{\n  var output = \"\";\n  for(var i = 0; i < input.length * 32; i += 8)\n    output += String.fromCharCode((input[i>>5] >>> (i % 32)) & 0xFF);\n  return output;\n}\n\n/*\n * Calculate the MD5 of an array of little-endian words, and a bit length.\n */\nfunction binl_md5(x, len)\n{\n  /* append padding */\n  x[len >> 5] |= 0x80 << ((len) % 32);\n  x[(((len + 64) >>> 9) << 4) + 14] = len;\n\n  var a =  1732584193;\n  var b = -271733879;\n  var c = -1732584194;\n  var d =  271733878;\n\n  for(var i = 0; i < x.length; i += 16)\n  {\n    var olda = a;\n    var oldb = b;\n    var oldc = c;\n    var oldd = d;\n\n    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);\n    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);\n    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);\n    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);\n    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);\n    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);\n    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);\n    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);\n    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);\n    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);\n    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);\n    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);\n    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);\n    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);\n    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);\n    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);\n\n    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);\n    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);\n    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);\n    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);\n    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);\n    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);\n    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);\n    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);\n    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);\n    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);\n    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);\n    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);\n    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);\n    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);\n    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);\n    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);\n\n    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);\n    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);\n    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);\n    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);\n    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);\n    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);\n    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);\n    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);\n    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);\n    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);\n    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);\n    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);\n    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);\n    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);\n    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);\n    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);\n\n    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);\n    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);\n    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);\n    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);\n    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);\n    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);\n    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);\n    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);\n    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);\n    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);\n    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);\n    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);\n    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);\n    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);\n    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);\n    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);\n\n    a = safe_add(a, olda);\n    b = safe_add(b, oldb);\n    c = safe_add(c, oldc);\n    d = safe_add(d, oldd);\n  }\n  return Array(a, b, c, d);\n}\n\n/*\n * These functions implement the four basic operations the algorithm uses.\n */\nfunction md5_cmn(q, a, b, x, s, t)\n{\n  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);\n}\nfunction md5_ff(a, b, c, d, x, s, t)\n{\n  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);\n}\nfunction md5_gg(a, b, c, d, x, s, t)\n{\n  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);\n}\nfunction md5_hh(a, b, c, d, x, s, t)\n{\n  return md5_cmn(b ^ c ^ d, a, b, x, s, t);\n}\nfunction md5_ii(a, b, c, d, x, s, t)\n{\n  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);\n}\n\n/*\n * Add integers, wrapping at 2^32. This uses 16-bit operations internally\n * to work around bugs in some JS interpreters.\n */\nfunction safe_add(x, y)\n{\n  var lsw = (x & 0xFFFF) + (y & 0xFFFF);\n  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);\n  return (msw << 16) | (lsw & 0xFFFF);\n}\n\n/*\n * Bitwise rotate a 32-bit number to the left.\n */\nfunction bit_rol(num, cnt)\n{\n  return (num << cnt) | (num >>> (32 - cnt));\n}\n\n\nexports.hex_md5 = hex_md5;\nexports.b64_md5 = b64_md5;\nexports.any_md5 = any_md5;\n\n//@ sourceURL=/node_modules/crypto-browserify/md5.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var EventEmitter = require('events').EventEmitter\n  , Memory = require('./Memory')\n  , eventRegExp = require('./path').eventRegExp\n  , mergeAll = require('./util').mergeAll\n  , uuid = require('node-uuid')\n  ;\n\nmodule.exports = Model;\n\nfunction Model (init) {\n  for (var k in init) {\n    this[k] = init[k];\n  }\n  this.flags || (this.flags = {});\n  this._memory = new Memory();\n  // Set max listeners to unlimited\n  this.setMaxListeners(0);\n\n  var cleanupCounts = 0\n    , self = this\n    , cleaning = false;\n  this.on('newListener', function(name) {\n    if (name !== 'cleanup') return;\n    if (cleanupCounts++ < 128) return;\n    cleanupCounts = 0;\n    if (cleaning) return;\n    cleaning = true;\n    setTimeout(function() {\n      self.emit('cleanup');\n      cleaning = false;\n    }, 10);\n  });\n\n  // Used for model scopes\n  this._root = this;\n  this.mixinEmit('init', this);\n}\n\nvar modelProto = Model.prototype\n  , emitterProto = EventEmitter.prototype;\n\nmergeAll(modelProto, emitterProto, {\n  id: function () {\n    return uuid.v4();\n  }\n\n  /* Socket.io communication */\n\n, connected: true\n, canConnect: true\n\n, _setSocket: function (socket) {\n    this.socket = socket;\n    this.mixinEmit('socket', this, socket);\n    this.disconnect = function () {\n      socket.disconnect();\n    };\n    this.connect = function (callback) {\n      if (callback) socket.once('connect', callback);\n      socket.socket.connect();\n    };\n\n    var self = this;\n    this.canConnect = true;\n    function onFatalErr (reason) {\n      self.canConnect = false;\n      self.emit('canConnect', false);\n      onConnected();\n      socket.disconnect();\n      console.error('fatalErr', reason);\n    }\n    socket.on('fatalErr', onFatalErr);\n\n    this.connected = false;\n    function onConnected () {\n      var connected = self.connected;\n      self.emit(connected ? 'connect' : 'disconnect');\n      self.emit('connected', connected);\n      self.emit('connectionStatus', connected, self.canConnect);\n    }\n\n    socket.on('connect', function () {\n      self.connected = true;\n      onConnected();\n    });\n\n    socket.on('disconnect', function () {\n      self.connected = false;\n      // Slight delay after disconnect so that offline does not flash on reload\n      setTimeout(onConnected, 400);\n    });\n\n    socket.on('error', function (err) {\n      if (typeof err === 'string' && ~err.indexOf('unauthorized')) onFatalErr(err);\n    });\n\n    if (typeof window !== 'undefined') {\n      // The server can ask the client to reload itself\n      socket.on('reload', function () {\n        window.location.reload();\n      });\n    }\n\n    // Needed in case page is loaded from cache while offline\n    socket.on('connect_failed', onConnected);\n  }\n\n  /* Scoped Models */\n\n  /**\n   * Create a model object scoped to a particular path.\n   * Example:\n   *     var user = model.at('users.1');\n   *     user.set('username', 'brian');\n   *     user.on('push', 'todos', function (todo) {\n   *       // ...\n   *     });\n   *\n   *  @param {String} segment\n   *  @param {Boolean} absolute\n   *  @return {Model} a scoped model\n   *  @api public\n   */\n, at: function (segment, absolute) {\n    var at = this._at\n      , val = (at && !absolute)\n            ? (segment === '')\n              ? at\n              : at + '.' + segment\n            : segment.toString()\n    return Object.create(this, { _at: { value: val } });\n  }\n\n, root: function () {\n    return Object.create(this, { _at: { value: null } });\n  }\n\n  /**\n   * Returns a model scope that is a number of levels above the current scoped\n   * path. Number of levels defaults to 1, so this method called without\n   * arguments returns the model scope's parent model scope.\n   *\n   * @optional @param {Number} levels\n   * @return {Model} a scoped model\n   */\n, parent: function (levels) {\n    if (! levels) levels = 1;\n    var at = this._at;\n    if (!at) return this;\n    var segments = at.split('.');\n    return this.at(segments.slice(0, segments.length - levels).join('.'), true);\n  }\n\n  /**\n   * Returns the path equivalent to the path of the current scoped model plus\n   * the suffix path `rest`\n   *\n   * @optional @param {String} rest\n   * @return {String} absolute path\n   * @api public\n   */\n, path: function (rest) {\n    var at = this._at;\n    if (at) {\n      if (rest) return at + '.' + rest;\n      return at;\n    }\n    return rest || '';\n  }\n\n  /**\n   * Returns the last property segment of the current model scope path\n   *\n   * @optional @param {String} path\n   * @return {String}\n   */\n, leaf: function (path) {\n    if (!path) path = this._at || '';\n    var i = path.lastIndexOf('.');\n    return path.substr(i+1);\n  }\n\n  /* Model events */\n\n  // EventEmitter.prototype.on, EventEmitter.prototype.addListener, and\n  // EventEmitter.prototype.once return `this`. The Model equivalents return\n  // the listener instead, since it is made internally for method subscriptions\n  // and may need to be passed to removeListener.\n\n, _on: emitterProto.on\n, on: function (type, pattern, callback) {\n    var self = this\n      , listener = eventListener(type, pattern, callback, this);\n    this._on(type, listener);\n    listener.cleanup = function () {\n      self.removeListener(type, listener);\n    }\n    return listener;\n  }\n\n, _once: emitterProto.once\n, once: function (type, pattern, callback) {\n    var listener = eventListener(type, pattern, callback, this)\n      , self;\n    this._on( type, function g () {\n      var matches = listener.apply(null, arguments);\n      if (matches) this.removeListener(type, g);\n    });\n    return listener;\n  }\n\n  /**\n   * Used to pass an additional argument to local events. This value is added\n   * to the event arguments in txns/mixin.Model\n   * Example:\n   *     model.pass({ ignore: domId }).move('arr', 0, 2);\n   *\n   * @param {Object} arg\n   * @return {Model} an Object that prototypically inherits from the calling\n   * Model instance, but with a _pass attribute equivalent to `arg`.\n   * @api public\n   */\n, pass: function (arg) {\n    return Object.create(this, { _pass: { value: arg } });\n  }\n\n, silent: function () {\n    return Object.create(this, { _silent: { value: true } });\n  }\n});\n\nmodelProto.addListener = modelProto.on;\n\n/**\n * Returns a function that is assigned as an event listener on method events\n * such as 'set', 'insert', etc.\n *\n * Possible function signatures are:\n *\n * - eventListener(method, pattern, callback, at)\n * - eventListener(method, pattern, callback)\n * - eventListener(method, callback)\n *\n * @param {String} method\n * @param {String} pattern\n * @param {Function} callback\n * @param {String} at\n * @return {Function} function ([path, args...], out, isLocal, pass)\n */\nfunction eventListener (method, pattern, callback, model) {\n  if (model._at) {\n    if (typeof pattern === 'string') {\n      pattern = model._at + '.' + pattern;\n    } else if (pattern.call) {\n      callback = pattern;\n      pattern = model._at;\n    } else {\n      throw new Error('Unsupported event pattern on scoped model');\n    }\n\n    // on(type, listener)\n    // Test for function by looking for call, since pattern can be a RegExp,\n    // which has typeof pattern === 'function' as well\n  } else if ((typeof pattern === 'function') && pattern.call) {\n    return pattern;\n  }\n\n  // on(method, pattern, callback)\n  var regexp = eventRegExp(pattern)\n    , listener\n\n  if (method === 'mutator') {\n    listener = function listenerModelMutator (mutatorMethod, _arguments) {\n      var args = _arguments[0]\n        , path = args[0];\n      if (! regexp.test(path)) return;\n\n      var captures = regexp.exec(path).slice(1)\n        , callbackArgs = captures.concat([mutatorMethod, _arguments]);\n      callback.apply(null, callbackArgs);\n      return true;\n    };\n  } else {\n    listener = function listenerModel (args, out, isLocal, pass) {\n      var path = args[0];\n      if (! regexp.test(path)) return;\n\n      args = args.slice(1);\n      var captures = regexp.exec(path).slice(1)\n        , callbackArgs = captures.concat(args).concat([out, isLocal, pass]);\n      callback.apply(null, callbackArgs);\n      return true;\n    };\n  }\n\n  function removeModelListener() {\n    model.removeListener(method, listener);\n    model.removeListener('removeModelListeners', removeModelListener);\n  }\n  model._on('removeModelListeners', removeModelListener);\n\n  return listener;\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/Model.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/Memory.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var speculative = require('./util/speculative')\n  , isPrivate = require('./path').isPrivate\n  , treeLookup = require('./tree').lookup\n  , __slice = [].slice\n\nmodule.exports = Memory;\nfunction Memory() {\n  this.flush();\n}\nMemory.prototype = {\n  flush: flush\n, init: init\n, eraseNonPrivate: eraseNonPrivate\n, toJSON: toJSON\n, setVersion: setVersion\n, get: get\n, set: set\n, del: del\n, push: push\n, unshift: unshift\n, insert: insert\n, pop: pop\n, shift: shift\n, remove: remove\n, move: move\n, _applyArrayMethod: applyArrayMethod\n, _arrayLookupSet: arrayLookupSet\n, _lookupSet: lookupSet\n};\n\nfunction flush() {\n  this._data = {\n    world: {}\n  };\n  this.version = 0;\n}\nfunction init(obj) {\n  this.flush()\n  this._data.world = obj.data;\n  this.version = obj.ver;\n}\nfunction eraseNonPrivate() {\n  var world = this._data.world\n    , path\n  for (path in world) {\n    if (isPrivate(path)) continue;\n    delete world[path];\n  }\n}\nfunction toJSON() {\n  return {\n    data: this._data.world,\n    ver: this.version\n  };\n}\nfunction setVersion(ver) {\n  return this.version = Math.max(this.version, ver);\n}\n\nfunction get(path, data, getRef) {\n  data || (data = this._data);\n  return path ? treeLookup(data, path, {getRef: getRef}).node : data.world;\n}\n\nfunction set(path, value, ver, data) {\n  this.setVersion(ver);\n  var tuple = lookupSet(path, data || this._data, ver == null, 'object')\n    , obj = tuple[0]\n    , parent = tuple[1]\n    , prop = tuple[2]\n  parent[prop] = value;\n  var segments = path.split('.');\n  if (segments.length === 2 &&\n      value && value.constructor === Object &&\n      value.id == null) {\n    value.id = segments[1];\n  }\n  return obj;\n}\n\nfunction del(path, ver, data) {\n  this.setVersion(ver);\n  data || (data = this._data);\n  var isSpeculative = (ver == null)\n    , tuple = lookupSet(path, data, isSpeculative)\n    , obj = tuple[0]\n    , parent = tuple[1]\n    , prop = tuple[2]\n    , grandparent, index, parentClone, parentPath, parentProp\n  if (ver != null) {\n    if (parent) delete parent[prop];\n    return obj;\n  }\n  // If speculatiave, replace the parent object with a clone that\n  // has the desired item deleted\n  if (!parent) {\n    return obj;\n  }\n  if (~(index = path.lastIndexOf('.'))) {\n    parentPath = path.substr(0, index);\n    tuple = lookupSet(parentPath, data, isSpeculative);\n    parent = tuple[0];\n    grandparent = tuple[1];\n    parentProp = tuple[2];\n  } else {\n    parent = data.world;\n    grandparent = data;\n    parentProp = 'world';\n  }\n  parentClone = speculative.clone(parent);\n  delete parentClone[prop];\n  grandparent[parentProp] = parentClone;\n  return obj;\n}\n\n// push(path, args..., ver, data)\nfunction push() {\n  return this._applyArrayMethod(arguments, 1, function(arr, args) {\n    return arr.push.apply(arr, args);\n  });\n}\n\n// unshift(path, args..., ver, data)\nfunction unshift() {\n  return this._applyArrayMethod(arguments, 1, function(arr, args) {\n    return arr.unshift.apply(arr, args);\n  });\n}\n\n// insert(path, index, args..., ver, data)\nfunction insert(path, index) {\n  return this._applyArrayMethod(arguments, 2, function(arr, args) {\n    arr.splice.apply(arr, [index, 0].concat(args));\n    return arr.length;\n  });\n}\n\nfunction applyArrayMethod(argumentsObj, offset, fn) {\n  if (argumentsObj.length < offset + 3) throw new Error('Not enough arguments');\n  var path = argumentsObj[0]\n    , i = argumentsObj.length - 2\n    , args = __slice.call(argumentsObj, offset, i)\n    , ver = argumentsObj[i++]\n    , data = argumentsObj[i++]\n    , arr = this._arrayLookupSet(path, ver, data)\n  return fn(arr, args);\n}\n\nfunction pop(path, ver, data) {\n  var arr = this._arrayLookupSet(path, ver, data);\n  return arr.pop();\n}\n\nfunction shift(path, ver, data) {\n  var arr = this._arrayLookupSet(path, ver, data);\n  return arr.shift();\n}\n\nfunction remove(path, index, howMany, ver, data) {\n  var arr = this._arrayLookupSet(path, ver, data);\n  return arr.splice(index, howMany);\n}\n\nfunction move(path, from, to, howMany, ver, data) {\n  var arr = this._arrayLookupSet(path, ver, data)\n    , len = arr.length\n    , values\n  // Cast to numbers\n  from = +from;\n  to = +to;\n  // Make sure indices are positive\n  if (from < 0) from += len;\n  if (to < 0) to += len;\n  // Remove from old location\n  values = arr.splice(from, howMany);\n  // Insert in new location\n  arr.splice.apply(arr, [to, 0].concat(values));\n  return values;\n}\n\nfunction arrayLookupSet(path, ver, data) {\n  this.setVersion(ver);\n  var arr = lookupSet(path, data || this._data, ver == null, 'array')[0];\n  if (!Array.isArray(arr)) {\n    throw new TypeError(arr + ' is not an Array');\n  }\n  return arr;\n}\n\nfunction lookupSet(path, data, isSpeculative, pathType) {\n  var props = path.split('.')\n    , len = props.length\n    , i = 0\n    , curr = data.world = isSpeculative ? speculative.create(data.world) : data.world\n    , firstProp = props[0]\n    , parent, prop\n\n  while (i < len) {\n    prop = props[i++];\n    parent = curr;\n    curr = curr[prop];\n\n    // Create empty objects implied by the path\n    if (curr != null) {\n      if (isSpeculative && typeof curr === 'object') {\n        curr = parent[prop] = speculative.create(curr);\n      }\n    } else {\n      if (pathType === 'object') {\n        // Cover case where property is a number and it NOT a doc id\n        // We treat the value at <collection>.<docid> as an Object, not an Array\n        if ((i !== 1 || isPrivate(firstProp)) && /^[0-9]+$/.test(props[i])) {\n          curr = parent[prop] = isSpeculative ? speculative.createArray() : [];\n        } else if (i !== len) {\n          curr = parent[prop] = isSpeculative ? speculative.createObject() : {};\n          if (i === 2 && !isPrivate(firstProp)) {\n            curr.id = prop;\n          }\n        }\n      } else if (pathType === 'array') {\n        if (i === len) {\n          curr = parent[prop] = isSpeculative ? speculative.createArray() : [];\n        } else {\n          curr = parent[prop] = isSpeculative ? speculative.createObject() : {};\n          if (i === 2 && !isPrivate(firstProp)) {\n            curr.id = prop;\n          }\n        }\n      } else {\n        if (i !== len) {\n          parent = curr = void 0;\n        }\n        return [curr, parent, prop];\n      }\n    }\n  }\n  return [curr, parent, prop];\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/Memory.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/util/speculative.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./index')\n  , merge = util.merge;\n\nmodule.exports =\nutil.speculative = {\n  createObject: function () { return {$spec: true}; }\n\n, createArray: function () {\n    var obj = [];\n    obj.$spec = true;\n    return obj;\n  }\n\n, create: function (proto) {\n    if (proto.$spec) return proto;\n\n    if (Array.isArray(proto)) {\n      // TODO Slicing is obviously going to be inefficient on large arrays, but\n      // inheriting from arrays is problematic. Eventually it would be good to\n      // implement something faster in browsers that could support it. See:\n      // http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/#wrappers_prototype_chain_injection\n      var obj = proto.slice();\n      obj.$spec = true;\n      return obj\n    }\n\n    return Object.create(proto, { $spec: { value: true } });\n  }\n\n, clone: function (proto) {\n    if (Array.isArray(proto)) {\n      var obj = proto.slice();\n      obj.$spec = true;\n      return obj;\n    }\n\n    return merge({}, proto);\n  }\n\n, isSpeculative: function (obj) {\n    return obj && obj.$spec;\n  }\n\n, identifier: '$spec' // Used in tests\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/util/speculative.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/path.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('./util')\n  , hasKeys = util.hasKeys;\n\nutil.path = exports;\n\n// Test to see if path name contains a segment that starts with an underscore.\n// Such a path is private to the current session and should not be stored\n// in persistent storage or synced with other clients.\nexports.isPrivate = function isPrivate (name) { return /(?:^_)|(?:\\._)/.test(name); };\n\nexports.isPattern = function isPattern (x) { return -1 === x.indexOf('*'); };\n\nexports.eventRegExp = function eventRegExp (pattern) {\n  if (pattern instanceof RegExp) return pattern;\n  return new RegExp('^' + escapeForRegExp(pattern) + '$');\n};\n\nexports.regExp = function regExp (pattern) {\n  // Match anything if there is no pattern or the pattern is ''\n  if (! pattern) return /^/;\n\n  return new RegExp('^' + pattern.replace(/[.*$]/g, function (match, index) {\n    // Escape periods\n    if (match === '.') return '\\\\.';\n\n    if (match === '$') return '\\\\$';\n\n    // An asterisk matches any single path segment in the middle\n    return '[^.]+';\n\n    // All subscriptions match the root and any path below the root\n  }) + '(?:\\\\.|$)');\n};\n\n// Create regular expression matching the path or any of its parents\nexports.regExpPathOrParent = function regExpPathOrParent (path, levels) {\n  var p = ''\n    , parts = path.split('.')\n    , source = [];\n\n  for (var i = 0, l = parts.length - (levels || 0); i < l; i++) {\n    var segment = parts[i];\n    p += i ? '\\\\.' + segment\n           : segment;\n\n    source.push( '(?:' + escapeForRegExp(p) + ')' );\n  }\n  source = source.join('|');\n  return new RegExp('^(?:' + source + ')$');\n};\n\n// Create regular expression matching any of the paths or child paths of any of\n// the paths\nexports.regExpPathsOrChildren = function regExpPathsOrChildren (paths) {\n  var source = [];\n  for (var i = 0, l = paths.length; i < l; i++) {\n    var path = paths[i];\n    source.push( '(?:' + path + \"(?:\\\\..+)?)\" );\n  }\n  source = source.join('|');\n  source = source.replace(/\\$/g, \"\\\\$\");\n  return new RegExp('^(?:' + source + ')$');\n};\n\nexports.lookup = pathLookup;\n\nfunction pathLookup (path, obj) {\n  if (!obj) return;\n  if (path.indexOf('.') === -1) return obj[path];\n\n  var parts = path.split('.');\n  for (var i = 0, l = parts.length; i < l; i++) {\n    if (!obj) return obj;\n\n    var prop = parts[i];\n    obj = obj[prop];\n  }\n  return obj;\n};\n\nexports.assign = assign;\n\nfunction assign (obj, path, val) {\n  var parts = path.split('.')\n    , lastIndex = parts.length - 1;\n  for (var i = 0, l = parts.length; i < l; i++) {\n    var prop = parts[i];\n    if (i === lastIndex) obj[prop] = val;\n    else                 obj = obj[prop] || (obj[prop] = {});\n  }\n};\n\nexports.objectExcept = function objectExcept (from, exceptions) {\n  if (! from) return;\n  var to = Array.isArray(from) ? [] : {};\n  for (var key in from) {\n    // Skip exact exception matches\n    if (~exceptions.indexOf(key)) continue;\n\n    var nextExceptions = [];\n    for (var i = exceptions.length; i--; ) {\n      var except = exceptions[i]\n        , periodPos = except.indexOf('.')\n        , prefix = except.substring(0, periodPos);\n      if (prefix === key) {\n        nextExceptions.push(except.substring(periodPos + 1, except.length));\n      }\n    }\n    if (nextExceptions.length) {\n      var nested = objectExcept( from[key], nextExceptions );\n      if (hasKeys(nested)) to[key] = nested;\n    } else {\n      if (Array.isArray(from)) key = parseInt(key, 10);\n      to[key] = from[key];\n    }\n  }\n  return to;\n};\n\n/**\n * TODO Rename to isPrefixOf because more String generic? (no path implication)\n * Returns true if `prefix` is a prefix of `path`. Otherwise, returns false.\n * @param {String} prefix\n * @param {String} path\n * @return {Boolean}\n */\nexports.isSubPathOf = function isSubPathOf (path, fullPath) {\n  if (path !== fullPath.substring(0, path.length)) {\n    return false;\n  }\n\n  // Ensure that _x is not considered a subpath of _xs, but is considered a\n  // subpath of _x.s\n  var subsequentChar = fullPath[path.length];\n  if (subsequentChar && subsequentChar !== '.') {\n    return false;\n  }\n  return true;\n};\n\nexports.split = function split (path) {\n  return path.split(/\\.?[(*]\\.?/);\n};\n\nexports.expand = function expand (path) {\n  // Remove whitespace and line break characters\n  path = path.replace(/[\\s\\n]/g, '');\n\n  // Return right away if path doesn't contain any groups\n  if (! ~path.indexOf('(')) return [path];\n\n  // Break up path groups into a list of equivalent paths that contain only\n  // names and *\n  var paths = [''], out = []\n    , stack = { paths: paths, out: out}\n    , lastClosed;\n  while (path) {\n    var match = /^([^,()]*)([,()])(.*)/.exec(path);\n    if (! match) return out.map( function (val) { return val + path; });\n    var pre = match[1]\n      , token = match[2];\n    path = match[3]\n\n    if (pre) {\n      paths = paths.map( function (val) { return val + pre; });\n      if (token !== '(') {\n        var out = lastClosed ? paths : out.concat(paths);\n      }\n    }\n    lastClosed = false;\n    if (token === ',') {\n      stack.out = stack.out.concat(paths);\n      paths = stack.paths;\n    } else if (token === '(') {\n      out = [];\n      stack = { parent: stack, paths: paths, out: out };\n    } else if (token === ')') {\n      lastClosed = true;\n      paths = out = stack.out.concat(paths);\n      stack = stack.parent;\n    }\n  }\n  return out;\n};\n\n// Given a `path`, returns an array of length 3 with the namespace, id, and\n// relative path to the attribute\nexports.triplet = function triplet (path) {\n  var parts = path.split('.');\n  return [parts[0], parts[1], parts.slice(2).join('.')];\n};\n\nexports.subPathToDoc = function subPathToDoc (path) {\n  return path.split('.').slice(0, 2).join('.');\n};\n\nexports.join = function join () {\n  var joinedPath = [];\n  for (var i = 0, l = arguments.length; i < l; i++) {\n    var component = arguments[i];\n    if (typeof component === 'string') {\n      joinedPath.push(component);\n    } else if (Array.isArray(component)) {\n      joinedPath.push.apply(joinedPath, component);\n    } else {\n      throw new Error('path.join only takes strings and Arrays as arguments');\n    }\n  }\n  return joinedPath.join('.');\n};\n\nexports.isImmediateChild = function (ns, path) {\n  var rest = path.substring(ns.length + /* dot */ 1);\n  return -1 === rest.indexOf('.');\n};\n\nexports.isGrandchild = function (ns, path) {\n  var rest = path.substring(ns.length + /* dot */ 1);\n  return -1 !== rest.indexOf('.');\n};\n\nexports.isPathToDoc = function (path) {\n  var firstDot = path.indexOf('.');\n  if (firstDot === -1) return false\n  var lastDot = path.lastIndexOf('.');\n  return firstDot === lastDot;\n}\n\nvar ESCAPE_MAP = {\n  '.': '\\\\.'\n, '$': '\\\\$'\n, '^': '\\\\^'\n, '[': '\\\\['\n, ']': '\\\\]'\n\n  // Commas can be used for or, as in path.(one,two)\n, ',': '|'\n, '|': '\\\\|'\n, '+': '\\\\+'\n, '{': '\\\\{'\n, '}': '\\\\}'\n};\n\nfunction escapeForRegExp (pattern) {\n  var escaped;\n  var eachMatch;\n  if (pattern.substring(0, 9) === '_$queries') {\n    eachMatch = createEachMatch(ESCAPE_MAP, '.*$^[]|+{}');\n    escaped = '_\\\\$queries\\\\.' + pattern.substring(10).replace(/[.*$^\\[\\]|+{}]/g, eachMatch);\n  } else {\n    eachMatch = createEachMatch(ESCAPE_MAP, ',.*$');\n    escaped = pattern.replace(/[,.*$]/g, eachMatch);\n  }\n  return escaped;\n}\n\nfunction createEachMatch (matchHandler, fields) {\n  fields = fields.split('');\n  return function eachMatch (match, index, pattern) {\n    // Escape special characters\n    if (~fields.indexOf(match) && match in matchHandler) {\n      return matchHandler[match];\n    }\n\n    // An asterisk matches any single path segment in the middle and any path\n    // or paths at the end\n    if (pattern.length - index === 1) return '(.+)';\n\n    return '([^.]+)';\n  }\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/path.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/tree.js",Function(['require','module','exports','__dirname','__filename','process','global'],"exports.lookup = lookup;\n\nfunction lookup (data, path, meta) {\n  meta || (meta = {});\n\n  if (meta.skipLast && path.indexOf('.') === -1) {\n    return {node: data.world, path: ''};\n  }\n\n  var props = path.split('.')\n    , curr = data.world\n    , currPath = ''\n    , prop, halt\n\n  while (prop = props.shift()) {\n    currPath = currPath ? currPath + '.' + prop : prop;\n    curr = curr[prop];\n\n    // parts can be modified by iter(...)\n    if (!curr) break;\n\n    if (meta.skipLast && props.length === 1) halt = true;\n\n    if (typeof curr === 'function' && !(meta.getRef && !props.length)) {\n      // Note that props may be mutated\n      var out = curr(data, currPath, props, meta);\n      curr = out.node;\n      currPath = out.path;\n      if (halt || curr == null) break;\n      continue;\n    }\n\n    if (halt || curr == null) break;\n  }\n  while (prop = props.shift()) {\n    currPath = currPath ? currPath + '.' + prop : prop;\n  }\n\n  return {node: curr, path: currPath};\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/tree.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/transaction.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var noop = require('./util').noop\n  , Memory = require('./Memory');\n\n/**\n * Transactions are represented as an Array\n * [ ver = version at the time of the transaction\n * , transaction id\n * , method\n * , arguments]\n */\n\nexports = module.exports = {\n  create: function (obj) {\n    var txn = (obj.ops) ? [obj.ver, obj.id, obj.ops]\n                        : [obj.ver, obj.id, obj.method, obj.args]\n      , ctx = obj.context;\n    if (ctx && !obj.ops) txn.push({c: ctx});\n    return txn;\n  }\n\n, getVer: function (txn) { return txn[0]; }\n, setVer: function (txn, val) { return txn[0] = val; }\n\n, getId: function (txn) { return txn[1]; }\n, setId: function (txn, id) { return txn[1] = id; }\n\n, clientIdAndVer: function (txn) {\n    var pair = this.getId(txn).split('.');\n    pair[1] = parseInt(pair[1], 10);\n    return pair;\n  }\n\n, getMethod: function (txn) { return txn[2]; }\n, setMethod: function (txn, name) { return txn[2] = name; }\n\n, getArgs: function (txn) { return txn[3]; }\n, setArgs: function (txn, vals) { return txn[3] = vals; }\n, copyArgs: function (txn) { return this.getArgs(txn).slice(); }\n\n, getPath: function (txn) { return this.getArgs(txn)[0]; }\n, setPath: function (txn, val) { return this.getArgs(txn)[0] = val; }\n\n, getMeta: function (txn) { return txn[4]; }\n, setMeta: function (txn, meta) { return txn[4] = meta; }\n\n, getContext: function (txn) {\n    var meta = this.getMeta(txn);\n    return meta && meta.c || 'default';\n  }\n, setContext: function (txn, ctx) {\n    var meta = this.getMeta(txn);\n    return meta.c = ctx;\n  }\n\n, getClientId: function (txn) {\n    return this.getId(txn).split('.')[0];\n  }\n, setClientId: function (txn, clientId) {\n    var pair = this.getId(txn).split('.')\n      , clientId = pair[0]\n      , num = pair[1];\n    this.setId(txn, newClientId + '.' + num);\n    return newClientId;\n  }\n\n, pathConflict: function (pathA, pathB) {\n    // Paths conflict if equal or either is a sub-path of the other\n    if (pathA === pathB) return 'equal';\n    var pathALen = pathA.length\n      , pathBLen = pathB.length;\n    if (pathALen === pathBLen) return false;\n    if (pathALen > pathBLen)\n      return pathA.charAt(pathBLen) === '.' && pathA.substr(0, pathBLen) === pathB && 'child';\n    return pathB.charAt(pathALen) === '.' && pathB.substr(0, pathALen) === pathA && 'parent';\n  }\n\n, ops: function (txn, ops) {\n    if (typeof ops !== 'undefined') txn[2] = ops;\n    return txn[2];\n  }\n\n, isCompound: function (txn) {\n    return Array.isArray(txn[2]);\n  }\n\n, applyTxn: function (txn, data, memoryAdapter, ver) {\n    return applyTxn(this, txn, data, memoryAdapter, ver);\n  }\n\n, op: {\n    // Creates an operation\n    create: function (obj) { return [obj.method, obj.args]; }\n\n  , getMethod: function (op) { return op[0]; }\n  , setMethod: function (op, name) { return op[0] = name; }\n\n  , getArgs: function (op) { return op[1]; }\n  , setArgs: function (op, vals) { return op[1] = vals; }\n\n  , applyTxn: function (txn, data, memoryAdapter, ver) {\n      return applyTxn(this, txn, data, memoryAdapter, ver);\n    }\n  }\n};\n\nfunction applyTxn (extractor, txn, data, memoryAdapter, ver) {\n  var method = extractor.getMethod(txn);\n  if (method === 'get') return;\n  var args = extractor.getArgs(txn);\n  if (ver !== null) {\n    ver = extractor.getVer(txn);\n  }\n  args = args.concat([ver, data]);\n  return memoryAdapter[method].apply(memoryAdapter, args);\n}\n\nexports.applyTxnToDoc = function(txn, doc) {\n  var memory = new Memory\n    , path = exports.getPath(txn)\n    , segments = path.split('.')\n    , ns = segments[0]\n    , id = segments[1]\n    , world = memory._data.world\n  world[ns] = {};\n  world[ns][id] = doc;\n  applyTxn(exports, txn, memory._data, memory, -1);\n  return world[ns][id]\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/transaction.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/mutators/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./mutators.Model')\n  , mixinStore = __dirname + '/mutators.Store';\n\nexports = module.exports = plugin;\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\nexports.useWith = { server: true, browser: true };\nexports.decorate = 'racer';\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/mutators/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/mutators/mutators.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var Async = require('./Async')\n  , Memory = require('../Memory')\n  , ACCESSOR = 'accessor'\n  , BASIC_MUTATOR = 'mutator,basicMutator'\n  , COMPOUND_MUTATOR = 'mutator,compoundMutator'\n  , ARRAY_MUTATOR = 'mutator,arrayMutator'\n  ;\n\nmodule.exports = {\n  type: 'Model'\n\n, static: {\n    ACCESSOR: ACCESSOR\n  , BASIC_MUTATOR: BASIC_MUTATOR\n  , COMPOUND_MUTATOR: COMPOUND_MUTATOR\n  , ARRAY_MUTATOR: ARRAY_MUTATOR\n  }\n\n, events: {\n    init: function (model) {\n      // Memory instance for use in building multiple path objects in async get\n      var memory = new Memory();\n\n      model.async = new Async({\n        model: model\n\n      , nextTxnId: function () { return model._nextTxnId(); }\n\n      , get: function (path, cb) {\n          model._upstreamData([path], function (err, data) {\n            if (err) return cb(err);\n\n            // Callback with undefined if no data matched\n            var items = data.data\n              , len = items && items.length;\n            if (! len) return cb();\n\n            // Callback with the value for a single matching item on the same\n            // path\n            if (len === 1) {\n              var item = items[0];\n              if (item && item[0] === path) {\n                return cb(null, item[1]);\n              }\n            }\n\n            // Callback with a multiple path object, such as the result of a query\n            for (var i = 0, l = items.length; i < l; i++) {\n              var pair = items[i]\n                , subpath = pair[0]\n                , value = pair[1];\n              memory.set(subpath, value, -1);\n            }\n            var out = memory.get(path);\n            memory.flush();\n            cb(null, out);\n          });\n        }\n\n      , commit: function (txn, cb) { model._asyncCommit(txn, cb); }\n      });\n    }\n  }\n\n, proto: {\n    get: {\n      type: ACCESSOR\n    , fn: function (path) {\n        var at = this._at;\n        if (at) {\n          path = path ? at + '.' + path : at;\n        }\n        return this._memory.get(path, this._specModel());\n      }\n    }\n\n  , set: {\n      type: BASIC_MUTATOR\n    , fn: function (path, value, cb) {\n        var at = this._at;\n        if (at) {\n          var arglen = arguments.length;\n          if (arglen === 1 || arglen === 2 && typeof value === 'function') {\n            cb = value;\n            value = path;\n            path = at\n          } else {\n            path = at + '.' + path;\n          }\n        }\n\n        // Replace special unicode characters that cause a Syntax Error ILLEGAL\n        // in v8 and chromium\n        // http://timelessrepo.com/json-isnt-a-javascript-subset\n        // http://code.google.com/p/v8/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Type%20Status%20Priority%20Owner%20Summary%20HW%20OS%20Area%20Stars&groupby=&sort=&id=1939\n        if (typeof value === 'string') {\n          value = value.replace(/\\u2028/g, \"\\n\").replace(/\\u2029/g, \"\\n\");\n        }\n        return this._sendOp('set', [path, value], cb);\n      }\n    }\n\n  , del: {\n      type: BASIC_MUTATOR\n    , fn: function (path, cb) {\n        var at = this._at\n        if (at) {\n          if (typeof path === 'string') {\n            path = at + '.' + path;\n          } else {\n            cb = path;\n            path = at;\n          }\n        }\n        return this._sendOp('del', [path], cb);\n      }\n    }\n  , add: {\n      type: COMPOUND_MUTATOR\n    , fn: function (path, value, cb) {\n        var arglen = arguments.length\n          , id;\n        if (this._at && arglen === 1 || arglen === 2 && typeof value === 'function') {\n          cb = value;\n          value = path;\n          if (typeof value !== 'object') {\n            throw new Error('model.add() requires an object argument');\n          }\n          path = id = value.id || (value.id = this.id());\n        } else {\n          value || (value = {});\n          if (typeof value !== 'object') {\n            throw new Error('model.add() requires an object argument');\n          }\n          id = value.id || (value.id = this.id());\n          path += '.' + id;\n        }\n\n        if (cb) {\n          this.set(path, value, function (err) { cb(err, id); });\n        } else {\n          this.set(path, value);\n        }\n        return id;\n      }\n    }\n\n  , setNull: {\n      type: COMPOUND_MUTATOR\n    , fn: function (path, value, cb) {\n        var arglen = arguments.length\n          , obj = (this._at && arglen === 1 || arglen === 2 && typeof value === 'function')\n                ? this.get()\n                : this.get(path);\n        if (obj != null) return obj;\n        if (arglen === 1) {\n          this.set(path);\n          return value;\n        }\n        if (arglen === 2) {\n          this.set(path, value);\n          return value;\n        }\n        this.set(path, value, cb);\n        return value;\n      }\n    }\n\n  , incr: {\n      type: COMPOUND_MUTATOR\n    , fn: function (path, byNum, cb) {\n        if (typeof path !== 'string') {\n          cb = byNum;\n          byNum = path;\n          path = '';\n        }\n\n        var type = typeof byNum;\n        if (type === 'function') {\n          cb = byNum;\n          byNum = 1;\n        } else if (type !== 'number') {\n          byNum = 1;\n        }\n        var value = (this.get(path) || 0) + byNum;\n\n        if (path) {\n          this.set(path, value, cb);\n        } else if (cb) {\n          this.set(value, cb);\n        } else {\n          this.set(value);\n        }\n        return value;\n      }\n    }\n\n  , push: {\n      type: ARRAY_MUTATOR\n    , insertArgs: 1\n    , fn: function () {\n        var args = Array.prototype.slice.call(arguments)\n          , at = this._at\n          , cb;\n        if (at) {\n          var path = args[0]\n            , curr;\n          if (typeof path === 'string' && (curr = this.get()) && !Array.isArray(curr)) {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n\n        if (typeof args[args.length-1] === 'function') {\n          cb = args.pop();\n        }\n\n        return this._sendOp('push', args, cb);\n      }\n    }\n\n  , unshift: {\n      type: ARRAY_MUTATOR\n    , insertArgs: 1\n    , fn: function () {\n        var args = Array.prototype.slice.call(arguments)\n          , at = this._at\n          , cb;\n        if (at) {\n          var path = args[0]\n            , curr;\n          if (typeof path === 'string' && (curr = this.get()) && !Array.isArray(curr)) {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n\n        if (typeof args[args.length-1] === 'function') {\n          cb = args.pop();\n        }\n        return this._sendOp('unshift', args, cb);\n      }\n    }\n\n  , insert: {\n      type: ARRAY_MUTATOR\n    , indexArgs: [1]\n    , insertArgs: 2\n    , fn: function () {\n        var args = Array.prototype.slice.call(arguments)\n          , at = this._at\n          , cb;\n        if (at) {\n          var path = args[0];\n          if (typeof path === 'string' && isNaN(path)) {\n            args[0] = at + '.' + path;\n          } else {\n            args.unshift(at);\n          }\n        }\n\n        var match = /^(.*)\\.(\\d+)$/.exec(args[0]);\n        if (match) {\n          // Use the index from the path if it ends in an index segment\n          args[0] = match[1];\n          args.splice(1, 0, match[2]);\n        }\n\n        if (typeof args[args.length-1] === 'function') {\n          cb = args.pop();\n        }\n        return this._sendOp('insert', args, cb);\n      }\n    }\n\n  , pop: {\n      type: ARRAY_MUTATOR\n    , fn: function (path, cb) {\n        var at = this._at;\n        if (at) {\n          if (typeof path ===  'string') {\n            path = at + '.' + path;\n          } else {\n            cb = path;\n            path = at;\n          }\n        }\n        return this._sendOp('pop', [path], cb);\n      }\n    }\n\n  , shift: {\n      type: ARRAY_MUTATOR\n    , fn: function (path, cb) {\n        var at = this._at;\n        if (at) {\n          if (typeof path === 'string') {\n            path = at + '.' + path;\n          } else {\n            cb = path;\n            path = at;\n          }\n        }\n        return this._sendOp('shift', [path], cb);\n      }\n    }\n\n  , remove: {\n      type: ARRAY_MUTATOR\n    , indexArgs: [1]\n    , fn: function (path, start, howMany, cb) {\n        var at = this._at;\n        if (at) {\n          if (typeof path === 'string' && isNaN(path)) {\n            path = at + '.' + path;\n          } else {\n            cb = howMany;\n            howMany = start;\n            start = path;\n            path = at;\n          }\n        }\n\n        var match = /^(.*)\\.(\\d+)$/.exec(path);\n        if (match) {\n          // Use the index from the path if it ends in an index segment\n          cb = howMany;\n          howMany = start;\n          start = match[2]\n          path = match[1];\n        }\n\n        if (typeof howMany !== 'number') {\n          cb = howMany;\n          howMany = 1;\n        }\n        return this._sendOp('remove', [path, start, howMany], cb);\n      }\n    }\n\n  , move: {\n      type: ARRAY_MUTATOR\n    , indexArgs: [1, 2]\n    , fn: function (path, from, to, howMany, cb) {\n        var at = this._at;\n        if (at) {\n          // isNaN will be false for index values in a string like '3'\n          if (typeof path === 'string' && isNaN(path)) {\n            path = at + '.' + path;\n          } else {\n            cb = howMany;\n            howMany = to;\n            to = from;\n            from = path;\n            path = at;\n          }\n        }\n\n        var match = /^(.*)\\.(\\d+)$/.exec(path);\n        if (match) {\n          // Use the index from the path if it ends in an index segment\n          cb = howMany;\n          howMany = to;\n          to = from;\n          from = match[2];\n          path = match[1];\n        }\n\n        if (typeof howMany !== 'number') {\n          cb = howMany;\n          howMany = 1;\n        }\n\n        return this._sendOp('move', [path, from, to, howMany], cb);\n      }\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/mutators/mutators.Model.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/mutators/Async.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var transaction = require('../transaction')\n  , noop = require('../util').noop;\n\n// TODO Implement remaining methods for AsyncAtomic\n// TODO Redo implementation using a macro\n\nmodule.exports = Async;\n\nfunction Async (options) {\n  options || (options = {});\n  if (options.get) this.get = options.get;\n  if (options.commit) this._commit = options.commit;\n  this.model = options.model;\n\n  // Note that async operation clientIds MUST begin with '#', as this is used\n  // to treat conflict detection between async and sync transactions differently\n  var nextTxnId = options.nextTxnId;\n  if (nextTxnId) {\n    this._nextTxnId = function (callback) {\n      callback(null, '#' + nextTxnId());\n    };\n  }\n}\n\nAsync.prototype = {\n  set: function (path, value, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'set'\n      , args: [path, value]\n      });\n      // TODO When store is mutating, it should have something akin to\n      // superadmin rights. Perhaps store.sudo.set\n      self._commit(txn, callback);\n    });\n  }\n\n, del: function (path, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'del'\n      , args: [path]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, push: function (path, items, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'push'\n      , args: [path].concat(items)\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, unshift: function (path, items, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'unshift'\n      , args: [path].concat(items)\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, insert: function (path, index, items, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'insert'\n      , args: [path, index].concat(items)\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, pop: function (path, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'pop'\n      , args: [path]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, shift: function (path, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'shift'\n      , args: [path]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, remove: function (path, start, howMany, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'remove'\n      , args: [path, start, howMany]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, move: function (path, from, to, howMany, ver, callback) {\n    var self = this;\n    self._nextTxnId( function (err, id) {\n      var txn = transaction.create({\n        ver: ver\n      , id: id\n      , method: 'move'\n      , args: [path, from, to, howMany]\n      });\n      self._commit(txn, callback);\n    });\n  }\n\n, incr: function (path, byNum, callback) {\n    if (typeof byNum === 'function') {\n      // For incr(path, callback)\n      callback = byNum;\n      byNum = 1;\n    } else {\n      if (byNum == null) byNum = 1;\n    }\n    callback || (callback = noop);\n    var tryVal;\n    this.retry( function (atomic) {\n      atomic.get(path, function (val) {\n        tryVal = (val || 0) + byNum;\n        atomic.set(path, tryVal);\n      });\n    }, function (err) {\n      callback(err, tryVal);\n    });\n  }\n\n, setNull: function (path, value, callback) {\n    callback || (callback = noop);\n    var tryVal;\n    this.retry( function (atomic) {\n      atomic.get(path, function (val) {\n        if (val != null) return tryVal = val;\n        tryVal = value;\n        atomic.set(path, tryVal);\n      });\n    }, function (err) {\n      callback(err, tryVal);\n    });\n  }\n\n, add: function (path, value, callback) {\n    callback || (callback = noop);\n    value || (value = {});\n    var id = value.id\n      , uuid = (this.model && this.model.id || this.uuid)\n      , tryId, tryPath;\n\n    this.retry( function (atomic) {\n      tryId = id || (value.id = uuid());\n      tryPath = path + '.' + tryId;\n      atomic.get(tryPath, function (val) {\n        if (val != null) return atomic.next('nonUniqueId');\n        atomic.set(tryPath, value);\n      });\n    }, function (err) {\n      callback(err, tryId);\n    });\n  }\n\n, retry: function (fn, callback) {\n    var retries = MAX_RETRIES;\n    var atomic = new AsyncAtomic(this, function (err) {\n      if (!err) return callback && callback();\n      if (! retries--) {\n\t\t\t\tconsole.error(err);\n\t\t\t\treturn callback && callback('maxRetries');\n\t\t\t}\n      atomic._reset();\n      setTimeout(fn, RETRY_DELAY, atomic);\n    });\n    fn(atomic);\n  }\n};\n\nvar MAX_RETRIES = Async.MAX_RETRIES = 20;\nvar RETRY_DELAY = Async.RETRY_DELAY = 100;\n\nfunction AsyncAtomic (async, cb) {\n  this.async = async;\n  this.cb = cb;\n  this.minVer = 0;\n  this.count = 0;\n}\n\nAsyncAtomic.prototype = {\n  _reset: function () {\n    this.minVer = 0;\n    this.count = 0;\n  }\n\n, next: function (err) {\n  this.cb(err);\n}\n\n, get: function (path, callback) {\n    var self = this\n      , minVer = self.minVer\n      , cb = self.cb\n    self.async.get(path, function (err, value, ver) {\n      if (err) return cb(err);\n      self.minVer = minVer ? Math.min(minVer, ver) : ver;\n      callback && callback(value);\n    });\n  }\n\n, set: function (path, value, callback) {\n    var self = this\n      , cb = self.cb;\n    self.count++;\n    self.async.set(path, value, self.minVer, function (err, value) {\n      if (err) return cb(err);\n      callback && callback(null, value);\n      --self.count || cb();\n    });\n  }\n\n, del: function (path, callback) {\n    var self = this\n      , cb = self.cb;\n    self.count++;\n    self.async.del(path, self.minVer, function (err) {\n      if (err) return cb(err);\n      callback && callback();\n      --self.count || cb();\n    });\n  }\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/mutators/Async.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/refs/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var pathUtils             = require('../path')\n  , regExpPathOrParent    = pathUtils.regExpPathOrParent\n  , regExpPathsOrChildren = pathUtils.regExpPathsOrChildren\n  , treeLookup            = require('../tree').lookup\n  , refUtils              = require('./util')\n  , assertPrivateRefPath  = refUtils.assertPrivateRefPath\n  , RefEmitter            = refUtils.RefEmitter\n  , createRef             = require('./ref')\n  , createRefList         = require('./refList')\n  , utils                 = require('../util')\n  , equal                 = utils.equal\n  , unbundledFunction     = require('../bundle/util').unbundledFunction\n  , TransformBuilder      = require('../descriptor/query/TransformBuilder') // ugh - leaky abstraction\n  ;\n\nexports = module.exports = plugin;\nexports.useWith = { server: true, browser: true };\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixin);\n}\n\nvar mixin = {\n  type: 'Model'\n\n, server: __dirname + '/refs.server'\n, events: {\n    init: function (model) {\n      // [[from, get, item], ...]\n      model._refsToBundle = [];\n\n      // [['fn', path, inputs..., cb.toString()], ...]\n      model._fnsToBundle = [];\n\n      var Model = model.constructor;\n\n      for (var method in Model.mutator) {\n        model.on(method, (function (method) {\n          return function mutatorEmit() {\n            model.emit('mutator', method, arguments);\n          };\n        })(method));\n      }\n\n      var memory = model._memory;\n\n      // De-reference transactions to operate on their absolute path\n      model.on('beforeTxn', function (method, args) {\n        var data = model._specModel()\n          , options, path, refEmitter\n          , meta = {}\n\n        // If we are setting a ref or refList or model.fn\n        if (method === 'set' && typeof args[1] === 'function') {\n          meta.skipLast = true;\n        }\n        // Keep dereferencing until the path doesn't change\n        // TODO: This is a really slow way of doing this\n        do {\n          path = args[0];\n          meta.refEmitter = new RefEmitter(model, method, args);\n          treeLookup(data, path, meta);\n        } while (path !== args[0]);\n      });\n    }\n\n  , bundle: function (model) {\n      var onLoad       = model._onLoad\n        , refsToBundle = model._refsToBundle\n        , fnsToBundle  = model._fnsToBundle;\n\n      for (var i = 0, len = refsToBundle.length; i < len; i++) {\n        var triplet = refsToBundle[i]\n          , from    = triplet[0]\n          , getter  = triplet[1]\n          , item    = triplet[2];\n        if (model._getRef(from) === getter) {\n          onLoad.push(item);\n        }\n      }\n\n      for (i = 0, len = fnsToBundle.length; i < len; i++) {\n        var item = fnsToBundle[i];\n        if (item) onLoad.push(item);\n      }\n    }\n  }\n\n, proto: {\n    /**\n     * Assuming that a ref getter was assigned to `path`, this function will\n     * return that ref getter function.\n     * @param {String} path\n     * @return {Function} the ref getter\n     */\n    _getRef: function (path) {\n      // The 3rd argument `true` below tells Memory#get to return the ref\n      // getter function, instead of invoking the getter function and resolve\n      // the dereferenced value of the ref.\n      return this._memory.get(path, this._specModel(), true);\n    }\n\n    /**\n     * @param {String} path\n     * @param {Boolean} getRef\n     * @return {String}\n     */\n  , dereference: function (path, getRef) {\n      if (!getRef) getRef = false;\n      var data = this._specModel();\n      return treeLookup(data, path, {getRef: getRef}).path;\n    }\n\n    /**\n     * Creates a ref at `from` that points to `to`, with an optional `key`\n     * @param {String} from path\n     * @param {String} to path\n     * @param {String} @optional key path\n     * @param {Boolean} hardLink\n     * @return {Model} a model scope scoped to `from`\n     */\n  , ref: function (from, to, key, hardLink) {\n      return this._createRef(createRef, 'ref', from, to, key, hardLink);\n    }\n\n    /**\n     * Creates a refList at `from` with an array of pointers at `key` that\n     * point to documents in `to`.\n     * @param {String} from path\n     * @param {String} to path\n     * @param {String} key path\n     * @param {Boolean} hardLink\n     * @return {Model} a model scope scoped to `from`\n     */\n  , refList: function (from, to, key, hardLink) {\n      return this._createRef(createRefList, 'refList', from, to, key, hardLink);\n    }\n\n    /**\n     * @param {Function} refFactory\n     * @param {String} refType is either 'ref' or 'refList'\n     * @param {String} from path\n     * @param {String} to path\n     * @param {key} key path\n     * @param {Boolean} hardLink\n     * @return {Model} a model scope scoped to the `from` path\n     */\n  , _createRef: function (refFactory, refType, from, to, key, hardLink) {\n      // Normalize scoped model arguments\n      if (from._at) {\n        from = from._at;\n      } else if (this._at) {\n        from = this._at + '.' + from;\n      }\n      if (to instanceof TransformBuilder) {\n        to = to.path();\n      } else if (to._at) {\n        to = to._at;\n      }\n      if (key && key._at) key = key._at;\n\n      var model = this.root();\n\n      assertPrivateRefPath(model, from, refType);\n      var getter = refFactory(model, from, to, key, hardLink);\n\n      model.setRefGetter(from, getter);\n\n      // The server model adds [from, getter, [refType, from, to, key]] to\n      // this._refsToBundle\n      if (this._onCreateRef) this._onCreateRef(refType, from, to, key, getter);\n\n      return model.at(from);\n    }\n\n  , setRefGetter: function (path, getter) {\n      var self = this;\n      // Prevent emission of the next set event, since we are setting the\n      // dereferencing function and not its value.\n      var listener = this.on('beforeTxn', function (method, args) {\n        // Supress emission of set events when setting a function, which is\n        // what happens when a ref is created\n        if (method === 'set' && args[1] === getter) {\n          args.cancelEmit = true;\n          self.removeListener('beforeTxn', listener);\n        }\n      });\n\n      // Now, set the dereferencing function\n      var prevValue = this.set(path, getter);\n      // Emit a set event with the expected de-referenced values\n      var newValue = this.get(path);\n      this.emit('set', [path, newValue], prevValue, true);\n    }\n\n    /**\n     * TODO\n     * Works similar to model.fn(inputs..., fn) but without having to declare\n     * inputs. This means that fn also takes no arguments\n     */\n  , autofn: function (fn) {\n      throw new Error('Unimplemented');\n      autodep(this, fn);\n    }\n\n    /**\n     * model.fn(inputs... ,fn);\n     *\n     * Defines a reactive value that depends on the paths represented by\n     * `inputs`, which are used by `fn` to re-calculate a return value every\n     * time any of the `inputs` change.\n     */\n  , fn: function (/* inputs..., fn */) {\n      var arglen = arguments.length\n        , inputs = Array.prototype.slice.call(arguments, 0, arglen-1)\n        , fn = arguments[arglen-1];\n\n      // Convert scoped models into paths\n      for (var i = 0, len = inputs.length; i < len; i++) {\n        var scopedPath = inputs[i]._at;\n        if (scopedPath) inputs[i] = scopedPath;\n      }\n\n      var path = inputs.shift()\n        , model = this.root();\n\n      // If we are a scoped model, scoped to this._at\n      if (this._at) path = this._at + '.' + path;\n\n      assertPrivateRefPath(this, path, 'fn');\n      if (typeof fn === 'string') {\n        fn = unbundledFunction(fn);\n      }\n      return model._createFn(path, inputs, fn);\n    }\n\n    /**\n     * @param {String} path to the reactive value\n     * @param {[String]} inputs is a list of paths from which the reactive\n     * value is calculated\n     * @param {Function} fn returns the reactive value at `path` calculated\n     * from the values at the paths defined by `inputs`\n     */\n  , _createFn: function (path, inputs, fn, destroy) {\n      var prevVal, currVal\n        , self = this\n        , reSelf = regExpPathOrParent(path)\n        , reInput = regExpPathsOrChildren(inputs)\n        , destroy = self._onCreateFn && self._onCreateFn(path, inputs, fn)\n\n      var listener = function listenerFnMutator (mutator, _arguments) {\n        var mutatorPath = _arguments[0][0];\n        // Ignore mutations created by this reactive function\n        if (_arguments[3] === listener) return;\n\n        // Remove reactive function if something else sets the value of its\n        // output path. We also get the current value here, since a mutator might\n        // operate on the path or the parent path that does not actually affect\n        // the reactive function\n        if (reSelf.test(mutatorPath) && cleanup()) return;\n\n        if (reInput.test(mutatorPath)) {\n          currVal = updateVal();\n        }\n      };\n\n      function cleanup() {\n        // The equal function is true if the objects are identical or if\n        // they are both NaN\n        if (equal(self.get(path), currVal)) return;\n        self.removeListener('mutator', listener);\n        destroy && destroy();\n        self.removeListener('cleanup', cleanup);\n        return true;\n      }\n      self.on('cleanup', cleanup);\n\n      self.on('mutator', listener);\n\n      var model = self.pass(listener);\n\n      function updateVal () {\n        prevVal = currVal;\n        var inputVals = [];\n        for (var i = 0, len = inputs.length; i < len; i++) {\n          inputVals.push(self.get(inputs[i]));\n        }\n        try {\n          currVal = fn.apply(null, inputVals);\n        } catch (err) {\n          console.log('\"' + err.message + '\" thrown in model.fn:\\n', fn.toString());\n          console.error(err);\n        }\n        if (equal(prevVal, currVal)) return currVal;\n        model.set(path, currVal);\n        return currVal;\n      };\n      return updateVal();\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/refs/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/refs/util.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var pathUtils = require('../path')\n  , joinPaths = pathUtils.join\n  , isPrivate = pathUtils.isPrivate\n  , eventRegExp = pathUtils.eventRegExp\n  , utils = require('../util')\n  , hasKeys = utils.hasKeys\n\nmodule.exports = {\n  assertPrivateRefPath: assertPrivateRefPath\n, RefListener: RefListener\n, RefEmitter: RefEmitter\n};\n\n/**\n * Asserts that the path of a ref is private.\n * @param {Model} model\n * @param {String} path is the path of the ref\n */\nfunction assertPrivateRefPath(model, path) {\n  if (! isPrivate(model.dereference(path, true)) )\n    throw new Error('Cannot create ref on public path \"' + path + '\"');\n}\n\n/**\n * Add a listener function (method, path, arguments) on the 'mutator' event.\n * The listener ignores mutator events that fire on paths that do not match\n * `pattern`\n * @param {Array} listeners is an Array of listener functions that the listener\n * we generate is added to.\n * @param {Model} model is the model to which we add the listener\n * @param {String} from is the private path of the ref\n * @param {Function} getter\n * @param {String} pattern\n * @param {Function} generatePath(match, mutator, args) generates the referenced\n *   (i.e., inverse of de-referenced) path. This path is used to generate a\n *   path that we should emit on for this reference.\n */\nfunction RefListener(model, from, getter) {\n  var patternRegExps = this.patternRegExps = []\n    , pathGenerators = this.pathGenerators = []\n\n  var listener = function listenerRefMutator (mutator, _arguments) {\n    var path = _arguments[0][0]\n      , matches, i\n      ;\n    for (i = patternRegExps.length; i--;) {\n      if (patternRegExps[i].test(path)) {\n        (matches || (matches = [])).push(i);\n      }\n    }\n    // Lazy cleanup of listener\n    if (!matches || cleanup()) return;\n\n    var pathGenerator, args, dereffedPath, isLocal, pass;\n    for (i = matches.length; i--;) {\n      pathGenerator = pathGenerators[matches[i]];\n      // Construct the next de-referenced path to emit on. pathGenerator\n      // may also alter args\n      args = _arguments[0].slice();\n      args.out = _arguments[1];\n      dereffedPath = pathGenerator(path, mutator, args);\n      if (dereffedPath === null) continue;\n      args[0] = dereffedPath;\n      isLocal = _arguments[2];\n      pass = _arguments[3];\n      model.emit(mutator, args, args.out, isLocal, pass);\n    }\n  };\n\n  function cleanup() {\n    if (model._getRef(from) === getter) return;\n    model.removeListener('mutator', listener);\n    model.removeListener('cleanup', cleanup);\n    return true;\n  }\n  model.on('cleanup', cleanup);\n\n  model.on('mutator', listener);\n}\n\n/**\n * @param {String} pattern\n * @param {Function} pathGenerator(path, method, args)\n */\nRefListener.prototype.add = function (pattern, pathGenerator) {\n  this.patternRegExps.push(eventRegExp(pattern));\n  this.pathGenerators.push(pathGenerator);\n}\n\nfunction RefEmitter(model, method, args) {\n  this.model = model;\n  this.method = method;\n  this.args = args;\n}\n\n/**\n * Called when a lookup gets to a refList.\n * Changes this.args.\n * May also set dereffed + '.' + id\n *\n * @param {Array<Object>} node\n * @param {String} pathToRef is the path to the refList\n * @param {Array<String>} rest is the rest of the properties we want to look\n *   up, after encountering the refList. Should be empty.\n * @param {Array<String>} pointerList is an array of other document ids\n * @param {String} dereffed is the dereferenced path to the refList\n * @param {String} pathToPointerList is the dereferneced path to the refList list of pointers\n */\nRefEmitter.prototype.onRefList = function (node, pathToRef, rest, pointerList, dereffed, pathToPointerList) {\n  var id;\n  if (rest.length) return;\n  var Model = this.model.constructor\n    , basicMutators = Model.basicMutator;\n\n  // This function should handle array mutations only\n  if (!this.method || (this.method in basicMutators)) return;\n\n  var arrayMutators = Model.arrayMutator\n    , mutator = arrayMutators[this.method];\n  if (!mutator) throw new Error(this.method + ' unsupported on refList');\n\n  this.args[0] = pathToPointerList;\n\n  var j, arg, indexArgs;\n  // Handle index args if they are specified by id\n  if (indexArgs = mutator.indexArgs) {\n    for (var k = 0, len = indexArgs.length; k < len; k++) {\n      j = indexArgs[k];\n      arg = this.args[j];\n      if (!arg) continue;\n      id = arg.id;\n      if (id == null) continue;\n      // Replace id arg with the current index for the given id\n      var idIndex = pointerList.indexOf(id);\n      if (idIndex !== -1) this.args[j] = idIndex;\n    }\n  }\n\n  if (j = mutator.insertArgs) {\n    while (arg = this.args[j]) {\n      id = (arg.id == null) ? (arg.id = this.model.id()) : arg.id;\n      // Set the object being inserted if it contains any properties\n      // other than id\n      if (hasKeys(arg, 'id')) {\n        this.model.set(dereffed + '.' + id, arg);\n      }\n      this.args[j] = id;\n      j++;\n    }\n  }\n};\n\n/**\n * @param {Array<Object>} node\n * @param {Array<String>} pointerList\n * @param {String} memberKeyPath\n * @param {String} domainPath\n * @param {String} id\n * @param {Array<String>} rest\n */\nRefEmitter.prototype.onRefListMember = function (node, pointerList, memberKeyPath, domainPath, id, rest) {\n  // TODO Additional model methods should be done atomically with the\n  // original txn instead of making an additional txn\n  var method = this.method;\n  if (method === 'set') {\n    var model = this.model;\n    var origSetTo = this.args[1];\n    if (!id) {\n      id = (origSetTo.id != null)\n         ? origSetTo.id\n         : (origSetTo.id = model.id());\n    }\n    if (model.get(memberKeyPath) !== id) {\n      model.set(memberKeyPath, id);\n    }\n    this.args[0] = joinPaths(domainPath, id, rest);\n  } else if (method === 'del') {\n    id = node.id;\n    if (id == null) {\n      throw new Error('Cannot delete refList item without id');\n    }\n    if (! rest.length) {\n      this.model.del(memberKeyPath);\n    }\n    this.args[0] = joinPaths(domainPath, id, rest);\n  } else if (rest.length) {\n    this.args[0] = joinPaths(domainPath, id, rest);\n  } else {\n    throw new Error(method + ' unsupported on refList index');\n  }\n};\n\nRefEmitter.prototype.onRef = function (node, dereffedToPath, rest, hardLink) {\n  // Allow ref to be deleted or over-written if not a hardLink\n  if (!hardLink && !rest.length && (this.method === 'del' || this.method == 'set')) return;\n  this.args[0] = joinPaths(dereffedToPath, rest);\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/refs/util.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/refs/ref.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var refUtils = require('./util')\n  , RefListener = refUtils.RefListener\n  , pathUtil = require('../path')\n  , regExpPathOrParent = pathUtil.regExpPathOrParent\n  , lookup = pathUtil.lookup\n  , indexOf = require('../util').indexOf\n  , indexOfFn = require('../util').indexOfFn\n  , Model = require('../Model')\n  , treeLookup = require('../tree').lookup\n  ;\n\nexports = module.exports = createRef;\n\nfunction createRef (model, from, to, key, hardLink) {\n  if (!from)\n    throw new Error('Missing `from` in `model.ref(from, to, key)`');\n  if (!to)\n    throw new Error('Missing `to` in `model.ref(from, to, key)`');\n\n  if (key) {\n    var getter = createGetterWithKey(to, key, hardLink);\n    setupRefWithKeyListeners(model, from, to, key, getter);\n  } else {\n    var getter = createGetterWithoutKey(to, hardLink);\n    setupRefWithoutKeyListeners(model, from, to, getter);\n  }\n  return getter;\n}\n\n// TODO Rewrite *WithKey to work\n/**\n * Returns a getter function that is assigned to the ref's `from` path. When a\n * lookup function encounters the getter, it invokes the getter in order to\n * navigate to the proper node in `data` that is pointed to by the ref. The\n * invocation also \"expands\" the current path to the absolute path pointed to\n * by the ref.\n *\n * @param {String} to path\n * @param {String} key path\n * @param {Boolean} hardLink\n * @return {Function} getter\n */\nfunction createGetterWithKey (to, key, hardLink) {\n  /**\n   * @param {Function} lookup as defined in Memory.js\n   * @param {Object} data is all data in the Model or the spec model\n   * @param {String} path is the path traversed so far to the ref function\n   * @param {[String]} props is the array of all properties that we want to traverse\n   * @param {Number} len is the number of properties in props\n   * @param {Number} i is the index in props representing the current property\n   * we are at in our traversal of props\n   * @return {[Object, String, Number]} [current node in data, current path,\n   * current props index]\n   */\n  return function getterWithKey (data, pathToRef, rest, meta) {\n    var toOut          = treeLookup(data, to, null)\n      , domain         = toOut.node\n      , dereffedToPath = toOut.path\n\n      , keyOut          = treeLookup(data, key, null)\n      , id              = keyOut.node\n      , path, node\n\n    if (Array.isArray(domain)) {\n      var index = indexOfFn(domain, function (doc) {\n        return doc.id === id;\n      });\n      node = domain[index];\n      path = dereffedToPath + '.' + index;\n    } else if (! domain) {\n      node = undefined;\n      path = dereffedToPath + '.' + id;\n    } else if (domain.constructor === Object) {\n      node = domain[id];\n      path = dereffedToPath + '.' + id;\n    } else {\n      throw new Error();\n    }\n    if (meta.refEmitter) {\n      meta.refEmitter.onRef(node, path, rest, hardLink);\n    }\n    return {node: node, path: path};\n  }\n}\n\nfunction setupRefWithKeyListeners (model, from, to, key, getter) {\n  var refListener = new RefListener(model, from, getter)\n    , toOffset = to.length + 1;\n\n  refListener.add(to + '.*', function (path) {\n    var keyPath = model.get(key) + '' // Cast to string\n      , remainder = path.slice(toOffset);\n    if (remainder === keyPath) return from;\n    // Test to see if the remainder starts with the keyPath\n    var index = keyPath.length;\n    if (remainder.substring(0, index + 1) === keyPath + '.') {\n      remainder = remainder.substring(index + 1, remainder.length);\n      return from + '.' + remainder;\n    }\n    // Don't emit another event if the keyPath is not matched\n    return null;\n  });\n\n  refListener.add(key, function (path, mutator, args) {\n    var docs = model.get(to)\n      , id\n      , out = args.out\n      ;\n    if (mutator === 'set') {\n      id = args[1];\n      if (Array.isArray(docs)) {\n        args[1] = docs && docs[ indexOf(docs, id, equivId) ];\n        args.out = docs && docs[ indexOf(docs, out, equivId) ];\n      } else {\n        // model.get is used in case this points to a ref\n        args[1] = model.get(to + '.' + id);\n        args.out = model.get(to + '.' + out);\n      }\n    } else if (mutator === 'del') {\n      if (Array.isArray(docs)) {\n        args.out = docs && docs[ indexOf(docs, out, equivId) ];\n      } else {\n        // model.get is used in case this points to a ref\n        args.out = model.get(to + '.' + out);\n      }\n    }\n    return from;\n  });\n}\n\nfunction equivId (id, doc) {\n  return doc && doc.id === id;\n}\n\nfunction createGetterWithoutKey (to, hardLink) {\n  return function getterWithoutKey (data, pathToRef, rest, meta) {\n    var prevRests = meta.prevRests || []\n    prevRests.unshift(rest);\n    var out = treeLookup(data, to, {prevRests: prevRests});\n    prevRests.shift();\n    if (meta.refEmitter) {\n      meta.refEmitter.onRef(out.node, out.path, rest, hardLink);\n    }\n    return out;\n  };\n}\n\nfunction setupRefWithoutKeyListeners(model, from, to, getter) {\n  var refListener = new RefListener(model, from, getter)\n    , toOffset = to.length + 1;\n\n  refListener.add(to, function () {\n    return from;\n  });\n\n  refListener.add(to + '.*', function (path) {\n    return from + '.' + path.slice(toOffset);\n  });\n\n  refListener.add(regExpPathOrParent(to, 1), function (path, mutator, args) {\n    var remainder = to.slice(path.length + 1)\n\n    if (mutator === 'set') {\n      args[1] = lookup(remainder, args[1]);\n      args.out = lookup(remainder, args.out);\n    } else if (mutator === 'del') {\n      args.out = lookup(remainder, args.out);\n    } else {\n      // Don't emit an event if not a set or delete\n      return null;\n    }\n    return from;\n  });\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/refs/ref.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/refs/refList.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('../util')\n  , indexOf = util.indexOf\n  , indexOfFn = util.indexOfFn\n  , refUtils = require('./util')\n  , RefListener = refUtils.RefListener\n  , Model = require('../Model')\n  , treeLookup = require('../tree').lookup\n  ;\n\nmodule.exports = createRefList;\n\nfunction createRefList (model, from, to, key) {\n  if (!from || !to || !key) {\n    throw new Error('Invalid arguments for model.refList');\n  }\n  var arrayMutators = Model.arrayMutator\n    , getter = createGetter(from, to, key)\n    , refListener = new RefListener(model, from, getter)\n    , toOffset = to.length + 1;\n\n  refListener.add(key, function (path, method, args) {\n    var methodMeta = arrayMutators[method]\n      , i = methodMeta && methodMeta.insertArgs;\n    if (i) {\n      var id, docs;\n      docs = model.get(to);\n      while ((id = args[i]) && id != null) {\n        args[i] = (Array.isArray(docs))\n          ? docs && docs[ indexOf(docs, id, function (id, doc) { return doc && doc.id === id; })  ]\n          : docs && docs[id];\n        // args[i] = model.get(to + '.' + id);\n        i++;\n      }\n    }\n    return from;\n  });\n\n  refListener.add(to + '.*', function (path) {\n    var id = path.slice(toOffset)\n      , i = id.indexOf('.')\n      , remainder;\n    if (~i) {\n      remainder = id.substr(i+1);\n      id = id.substr(0, i);\n      // id can be a document id,\n      // or it can be an array index if to resolves to e.b., a filter result array\n      // This line is for the latter case\n      id = model.get(to + '.' + id + '.id')\n    }\n    var pointerList = model.get(key);\n    if (!pointerList) return null;\n    i = pointerList.indexOf(id);\n    if (i === -1) return null;\n    return remainder ?\n      from + '.' + i + '.' + remainder :\n      from + '.' + i;\n  });\n\n  return getter;\n}\n\nfunction createGetter (from, to, key) {\n  /**\n   * This represents a ref function that is assigned as the value of the node\n   * located at `path` in `data`\n   *\n   * @param {Object} data is the speculative or non-speculative data tree\n   * @param {String} pathToRef is the current path to the ref function\n   * @param {[String]} rest is an array of properties representing the suffix\n   * path we still want to lookup up on the dereferenced lookup\n   * @param {Object} meta\n   * @config {Array} [meta.prevRests]\n   * @config {RefEmitter} [meta.refEmitter]\n   * @return {Array} {node, path}\n   */\n  return function getterRefList (data, pathToRef, rest, meta) {\n    var toOut = treeLookup(data, to)\n      , domain = toOut.node || {} // formerly obj\n      , dereffed = toOut.path\n\n      , keyOut = treeLookup(data, key)\n      , pointerList = keyOut.node\n      , dereffedKey = keyOut.path\n      ;\n\n    if (!rest.length) {\n      var node = [];\n      if (pointerList) {\n        // returned node should be an array of dereferenced documents\n        for (var k = 0, len = pointerList.length; k < len; k++) {\n          var id = pointerList[k];\n          node.push(getDoc(domain, id, to, pathToRef));\n        }\n      }\n\n      if (meta.refEmitter) {\n        meta.refEmitter.onRefList(node, pathToRef, rest, pointerList, dereffed, dereffedKey);\n      }\n      return { node: node, path: pathToRef };\n    } else {\n      if (rest.length === 1 && rest[0] === 'length') {\n        rest.shift();\n        return {node: pointerList ? pointerList.length : 0, path: pathToRef + '.length'};\n      }\n      var index = rest.shift()\n        , id = pointerList && pointerList[index]\n        , node = domain && id && getDoc(domain, id, to, pathToRef);\n      if (meta.refEmitter) {\n        meta.refEmitter.onRefListMember(node, pointerList, dereffedKey + '.' + index, dereffed, id, rest);\n      }\n      return {node: node, path: dereffed + '.' + id};\n    }\n  };\n}\nfunction getDoc (domain, id, to, pathToRef) {\n  if (domain.constructor == Object) {\n    return domain[id];\n  } else if (Array.isArray(domain)) {\n    return domain[indexOfFn(domain, function (doc) {\n      if (!doc) {\n        console.warn(new Error('Unexpected'));\n        console.warn(\"No doc\", 'domain:', domain, 'refList to path:', to, 'pathToRef:', pathToRef);\n      }\n      return doc && doc.id == id;\n    })]\n  } else {\n    throw new TypeError();\n  }\n}\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/refs/refList.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/bundle/util.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var isProduction = require('../util').isProduction\n\nmodule.exports = {\n  init: init\n, bundledFunction: bundledFunction\n, unbundledFunction: unbundledFunction\n}\n\nvar racer;\nfunction init (_racer) {\n  racer = _racer;\n};\n\nfunction bundledFunction (fn) {\n  var fnStr = fn.toString();\n  if (isProduction) {\n    // Uglify can't parse a naked function. Executing it allows Uglify to\n    // parse it properly\n    var minified = racer.get('minifyJs')('(' + fnStr + ')();');\n    fnStr = minified.slice(1, -4);\n  }\n  return fnStr;\n}\n\nfunction unbundledFunction (fnStr) {\n  return (new Function('return ' + fnStr + ';'))();\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/bundle/util.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/TransformBuilder.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var QueryBuilder = require('./QueryBuilder')\n  , MemoryQuery = require('./MemoryQuery')\n  , setupQueryModelScope = require('./scope')\n  , filterDomain = require('../../computed/filter').filterDomain\n  , bundledFunction = require('../../bundle/util').bundledFunction\n  , unbundledFunction = require('../../bundle/util').unbundledFunction\n  , Model = require('../../Model')\n  ;\n\nmodule.exports = TransformBuilder;\n\nfunction TransformBuilder (model, source) {\n  QueryBuilder.call(this);\n  this._model = model;\n  this.from(source);\n\n  // This is an array of paths that this Transformation (i.e., filter) depends\n  // on. Filters will depend on paths if we use filter against parameters that\n  // are paths pointing to data that can change. e.g.,\n  //\n  //   model.filter(ns).where(field).equals(model.at('_dependency'))\n  //\n  // In this case, this.dependencies == ['_dependency']\n  this.dependencies = [];\n}\n\nvar fromJson = QueryBuilder._createFromJsonFn(TransformBuilder);\n\nTransformBuilder.fromJson = function (model, source) {\n  var filterFn = source.filter;\n  delete source.filter;\n  var builder = fromJson(source);\n  builder._model = model;\n  if (filterFn) {\n    filterFn = unbundledFunction(filterFn);\n    builder.filter(filterFn);\n  }\n  return builder;\n};\n\nTransformBuilder.prototype = new QueryBuilder();\n\nTransformBuilder.prototype.filter = function (filterSpec) {\n  var filterFn;\n  if (typeof filterSpec === 'function') {\n    this.filterFn = filterSpec;\n  } else if (filterSpec.constructor == Object) {\n    this.query(filterSpec);\n  }\n  return this;\n};\n\nvar __sort__ = TransformBuilder.prototype.sort;\nTransformBuilder.prototype.sort = function (sortSpec) {\n  if (typeof sortSpec === 'function') {\n    this._comparator = sortSpec;\n    return this;\n  }\n  // else sortSpec === ['fieldA', 'asc', 'fieldB', 'desc', ...]\n  return __sort__.call(this, sortSpec);\n};\n\n// Quack like a Model (delegates to Model#get and Model#path)\n\n/**\n * Registers, executes, and sets up listeners for a model query, the first time\n * this is called. Subsequent calls just return the cached scoped model\n * representing the filter result.\n *\n * @return {Model} a scoped model scoped to a refList\n * @api public\n */\nTransformBuilder.prototype.get = function () {\n  return this.model().get();\n};\n\nTransformBuilder.prototype.model = function () {\n  var scopedModel = this.scopedModel;\n  if (! scopedModel) {\n    scopedModel = this.scopedModel = this._genScopedModel();\n    var model = this._model;\n\n    // For server-side bundling\n    if (model._onCreateFilter) {\n      model._onCreateFilter(this);\n    }\n  }\n  return scopedModel;\n};\n\nTransformBuilder.prototype.path = function () {\n  return this.model().path();\n};\n\n// Default query type of 'find'\nTransformBuilder.prototype.type = 'find';\n\nTransformBuilder.prototype._genScopedModel = function () {\n  // syncRun is also called by the Query Model Scope on dependency changes\n  var model = this._model\n    , domain = model.get(this.ns)\n    , filterFn = this.filterFn;\n\n  // TODO Register the transform, so it can be cleaned up when we no longer\n  // need it\n\n  var queryJson = QueryBuilder.prototype.toJSON.call(this)\n    , comparator = this._comparator\n    , memoryQuery = this.memoryQuery = new MemoryQuery(queryJson, model)\n    ;\n  if (filterFn) {\n    var oldSyncRun = memoryQuery.syncRun\n      , oldFilterTest = memoryQuery.filterTest;\n    memoryQuery.syncRun = function (searchSpace) {\n      searchSpace = filterDomain(searchSpace, function (v, k) {\n        return filterFn(v, k, model);\n      });\n      return oldSyncRun.call(this, searchSpace);\n    };\n    memoryQuery.filterTest = function (doc, ns) {\n      // TODO Replace null with key or index in filterFn call\n      return oldFilterTest.call(this, doc, ns) && filterFn(doc, null, model);\n    };\n  }\n  if (comparator) memoryQuery.sort(comparator);\n  var result = memoryQuery.syncRun(domain);\n  var queryId = QueryBuilder.hash(queryJson, filterFn);\n  return setupQueryModelScope(model, memoryQuery, queryId, result, this.dependencies);\n};\n\nTransformBuilder.prototype.toJSON = function () {\n  var json = QueryBuilder.prototype.toJSON.call(this);\n  if (this.filterFn) {\n    json.filter = bundledFunction(this.filterFn);\n  }\n  return json;\n};\n\n// TransformBuilder.prototype.filterTest = function (doc, ns) {\n//   if (ns !== this.ns) return false;\n//   var filterFn = this.filterFn;\n//   if (filterFn && ! filterFn(doc)) return false;\n//   return this.memoryQuery.filterTest(doc, ns);\n// };\n\nQueryBuilder.queryMethods.forEach( function (method) {\n  var oldMethod = TransformBuilder.prototype[method];\n  TransformBuilder.prototype[method] = function (val) {\n    var pathToDependency;\n    if (val instanceof Model) {\n      pathToDependency = val.path();\n      val = {$ref: pathToDependency};\n    } else if (val && val.$ref) {\n      pathToDependency = val.$ref;\n    }\n    if (pathToDependency) {\n      var dependencies = this.dependencies;\n      if (dependencies.indexOf(pathToDependency) === -1) {\n        dependencies.push(pathToDependency);\n      }\n    }\n    return oldMethod.call(this, val);\n  }\n});\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/TransformBuilder.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/QueryBuilder.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = QueryBuilder;\n\nvar reserved = {\n    equals: 1\n  , notEquals: 1\n  , softEquals: 1\n  , notSoftEquals: 1\n  , gt: 1\n  , gte: 1\n  , lt: 1\n  , lte: 1\n  , within: 1\n  , contains: 1\n  , exists: 1\n  , elemPropertyEquals: 1\n};\n\nvar validQueryParams = {\n    from: 1\n  , byId: 1\n  , where: 1\n  , skip: 1\n  , limit: 1\n  , sort: 1\n  , except: 1\n  , only: 1\n};\n\n/**\n * QueryBuilder constructor\n * @param {Object} params looks like:\n *   {\n *     from: 'someNamespace'\n *   , where: {\n *       name: 'Gnarls'\n *     , gender: { notEquals: 'female' }\n *     , age: { gt: 21, lte: 30 }\n *     , tags: { contains: ['super', 'derby'] }\n *     , shoe: { within: ['nike', 'adidas'] }\n *     }\n *   , sort: ['fieldA', 'asc', 'fieldB', 'desc']\n *   , skip: 10\n *   , limit: 5\n *   }\n */\nfunction QueryBuilder (params) {\n  this._json = {};\n  if (params) this.query(params);\n}\n\nfunction keyMatch (obj, fn) {\n  for (var k in obj) {\n    if (fn(k)) return true;\n  }\n  return false;\n}\n\nfunction isReserved (key) { return key in reserved; }\n\nQueryBuilder.prototype.from = function (from) {\n  this.ns = from;\n  this._json.from = from;\n  return this;\n};\n\nQueryBuilder.prototype.byId = function (id) {\n  this._json.byId = id;\n  return this;\n};\nQueryBuilder.prototype.where = function (param) {\n  if (typeof param === 'string') {\n    this._currField = param;\n    return this;\n  }\n\n  if (param.constructor !== Object) {\n    console.error(param);\n    throw new Error(\"Invalid `where` param\");\n  }\n\n  for (var fieldName in param) {\n    this._currField = fieldName;\n    var arg = param[fieldName]\n    if (arg === null || arg.constructor !== Object) {\n      this.equals(arg);\n    } else if (keyMatch(arg, isReserved)) {\n      for (var comparator in arg) {\n        this[comparator](arg[comparator]);\n      }\n    } else {\n      this.equals(arg);\n    }\n  }\n};\n\nQueryBuilder.prototype.toJSON = function () {\n  var json = this._json;\n  if (this.type && !json.type) json.type = this.type;\n  return json;\n};\n\n/**\n * Entry-point for more coffee-script style query building.\n *\n * @param {Object} params representing additional query method calls\n * @return {QueryBuilder} this for chaining\n */\nQueryBuilder.prototype.query = function (params) {\n  for (var k in params) {\n    if (! (k in validQueryParams)) {\n      throw new Error(\"Un-identified operator '\" + k + \"'\");\n    }\n    this[k](params[k]);\n  }\n  return this;\n};\n\nQueryBuilder._createFromJsonFn = function (QueryBuilderKlass) {\n  return function (json) {\n    var q = new QueryBuilderKlass;\n    for (var param in json) {\n      switch (param) {\n        case 'type':\n          QueryBuilder.prototype[json[param]].call(q);\n          break;\n        case 'from':\n        case 'byId':\n        case 'sort':\n        case 'skip':\n        case 'limit':\n          q[param](json[param]);\n          break;\n        case 'only':\n        case 'except':\n          q[param](json[param]);\n          break;\n        case 'equals':\n        case 'notEquals':\n        case 'softEquals':\n        case 'notSoftEquals':\n        case 'gt':\n        case 'gte':\n        case 'lt':\n        case 'lte':\n        case 'within':\n        case 'contains':\n        case 'exists':\n          var fields = json[param];\n          for (var field in fields) {\n            q.where(field)[param](fields[field]);\n          }\n          break;\n        default:\n          throw new Error(\"Un-identified Query json property '\" + param + \"'\");\n      }\n    }\n    return q;\n  }\n};\n\nQueryBuilder.fromJson = QueryBuilder._createFromJsonFn(QueryBuilder);\n\n// We use ABBREVS for query hashing, so our hashes are more compressed.\nvar ABBREVS = {\n        equals: '$eq'\n      , notEquals: '$ne'\n      , softEquals: '$seq'\n      , notSoftEquals: '$nse'\n      , gt: '$gt'\n      , gte: '$gte'\n      , lt: '$lt'\n      , lte: '$lte'\n      , within: '$w'\n      , contains: '$c'\n      , exists: '$x'\n      , elemPropertyEquals: '$epe'\n\n      , byId: '$id'\n\n      , only: '$o'\n      , except: '$e'\n      , sort: '$s'\n      , asc: '^'\n      , desc: 'v'\n      , skip: '$sk'\n      , limit: '$L'\n    }\n  , SEP = ':';\n\nfunction noDots (path) {\n  return path.replace(/\\./g, '$DOT$');\n}\n\n// TODO Close ABBREVS with reverse ABBREVS?\nQueryBuilder.hash = function (json, filterFn) {\n  var groups = []\n    , typeHash\n    , nsHash\n    , byIdHash\n    , selectHash\n    , sortHash\n    , skipHash\n    , limitHash\n    , group\n    , fields, field;\n\n  for (var method in json) {\n    var val = json[method];\n    switch (method) {\n      case 'type':\n        typeHash = json[method];\n        break;\n      case 'from':\n        nsHash = noDots(val);\n        break;\n      case 'byId':\n        byIdHash = ABBREVS.byId + SEP + JSON.stringify(val);\n        break;\n      case 'only':\n      case 'except':\n        selectHash = ABBREVS[method];\n        for (var i = 0, l = val.length; i < l; i++) {\n          field = val[i];\n          selectHash += SEP + noDots(field);\n        }\n        break;\n      case 'sort':\n        sortHash = ABBREVS.sort + SEP;\n        for (var i = 0, l = val.length; i < l; i+=2) {\n          field = val[i];\n          sortHash += noDots(field) + SEP + ABBREVS[val[i+1]];\n        }\n        break;\n      case 'skip':\n        skipHash = ABBREVS.skip + SEP + val;\n        break;\n      case 'limit':\n        limitHash = ABBREVS.limit + SEP + val;\n        break;\n\n      case 'where':\n        break;\n      case 'within':\n      case 'contains':\n        for (var k in val) {\n          val[k] = val[k].sort();\n        }\n        // Intentionally fall-through without a break\n      case 'equals':\n      case 'notEquals':\n      case 'softEquals':\n      case 'notSoftEquals':\n      case 'gt':\n      case 'gte':\n      case 'lt':\n      case 'lte':\n      case 'exists':\n      case 'elemPropertyEquals':\n        group = [ABBREVS[method]];\n        fields = group[group.length] = [];\n        groups.push(group);\n        for (field in val) {\n          fields.push([field, JSON.stringify(val[field])]);\n        }\n        break;\n    }\n  }\n\n  var hash = nsHash + SEP + typeHash;\n  if (byIdHash)  hash += SEP + byIdHash;\n  if (sortHash)   hash += SEP + sortHash;\n  if (selectHash) hash += SEP + selectHash;\n  if (skipHash)   hash += SEP + skipHash;\n  if (limitHash)  hash += SEP + limitHash;\n\n  for (var i = groups.length; i--; ) {\n    group = groups[i];\n    group[1] = group[1].sort(comparator);\n  }\n\n  groups = groups.sort( function (groupA, groupB) {\n    var pathA = groupA[0]\n      , pathB = groupB[0];\n    if (pathA < pathB)   return -1;\n    if (pathA === pathB) return 0;\n    return 1;\n  });\n\n  for (i = 0, l = groups.length; i < l; i++) {\n    group = groups[i];\n    hash += SEP + SEP + group[0];\n    fields = group[1];\n    for (var j = 0, m = fields.length; j < m; j++) {\n      var pair = fields[j]\n        , field = pair[0]\n        , val   = pair[1];\n      hash += SEP + noDots(field) + SEP + val;\n    }\n  }\n\n  if (filterFn) {\n    // TODO: Do a less ghetto hash function here\n    hash += SEP + 'filterFn' + SEP +\n      filterFn.toString().replace(/[\\s(){},.:]/g, function(match) {\n        return match.charCodeAt(0);\n      });\n  }\n\n  return hash;\n};\n\nQueryBuilder.prototype.hash = function hash () {\n  return QueryBuilder.hash(this._json);\n};\n\nfunction comparator (pairA, pairB) {\n  var methodA = pairA[0], methodB = pairB[0];\n  if (methodA < methodB)   return -1;\n  if (methodA === methodB) return 0;\n  return 1;\n}\n\nQueryBuilder.prototype.sort = function (params) {\n  if (arguments.length > 1) {\n    params = Array.prototype.slice.call(arguments);\n  }\n  this._json.sort = params;\n  return this;\n};\n\nvar methods = [\n    'skip'\n  , 'limit'\n];\n\nmethods.forEach( function (method) {\n  QueryBuilder.prototype[method] = function (arg) {\n    this._json[method] = arg;\n    return this;\n  }\n});\n\nmethods = ['only', 'except'];\n\nmethods.forEach( function (method) {\n  QueryBuilder.prototype[method] = function (paths) {\n    if (arguments.length > 1 || ! Array.isArray(arguments[0])) {\n      paths = Array.prototype.slice.call(arguments);\n    }\n    var json = this._json\n      , fields = json[method] || (json[method] = {});\n    if (Array.isArray(paths)) {\n      for (var i = paths.length; i--; ) {\n        fields[paths[i]] = 1;\n      }\n    } else if (paths.constructor === Object) {\n      merge(fields, paths);\n    } else {\n      console.error(paths);\n      throw new Error('Un-supported paths format');\n    }\n    return this;\n  }\n});\n\nmethods =\nQueryBuilder.queryMethods = [\n    'equals'\n  , 'notEquals'\n  , 'softEquals'\n  , 'notSoftEquals'\n  , 'gt', 'gte', 'lt', 'lte'\n  , 'within', 'contains'\n  , 'elemPropertyEquals'\n];\n\nmethods.forEach( function (method) {\n  // Each method `equals`, `notEquals`, etc. just populates a `json` property\n  // that is a JSON representation of the query that can be passed around\n  QueryBuilder.prototype[method] = function (val) {\n    var json = this._json\n      , cond = json[method] || (json[method] = {});\n    cond[this._currField] = val;\n    return this;\n  };\n});\n\nQueryBuilder.prototype.exists = function (val) {\n  var json = this._json\n    , cond = json.exists || (json.exists = {});\n  cond[this._currField] = (!arguments.length)\n                        ? true // exists() is shorthand for exists(true)\n                        : val;\n  return this;\n};\n\nvar queryTypes = require('./types')\n  , registerType = require('./types/register');\nfor (var t in queryTypes) {\n  registerType(QueryBuilder, t, queryTypes[t]);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/QueryBuilder.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/types/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"exports = module.exports = {\n  findOne: require('./findOne')\n, one: require('./findOne')\n, find: require('./find')\n, count: require('./count')\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/types/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/types/findOne.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var sortUtils = require('../../../computed/sort')\n  , sortDomain = sortUtils.sortDomain\n  , projectDomain = require('../../../computed/project').projectDomain\n  , sliceDomain = require('../../../computed/range').sliceDomain\n  , PRIVATE_COLLECTION = require('./constants').PRIVATE_COLLECTION\n  ;\n\nexports.exec = function (matches, memoryQuery) {\n  // Query results should always be a list. sort co-erces the results into a\n  // list even if comparator is not present.\n  matches = sortDomain(matches, memoryQuery._comparator);\n\n  // Handle skip/limit for pagination\n  var skip = memoryQuery._skip\n    , limit = memoryQuery._limit;\n  if (typeof limit !== 'undefined') {\n    matches = sliceDomain(matches, skip, limit);\n  }\n\n  // Truncate to limit the work of the subsequent field projections step.\n  matches = [matches[0]];\n\n  // Selectively return the documents with a subset of fields based on\n  // `except` or `only`\n  var only = memoryQuery._only\n    , except = memoryQuery._except;\n  if (only || except) {\n    matches = projectDomain(matches, only || except, !!except);\n  }\n\n  return matches[0];\n};\n\nexports.assignInitialResult = function (model, queryId, initialResult) {\n  if (!initialResult) return;\n  model.set(getPointerPath(queryId), initialResult.id);\n};\n\nexports.createScopedModel = function (model, memoryQuery, queryId) {\n  var ns = memoryQuery.ns\n  return model.ref(refPath(queryId), ns, getPointerPath(queryId));\n};\n\nfunction refPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.result';\n}\n\nfunction getPointerPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.resultId';\n}\n\n// In this case, docs is the same as searchSpace.\nexports.onOverwriteNs = function (docs, findOneQuery, model) {\n  var queryId = findOneQuery.id\n    , findQuery = equivFindQuery(findOneQuery);\n  docs = findQuery.syncRun(docs);\n  if (! docs[0]) {\n    var warning = new Error('Unexpected: docs[0] is undefined');\n    console.warn(warning.stack);\n    return console.warn('docs:', docs, 'findOneQuery:', findOneQuery);\n  }\n  model.set(getPointerPath(queryId), docs[0].id);\n};\n\nexports.onRemoveNs = function (docs, findOneQuery, model) {\n  var queryId = findOneQuery.id;\n  model.del(getPointerPath(queryId));\n};\n\n// TODO Think through this logic more\nexports.onAddDoc = function (newDoc, oldDoc, findOneQuery, model, searchSpace, currResult) {\n  var ns = findOneQuery.ns\n    , doesBelong = findOneQuery.filterTest(newDoc, ns);\n  if (! doesBelong) return;\n  var pointerPath = getPointerPath(findOneQuery.id);\n  if (currResult) {\n    var list = [currResult, newDoc];\n    if (list.length === 2) {\n      var comparator = findOneQuery._comparator;\n      list = list.sort(comparator);\n      model.set(pointerPath, list[0].id);\n    }\n  } else {\n    model.set(pointerPath, newDoc.id);\n  }\n};\n\nexports.onInsertDocs = function (newDocs, findOneQuery, model, searchSpace, currResult) {\n  var list = (currResult) ? [currResult].concat(newDocs) : newDocs\n    , comparator = findOneQuery._comparator\n    ;\n  list = list.sort(comparator);\n  var pointerPath = getPointerPath(findOneQuery.id);\n  model.set(pointerPath, list[0].id);\n};\n\nexports.onRmDoc = function (oldDoc, findOneQuery, model, searchSpace, currResult) {\n  if (oldDoc.id === (currResult && currResult.id)) {\n    var findQuery = equivFindQuery(findOneQuery)\n      , results = equivFindQuery.syncRun(searchSpace);\n    if (!results.length) return;\n    var pointerPath = getPointerPath(findOneQuery.id);\n    if (! results[0]) {\n      var warning = new Error('Unexpected: results[0] is undefined');\n      console.warn(warning.stack);\n      return console.warn('results:', results, 'findOneQuery:', findOneQuery);\n    }\n    model.set(pointerPath, results[0].id);\n  }\n};\n\nexports.onUpdateDocProperty = function (doc, memoryQuery, model, searchSpace, currResult) {\n  var ns = memoryQuery.ns\n    , pointerPath = getPointerPath(memoryQuery.id);\n\n  if (!memoryQuery.filterTest(doc, ns)) {\n    if ((currResult && currResult.id) !== doc.id) return;\n    var findQuery = equivFindQuery(memoryQuery);\n    var results = findQuery.syncRun(searchSpace);\n    if (results.length) {\n      if (! results[0]) {\n        var warning = new Error('Unexpected: results[0] is undefined');\n        console.warn(warning.stack);\n        return console.warn('results:', results, 'equivFindQuery:', findQuery);\n      }\n      return model.set(pointerPath, results[0].id);\n    }\n    return model.set(pointerPath, null);\n  }\n  var comparator = memoryQuery._comparator;\n  if (!comparator) {\n    return model.set(pointerPath, doc.id);\n  }\n  if (comparator(doc, currResult) < 0) {\n    model.set(pointerPath, doc.id);\n  }\n};\n\nfunction equivFindQuery (findOneQuery) {\n  var MemoryQuery = findOneQuery.constructor;\n  return new MemoryQuery(Object.create(findOneQuery.toJSON(), {\n    type: { value: 'find' }\n  }));\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/types/findOne.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/computed/sort.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var lookup = require('../path').lookup\n  , specIdentifier = require('../util/speculative').identifier\n\nmodule.exports = {\n  sortDomain: sortDomain\n, deriveComparator: deriveComparator\n};\n\nfunction sortDomain (domain, comparator) {\n  if (! Array.isArray(domain)) {\n    var list = [];\n    for (var k in domain) {\n      if (k === specIdentifier) continue;\n      list.push(domain[k]);\n    }\n    domain = list;\n  }\n  if (!comparator) return domain;\n  return domain.sort(comparator);\n}\n\n// TODO Do the functions below need to belong here?\n\n/**\n * Generates a comparator function that returns -1, 0, or 1\n * if a < b, a == b, or a > b respectively, according to the ordering criteria\n * defined by sortParams\n * , e.g., sortParams = ['field1', 'asc', 'field2', 'desc']\n */\nfunction deriveComparator (sortList) {\n  return function comparator (a, b, sortParams) {\n    sortParams || (sortParams = sortList);\n    var dir, path, factor, aVal, bVal\n      , aIsIncomparable, bIsIncomparable;\n    for (var i = 0, l = sortParams.length; i < l; i+=2) {\n      var dir = sortParams[i+1];\n      switch (dir) {\n        case 'asc' : factor =  1; break;\n        case 'desc': factor = -1; break;\n        default: throw new Error('Must be \"asc\" or \"desc\"');\n      }\n      path = sortParams[i];\n      aVal = lookup(path, a);\n      bVal = lookup(path, b);\n\n      // Handle undefined, null, or in-comparable aVal and/or bVal.\n      aIsIncomparable = isIncomparable(aVal)\n      bIsIncomparable = isIncomparable(bVal);\n\n      // Incomparables always come last.\n      if ( aIsIncomparable && !bIsIncomparable) return factor;\n      // Incomparables always come last, even in reverse order.\n      if (!aIsIncomparable &&  bIsIncomparable) return -factor;\n\n      // Tie-break 2 incomparable fields by comparing more downstream ones\n      if ( aIsIncomparable &&  bIsIncomparable) continue;\n\n      // Handle comparable field values\n      if      (aVal < bVal) return -factor;\n      else if (aVal > bVal) return factor;\n\n      // Otherwise, the field values for both docs so far are equivalent\n    }\n    return 0;\n  };\n}\n\nfunction isIncomparable (x) {\n  return (typeof x === 'undefined') || x === null;\n}\n\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/computed/sort.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/computed/project.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var path = require('../path')\n  , objectExcept = path.objectExcept\n  , objectWithOnly = require('racer-util/object').only\n  , specIdentifier = require('../util/speculative').identifier\n\nexports.projectDomain = projectDomain;\n\nfunction projectDomain (domain, fields, isExcept) {\n  fields = Object.keys(fields);\n  var projectObject = isExcept\n                    ? objectExcept\n                    : objectWithOnly;\n  if (Array.isArray(domain)) {\n    return domain.map( function (doc) {\n      return projectObject(doc, fields);\n    });\n  }\n\n  var out = {};\n  for (var k in domain) {\n    if (k === specIdentifier) continue;\n    out[k] = projectObject(domain[k], fields);\n  }\n  return out;\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/computed/project.js"
));

require.define("/node_modules/derby/node_modules/racer/node_modules/racer-util/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/racer/node_modules/racer-util/package.json"
));

require.define("/node_modules/derby/node_modules/racer/node_modules/racer-util/object.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  merge: merge\n, extract: extract\n, deepEqual: deepEqual\n, only: objectWithOnly\n, filter: filter\n};\n\nfunction merge () {\n  var merged = {};\n  for (var i = 0, l = arguments.length; i < l; i++) {\n    var obj = arguments[i];\n    for (var k in obj) {\n      merged[k] = obj[k];\n    }\n  }\n  return merged;\n}\n\nfunction extract (key, obj) {\n  return obj[key];\n}\n\n/**\n * Modified from node's assert.js\n */\nfunction deepEqual (actual, expected, ignore) {\n  // 7.1. All identical values are equivalent, as determined by ===.\n  if (actual === expected) return true;\n\n  // 7.2. If the expected value is a Date object, the actual value is\n  // equivalent if it is also a Date object that refers to the same time.\n  if (actual instanceof Date && expected instanceof Date)\n    return actual.getTime() === expected.getTime();\n\n  if (typeof actual === 'function' && typeof expected === 'function')\n    return actual === expected || actual.toString() === expected.toString();\n\n  // 7.3. Other pairs that do not both pass typeof value == 'object',\n  // equivalence is determined by ==.\n  if (typeof actual !== 'object' && typeof expected !== 'object')\n    return actual === expected;\n\n  // 7.4. For all other Object pairs, including Array objects, equivalence is\n  // determined by having the same number of owned properties (as verified\n  // with Object.prototype.hasOwnProperty.call), the same set of keys\n  // (although not necessarily the same order), equivalent values for every\n  // corresponding key, and an identical 'prototype' property. Note: this\n  // accounts for both named and indexed properties on Arrays.\n  if (ignore) {\n    var ignoreMap = {}\n      , i = ignore.length\n    while (i--) {\n      ignoreMap[ignore[i]] = true;\n    }\n  }\n  return objEquiv(actual, expected, ignoreMap);\n}\n\n/** Private Functions **/\n\n/**\n * Modified from node's assert.js\n */\nfunction objEquiv (a, b, ignoreMap) {\n  var i, key, ka, kb;\n\n  if (a == null || b == null) return false;\n\n  // an identical 'prototype' property.\n  if (a.prototype !== b.prototype) return false;\n\n  //~~~I've managed to break Object.keys through screwy arguments passing.\n  //   Converting to array solves the problem.\n  if (isArguments(a)) {\n    if (! isArguments(b)) return false;\n    a = pSlice.call(a);\n    b = pSlice.call(b);\n    return deepEqual(a, b);\n  }\n  try {\n    if (ignoreMap) {\n      ka = keysWithout(a, ignoreMap);\n      kb = keysWithout(b, ignoreMap);\n    } else {\n      ka = Object.keys(a);\n      kb = Object.keys(b);\n    }\n  } catch (e) {\n    // happens when one is a string literal and the other isn't\n    return false;\n  }\n  // having the same number of owned properties (keys incorporates\n  // hasOwnProperty)\n  if (ka.length !== kb.length) return false;\n\n  // the same set of keys (although not necessarily the same order),\n  ka.sort();\n  kb.sort();\n\n  //~~~cheap key test\n  i = ka.length;\n  while (i--) {\n    if (ka[i] !== kb[i]) return false;\n  }\n\n  //equivalent values for every corresponding key, and\n  //~~~possibly expensive deep test\n  i = ka.length;\n  while (i--) {\n    key = ka[i];\n    if (! deepEqual(a[key], b[key])) return false;\n  }\n  return true;\n}\n\nfunction isArguments (obj) {\n  return toString.call(obj) === '[object Arguments]';\n}\n\nfunction objectWithOnly (obj, paths) {\n  var projectedDoc = {};\n  for (var i = 0, l = paths.length; i < l; i++) {\n    var path = paths[i];\n    assign(projectedDoc, path, lookup(path, obj));\n  }\n  return projectedDoc;\n}\n\nfunction filter (obj, fn) {\n  var filtered = {};\n  for (var k in obj) {\n    var curr = obj[k];\n    if (fn(curr, k)) filtered[k] = curr;\n  }\n  return filtered;\n}\n\nfunction assign (obj, path, val) {\n  var parts = path.split('.')\n    , lastIndex = parts.length - 1;\n  for (var i = 0, l = parts.length; i < l; i++) {\n    var prop = parts[i];\n    if (i === lastIndex) obj[prop] = val;\n    else                 obj = obj[prop] || (obj[prop] = {});\n  }\n};\n\nfunction lookup (path, obj) {\n  if (!obj) return;\n  if (path.indexOf('.') === -1) return obj[path];\n\n  var parts = path.split('.');\n  for (var i = 0, l = parts.length; i < l; i++) {\n    if (!obj) return obj;\n\n    var prop = parts[i];\n    obj = obj[prop];\n  }\n  return obj;\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/node_modules/racer-util/object.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/computed/range.js",Function(['require','module','exports','__dirname','__filename','process','global'],"exports.sliceDomain = sliceDomain;\n\nfunction sliceDomain (list, skip, limit) {\n  if (typeof skip === 'undefined') skip = 0;\n  return list.slice(skip, skip + limit);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/computed/range.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/types/constants.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  PRIVATE_COLLECTION: '_$queries'\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/types/constants.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/types/find.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var sortUtils = require('../../../computed/sort')\n  , sortDomain = sortUtils.sortDomain\n  , projectDomain = require('../../../computed/project').projectDomain\n  , sliceDomain = require('../../../computed/range').sliceDomain\n  , PRIVATE_COLLECTION = require('./constants').PRIVATE_COLLECTION\n  , indexOf = require('../../../util').indexOf\n  ;\n\nexports.exec = function (matches, memoryQuery) {\n  // Query results should always be a list. sort co-erces the results into a\n  // list even if comparator is not present.\n  matches = sortDomain(matches, memoryQuery._comparator);\n\n  // Handle skip/limit for pagination\n  var skip = memoryQuery._skip\n    , limit = memoryQuery._limit;\n  if (typeof limit !== 'undefined') {\n    matches = sliceDomain(matches, skip, limit);\n  }\n\n  // Selectively return the documents with a subset of fields based on\n  // `except` or `only`\n  var only = memoryQuery._only\n    , except = memoryQuery._except;\n  if (only || except) {\n    matches = projectDomain(matches, only || except, !!except);\n  }\n\n  return matches;\n};\n\nexports.assignInitialResult = function (model, queryId, initialResult) {\n  if (!initialResult) return model.set(getPointerPath(queryId), []);\n  var ids = [], item;\n  for (var i = 0, l = initialResult.length; i < l; i++) {\n    item = initialResult[i];\n    if (!item) {\n      continue;\n    }\n    ids.push(item.id);\n  }\n  model.set(getPointerPath(queryId), ids);\n};\n\nexports.createScopedModel = function (model, memoryQuery, queryId, initialResult) {\n  var ns = memoryQuery.ns;\n  return model.refList(refPath(queryId), ns, getPointerPath(queryId));\n};\n\nfunction refPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.results';\n}\n\nfunction getPointerPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.resultIds'\n}\n\n// All of these callbacks are semantically relative to our search\n// space. Hence, onAddDoc means a listener for the event when a\n// document is added to the search space to query.\n\n// In this case, docs is the same as searchSpace.\nexports.onOverwriteNs = function (docs, findQuery, model) {\n  var docs = findQuery.syncRun(docs)\n    , queryId = findQuery.id\n    , docIds = [];\n  for (var i = 0, l = docs.length; i < l; i++) {\n    if (! docs[i]) {\n      var warning = new Error('Unexpected: docs[i] is undefined');\n      console.warn(warning.stack);\n      console.warn('docs:', docs, 'i:', i, 'findQuery', findQuery);\n    } else {\n      docIds.push(docs[i].id);\n    }\n  }\n  model.set(getPointerPath(queryId), docIds);\n};\n\nexports.onRemoveNs = function (model, findQuery, model) {\n  var queryId = findQuery.id;\n  model.set(getPointerPath(queryId), []);\n};\n\nexports.onReplaceDoc = function (newDoc, oldDoc) {\n  return onUpdateDocProperty(newDoc);\n}\n\nexports.onAddDoc = function (newDoc, oldDoc, memoryQuery, model, searchSpace, currResult) {\n  var ns = memoryQuery.ns\n    , doesBelong = memoryQuery.filterTest(newDoc, ns)\n    ;\n  if (! doesBelong) return;\n\n  var pointerPath = getPointerPath(memoryQuery.id)\n    , pointers = model.get(pointerPath)\n    , alreadyAResult = (pointers && (-1 !== pointers.indexOf(newDoc.id)));\n  if (alreadyAResult) return;\n\n  if (memoryQuery.isPaginated && currResult.length === memoryQuery._limit) {\n    // TODO Re-do this hack later\n    return;\n  }\n  insertDocAsPointer(memoryQuery._comparator, model, pointerPath, currResult, newDoc);\n};\n\nexports.onInsertDocs = function (newDocs, memoryQuery, model, searchSpace, currResult) {\n  for (var i = 0, l = newDocs.length; i < l; i++) {\n    this.onAddDoc(newDocs[i], null, memoryQuery, model, searchSpace, currResult);\n  }\n};\n\nexports.onRmDoc = function (oldDoc, memoryQuery, model) {\n  // If the doc is no longer in our data, but our results have a reference to\n  // it, then remove the reference to the doc.\n  if (!oldDoc) return;\n  var queryId = memoryQuery.id\n    , pointerPath = getPointerPath(queryId)\n    , pointers = model.get(pointerPath)\n    , pos = pointers ? pointers.indexOf(oldDoc.id) : -1;\n  if (~pos) model.remove(pointerPath, pos, 1);\n};\n\nexports.onUpdateDocProperty = function (doc, memoryQuery, model, searchSpace, currResult) {\n  var id = doc.id\n    , ns = memoryQuery.ns\n    , queryId = memoryQuery.id\n    , pointerPath = getPointerPath(queryId)\n    , currPointers = model.get(pointerPath) || []\n    , pos = currPointers.indexOf(id);\n\n  // If the updated doc belongs in our query results...\n  if (memoryQuery.filterTest(doc, ns)) {\n    // ...and it is already recorded in our query result.\n    if (~pos) {\n      // Then, figure out if we need to re-order our results\n      var resortedResults = currResult.sort(memoryQuery._comparator)\n        , newPos = indexOf(resortedResults, id, equivId);\n      if (pos === newPos) return;\n      return model.move(pointerPath, pos, newPos, 1);\n    }\n\n    // ...or it is not recorded in our query result\n    if (memoryQuery.isPaginated && currResult.length === memoryQuery._limit) {\n      // TODO Re-do this hack later\n      return;\n    }\n    return insertDocAsPointer(memoryQuery._comparator, model, pointerPath, currResult, doc);\n  }\n\n  // Otherwise, if the doc does not belong in our query results, but\n  // it did belong to our query results prior to mutation...\n  if (~pos) model.remove(pointerPath, pos, 1);\n};\n\nexports.resultDefault = [];\n\n/**\n * @param {Function} comparator is the sort comparator function of the query\n * @param {Model} model is the racer model\n * @param {String} pointerPath is the path where the list of pointers (i.e.,\n * document ids) to documents resides\n * @param {[Object]} currResults is the array of documents representing the\n * results as cached prior to the mutation.\n * @param {Object} doc is the document we want to insert into our query results\n */\nfunction insertDocAsPointer (comparator, model, pointerPath, currResults, doc) {\n  if (!comparator) {\n    var lastResult = currResults[currResults.length-1];\n    if (lastResult && lastResult.id === doc.id) return;\n    var out = model.insert(pointerPath, currResults.length, doc.id);\n    return out;\n  }\n  for (var k = currResults.length; k--; ) {\n    var currRes = currResults[k]\n      , comparison = comparator(doc, currRes);\n    if (comparison >= 0) {\n      if (! currRes) {\n        var warning = new Error('Unexpected: expected currResults[k] !== undefined');\n        console.warn(warning.stack);\n        console.warn('currResults:', currResults, 'k:', k, 'doc:', doc);\n        continue;\n      }\n      if (doc.id === currRes.id) return;\n      return model.insert(pointerPath, k+1, doc.id);\n    }\n  }\n  return model.insert(pointerPath, 0, doc.id);\n}\n\nfunction equivId (id, doc) {\n  return doc && doc.id === id;\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/types/find.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/types/count.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var PRIVATE_COLLECTION = require('./constants').PRIVATE_COLLECTION\nexports.exec = function (matches, memoryQuery) {\n  if (Array.isArray(matches)) {\n    return matches.length\n  }\n  return Object.keys(matches).length;\n};\n\nexports.assignInitialResult = function (model, queryId, initialResult) {\n  model.set(getResultPath(queryId), initialResult || 0);\n};\n\nexports.createScopedModel = function (model, memoryQuery, queryId) {\n  var ns = memoryQuery.ns\n  return model.at(getResultPath(queryId));\n};\n\nfunction getResultPath (queryId) {\n  return PRIVATE_COLLECTION + '.' + queryId + '.count';\n}\n\nexports.onOverwriteNs = function (docs, countQuery, model) {\n  return; // TODO Figure out how best to handle count later\n\n  var queryId = findOneQuery.id\n    , count = countQuery.syncRun(docs);\n  model.set(getResultPath(queryId), count);\n};\n\nexports.onRemoveNs = function (docs, countQuery, model) {\n  model.set(getResultPath(countQuery.id), 0);\n};\n\nexports.onAddDoc = function (newDoc, oldDoc, countQuery, model, searchSpace, currResult) {\n  return; // TODO Figure out how best to handle count later\n\n  var ns = countQuery.ns\n    , doesBelong = countQuery.filterTest(newDoc, ns);\n  if (! doesBelong) return;\n  var resultPath = getResultPath(countQuery.id);\n  model.set(resultPath, (currResult || 0) + 1);\n};\n\nexports.onInsertDocs = function (newDocs, countQuery, model, searchSpace, currResult) {\n  return; // TODO Figure out how best to handle count later\n\n  model.set(pointerPath, currResult + newDocs.length);\n};\n\nexports.onRmDoc = function (oldDoc, countQuery, model, searchSpace, currResult) {\n  return; // TODO Figure out how best to handle count later\n\n  var ns = countQuery.ns\n    , doesBelong = countQuery.filterTest(oldDoc, ns);\n  if (! doesBelong) return;\n  var resultPath = getResultPath(countQuery.id);\n  model.set(resultPath, currResult - 1);\n};\n\nexports.onUpdateDocProperty = function (doc, countQuery, model, searchSpace, currResult) {\n  return; // TODO Figure out how best to handle count later\n  var resultPath = getResultPath(countQuery.id)\n    , count = countQuery.syncRun(searchSpace);\n  model.set(resultPath, count);\n};\n\nexports.resultDefault = 0;\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/types/count.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/types/register.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = function register (Klass, typeName, conf) {\n  var proto = Klass.prototype\n    , types = proto._types = proto._types || {};\n  types[typeName] = conf;\n\n  proto.getType = function (name) {\n    return this._types[name || 'find'];\n  };\n\n  proto[typeName] = function () {\n    this._json.type = this.type = typeName;\n    return this;\n  };\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/types/register.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/MemoryQuery.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// TODO JSDoc\nvar filterUtils = require('../../computed/filter')\n  , filterFnFromQuery = filterUtils.filterFnFromQuery\n  , filterDomain = filterUtils.filterDomain\n  , sortUtils = require('../../computed/sort')\n  , deriveComparator = sortUtils.deriveComparator\n  , util = require('../../util')\n  , Promise = util.Promise\n  , merge = util.merge\n  , objectExcept = require('../../path').objectExcept\n  ;\n\nmodule.exports = MemoryQuery;\n\n/**\n * MemoryQuery instances are used:\n * - On the server when DbMemory database adapter is used\n * - On QueryNodes stored inside a QueryHub to figure out which transactions\n *   trigger query result changes to publish to listeners.\n * - Inside the browser for filters\n *\n * @param {Object} json representing a query that is typically created via\n * convenient QueryBuilder instances. See QueryBuilder.js for more details.\n * @param {Model} model is passed to MemoryQuery from a TransformBuilder.\n */\nfunction MemoryQuery (json, model) {\n  // We need model internally, so we can pass model down (via context `this`)\n  // to predicates that are defined by our convenience filter methods\n  // (e.g., `equals`, `notEquals`; see fieldPredicates in filter.js)\n  this.model = model\n\n  this.ns = json.from;\n  this._json = json;\n  var filteredJson = objectExcept(json, ['only', 'except', 'limit', 'skip', 'sort', 'type']);\n  this._filter = filterFnFromQuery(filteredJson);\n  for (var k in json) {\n    if (k === 'type') {\n      // json[k] can be: 'find', 'findOne', 'count', etc.\n      this[json[k]]();\n    } else if (k in this) {\n      this[k](json[k]);\n    }\n  }\n}\n\nMemoryQuery.prototype.toJSON = function toJSON () {\n  return this._json;\n};\n\n/**\n * Specify that documents in the result set are stripped of all fields except\n * the ones specified in `paths`\n * @param {Object} paths to include. The Object maps String -> 1\n * @return {MemoryQuery} this for chaining\n * @api public\n */\nMemoryQuery.prototype.only = function only (paths) {\n  if (this._except) {\n    throw new Error(\"You can't specify both query(...).except(...) and query(...).only(...)\");\n  }\n  var only = this._only || (this._only = {id: 1});\n  merge(only, paths);\n  return this;\n};\n\n/**\n * Specify that documents in the result set are stripped of the fields\n * specified in `paths`. You aren't allowed to exclude the path \"id\"\n * @param {Object} paths to exclude. The Object maps String -> 1\n * @return {MemoryQuery} this for chaining\n * @api public\n */\nMemoryQuery.prototype.except = function except (paths) {\n  if (this._only) {\n    throw new Error(\"You can't specify both query(...).except(...) and query(...).only(...)\");\n  }\n  var except = this._except || (this._except = {});\n  if ('id' in paths) {\n    throw new Error('You cannot ignore `id`');\n  }\n  merge(except, paths);\n  return this;\n};\n\n// Specify that the result set includes no more than `lim` results\n// @param {Number} lim is the number of results to which to limit the result set\nMemoryQuery.prototype.limit = function limit (lim) {\n  this.isPaginated = true;\n  this._limit = lim;\n  return this;\n};\n\n// Specify that the result set should skip the first `howMany` results out of\n// the entire set of results that match the equivlent query without a skip or\n// limit.\nMemoryQuery.prototype.skip = function skip (howMany) {\n  this.isPaginated = true;\n  this._skip = howMany;\n  return this;\n};\n\n// e.g.,\n// sort(['field1', 'asc', 'field2', 'desc', ...])\n/**\n * mquery.sort(['field1', 'asc', 'field2', 'desc']);\n *\n * OR\n *\n * mquery.sort( function (x, y) {\n *   if (x > y) return 1;\n *   if (x < y) return -1;\n *   return 0;\n * });\n *\n * @param {Array|Function} params\n * @return {MemoryQuery}\n */\nMemoryQuery.prototype.sort = function (params) {\n  if (typeof params === 'function') {\n    this._comparator = params;\n    return this;\n  }\n  var sort = this._sort;\n  if (sort && sort.length) {\n    sort = this._sort = this._sort.concat(params);\n  } else {\n    sort = this._sort = params;\n  }\n  this._comparator = deriveComparator(sort);\n  return this;\n};\n\n\nMemoryQuery.prototype.filterTest = function filterTest (doc, ns) {\n  if (ns !== this._json.from) return false;\n  return this._filter(doc);\n};\n\nMemoryQuery.prototype.run = function (memoryAdapter, cb) {\n  var promise = (new Promise).on(cb)\n    , searchSpace = memoryAdapter._get(this._json.from)\n    , matches = this.syncRun(searchSpace);\n\n  promise.resolve(null, matches);\n\n  return promise;\n};\n\nMemoryQuery.prototype.syncRun = function (searchSpace) {\n  // We need to this._filter.bind(this) here, so we can pass this.model to the\n  // this._filter function (this.model is accessed by fieldPredicates in\n  // filter.js)\n  var matches = filterDomain(searchSpace, this._filter.bind(this), this._json.from);\n\n  return this.getType(this.type).exec(matches, this);\n};\n\nvar queryTypes = require('./types')\n  , registerType = require('./types/register');\nfor (var t in queryTypes) {\n  registerType(MemoryQuery, t, queryTypes[t]);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/MemoryQuery.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/computed/filter.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var lookup = require('../path').lookup\n  , transaction = require('../transaction')\n  , util = require('../util')\n  , indexOf = util.indexOf\n  , deepIndexOf = util.deepIndexOf\n  , deepEqual = util.deepEqual\n  , QueryBuilder = require('../descriptor/query/QueryBuilder')\n  , specIdentifier = require('../util/speculative').identifier\n  , filter = require('racer-util/object').filter\n  ;\n\nmodule.exports = {\n  filterFnFromQuery: filterFnFromQuery\n, filterDomain: filterDomain\n, deriveFilterFn: deriveFilterFn\n};\n\n/**\n * Creates a filter function based on a query represented as json.\n *\n * @param {Object} json representing a query that is typically created via\n * convenient QueryBuilder instances\n *\n * json looks like:\n * {\n *    from: 'collectionName'\n *  , byId: id\n *  , equals: {\n *      somePath: someVal\n *  , }\n *  , notEquals: {\n *      somePath: someVal\n *    }\n *  , sort: ['fieldA', 'asc', 'fieldB', 'desc']\n *  }\n *\n * @return {Function} a filter function\n * @api public\n */\nfunction filterFnFromQuery (json) {\n  // Stores a list of predicate functions that take a document and return a\n  // Boolean. If all predicate functions return true, then the document passes\n  // through the filter. If not, the document is blocked by the filter\n  var predicates = []\n    , pred;\n\n  if (json) for (var method in json) {\n    if (method === 'from') continue;\n    pred = predicateBuilders[method](json[method]);\n    if (Array.isArray(pred)) predicates = predicates.concat(pred);\n    else predicates.push(pred);\n  }\n\n  return compileDocFilter(predicates);\n}\n\nvar predicateBuilders = {};\n\npredicateBuilders.byId = function byId (id) {\n  return function (doc) { return doc.id === id; };\n};\n\nvar fieldPredicates = {\n    equals: function (fieldName, val, doc) {\n      // In case the filter parameter refers to a dynamically changing reference:\n      // e.g, model.filter(ns).where(field).equals(model.at('_x'))\n      if (val && val.$ref) {\n        val = this.model.get(val.$ref);\n      }\n\n      var currVal = lookup(fieldName, doc);\n      if (typeof currVal === 'object') {\n        return deepEqual(currVal, val);\n      }\n      return currVal === val;\n    }\n  , notEquals: function (fieldName, val, doc) {\n      if (val && val.$ref) {\n        val = this.model.get(val.$ref);\n      }\n      var currVal = lookup(fieldName, doc);\n      if (typeof currVal === 'object') {\n        return ! deepEqual(currVal, val);\n      }\n      return currVal !== val;\n    }\n  , softEquals: function(fieldName, val, doc) {\n      if (val && val.$ref) {\n        val = this.model.get(val.$ref);\n      }\n      var currVal = lookup(fieldName, doc);\n      if (typeof currVal === 'object') {\n        return deepEqual(currVal, val);\n      }\n      return currVal == val;\n    }\n  , notSoftEquals: function (fieldName, val, doc) {\n      if (val && val.$ref) {\n        val = this.model.get(val.$ref);\n      }\n      var currVal = lookup(fieldName, doc);\n      if (typeof currVal === 'object') {\n        return ! deepEqual(currVal, val);\n      }\n      return currVal != val;\n    }\n  , elemPropertyEquals: function (fieldName, val, doc) {\n      if (val && val.$ref) {\n        val = this.model.get(val.$ref);\n      }\n      var curr = doc\n        , parts = fieldName.split('.');\n      for (var i = 0, l = parts.length; i < l; i++) {\n        curr = curr[parts[i]];\n        if (! curr) return false;\n        if (Array.isArray(curr)) {\n          var remainder = parts.slice(i+1).join('.');\n          for (var k = 0, kk = curr.length; k < kk; k++) {\n            if (fieldPredicates.equals(remainder, val, curr[k])) {\n              return true;\n            }\n          }\n          return false;\n        }\n      }\n      return false;\n    }\n  , gt: function (fieldName, val, doc) {\n      if (val && val.$ref) {\n        val = this.model.get(val.$ref);\n      }\n      return lookup(fieldName, doc) > val;\n    }\n  , gte: function (fieldName, val, doc) {\n      if (val && val.$ref) {\n        val = this.model.get(val.$ref);\n      }\n      return lookup(fieldName, doc) >= val;\n    }\n  , lt: function (fieldName, val, doc) {\n      if (val && val.$ref) {\n        val = this.model.get(val.$ref);\n      }\n      return lookup(fieldName, doc) < val;\n    }\n  , lte: function (fieldName, val, doc) {\n      if (val && val.$ref) {\n        val = this.model.get(val.$ref);\n      }\n      return lookup(fieldName, doc) <= val;\n    }\n  , within: function (fieldName, list, doc) {\n      if (list && list.$ref) {\n        list = this.model.get(list.$ref);\n      }\n      if (!list.length) return false;\n      var x = lookup(fieldName, doc);\n      if (x && x.constructor === Object) return ~deepIndexOf(list, x);\n      return ~list.indexOf(x);\n    }\n  , contains: function (fieldName, list, doc) {\n      if (list && list.$ref) {\n        list = this.model.get(list.$ref);\n      }\n      var docList = lookup(fieldName, doc);\n      if (typeof docList === 'undefined') {\n        if (list.length) return false;\n        return true; // contains nothing\n      }\n      for (var x, i = list.length; i--; ) {\n        x = list[i];\n        if (x.constructor === Object) {\n          if (-1 === deepIndexOf(docList, x)) return false;\n        } else {\n          if (-1 === docList.indexOf(x)) return false;\n        }\n      }\n      return true;\n    }\n  , exists: function (fieldName, shouldExist, doc) {\n      if (shouldExist && shouldExist.$ref) {\n        shouldExist = this.model.get(shouldExist.$ref);\n      }\n      var val = lookup(fieldName, doc)\n        , doesExist = (typeof val !== 'undefined');\n      return doesExist === shouldExist;\n    }\n};\n\nfor (var queryKey in fieldPredicates) {\n  predicateBuilders[queryKey] = (function (fieldPred) {\n    return function (params) {\n      return createDocPredicates(params, fieldPred);\n    };\n  })(fieldPredicates[queryKey]);\n}\n\nfunction createDocPredicates (params, fieldPredicate) {\n  var predicates = []\n    , docPred;\n  for (var fieldName in params) {\n    docPred = (function (fieldName, fieldVal) {\n      return function (doc) {\n        // We call(this, ...), so that we can have access to this.model in\n        // order to do this.model.get(val.$ref) (see filedPredicates)\n        return fieldPredicate.call(this, fieldName, fieldVal, doc);\n      };\n    })(fieldName, params[fieldName]);\n    predicates.push(docPred);\n  }\n  return predicates;\n};\n\nfunction compileDocFilter (predicates) {\n  switch (predicates.length) {\n    case 0: return evalToTrue;\n    case 1: return predicates[0];\n  }\n  return function test (doc) {\n    if (typeof doc === 'undefined') return false;\n    for (var i = 0, l = predicates.length; i < l; i++) {\n      if (! predicates[i].call(this, doc)) return false;\n    }\n    return true;\n  };\n}\n\n/**\n * @api private\n */\nfunction evalToTrue () { return true; }\n\n/**\n * Returns the set of docs from searchSpace that pass filterFn.\n *\n * @param {Object|Array} searchSpace\n * @param {Function} filterFn\n * @param {String} ns\n * @return {Object|Array} the filtered values\n * @api public\n */\nfunction filterDomain (searchSpace, filterFn) {\n  if (Array.isArray(searchSpace)) {\n    return searchSpace.filter(filterFn);\n  }\n\n  return filter(searchSpace, function (v, k) {\n    if (k === specIdentifier) return false;\n    return filterFn(v, k);\n  });\n}\n\n/**\n * Derives the filter function, based on filterSpec and source.\n *\n * @param {Function|Object} filterSpec is a representation of the filter\n * @param {String} source is the path to the data that we want to filter\n * @param {Boolean} single specifies whether to filter down to a single\n * resulting Object.\n * @return {Function} filter function\n * @api private\n */\nfunction deriveFilterFn (filterSpec, source, single) {\n  if (typeof filterSpec === 'function') {\n    var numArgs = filterSpec.length;\n    if (numArgs === 1) return filterSpec;\n    if (numArgs === 0) {\n      var queryBuilder = new QueryBuilder({from: source});\n      queryBuilder = filterSpec.call(queryBuilder);\n      if (single) queryBuilder.on();\n      var queryJson = queryBuilder.toJSON();\n      var filter = filterFnFromQuery(queryJson);\n      if (queryJson.sort) {\n        // TODO\n      }\n    }\n    throw new Error('filter spec must be either a function with 0 or 1 argument, or an Object');\n  }\n  // Otherwise, filterSpec is an Object representing query params\n  filterSpec.from = source;\n  var queryBuilder = new QueryBuilder(filterSpec);\n  if (single) queryBuilder.one();\n  return filterFnFromQuery(queryBuilder.toJSON());\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/computed/filter.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/scope.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var QueryBuilder = require('./QueryBuilder')\n  , queryTypes = require('./types')\n  , pathUtils = require('../../path')\n  , isSubPathOf = pathUtils.isSubPathOf\n  , isImmediateChild = pathUtils.isImmediateChild\n  , isGrandchild = pathUtils.isGrandchild\n  , indexOf = require('../../util').indexOf\n  , PRIVATE_COLLECTION = require('./types/constants').PRIVATE_COLLECTION\n  ;\n\nmodule.exports = setupQueryModelScope;\n\n/**\n * Given a model, query, and the query's initial result(s), this function sets\n * up and returns a scoped model that is centered on a ref or refList that\n * embodies the query result(s) and updates those result(s) whenever a relevant\n * mutation should change the query result(s).\n *\n * @param {Model} model is the racer model\n * @param {MemoryQuery} memoryQuery or a TransformBuilder that has\n * MemoryQuery's syncRun interface\n * @param {[Object]|Object} initialResult is either an array of documents or a\n * single document that represents the initial result of the query over the\n * data currently loaded into the model.\n * @return {Model} a refList or ref scoped model that represents the query result(s)\n */\nfunction setupQueryModelScope (model, memoryQuery, queryId, initialResult, dependencies) {\n  var type = queryTypes[memoryQuery.type]\n    , root = PRIVATE_COLLECTION + '.' + queryId\n\n  if (typeof initialResult !== 'undefined') {\n    type.assignInitialResult(model, queryId, initialResult);\n  }\n\n  var scopedModel = type.createScopedModel(model, memoryQuery, queryId, initialResult);\n  model.set(root + '.ns', memoryQuery.ns)\n\n  if (! model[queryId]) {\n    var listener = createMutatorListener(model, scopedModel, memoryQuery, queryId);\n    model.on('mutator', listener);\n\n    function cleanup() {\n      if (model.get(root)) return;\n      model.removeListener('mutator', listener);\n      delete model[queryId];\n      model.removeListener('cleanup', cleanup);\n      var fn;\n      if (dependencyListeners) {\n        for (var i = dependencyListeners.length; i--; ) {\n          model.removeListener('mutator', dependencyListeners[i]);\n        }\n        dependencyListeners = null;\n      }\n      return true;\n    }\n    model.on('cleanup', cleanup);\n\n    model[queryId] = listener;\n    // TODO: This is a total hack. Fix the initialization of filters in client\n    // and prevent filters from generating multiple listeners\n  }\n\n  var dependencyListeners;\n  if (dependencies) {\n    // For storing dependencyListeners, so we can clean them up later\n    dependencyListeners = [];\n\n    dependencies.forEach( function (path) {\n      var listener = function (method, _arguments) {\n        var argPath = _arguments[0][0];\n\n        // Ignore irrelevant paths. Because any mutation on any object causes model\n        // to fire a \"mutator\" event, we will want to ignore most of these mutator\n        // events because our listener is only concerned about mutations that\n        // affect ns.\n        if (! isSubPathOf(argPath, path) && ! isSubPathOf(path, argPath)) return;\n        var searchSpace = model.get(memoryQuery.ns);\n        var queryType = queryTypes[memoryQuery.type];\n        queryType.onOverwriteNs(searchSpace, memoryQuery, model);\n      };\n      dependencyListeners.push(listener);\n      model.on('mutator', listener);\n    });\n  }\n\n  return scopedModel;\n}\n\n/**\n * Creates a listener of the 'mutator' event, for the type (e.g., findOne) of\n * query.\n * See the JSDocDoc of the function iniside the block to see what this listener\n * does.\n *\n * @param {Model} model is the racer model\n * @param {String} ns is the query namespace that points to the set of data we\n * wish to query\n * @param {Model} scopedModel is the scoped model that is scoped to the query\n * results\n * @param {Object} queryTuple is [ns, {queryMotif: queryArgs}, queryId]\n * @return {Function} a function to be used as a listener to the \"mutator\"\n * event emitted by model\n */\nfunction createMutatorListener (model, scopedModel, memoryQuery, queryId) {\n  var ns = memoryQuery.ns;\n\n  // TODO Move this closer to MemoryQuery instantiation\n  memoryQuery.id = queryId;\n\n  /**\n   * This function will listen to the \"mutator\" event emitted by the model. The\n   * purpose of listening for \"mutator\" here is to respond to changes to the\n   * set of documents that the relevant query scans over to derive its search\n   * results. Hence, the mutations it listens for are mutations on its search\n   * domain, where that domain can be an Object of documents or an Array of documents.\n   *\n   * Fires callbacks by analyzing how model[method](_arguments...) has affected a\n   * query searching over the Tree or Array of documents pointed to by ns.\n   *\n   * @param {String} method name\n   * @param {Arguments} _arguments are the arguments for a given \"mutator\" event listener.\n   * The arguments have the signature [[path, restOfMutationArgs...], out, isLocal, pass]\n   */\n\n  return function listenerQueryMutator (method, _arguments) {\n    var args = _arguments[0]\n      , out = _arguments[1]\n      , path = args[0]\n\n    // Ignore irrelevant paths. Because any mutation on any object causes model\n    // to fire a \"mutator\" event, we will want to ignore most of these mutator\n    // events because our listener is only concerned about mutations that\n    // affect ns.\n    if (! isSubPathOf(ns, path) && ! isSubPathOf(path, ns)) return;\n\n    // TODO: Eagerly getting refLists is very expensive. We should replace this\n    // scopedModel.get() with a simple reference and memoize the query results\n\n    // The documents this query searches over, either as an Array or Object of\n    // documents. This set of documents reflects that the mutation has already\n    // taken place.\n    var searchSpace = model.get(ns);\n    if (!searchSpace) return;\n\n    var queryType = queryTypes[memoryQuery.type];\n    var currResult = scopedModel.get();\n\n    if (currResult == null) currResult = queryType.resultDefault;\n\n//    if (isSubPathOf(path, ns)) {\n//      if (!searchSpace) return;\n//      return queryType.onOverwriteNs(searchSpace, memoryQuery, model);\n//    }\n\n    if (path === ns) {\n      if (method === 'set') {\n        return queryType.onOverwriteNs(searchSpace, memoryQuery, model);\n      }\n\n      if (method === 'del') {\n        return queryType.onRemoveNs(searchSpace, memoryQuery, model);\n      }\n\n      if (method === 'push' || method === 'insert' || method === 'unshift') {\n        var Model = model.constructor\n          , docsToAdd = args[Model.arrayMutator[method].insertArgs];\n        if (Array.isArray(docsToAdd)) {\n          docsToAdd = docsToAdd.filter( function (doc) {\n            // Ensure that the document is in the domain (it may not be if we are\n            // filtering over some query results)\n            return doesBelong(doc, searchSpace);\n          });\n          queryType.onInsertDocs(docsToAdd, memoryQuery, model, searchSpace, currResult);\n        } else {\n          var doc = docsToAdd;\n          // TODO Is this conditional if redundant? Isn't this always true?\n          if (doesBelong(doc, searchSpace)) {\n            queryType.onInsertDocs([doc], memoryQuery, model, searchSpace, currResult);\n          }\n        }\n        return;\n      }\n\n      if (method === 'pop' || method === 'shift' || method === 'remove') {\n        var docsToRm = out;\n        for (var i = 0, l = docsToRm.length; i < l; i++) {\n          queryType.onRmDoc(docsToRm[i], memoryQuery, model, searchSpace, currResult);\n        }\n        return;\n      }\n\n      // TODO Is this the right logic for move?\n      if (method === 'move') {\n        var movedIds = out\n          , onUpdateDocProperty = queryType.onUpdateDocProperty\n          , docs = model.get(path);\n          ;\n        for (var i = 0, l = movedIds.length; i < l; i++) {\n          var id = movedIds[i], doc;\n          // TODO Ugh, this is messy\n          if (Array.isArray(docs)) {\n            doc = docs[indexOf(docs, id, equivId)];\n          } else {\n            doc = docs[id];\n          }\n          onUpdateDocProperty(doc, memoryQuery, model, searchSpace, currResult);\n        }\n        return;\n      }\n      throw new Error('Uncaught edge case');\n    }\n\n    // From here on: path = ns + suffix\n\n    // The mutation can:\n    if (isImmediateChild(ns, path)) {\n      // (1) remove the document\n      if (method === 'del') {\n        return queryType.onRmDoc(out, memoryQuery, model, searchSpace, currResult);\n      }\n\n      // (2) add or over-write the document with a new version of the document\n      if (method === 'set' || method === 'setNull') {\n        var doc = args[1]\n          , belongs = doesBelong(doc, searchSpace);\n        if (! out) {\n          return queryType.onAddDoc(doc, out, memoryQuery, model, searchSpace, currResult);\n        }\n        if (doc.id === out.id) {\n          return queryType.onAddDoc(doc, out, memoryQuery, model, searchSpace, currResult);\n        }\n      }\n      throw new Error('Uncaught edge case: ' + method + ' ' + require('util').inspect(_arguments, false, null));\n    }\n\n    if (isGrandchild(ns, path)) {\n      var suffix = path.substring(ns.length + 1)\n        , separatorPos = suffix.indexOf('.')\n        , property = suffix.substring(0, ~separatorPos ? separatorPos : suffix.length)\n        , isArray = Array.isArray(searchSpace)\n        ;\n      if (isArray) property = parseInt(property, 10);\n      var doc = searchSpace && searchSpace[property];\n      if (doc) queryType.onUpdateDocProperty(doc, memoryQuery, model, searchSpace, currResult);\n    }\n  };\n}\n\nfunction doesBelong (doc, searchSpace) {\n  if (Array.isArray(searchSpace)) {\n    return indexOf(searchSpace, doc.id, equivId) !== -1;\n  }\n  return doc.id in searchSpace;\n}\n\nfunction equivId (id, doc) {\n  return doc && doc.id === id;\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/scope.js"
));

require.define("util",Function(['require','module','exports','__dirname','__filename','process','global'],"var events = require('events');\n\nexports.isArray = isArray;\nexports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};\nexports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};\n\n\nexports.print = function () {};\nexports.puts = function () {};\nexports.debug = function() {};\n\nexports.inspect = function(obj, showHidden, depth, colors) {\n  var seen = [];\n\n  var stylize = function(str, styleType) {\n    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics\n    var styles =\n        { 'bold' : [1, 22],\n          'italic' : [3, 23],\n          'underline' : [4, 24],\n          'inverse' : [7, 27],\n          'white' : [37, 39],\n          'grey' : [90, 39],\n          'black' : [30, 39],\n          'blue' : [34, 39],\n          'cyan' : [36, 39],\n          'green' : [32, 39],\n          'magenta' : [35, 39],\n          'red' : [31, 39],\n          'yellow' : [33, 39] };\n\n    var style =\n        { 'special': 'cyan',\n          'number': 'blue',\n          'boolean': 'yellow',\n          'undefined': 'grey',\n          'null': 'bold',\n          'string': 'green',\n          'date': 'magenta',\n          // \"name\": intentionally not styling\n          'regexp': 'red' }[styleType];\n\n    if (style) {\n      return '\\033[' + styles[style][0] + 'm' + str +\n             '\\033[' + styles[style][1] + 'm';\n    } else {\n      return str;\n    }\n  };\n  if (! colors) {\n    stylize = function(str, styleType) { return str; };\n  }\n\n  function format(value, recurseTimes) {\n    // Provide a hook for user-specified inspect functions.\n    // Check that value is an object with an inspect function on it\n    if (value && typeof value.inspect === 'function' &&\n        // Filter out the util module, it's inspect function is special\n        value !== exports &&\n        // Also filter out any prototype objects using the circular check.\n        !(value.constructor && value.constructor.prototype === value)) {\n      return value.inspect(recurseTimes);\n    }\n\n    // Primitive types cannot have properties\n    switch (typeof value) {\n      case 'undefined':\n        return stylize('undefined', 'undefined');\n\n      case 'string':\n        var simple = '\\'' + JSON.stringify(value).replace(/^\"|\"$/g, '')\n                                                 .replace(/'/g, \"\\\\'\")\n                                                 .replace(/\\\\\"/g, '\"') + '\\'';\n        return stylize(simple, 'string');\n\n      case 'number':\n        return stylize('' + value, 'number');\n\n      case 'boolean':\n        return stylize('' + value, 'boolean');\n    }\n    // For some reason typeof null is \"object\", so special case here.\n    if (value === null) {\n      return stylize('null', 'null');\n    }\n\n    // Look up the keys of the object.\n    var visible_keys = Object_keys(value);\n    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;\n\n    // Functions without properties can be shortcutted.\n    if (typeof value === 'function' && keys.length === 0) {\n      if (isRegExp(value)) {\n        return stylize('' + value, 'regexp');\n      } else {\n        var name = value.name ? ': ' + value.name : '';\n        return stylize('[Function' + name + ']', 'special');\n      }\n    }\n\n    // Dates without properties can be shortcutted\n    if (isDate(value) && keys.length === 0) {\n      return stylize(value.toUTCString(), 'date');\n    }\n\n    var base, type, braces;\n    // Determine the object type\n    if (isArray(value)) {\n      type = 'Array';\n      braces = ['[', ']'];\n    } else {\n      type = 'Object';\n      braces = ['{', '}'];\n    }\n\n    // Make functions say that they are functions\n    if (typeof value === 'function') {\n      var n = value.name ? ': ' + value.name : '';\n      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';\n    } else {\n      base = '';\n    }\n\n    // Make dates with properties first say the date\n    if (isDate(value)) {\n      base = ' ' + value.toUTCString();\n    }\n\n    if (keys.length === 0) {\n      return braces[0] + base + braces[1];\n    }\n\n    if (recurseTimes < 0) {\n      if (isRegExp(value)) {\n        return stylize('' + value, 'regexp');\n      } else {\n        return stylize('[Object]', 'special');\n      }\n    }\n\n    seen.push(value);\n\n    var output = keys.map(function(key) {\n      var name, str;\n      if (value.__lookupGetter__) {\n        if (value.__lookupGetter__(key)) {\n          if (value.__lookupSetter__(key)) {\n            str = stylize('[Getter/Setter]', 'special');\n          } else {\n            str = stylize('[Getter]', 'special');\n          }\n        } else {\n          if (value.__lookupSetter__(key)) {\n            str = stylize('[Setter]', 'special');\n          }\n        }\n      }\n      if (visible_keys.indexOf(key) < 0) {\n        name = '[' + key + ']';\n      }\n      if (!str) {\n        if (seen.indexOf(value[key]) < 0) {\n          if (recurseTimes === null) {\n            str = format(value[key]);\n          } else {\n            str = format(value[key], recurseTimes - 1);\n          }\n          if (str.indexOf('\\n') > -1) {\n            if (isArray(value)) {\n              str = str.split('\\n').map(function(line) {\n                return '  ' + line;\n              }).join('\\n').substr(2);\n            } else {\n              str = '\\n' + str.split('\\n').map(function(line) {\n                return '   ' + line;\n              }).join('\\n');\n            }\n          }\n        } else {\n          str = stylize('[Circular]', 'special');\n        }\n      }\n      if (typeof name === 'undefined') {\n        if (type === 'Array' && key.match(/^\\d+$/)) {\n          return str;\n        }\n        name = JSON.stringify('' + key);\n        if (name.match(/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)) {\n          name = name.substr(1, name.length - 2);\n          name = stylize(name, 'name');\n        } else {\n          name = name.replace(/'/g, \"\\\\'\")\n                     .replace(/\\\\\"/g, '\"')\n                     .replace(/(^\"|\"$)/g, \"'\");\n          name = stylize(name, 'string');\n        }\n      }\n\n      return name + ': ' + str;\n    });\n\n    seen.pop();\n\n    var numLinesEst = 0;\n    var length = output.reduce(function(prev, cur) {\n      numLinesEst++;\n      if (cur.indexOf('\\n') >= 0) numLinesEst++;\n      return prev + cur.length + 1;\n    }, 0);\n\n    if (length > 50) {\n      output = braces[0] +\n               (base === '' ? '' : base + '\\n ') +\n               ' ' +\n               output.join(',\\n  ') +\n               ' ' +\n               braces[1];\n\n    } else {\n      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];\n    }\n\n    return output;\n  }\n  return format(obj, (typeof depth === 'undefined' ? 2 : depth));\n};\n\n\nfunction isArray(ar) {\n  return ar instanceof Array ||\n         Array.isArray(ar) ||\n         (ar && ar !== Object.prototype && isArray(ar.__proto__));\n}\n\n\nfunction isRegExp(re) {\n  return re instanceof RegExp ||\n    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');\n}\n\n\nfunction isDate(d) {\n  if (d instanceof Date) return true;\n  if (typeof d !== 'object') return false;\n  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);\n  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);\n  return JSON.stringify(proto) === JSON.stringify(properties);\n}\n\nfunction pad(n) {\n  return n < 10 ? '0' + n.toString(10) : n.toString(10);\n}\n\nvar months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',\n              'Oct', 'Nov', 'Dec'];\n\n// 26 Feb 16:19:34\nfunction timestamp() {\n  var d = new Date();\n  var time = [pad(d.getHours()),\n              pad(d.getMinutes()),\n              pad(d.getSeconds())].join(':');\n  return [d.getDate(), months[d.getMonth()], time].join(' ');\n}\n\nexports.log = function (msg) {};\n\nexports.pump = null;\n\nvar Object_keys = Object.keys || function (obj) {\n    var res = [];\n    for (var key in obj) res.push(key);\n    return res;\n};\n\nvar Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {\n    var res = [];\n    for (var key in obj) {\n        if (Object.hasOwnProperty.call(obj, key)) res.push(key);\n    }\n    return res;\n};\n\nvar Object_create = Object.create || function (prototype, properties) {\n    // from es5-shim\n    var object;\n    if (prototype === null) {\n        object = { '__proto__' : null };\n    }\n    else {\n        if (typeof prototype !== 'object') {\n            throw new TypeError(\n                'typeof prototype[' + (typeof prototype) + '] != \\'object\\''\n            );\n        }\n        var Type = function () {};\n        Type.prototype = prototype;\n        object = new Type();\n        object.__proto__ = prototype;\n    }\n    if (typeof properties !== 'undefined' && Object.defineProperties) {\n        Object.defineProperties(object, properties);\n    }\n    return object;\n};\n\nexports.inherits = function(ctor, superCtor) {\n  ctor.super_ = superCtor;\n  ctor.prototype = Object_create(superCtor.prototype, {\n    constructor: {\n      value: ctor,\n      enumerable: false,\n      writable: true,\n      configurable: true\n    }\n  });\n};\n\nvar formatRegExp = /%[sdj%]/g;\nexports.format = function(f) {\n  if (typeof f !== 'string') {\n    var objects = [];\n    for (var i = 0; i < arguments.length; i++) {\n      objects.push(exports.inspect(arguments[i]));\n    }\n    return objects.join(' ');\n  }\n\n  var i = 1;\n  var args = arguments;\n  var len = args.length;\n  var str = String(f).replace(formatRegExp, function(x) {\n    if (x === '%%') return '%';\n    if (i >= len) return x;\n    switch (x) {\n      case '%s': return String(args[i++]);\n      case '%d': return Number(args[i++]);\n      case '%j': return JSON.stringify(args[i++]);\n      default:\n        return x;\n    }\n  });\n  for(var x = args[i]; i < len; x = args[++i]){\n    if (x === null || typeof x !== 'object') {\n      str += ' ' + x;\n    } else {\n      str += ' ' + exports.inspect(x);\n    }\n  }\n  return str;\n};\n\n//@ sourceURL=util"
));

require.define("/node_modules/derby/node_modules/racer/lib/pubSub/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinStore = __dirname + '/pubSub.Store';\n\nexports = module.exports = function (racer) {\n  racer.mixin(mixinStore);\n};\n\nexports.useWith = { server: false, browser: true };\nexports.decorate = 'racer';\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/pubSub/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/computed/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var filterMixin = require('./filter.Model');\n\nexports = module.exports = plugin;\nexports.decorate = 'racer';\nexports.useWith = { server: true, browser: true };\n\nfunction plugin (racer) {\n  racer.mixin(filterMixin);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/computed/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/computed/filter.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var TransformBuilder = require('../descriptor/query/TransformBuilder');\n\nmodule.exports = {\n  type: 'Model'\n, server: __dirname + '/computed.server'\n, events: {\n    init: function (model) {\n      model._filtersToBundle = [];\n    }\n\n  , bundle: function (model) {\n      var onLoad = model._onLoad\n        , filtersToBundle = model._filtersToBundle;\n      for (var i = 0, l = filtersToBundle.length; i < l; i++) {\n        onLoad.push( filtersToBundle[i] );\n      }\n    }\n  }\n, proto: {\n    /**\n     * @param {String|Model} source\n     * @param {Object|Function} filterSpec\n     * @return {TransformBuilder}\n     */\n    filter: function (source, filterSpec) {\n      var builder = new TransformBuilder(this._root, source.path ? source.path() : source);\n      if (filterSpec) builder.filter(filterSpec);\n      return builder;\n    }\n\n    /**\n     * @param {String|Model} source\n     * @param {Array|Function} sortParams\n     * @return {TransformBuilder}\n     */\n  , sort: function (source, sortParams) {\n      var builder = new TransformBuilder(this._root, source.path ? source.path() : source);\n      builder.sort(sortParams);\n      return builder;\n    }\n\n  , _loadFilter: function (builderJson) {\n      var builder = TransformBuilder.fromJson(this, builderJson);\n\n      // This creates the scoped model associated with the filter. This model\n      // is scoped to path \"_$queries.<filter-id>\"\n      builder.model();\n    }\n  }\n};\n\nvar mixinProto = module.exports.proto;\n\nfor (var k in mixinProto) {\n  scopeFriendly(mixinProto, k);\n}\n\n/**\n * @param {Object} object\n * @param {String} method\n */\nfunction scopeFriendly (object, method) {\n  var old = object[method];\n  object[method] = function (source, params) {\n    var at = this._at;\n    if (at) {\n      if (typeof source === 'string') {\n        source = at + '.' + source;\n      } else {\n        params = source;\n        source = at;\n      }\n    }\n    return old.call(this, source, params);\n  }\n}\n\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/computed/filter.Model.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/**\n * Descriptors are different ways of expressing a data set. Racer comes bundled\n * with 2 descriptor types:\n *\n * 1. Path Patterns\n *\n *    model.subscribe('users.*.name', callback);\n *\n * 2. Queries\n *\n *    var query = model.query('users').withName('Brian');\n *    model.fetch(query, callback);\n *\n * Descriptors allow you to create expressive DSLs to write addresses to data.\n * You then pass the concrete descriptor(s) to fetch, subscribe, or snapshot.\n */\nvar mixinModel = require('./descriptor.Model')\n  , mixinStore = __dirname + '/descriptor.Store'\n  , patternPlugin = require('./pattern')\n  , queryPlugin = require('./query')\n  ;\n\nexports = module.exports = plugin;\n\nexports.useWith = {server: true, browser: true};\n\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n  racer.use(patternPlugin);\n  racer.use(queryPlugin);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/descriptor.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var Taxonomy = require('./Taxonomy')\n  , noop = require('../util').noop\n  , normArgs = require('./util').normArgs\n  ;\n\nmodule.exports = {\n  type: 'Model'\n\n, decorate: function (Model) {\n    Model.prototype.descriptors = new Taxonomy;\n    Model.dataDescriptor = function (conf) {\n      var types = Model.prototype.descriptors\n        , typeName = conf.name\n        , type = types.type(typeName);\n      if (type) return type;\n      return types.type(typeName, conf);\n    };\n  }\n\n, proto: {\n    fetch: function (/* descriptors..., cb*/) {\n      var args = normArgs(arguments)\n        , descriptors = args[0]\n        , cb = args[1]\n        , self = this\n\n        , scopedModels = []\n        ;\n\n      descriptors = this.descriptors.normalize(descriptors);\n\n      this.descriptors.handle(this, descriptors, {\n        registerFetch: true\n        // Runs descriptorType.scopedResult and passes return value to this cb\n      , scopedResult: function (scopedModel) {\n          scopedModels.push(scopedModel);\n        }\n      });\n\n      this._upstreamData(descriptors, function (err, data) {\n        if (err) return cb(err);\n        var txnQueue = self._txnQueue;\n        if (txnQueue.length) {\n          // If there are still transactiosn we are waiting for server\n          // acknowledgment (i.e., 'txnOk') from, sometimes we may run into\n          // scenarios where the upstream data we receive already reflects\n          // mutations applied by these not yet ack'ed transactions. In this\n          // case, we want to wait for ack of these transactions before adding\n          // data and calling back to our app. If we do not, then the memory's\n          // world version would be set to the upstream data's max version;\n          // this would be bad because we would then ignore the transaction\n          // acks we are waiting on because they would be less than the version\n          // of the upstream data; the result is we would re-send the same\n          // transactions to the server, resulting in double-mutations or more\n\n          var lastTxnId = txnQueue[txnQueue.length - 1];\n          var onRmTxn = function (txnId) {\n            if (txnId === lastTxnId) {\n              self._addData(data);\n              cb.apply(null, [err].concat(scopedModels));\n              self.removeListener('rmTxn', onRmTxn);\n            }\n          }\n          self._on('rmTxn', onRmTxn);\n        } else {\n          self._addData(data);\n          cb.apply(null, [err].concat(scopedModels));\n        }\n      });\n    }\n\n  , waitFetch: function (/* descriptors..., cb */) {\n      var args = arguments\n        , cbIndex = args.length - 1\n        , cb = args[cbIndex]\n        , self = this\n\n      args[cbIndex] = function (err) {\n        if (err === 'disconnected') {\n          return self.once('connect', function() {\n            self.fetch.apply(self, args);\n          });\n        };\n        cb.apply(null, arguments);\n      };\n      this.fetch.apply(this, args);\n    }\n\n  , alwaysSubscribe: function (/* descriptors..., cb */) {\n      var args = normArgs(arguments)\n        , descriptors = args[0]\n        , cb = args[1]\n        ;\n\n      subscribe(this, descriptors, cb, true);\n    }\n\n    // TODO Do some sort of subscription counting (like reference counting) to\n    // trigger proper cleanup of a query in the QueryRegistry\n  , subscribe: function (/* descriptors..., cb */) {\n      var args = normArgs(arguments)\n        , descriptors = args[0]\n        , cb = args[1]\n        ;\n\n      subscribe(this, descriptors, cb);\n    }\n\n  , unsubscribe: function (/* descriptors..., cb */) {\n      var args = normArgs(arguments)\n        , descriptors = args[0]\n        , cb = args[1]\n        , self = this\n        ;\n\n      descriptors = this.descriptors.normalize(descriptors);\n\n      this.descriptors.handle(this, descriptors, {\n        unregisterSubscribe: true\n      });\n\n      // if (! descriptors.length) return;\n\n      this._removeSub(descriptors, cb);\n    }\n\n  , _upstreamData: function (descriptors, cb) {\n      if (!this.connected) return cb('disconnected');\n      this.socket.emit('fetch', descriptors, this.scopedContext, cb);\n    }\n\n  , _addSub: function (descriptors, cb) {\n      if (! this.connected) return cb('disconnected');\n      this.socket.emit('subscribe', descriptors, this.scopedContext, cb);\n    }\n\n  , _removeSub: function (descriptors, cb) {\n      if (! this.connected) return cb('disconnected');\n      this.socket.emit('unsubscribe', descriptors, cb);\n    }\n\n    // TODO Associate contexts with path and query subscriptions\n  , _subs: function () {\n      var subs = []\n        , types = this.descriptors\n        , model = this;\n      types.each( function (name, type) {\n        subs = subs.concat(type.subs(model));\n      });\n      return subs;\n    }\n\n  , _allSubs: function () {\n      var subs = []\n        , types = this.descriptors\n        , model = this;\n      types.each( function (name, type) {\n        subs = subs.concat(type.allSubs(model));\n      });\n      return subs;\n    }\n\n  , _addData: function (data) {\n      var memory = this._memory;\n      data = data.data;\n\n      for (var i = 0, l = data.length; i < l; i++) {\n        var triplet = data[i]\n          , path  = triplet[0]\n          , value = triplet[1]\n          , ver   = triplet[2];\n        if (ver == null) {\n          // Adding data in this context should not be speculative _addData\n          ver = -1;\n          // TODO Investigate what scenarios cause this later\n          // throw new Error('Adding data in this context should not be speculative _addData ' + path + ', ' + value + ', ' + ver);\n        }\n        // Invalidate the spec model, so the following mutation shows up in\n        // next calculation of spec model\n        this._specCache.invalidate();\n        var out = memory.set(path, value, ver);\n        // Need this condition for scenarios where we subscribe to a\n        // non-existing document. Otherwise, a mutator event would  e emitted\n        // with an undefined value, triggering filtering and querying listeners\n        // which rely on a document to be defined and possessing an id.\n        if (value !== null && typeof value !== 'undefined') {\n          // TODO Perhaps make another event to differentiate against model.set\n          this.emit('set', [path, value], out);\n        }\n      }\n    }\n  }\n\n, server: {\n    _upstreamData: function (descriptors, cb) {\n      var store = this.store\n        , contextName = this.scopedContext\n        , self = this;\n      this._clientIdPromise.on(function (err, clientId) {\n        if (err) return cb(err);\n        var req = {\n          targets: descriptors\n        , clientId: clientId\n        , session: self.session\n        , context: store.context(contextName)\n        };\n        var res = {\n          fail: cb\n        , send: function (data) {\n            store.emit('fetch', data, clientId, descriptors);\n            cb(null, data);\n          }\n        };\n        store.middleware.fetch(req, res);\n      });\n    }\n  , _addSub: function (descriptors, cb) {\n      var store = this.store\n        , contextName = this.scopedContext\n        , self = this;\n      this._clientIdPromise.on(function (err, clientId) {\n        if (err) return cb(err);\n        // Subscribe while the model still only resides on the server. The\n        // model is unsubscribed before sending to the browser.\n        var req = {\n          clientId: clientId\n        , session: self.session\n        , targets: descriptors\n        , context: store.context(contextName)\n        };\n        var res = {\n          fail: cb\n        , send: function (data) {\n            cb(null, data);\n          }\n        };\n        store.middleware.subscribe(req, res);\n      });\n    }\n  , _removeSub: function (descriptors, cb) {\n      var store = this.store\n        , context = this.scopedContext;\n      this._clientIdPromise.on(function (err, clientId) {\n        if (err) return cb(err);\n        var mockSocket = {clientId: clientId};\n        store.unsubscribe(mockSocket, descriptors, context, cb);\n      });\n    }\n  }\n};\n\nfunction subscribe (model, descriptors, cb, always) {\n  var scopedModels = [];\n\n  descriptors = model.descriptors.normalize(descriptors);\n\n  // TODO Don't subscribe to a given descriptor again if already\n  // subscribed to the descriptor before (so that we avoid an additional fetch)\n\n  model.descriptors.handle(model, descriptors, {\n    registerSubscribe: true\n  , scopedResult: function (scopedModel) {\n      scopedModels.push(scopedModel);\n    }\n  }, {always: always});\n\n  model._addSub(descriptors, function (err, data) {\n    if (err) return cb(err);\n    model._addData(data);\n    model.emit('addSubData', data);\n    cb.apply(null, [err].concat(scopedModels));\n  });\n\n  // TODO Cleanup function\n  // return {destroy: fn }\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/descriptor.Model.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/Taxonomy.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/**\n * A Taxonomy is a registry of descriptor types. It's an approach to achieve\n * polymorphism for the logic represented here by handle, normalize, and typeOf\n * across different descriptor instances (e.g., query, pattern, search)\n */\nmodule.exports = Taxonomy;\n\nfunction Taxonomy () {\n  this._types = {};\n}\n\nTaxonomy.prototype.type = function (name, conf) {\n  var types = this._types;\n  if (arguments.length === 1) return types[name];\n  return types[name] = conf;\n};\n\n/**\n * Handles descriptors based on the descriptor types registered with the Taxonomy.\n * @param {Model|Store} repo\n * @param {Array} descriptors\n * @param {Object} callbacks\n * @param {Object} params\n * @config {Boolean} [params.always]\n */\nTaxonomy.prototype.handle = function (repo, descriptors, callbacks, params) {\n  for (var i = 0, l = descriptors.length; i < l; i++) {\n    var descriptor = descriptors[i]\n      , type = this.typeOf(descriptor);\n    for (var method in callbacks) {\n      var result = type[method](repo, descriptor, params)\n        , fn = callbacks[method];\n      if (typeof fn === 'function') fn(result);\n    }\n  }\n};\n\nTaxonomy.prototype.normalize = function (descriptors) {\n  var normed = [];\n  for (var i = 0, l = descriptors.length; i < l; i++) {\n    var desc = descriptors[i]\n      , type = this.typeOf(desc)\n      , normalize = type.normalize;\n    normed.push(normalize ? normalize(desc) : desc);\n  }\n  return normed;\n};\n\nTaxonomy.prototype.typeOf = function (descriptor) {\n  var types = this._types;\n  for (var name in types) {\n    var type = types[name];\n    if (type.isInstance(descriptor)) return type;\n  }\n};\n\nTaxonomy.prototype.each = function (cb) {\n  var types = this._types;\n  for (var name in types) cb(name, types[name]);\n};\n\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/Taxonomy.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/util.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var noop = require('racer-util/fn').noop;\n\nmodule.exports = {\n  normArgs: normArgs\n};\n\nfunction normArgs (_arguments_) {\n  var arglen = _arguments_.length\n    , lastArg = _arguments_[arglen-1]\n    , cb = (typeof lastArg === 'function') ? lastArg : noop\n    , descriptors = Array.prototype.slice.call(_arguments_, 0, cb ? arglen-1 : arglen);\n  return [descriptors, cb];\n}\n\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/util.js"
));

require.define("/node_modules/derby/node_modules/racer/node_modules/racer-util/fn.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  curry: curry\n, noop: noop\n};\n\nfunction curry (fn/*, prefix...*/) {\n  var prefix = Array.prototype.slice.call(arguments, 1);\n  return function () {\n    var args = prefix.concat(Array.prototype.slice.call(arguments, 0));\n    return fn.apply(this, args);\n  };\n}\n\nfunction noop () {}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/node_modules/racer-util/fn.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/pattern/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./pattern.Model')\n  , mixinStore = __dirname + '/pattern.Store'\n  ;\n\nexports = module.exports = plugin;\n\nexports.useWith = {server: true, browser: true};\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/pattern/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/pattern/pattern.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var basePattern = require('./base')\n  , mergeAll = require('../../util').mergeAll\n  , splitPath= require('../../path').split\n  ;\n\n/**\n * Takes care of all the book-keeping in the Model for fetching and subscribing\n * to a path pattern.\n */\nmodule.exports = {\n  type: 'Model'\n, events: {\n    init: function (model) {\n      // `_patternSubs` remembers path subscriptions.\n      // This memory is useful when the client may have been disconnected from\n      // the server for quite some time and needs to re-send its subscriptions\n      // upon a re-connection in order for the server (1) to figure out what\n      // data the client needs to re-sync its snapshot and (2) to re-subscribe\n      // to the data on behalf of the client. The paths and queries get cached\n      // in Model#subscribe\n      model._patternSubs = {}; // pattern: Boolean\n      model._patternAlwaysSubs = {}; // pattern: Boolean\n    }\n\n  , bundle: function (model, addToBundle) {\n      addToBundle('_loadPatternSubs', model._patternSubs, model._patternAlwaysSubs);\n    }\n  }\n\n, decorate: function (Model) {\n    var modelPattern = mergeAll({\n      scopedResult: function (model, pattern) {\n        var pathToGlob = splitPath(pattern)[0];\n        return model.at(pathToGlob);\n      }\n    , registerFetch: function (model, pattern) {\n        // TODO Needed or remove this?\n      }\n    , registerSubscribe: function (model, pattern, params) {\n        var subs = params.always ? model._patternAlwaysSubs : model._patternSubs;\n        if (pattern in subs) return;\n        return subs[pattern] = true;\n      }\n    , unregisterSubscribe: function (model, pattern) {\n        var patternSubs = model._patternSubs;\n        if (! (pattern in patternSubs)) return;\n        delete patternSubs[pattern];\n      }\n    , subs: function (model) {\n        return Object.keys(model._patternSubs);\n      }\n    , allSubs: function (model) {\n        var patterns = [];\n        for (var k in model._patternSubs) {\n          patterns.push(k);\n        }\n        for (k in model._patternAlwaysSubs) {\n          patterns.push(k);\n        }\n        return patterns;\n      }\n    // TODO Need something for snapshot?\n    }, basePattern);\n\n    Model.dataDescriptor(modelPattern);\n  }\n\n, proto: {\n    _loadPatternSubs: function (patternSubs, patternAlwaysSubs) {\n      this._patternSubs = patternSubs;\n      this._patternAlwaysSubs = patternAlwaysSubs;\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/pattern/pattern.Model.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/pattern/base.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  name: 'Pattern'\n, normalize: function (x) { return x._at || x; }\n, isInstance: function (x) { return typeof x === 'string' || x._at; }\n, registerFetch: function () {}\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/pattern/base.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./query.Model')\n  , mixinStore = __dirname + '/query.Store'\n  ;\n\nexports = module.exports = plugin;\n\nexports.useWith = {server: true, browser: true};\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/query.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var basePattern = require('./base')\n  , mergeAll = require('../../util').mergeAll\n  , setupQueryModelScope = require('./scope')\n\n  , transaction = require('../../transaction')\n  , QueryBuilder = require('./QueryBuilder')\n  , QueryRegistry = require('./QueryRegistry')\n  , QueryMotifRegistry = require('./QueryMotifRegistry')\n  ;\n\nmodule.exports = {\n  type: 'Model'\n, events: {\n    init: onInit\n  , bundle: onBundle\n  , socket: onSocket\n  }\n, decorate: function (Model) {\n    var modelPattern = mergeAll({\n      scopedResult: scopedResult\n    , registerSubscribe: registerSubscribe\n    , registerFetch: registerFetch\n    , unregisterSubscribe: unregisterSubscribe\n    , subs: subs\n    , allSubs: allSubs\n    }, basePattern);\n    Model.dataDescriptor(modelPattern);\n  }\n, proto: {\n    _loadQueries: loadQueries\n  , _querySubs: querySubs\n  , _allQuerySubs: allQuerySubs\n  , queryJSON: queryJSON\n  , _loadQueryMotifs: loadQueryMotifs\n  , registerQuery: registerQuery\n  , unregisterQuery: unregisterQuery\n  , registeredMemoryQuery: registeredMemoryQuery\n  , registeredQueryId: registeredQueryId\n  , fromQueryMotif: fromQueryMotif\n  , query: query\n  }\n};\n\n\nfunction onInit(model) {\n  var store = model.store;\n  if (store) {\n    // Maps query motif -> callback\n    model._queryMotifRegistry = store._queryMotifRegistry;\n  } else {\n    // Stores any query motifs registered via store.query.expose. The query\n    // motifs declared via Store are copied over to all child Model\n    // instances created via Store#createModel\n    model._queryMotifRegistry = new QueryMotifRegistry;\n  }\n\n  // The query registry stores any queries associated with the model via\n  // Model#fetch and Model#subscribe\n  model._queryRegistry = new QueryRegistry;\n}\n\nfunction onBundle(model, addToBundle) {\n  // TODO Re-write this\n  var queryMotifRegistry = model._queryMotifRegistry\n    , queryMotifBundle = queryMotifRegistry.toJSON();\n  model._onLoad.push(['_loadQueryMotifs', queryMotifBundle]);\n  addToBundle('_loadQueries', model._queryRegistry.bundle());\n}\n\nfunction onSocket(model, socket) {\n  var memory = model._memory;\n\n  // The \"addDoc\" event is fired wheneber a remote mutation results in a\n  // new or existing document in the cloud to become a member of one of the\n  // result sets corresponding to a query that this model is currently\n  // subscribed.\n  socket.on('addDoc', function (payload, num) {\n    var data = payload.data\n      , doc = data.doc\n      , ns  = data.ns\n      , ver = data.ver\n      , txn = data.txn\n      , collection = model.get(ns);\n\n    // If the doc is already in the model, don't add it\n    if (collection && collection[doc.id]) {\n      // But apply the transaction that resulted in the document that is\n      // added to the query result set.\n      if (transaction.getClientId(txn) === model._clientId) {\n        // Set to null txn, and still account for num\n        txn = null\n      }\n      return model._addRemoteTxn(txn, num);\n    }\n\n    var pathToDoc = ns + '.' + doc.id\n      , txn = transaction.create({\n          ver: ver\n        , id: null\n        , method: 'set'\n        , args: [pathToDoc, doc]\n        });\n    model._addRemoteTxn(txn, num);\n    model.emit('addDoc', pathToDoc, doc);\n  });\n\n  // The \"rmDoc\" event is fired wheneber a remote mutation results in an\n  // existing document in the cloud ceasing to become a member of one of\n  // the result sets corresponding to a query that this model is currently\n  // subscribed.\n  socket.on('rmDoc', function (payload, num) {\n    var hash = payload.channel // TODO Remove\n      , data = payload.data\n      , doc  = data.doc\n      , id   = data.id\n      , ns   = data.ns\n      , ver  = data.ver\n      , txn = data.txn\n\n        // TODO Maybe just [clientId, queryId]\n      , queryTuple = data.q; // TODO Add q to data\n\n    // Don't remove the doc if any other queries match the doc\n    var querySubs = model._allQuerySubs();\n    for (var i = querySubs.length; i--; ) {\n      var currQueryTuple = querySubs[i];\n\n      var memoryQuery = model.registeredMemoryQuery(currQueryTuple);\n\n      // If \"rmDoc\" was triggered by the same query, we expect it not to\n      // match the query, so ignore it.\n      if (QueryBuilder.hash(memoryQuery.toJSON()) === hash.substring(3, hash.length)) continue;\n\n      // If the doc belongs in an existing subscribed query's result set,\n      // then don't remove it, but instead apply a \"null\" transaction to\n      // make sure the transaction counter `num` is acknowledged, so other\n      // remote transactions with a higher counter can be applied.\n      if (memoryQuery.filterTest(doc, ns)) {\n        return model._addRemoteTxn(null, num);\n      }\n    }\n\n    var pathToDoc = ns + '.' + id\n      , oldDoc = model.get(pathToDoc);\n    if (transaction.getClientId(txn) === model._clientId) {\n      txn = null;\n    } else {\n      txn = transaction.create({\n          ver: ver\n        , id: null\n        , method: 'del'\n        , args: [pathToDoc]\n      });\n    }\n\n    model._addRemoteTxn(txn, num);\n    model.emit('rmDoc', pathToDoc, oldDoc);\n  });\n}\n\n\nfunction scopedResult(model, queryTuple) {\n  var memoryQuery = model.registeredMemoryQuery(queryTuple)\n    , queryId = model.registeredQueryId(queryTuple);\n  return setupQueryModelScope(model, memoryQuery, queryId);\n}\nfunction registerSubscribe(model, queryTuple, params) {\n  var tag = params.always ? 'subs.always' : 'subs';\n  model.registerQuery(queryTuple, tag);\n}\nfunction registerFetch(model, queryTuple) {\n  model.registerQuery(queryTuple, 'fetch');\n}\nfunction unregisterSubscribe(model, queryTuple) {\n  model.unregisterQuery(queryTuple, 'subs');\n}\nfunction subs(model) {\n  return model._querySubs();\n}\nfunction allSubs (model) {\n  return model._allQuerySubs();\n}\n\nfunction loadQueries(bundle) {\n  for (var i = 0, l = bundle.length; i < l; i++) {\n    var pair = bundle[i]\n      , queryTuple = pair[0]\n      , tag = pair[1];\n    var force = true;\n    this.registerQuery(queryTuple, tag, force);\n    scopedResult(this, queryTuple);\n  }\n}\nfunction querySubs() {\n  return this._queryRegistry.lookupWithTag('subs');\n}\nfunction allQuerySubs () {\n  return this._queryRegistry.lookupWithTags('subs', 'subs.always');\n}\n\n/**\n * @param {Array} queryTuple\n * @return {Object} json representation of the query\n * @api protected\n */\nfunction queryJSON(queryTuple) {\n  return this._queryMotifRegistry.queryJSON(queryTuple);\n}\n\n\n/**\n * Called when loading the model bundle. Loads queries defined by store.query.expose\n *\n * @param {Object} queryMotifBundle is the bundled form of a\n * QueryMotifRegistry, that was packaged up by the server Model and sent\n * down with the initial page response.\n * @api private\n */\nfunction loadQueryMotifs(queryMotifBundle) {\n  this._queryMotifRegistry = QueryMotifRegistry.fromJSON(queryMotifBundle);\n}\n\n/**\n * Registers queries to which the model is subscribed.\n *\n * @param {Array} queryTuple\n * @param {String} tag to label the query\n * @return {Boolean} true if registered; false if already registered\n * @api protected\n */\nfunction registerQuery(queryTuple, tag, force) {\n  var queryRegistry = this._queryRegistry\n    , queryId = queryRegistry.add(queryTuple, this._queryMotifRegistry, force) ||\n                queryRegistry.queryId(queryTuple);\n  queryRegistry.tag(queryId, tag);\n  if (!tag) throw new Error(\"NO TAG\");\n  return queryId;\n}\n\n/**\n * If no tag is provided, removes queries that we do not care to keep around anymore.\n * If a tag is provided, we only untag the query.\n *\n * @param {Array} queryTuple of the form [motifName, queryArgs...]\n * @param {Object} index mapping query hash -> Boolean\n * @return {Boolean}\n * @api protected\n */\nfunction unregisterQuery(queryTuple, tag) {\n  var queryRegistry = this._queryRegistry;\n  if (tag) {\n    var queryId = queryRegistry.queryId(queryTuple);\n    return queryRegistry.untag(queryId, tag);\n  }\n  return queryRegistry.remove(queryTuple);\n}\n\n/**\n * Locates a registered query.\n *\n * @param {String} motifName\n * @return {MemoryQuery|undefined} the registered MemoryQuery matching the queryRepresentation\n * @api protected\n */\nfunction registeredMemoryQuery(queryTuple) {\n  return this._queryRegistry.memoryQuery(queryTuple, this._queryMotifRegistry);\n}\n\nfunction registeredQueryId(queryTuple) {\n  return this._queryRegistry.queryId(queryTuple);\n}\n\n/**\n * Convenience method for generating [motifName, queryArgs...] tuples to\n * pass to Model#subscribe and Model#fetch.\n *\n * Example:\n *\n *     var query = model.fromQueryMotif('todos', 'forUser', 'someUserId');\n *     model.subscribe(query, function (err, todos) {\n *       console.log(todos.get());\n *     });\n *\n * @param {String} motifName\n * @param @optional {Object} queryArgument1\n * @param @optional {Object} ...\n * @param @optional {Object} queryArgumentX\n * @return {Array} a tuple of [null, motifName, queryArguments...]\n * @api public\n */\nfunction fromQueryMotif(/* motifName, queryArgs... */) {\n  return [null].concat(Array.prototype.slice.call(arguments, 0));\n}\n\n/**\n * Convenience method for generating [ns, [motifName, queryArgs...],\n * [motifName, queryArgs...]] tuples to pass to Model#subscribe and\n * Model#fetch via a fluent, chainable interface.\n *\n * Example:\n *\n *     var query = model.query('todos').forUser('1');\n *     model.subscribe(query, function (err, todos) {\n *       console.log(todos.get());\n *     });\n *\n *  You do not need to pass query to subscribe. You can also call subscribe\n *  on the query directly:\n *\n *      model.query('todos').forUser('1').subscribe( function (err, todos) {\n *        console.log(todos.get());\n *      });\n *\n *  This also supports a function signature that's better for\n *  coffee-script:\n *\n *  Example in coffee:\n *\n *     model.query 'todos',\n *       forUser: '1'\n *       subscribe: (err, todos) ->\n *         console.log todos.get()\n *\n * @param {String} ns\n * @return {Object} a query tuple builder\n * @api public\n */\nfunction query(ns) {\n  var model = this;\n  var builder = Object.create(this._queryMotifRegistry.queryTupleBuilder(ns), {\n    fetch: {value: function (cb) {\n      model.fetch(this, cb);\n    }}\n  , waitFetch: {value: function (cb) {\n      model.waitFetch(this, cb);\n    }}\n  , subscribe: {value: function (cb) {\n      model.subscribe(this, cb);\n    }}\n  });\n  if (arguments.length == 2) {\n    var params = arguments[1];\n    var getter = 'fetch' in params\n               ? 'fetch'\n               : 'subscribe' in params\n                 ? 'subscribe'\n                 : null;\n    if (getter) {\n      var cb = params[getter];\n      delete params[getter];\n    }\n    for (var motif in params) {\n      builder[motif](params[motif]);\n    }\n    if (getter) builder[getter](cb);\n  }\n  return builder;\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/query.Model.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/base.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  name: 'Query'\n, normalize: function (x) {\n    return x.tuple ? x.tuple : x;\n  }\n, isInstance: function (x) { return Array.isArray(x) || x.tuple; }\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/base.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/QueryRegistry.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// TODO Update queryTuple comments to reflect current structure\n\nvar deepEqual = require('../../util').deepEqual\n  , objectExcept = require('../../path').objectExcept\n  , MemoryQuery = require('./MemoryQuery')\n  , QueryBuilder = require('./QueryBuilder')\n  ;\n\nmodule.exports = QueryRegistry;\n\n/**\n * QueryRegistry is used by Model to keep track of queries and their metadata.\n */\nfunction QueryRegistry () {\n  // Maps queryId ->\n  //        id: queryId\n  //        tuple: [ns, {<queryMotif>: queryArgs, ...}, queryId]\n  //        query: <# MemoryQuery>\n  //        tags: [tags...]\n  //\n  // The `query` property is lazily created via QueryRegistry#memoryQuery\n  this._queries = {};\n\n  this._ordered = [];\n\n  // Maps ns -> [queryIds...]\n  this._queryIdsByNs = {};\n\n  // Maps tag -> [queryIds...]\n  // This is used for quick lookup of queries by tag\n  this._queryIdsByTag = {};\n\n  this._nextId = 1;\n  var self = this;\n  this._nextQueryId = function () {\n    return '_' + (self._nextId++);\n  }\n}\n\n/**\n * Creates a QueryRegistry instance from json that has been generated from\n * QueryBuilder#toJSON\n *\n * @param {Object} json\n * @param {Object} queryMotifRegistry contains all registered query motifs\n * @return {QueryRegistry}\n * @api public\n */\nQueryRegistry.fromJSON = function (json, queryMotifRegistry) {\n  var registry = new QueryRegistry\n    , queryIdsByNs = registry._queryIdsByNs\n    , queryIdsByTag = registry._queryIdsByTag\n    , maxQueryId = 0;\n\n  registry._queries = json;\n\n  for (var queryId in json) {\n    var curr = json[queryId]\n      , queryTuple = curr.tuple\n      , ns = queryTuple[0];\n\n    // Re-construct queryIdsByNs index\n    var queryIds = queryIdsByNs[ns] || (queryIdsByNs[ns] = []);\n    queryIds.push(queryId);\n\n    // Re-construct queryIdsByTag index\n    var tags = curr.tags;\n    for (var i = tags.length; i--; ) {\n      var tag = tags[i]\n        , taggedQueryIds = queryIdsByTag[tag] ||\n                          (queryIdsByTag[tag] = []);\n      if (-1 === taggedQueryIds.indexOf(queryId)) {\n        taggedQueryIds.push(queryId);\n      }\n    }\n\n    // Keep track of a max queryId, so we can assign the _nextQueryId upon the\n    // next call to QueryRegistry#add\n    maxQueryId = Math.max(maxQueryId, parseInt(queryId.slice(1 /* rm '_'*/), 10));\n  }\n  registry._nextId = ++maxQueryId;\n  return registry;\n};\n\nQueryRegistry.prototype = {\n  toJSON: function () {\n    var queries = this._queries\n      , json = {};\n    for (var queryId in queries) {\n      // Ignore the MemoryQuery instance\n      json[queryId] = objectExcept(queries[queryId], 'query');\n    }\n    return json;\n  }\n\n, bundle: function () {\n    var ordered = this._ordered\n      , queries = this._queries\n      , bundle = [];\n    for (var i = 0, l = ordered.length; i < l; i++) {\n      var pair = ordered[i]\n        , queryId = pair[0]\n        , tag = pair[1]\n        ;\n      bundle.push([queries[queryId].tuple, tag]);\n    }\n    return bundle;\n  }\n\n  /**\n   * Adds a query to the registry.\n   *\n   * @param {Array} queryTuple is [ns, [queryMotif, queryArgs...], ...]\n   * @return {String|null} the query id if add succeeds. null if add fails.\n   * @api public\n   */\n, add: function (queryTuple, queryMotifRegistry, force) {\n    var queryId = this.queryId(queryTuple);\n\n    // NOTE It's important for some query types to send the queryId to the\n    // Store, so the Store can use it. For example, the `count` query needs to\n    // send over the queryId, so that the Store can send back the proper data\n    // instructions that includes a path at which to store the count result.\n    // TODO In the future, we can figure out the path based on a more generic\n    // means to load data into our Model from the Store. So we can remove this\n    // line later\n    if (!queryTuple[3]) queryTuple[3] = queryId;\n\n    if (!force && queryId) return null;\n\n    if (!queryTuple[2]) queryTuple[2] = null;\n\n    var queries = this._queries;\n    if (! (queryId in queries)) {\n      if (queryTuple[2] === 'count') { // TODO Use types/ somehow\n        var queryJson = queryMotifRegistry.queryJSON(queryTuple);\n        queryId = QueryBuilder.hash(queryJson);\n      } else {\n        queryId = this._nextQueryId();\n      }\n      queryTuple[3] = queryId;\n\n      queries[queryId] = {\n        id: queryId\n      , tuple: queryTuple\n      , tags: []\n      };\n\n      var ns = queryTuple[0]\n        , queryIdsByNs = this._queryIdsByNs\n        , queryIds = queryIdsByNs[ns] || (queryIdsByNs[ns] = []);\n      if (queryIds.indexOf(queryId) === -1) {\n        queryIds.push(queryId);\n      }\n    }\n\n    return queryId;\n  }\n\n  /**\n   * Removes a query from the registry.\n   *\n   * @param {Array} queryTuple\n   * @return {Boolean} true if remove succeeds. false if remove fails.\n   * @api public\n   */\n, remove: function (queryTuple) {\n    // TODO Return proper Boolean value\n    var queries = this._queries\n      , queryId = this.queryId(queryTuple)\n      , meta = queries[queryId];\n\n    // Clean up tags\n    var tags = meta.tags\n      , queryIdsByTag = this._queryIdsByTag;\n    for (var i = tags.length; i--; ) {\n      var tag = tags[i]\n        , queryIds = queryIdsByTag[tag];\n      queryIds.splice(queryIds.indexOf(queryId), 1);\n      if (! queryIds.length) delete queryIdsByTag[tag];\n    }\n\n    // Clean up queryIdsByNs index\n    var ns = queryTuple[0]\n      , queryIdsByNs = this._queryIdsByNs\n      , queryIds = queryIdsByNs[ns]\n      , queryId = queryTuple[queryTuple.length - 1];\n    queryIds.splice(queryIds.indexOf(queryId));\n    if (! queryIds.length) delete queryIdsByNs[ns];\n\n    // Clean up queries\n    delete queries[queryId];\n  }\n\n  /**\n   * Looks up a query in the registry.\n   *\n   * @param {Array} queryTuple of the form\n   * [ns, {motifA: argsA, motifB: argsB, ...}, queryId]\n   * @return {Object} returns registered info about the query\n   * @api public\n   */\n, lookup: function (queryTuple) {\n    var queryId = this.queryId(queryTuple);\n    return this._queries[queryId];\n  }\n\n  /**\n   * Returns the queryId of the queryTuple\n   *\n   * @param {Array} queryTuple\n   */\n, queryId: function (queryTuple) {\n    // queryTuple has the form:\n    // [ns, argsByMotif, typeMethod, queryId]\n    // where\n    // argsByMotif: maps query motif names to motif arguments\n    // typeMethod: e.g., 'one', 'count'\n    // queryId: is an id (specific to the clientId) assigned by the\n    // QueryRegistry to the query\n    if (queryTuple.length === 4) {\n      return queryTuple[3];\n    }\n\n    var ns = queryTuple[0]\n      , queryIds = this._queryIdsByNs[ns]\n      , queries = this._queries;\n    if (!queryIds) return null;\n    var motifs = queryTuple[1]\n      , typeMethod = queryTuple[2];\n    for (var i = queryIds.length; i--; ) {\n      var queryId = queryIds[i]\n        , tuple = queries[queryId].tuple\n        , currMotifs = tuple[1]\n        , currTypeMethod = tuple[2]\n        ;\n      if (deepEqual(currMotifs, motifs) && currTypeMethod == typeMethod) {\n        return queryId;\n      }\n    }\n    return null;\n  }\n\n  /**\n   * @param {Array} queryTuple\n   * @param {QueryMotifRegistry} queryMotifRegistry\n   * @return {MemoryQuery}\n   * @api public\n   */\n, memoryQuery: function (queryTuple, queryMotifRegistry) {\n    var meta = this.lookup(queryTuple)\n      , memoryQuery = meta.query;\n    if (memoryQuery) return memoryQuery;\n\n    var queryJson = queryMotifRegistry.queryJSON(queryTuple);\n    if (! queryJson.type) queryJson.type = 'find';\n    return meta.query = new MemoryQuery(queryJson);\n  }\n\n  /**\n   * Tags a query registered in the registry as queryId. The QueryRegistry can\n   * then look up query tuples by tag via Query#lookupWithTag.\n   *\n   * @param {String} queryId\n   * @param {String} tag\n   * @return {Boolean}\n   * @api public\n   */\n, tag: function (queryId, tag) {\n    var queryIdsByTag = this._queryIdsByTag\n      , queryIds = queryIdsByTag[tag] ||\n                  (queryIdsByTag[tag] = []);\n    if (-1 === queryIds.indexOf(queryId)) {\n      this._ordered.push([queryId, tag]);\n      queryIds.push(queryId);\n      return true;\n    }\n    return false;\n  }\n\n  /**\n   * Untags a query registered in the registry as queryId. This will change\n   * the query tuple results returned by Query#lookupWithTag.\n   *\n   * @param {String} queryId\n   * @param {String} tag\n   * @return {Boolean}\n   * @api public\n   */\n, untag: function (queryId, tag) {\n    var queryIdsByTag = this._queryIdsByTag;\n    if (! (tag in queryIdsByTag)) return false;\n    var queryIds = queryIdsByTag[tag]\n      , pos = queryIds.indexOf(queryId);\n    if (pos === -1) return false;\n    queryIds.splice(pos, 1);\n    if (! queryIds.length) delete queryIdsByTag[tag];\n    return true;\n  }\n\n, lookupWithTags: function (/* tag1, tag2, ... */) {\n    var queryIdsByTag = this._queryIdsByTag\n      , queryIds\n      , queryId\n      , cumulativeQueryIds = {}\n      , tag\n      , queries = this._queries\n      , found = []\n      , query;\n\n    for (var i = 0, l = arguments.length; i < l; i++) {\n      tag = arguments[i];\n      queryIds = queryIdsByTag[tag]\n      if (! queryIds) continue;\n      for (var j = 0, k = queryIds.length; j < k; j++) {\n        queryId = queryIds[j]\n        if (queryId && ! (queryId in cumulativeQueryIds)) {\n          cumulativeQueryIds[queryId] = true;\n        }\n      }\n    }\n    for (queryId in cumulativeQueryIds) {\n      query = queries[queryId];\n      if (query) found.push(query.tuple);\n    }\n\n    return found;\n  }\n\n  /**\n   * Returns all registered query tuples that have been tagged with the given\n   * tag.\n   *\n   * @param {String} tag\n   * @return {Array} array of query tuples\n   * @api public\n   */\n, lookupWithTag: function (tag) {\n    return this.lookupWithTags(tag);\n  }\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/QueryRegistry.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/descriptor/query/QueryMotifRegistry.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var QueryBuilder = require('./QueryBuilder')\n  , bundleUtils = require('../../bundle/util')\n  , bundledFunction = bundleUtils.bundledFunction\n  , unbundledFunction = bundleUtils.unbundledFunction\n  , deepCopy = require('../../util').deepCopy\n  ;\n\nmodule.exports = QueryMotifRegistry;\n\n/**\n * Instantiates a `QueryMotifRegistry`. The instance is used by Model and Store\n * to add query motifs and to generate QueryBuilder instances with the\n * registered query motifs.\n */\nfunction QueryMotifRegistry () {\n  // Contains the query motifs declared without a ns.\n  // An example this._noNs might look like:\n  //     this._noNs = {\n  //       motifNameK: callbackK\n  //     , motifNameL: callbackL\n  //     };\n  // This would have been generated via:\n  //     this.add('motifNameK', callbackK);\n  //     this.add('motifNameL', callbackL);\n  this._noNs = {};\n\n  // Contains the query motifs declared with an ns.\n  // An example this._byNs might look like:\n  //     this._byNs = {\n  //       nsA: {\n  //         motifNameX: callbackX\n  //       , motifNameY: callbackY\n  //       }\n  //     , nsB: {\n  //         motifNameZ: callbackZ\n  //       }\n  //     };\n  // This would have been generated via:\n  //     this.add('nsA', 'motifNameX', callbackX);\n  //     this.add('nsA', 'motifNameY', callbackY);\n  //     this.add('nsB', 'motifNameZ', callbackZ);\n  this._byNs = {};\n\n  // An index of factory methods that generate query representations of the form:\n  //\n  //     { tuple: [ns, {motifName: queryArgs}]}\n  //\n  // This generated query representation prototypically inherits from\n  // this._tupleFactories[ns] in order to compose queries from > 1 query\n  // motifs in a chained manner.\n  //\n  // An example this._tupleFactories might look like:\n  //\n  //     this._tupleFactories = {\n  //       nsA: {\n  //         motifNameX: factoryX\n  //       }\n  //     }\n  this._tupleFactories = {};\n}\n\n/**\n * Creates a QueryMotifRegistry instance from json that has been generated from\n * QueryMotifRegistry#toJSON\n *\n * @param {Object} json\n * @return {QueryMotifRegistry}\n * @api public\n */\nQueryMotifRegistry.fromJSON = function (json) {\n  var registry = new QueryMotifRegistry\n    , noNs = registry._noNs = json['*'];\n\n  _register(registry, noNs);\n\n  delete json['*'];\n  for (var ns in json) {\n    var callbacksByName = json[ns];\n    _register(registry, callbacksByName, ns);\n  }\n  return registry;\n};\n\nfunction _register (registry, callbacksByName, ns) {\n  for (var motifName in callbacksByName) {\n    var callbackStr = callbacksByName[motifName]\n      , callback = unbundledFunction(callbackStr);\n    if (ns) registry.add(ns, motifName, callback);\n    else    registry.add(motifName, callback);\n  }\n}\n\nQueryMotifRegistry.prototype ={\n  /**\n   * Registers a query motif.\n   *\n   * @optional @param {String} ns is the namespace\n   * @param {String} motifName is the name of the nquery motif\n   * @param {Function} callback\n   * @api public\n   */\n  add: function (ns, motifName, callback) {\n    if (arguments.length === 2) {\n      callback = motifName;\n      motifName = ns\n      ns = null;\n    }\n    var callbacksByName;\n    if (ns) {\n      var byNs = this._byNs;\n      callbacksByName = byNs[ns] || (byNs[ns] = Object.create(this._noNs));\n    } else {\n      callbacksByName = this._noNs;\n    }\n    if (callbacksByName.hasOwnProperty(motifName)) {\n      throw new Error('There is already a query motif \"' + motifName + '\"');\n    }\n    callbacksByName[motifName] = callback;\n\n    var tupleFactories = this._tupleFactories;\n    tupleFactories = tupleFactories[ns] || (tupleFactories[ns] = Object.create(tupleFactoryProto));\n\n    tupleFactories[motifName] = function addToTuple () {\n      var args = Array.prototype.slice.call(arguments);\n      // deepCopy the args in case any of the arguments are direct references\n      // to an Object or Array stored in our Model Memory. If we don't do this,\n      // then we can end up having the query change underneath the registry,\n      // which causes problems because the rest of our code expects the\n      // registry to point to an immutable query.\n      this.tuple[1][motifName] = deepCopy(args);\n      return this;\n    };\n  }\n\n  /**\n   * Unregisters a query motif.\n   *\n   * @optional @param {String} ns is the namespace\n   * @param {String} motifName is the name of the query motif\n   * @api public\n   */\n, remove: function (ns, motifName) {\n    if (arguments.length === 1) {\n      motifName = ns\n      ns = null;\n    }\n    var callbacksByName\n      , tupleFactories = this._tupleFactories;\n    if (ns) {\n      var byNs = this._byNs;\n      callbacksByName = byNs[ns];\n      if (!callbacksByName) return;\n      tupleFactories = tupleFactories[ns];\n    } else {\n      callbacksByName = this.noNs;\n    }\n    if (callbacksByName.hasOwnProperty(motifName)) {\n      delete callbacksByName[motifName];\n      if (ns && ! Object.keys(callbacksByName).length) {\n        delete byNs[ns];\n      }\n      delete tupleFactories[motifName];\n      if (! Object.keys(tupleFactories).length) {\n        delete this._tupleFactories[ns];\n      }\n    }\n  }\n\n  /**\n   * Returns an object for composing queries in a chained manner where the\n   * chainable methods are named after query motifs registered with a ns.\n   *\n   * @param {String} ns\n   * @return {Object}\n   */\n, queryTupleBuilder: function (ns) {\n    var tupleFactories = this._tupleFactories[ns];\n    if (!tupleFactories) {\n      throw new Error('You have not declared any query motifs for the namespace \"' + ns + '\"' +\n                      '. You must do so via store.query.expose before you can query a namespaced ' +\n                      'collection of documents');\n    }\n    return Object.create(tupleFactories, {\n      tuple: { value: [ns, {}, null] }\n    });\n  }\n\n  /**\n   * Returns a json representation of the query, based on queryTuple and which\n   * query motifs happen to be registered at the moment via past calls to\n   * QueryMotifRegistry#add.\n   *\n   * @param {Array} queryTuple is [ns, {motifName: queryArgs}, queryId]\n   * @return {Object}\n   * @api public\n   */\n, queryJSON: function (queryTuple) {\n    // Instantiate a QueryBuilder.\n    // Loop through the motifs of the queryTuple, and apply the corresponding motif logic to augment the QueryBuilder.\n    // Tack on the query type in the queryTuple (e.g., 'one', 'count', etc.), if\n  // specified -- otherwise, default to 'find' type.\n    // Convert the QueryBuilder instance to json\n    var ns = queryTuple[0]\n      , queryBuilder = new QueryBuilder({from: ns})\n\n      , queryComponents = queryTuple[1]\n      , callbacksByName = this._byNs[ns]\n      ;\n\n    for (var motifName in queryComponents) {\n      var callback = callbacksByName\n                   ? callbacksByName[motifName]\n                   : this._noNs[motifName];\n      if (! callback) return null;\n      var queryArgs = queryComponents[motifName];\n      callback.apply(queryBuilder, queryArgs);\n    }\n\n    // A typeMethod (e.g., 'one', 'count') declared in query motif chaining\n    // should take precedence over any declared inside a motif definition callback\n    var typeMethod = queryTuple[2];\n    if (typeMethod) queryBuilder[typeMethod]();\n\n    // But if neither the query motif chaining nor the motif definition define\n    // a query type, then default to the 'find' query type.\n    if (! queryBuilder.type) queryBuilder.find();\n\n    return queryBuilder.toJSON();\n  }\n\n  /**\n   * Returns a JSON representation of the registry.\n   *\n   * @return {Object} JSON representation of `this`\n   * @api public\n   */\n, toJSON: function () {\n    var json = {}\n      , noNs = this._noNs\n      , byNs = this._byNs;\n\n    // Copy over query motifs not specific to a namespace\n    var curr = json['*'] = {};\n    for (var k in noNs) {\n      curr[k] = noNs[k].toString();\n    }\n\n    // Copy over query motifs specific to a namespace\n    for (var ns in byNs) {\n      curr = json[ns] = {};\n      var callbacks = byNs[ns];\n      for (k in callbacks) {\n        var cb = callbacks[k];\n        curr[k] = bundledFunction(cb);\n      }\n    }\n\n    return json;\n  }\n\n  /**\n   * @param {String} ns is the collection namespace\n   * @param {String} motifName is the name of the QueryMotif\n   * @return {Number} the arity of the query motif definition callback\n   */\n, arglen: function (ns, motifName) {\n    var cbsByMotif = this._byNs[ns];\n    if (!cbsByMotif) return;\n    var cb = cbsByMotif[motifName];\n    return cb && cb.length;\n  }\n}\n\nvar queryTypes = require('./types');\nvar tupleFactoryProto = {};\nfor (var t in queryTypes) {\n  (function (t) {\n    // t could be: 'find', 'one', 'count', etc. -- see ./types\n    tupleFactoryProto[t] = function () {\n      this.tuple[2] = t;\n      return this;\n    };\n  })(t);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/descriptor/query/QueryMotifRegistry.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/context/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./context.Model')\n  , mixinStore = __dirname + '/context.Store'\n  ;\n\nexports = module.exports = plugin;\n\nexports.useWith = {server: true, browser: true};\n\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/context/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/context/context.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  type: 'Model'\n, events: {\n    init: function (model) {\n      model.scopedContext = null;\n    }\n  }\n, proto: {\n    context: function (name) {\n      return Object.create(this, {\n        scopedContext: { value: name }\n      });\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/context/context.Model.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/txns/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./txns.Model')\n  , mixinStore = __dirname + '/txns.Store';\n\nexports = module.exports = plugin;\n\nexports.useWith = { server: true, browser: true };\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/txns/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/txns/txns.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var Memory = require('../Memory')\n  , Promise = require('../util/Promise')\n  , Serializer = require('../Serializer')\n  , transaction = require('../transaction')\n  , pathUtils = require('../path')\n  , isPrivate = pathUtils.isPrivate\n  , isPathToDoc = pathUtils.isPathToDoc\n  , subPathToDoc = pathUtils.subPathToDoc\n  , lookup = pathUtils.lookup\n  , specCreate = require('../util/speculative').create\n  , arrayMutator = null\n\n    // Timeout in milliseconds after which sent transactions will be resent\n  , SEND_TIMEOUT = 20000\n\n    // Interval in milliseconds to check timeouts for queued transactions\n  , RESEND_INTERVAL = 20000\n  ;\n\nmodule.exports = {\n  type: 'Model'\n\n, static: {\n    SEND_TIMEOUT: SEND_TIMEOUT\n  , RESEND_INTERVAL: RESEND_INTERVAL\n  }\n\n, events: {\n    mixin: function (Model) {\n      arrayMutator = Model.arrayMutator;\n    }\n\n  , init: function (model) {\n      // Add a promise that is checked at bundle time to make sure all\n      // transactions have been committed on the server before a model gets\n      // serialized\n      var bundlePromises = model._bundlePromises;\n      if (bundlePromises) {\n        var promise = model._txnsPromise = new Promise();\n        bundlePromises.push(promise);\n      }\n\n      var specCache = model._specCache = {\n        invalidate: function () {\n          delete this.data;\n          delete this.lastTxnId;\n        }\n      };\n\n      model._count = {txn: 0};\n\n      model._txns = {}; // transaction id -> transaction\n      model._txnQueue = []; // [transactionIds...]\n\n      model._removeTxn = function (txnId) {\n        delete model._txns[txnId];\n        var txnQueue = model._txnQueue;\n        var i = txnQueue.indexOf(txnId);\n        if (~i) {\n          model._txnQueue.splice(i, 1);\n          specCache.invalidate();\n          model.emit('rmTxn', txnId, txnQueue.length);\n        }\n      };\n\n      // TODO Add client-side filtering for incoming data on\n      // no-longer-subscribed-to channels. This alleviates race condition of\n      // receiving a messages on a channel the client just subscribed to\n\n      var memory = model._memory;\n      model._onTxn = function (txn) {\n        if (!txn) return;\n\n        // Copy meta properties onto this txn if it matches one in the queue\n        var txnQ = model._txns[transaction.getId(txn)];\n        if (txnQ) {\n          txn.callback = txnQ.callback;\n          txn.emitted = txnQ.emitted;\n        }\n\n        var isLocal = 'callback' in txn\n          , ver = transaction.getVer(txn);\n        if (ver > memory.version || ver === -1) {\n          model._applyTxn(txn, isLocal);\n        }\n      };\n    }\n\n  , bundle: function (model) {\n      model._txnsPromise.on( function (err) {\n        if (err) throw err;\n        var clientId = model._clientId\n          , store = model.store;\n        if (store) {\n          // In case we already unregistered local model\n          // TODO Investigate why this is the case\n          store._unregisterLocalModel(clientId);\n        } else {\n          console.warn('ALREADY UNREGISTERED SERVER MODEL');\n          console.trace();\n        }\n\n        // Start buffering subsequently received transactions. They will be\n        // sent to the browser upon browser connection. This also occurs on 'disconnect'\n        store._txnBuffers.add(clientId);\n      });\n\n      // Get the speculative model, which will apply any pending private path\n      // transactions that may get stuck in the first position of the queue\n      model._specModel();\n\n      // If we have no pending transactions...\n      if (! model._txnQueue.length) {\n        return model._txnsPromise.resolve();\n      }\n\n      // Else...\n      // Wait for all pending transactions to complete before returning\n      // TODO This code is really confusing. Refactor\n      if (! model.__removeTxn__) model.__removeTxn__ = model._removeTxn;\n      model._removeTxn = function (txnId) {\n        model.__removeTxn__(txnId);\n        var len = model._txnQueue.length;\n        model._specModel();\n        if (len) return;\n\n        process.nextTick( function () {\n          model._txnsPromise.resolve();\n        });\n      };\n    }\n\n  , socket: function (model, socket) {\n      var memory    = model._memory\n        , removeTxn = model._removeTxn\n        , onTxn     = model._onTxn\n\n      // The startId is the ID of the last Journal restart. This is sent along with\n      // each versioned message from the Model so that the Store can map the model's\n      // version number to the version number of the Journal in case of a failure\n\n      // These events are triggered by the 'resyncWithStore' event in the\n      // reconnect mixin and the\n      // txnApplier timeout below. A request is made to the server to fetch the\n      // most recent snapshot, which is returned to the browser in one of many\n      // forms on a channel prefixed with \"snapshotUpdate:*\"\n      socket.on('snapshotUpdate:replace', function (data, num) {\n        // TODO Over-ride and replay diff as events?\n\n        // TODO: OMG NASTY HACK, but this prevents a number of issues that can\n        // come up if rendering in strange states\n        if (typeof DERBY !== 'undefined') DERBY.app.dom._preventUpdates = true;\n\n        var oldTxnQueue = model._txnQueue\n          , oldTxns = model._txns\n          , txnQueue = model._txnQueue = []\n          , txns = model._txns = {};\n\n        // Reset the number used to keep track of pending transactions\n        txnApplier.clearPending();\n        if (num != null) txnApplier.setIndex(num + 1);\n\n        model._specCache.invalidate();\n        memory.eraseNonPrivate();\n        var maxVersion = 0\n          , targetData = data.data\n        for (var i = targetData.length; i--;) {\n          maxVersion = Math.max(targetData[i][2], maxVersion);\n        }\n        memory.version = maxVersion;\n\n        // TODO memory.flush?\n        model._addData(data);\n\n        var txnId, txn\n        for (var i = 0, l = oldTxnQueue.length; i < l; i++) {\n          txnId = oldTxnQueue[i];\n          txn = oldTxns[txnId];\n          transaction.setVer(txn, maxVersion);\n          txns[txnId] = txn;\n          txnQueue.push(txnId);\n          commit(txn);\n        }\n\n        if (typeof DERBY !== 'undefined') DERBY.app.dom._preventUpdates = false;\n\n        model.emit('reInit');\n      });\n\n      socket.on('snapshotUpdate:newTxns', function (newTxns, num) {\n        // Apply any missed transactions first\n        for (var i = 0, l = newTxns.length; i < l; i++) {\n          onTxn( newTxns[i] );\n        }\n\n        // Reset the number used to keep track of pending transactions\n        txnApplier.clearPending();\n        if (typeof num !== 'undefined') txnApplier.setIndex(num + 1);\n\n        // Resend all transactions in the queue\n        var txns = model._txns\n          , txnQueue = model._txnQueue\n        for (var i = 0, l = txnQueue.length; i < l; i++) {\n          var id = txnQueue[i];\n          // TODO In access control tests, same mutation sent twice as 2\n          // different txns\n          commit(txns[id]);\n        }\n      });\n\n      var txnApplier = new Serializer({\n        withEach: onTxn\n\n        // This timeout is for scenarios when a service that the server proxies\n        // to fails. This is for remote transactions.\n      , onTimeout: function () {\n          // TODO Make sure to set up the timeout again if we are disconnected\n          if (! model.connected) return;\n          // TODO Don't do this if we are also responding to a resyncWithStore\n          socket.emit('fetch:snapshot', memory.version + 1, model._startId, model._subs());\n        }\n      });\n\n      function resend () {\n        var now = +new Date;\n        // Evaluate to clear out private transactions at the beginning of the\n        // queue\n        model._specModel();\n        var txns = model._txns\n          , txnQueue = model._txnQueue\n        for (var i = 0, l = txnQueue.length; i < l; i++) {\n          var id = txnQueue[i]\n            , txn = txns[id];\n          if (! txn || txn.timeout > now) return;\n          commit(txn);\n        }\n      }\n\n      // Set an interval to check for transactions that have been in the queue\n      // for too long and resend them\n      var resendInterval = null;\n      function setupResendInterval () {\n        if (!resendInterval) resendInterval = setInterval(resend, RESEND_INTERVAL);\n      }\n\n      function teardownResendInterval () {\n        if (resendInterval) clearInterval(resendInterval);\n        resendInterval = null;\n        if (model.connected) {\n          setupResendInterval();\n        } else {\n          model.once('connect', setupResendInterval);\n        }\n      }\n\n      // Stop resending transactions until reconnect\n      // TODO Stop asking for missed remote transactions until reconnect\n      socket.on('disconnect', teardownResendInterval);\n      teardownResendInterval();\n\n      model._addRemoteTxn = addRemoteTxn;\n      function addRemoteTxn (txn, num) {\n        if (typeof num !== 'undefined') {\n          txnApplier.add(txn, num);\n        } else {\n          onTxn(txn);\n        }\n      }\n\n      socket.on('txn', addRemoteTxn);\n\n      // The model receives 'txnOk' from the server/store after the\n      // server/store applies a transaction that originated from this model successfully\n      socket.on('txnOk', function (rcvTxn, num) {\n        var txnId = transaction.getId(rcvTxn)\n          , txn = model._txns[txnId];\n        if (!txn) return;\n        var ver = transaction.getVer(rcvTxn);\n        transaction.setVer(txn, ver);\n        addRemoteTxn(txn, num);\n      });\n\n      // The model receives 'txnErr' from the server/store after the\n      // server/store attempts to apply this transaction but fails\n      socket.on('txnErr', function (err, txnId) {\n        var txn = model._txns[txnId]\n          , callback = txn && txn.callback;\n        removeTxn(txnId);\n        if (callback) {\n          var callbackArgs = (transaction.isCompound(txn))\n                           ? transaction.ops(txn)\n                           : transaction.copyArgs(txn);\n          callbackArgs.unshift(err);\n          callback.apply(null, callbackArgs);\n        }\n      });\n\n      model._commit = commit;\n      function commit (txn) {\n        if (txn.isPrivate) return;\n        txn.timeout = +new Date + SEND_TIMEOUT;\n\n        // Don't queue this up in socket.io's message buffer. Instead, we\n        // explicitly send over an txns in this_txnQueue during reconnect synchronization\n        if (! model.connected) return;\n\n        socket.emit('txn', txn, model._startId);\n      }\n    }\n  }\n\n, server: {\n    _commit: function (txn) {\n      if (txn.isPrivate) return;\n      var self = this\n        , req = {\n            data: txn\n          , ignoreStartId: true\n          , clientId: this._clientId\n          , session: this.session\n          }\n        , res = {\n            fail: function (err, txn) {\n              self._removeTxn(transaction.getId(txn));\n              txn.callback(err, txn);\n            }\n          , send: function (txn) {\n              self._onTxn(txn);\n              self.store.serialCleanup(txn);\n            }\n          };\n      this.store.middleware.txn(req, res);\n    }\n  }\n\n, proto: {\n    // The value of this._force is checked in this._addOpAsTxn. It can be used\n    // to create a transaction without conflict detection, such as\n    // model.force().set\n    force: function () {\n      return Object.create(this, {_force: {value: true}});\n    }\n  , _commit: function () {}\n  , _asyncCommit: function (txn, cb) {\n      if (! this.connected) return cb('disconnected');\n      txn.callback = cb;\n      var id = transaction.getId(txn);\n      this._txns[id] = txn;\n      this._commit(txn);\n    }\n\n  , _nextTxnId: function () {\n      return this._clientId + '.' + this._count.txn++;\n    }\n\n  , _queueTxn: function (txn, cb) {\n      txn.callback = cb;\n      var id = transaction.getId(txn);\n      this._txns[id] = txn;\n      this._txnQueue.push(id);\n    }\n\n  , _getVersion: function () {\n      return this._force ? null : this._memory.version;\n    }\n\n  , _opToTxn: function (method, args, cb) {\n      var ver = this._getVersion()\n        , id = this._nextTxnId()\n        , txn = transaction.create({\n            ver: ver\n          , id: id\n          , method: method\n          , args: args})\n        ;\n      txn.callback = cb;\n      return txn;\n    }\n\n  , _sendOp: function (method, args, cb) {\n      var txn = this._opToTxn(method, args, cb)\n\n      // Refs may mutate the args in its 'beforeTxn' handler\n      this.emit('beforeTxn', method, args);\n      var path = args[0];\n      if (~ path.indexOf('.undefined')) {\n        return console.warn('You were about to set on a path including undefined: ' + path);\n      }\n      if (typeof path === 'undefined') {\n        return console.warn('You were about to set on undefined path');\n      }\n      txn.isPrivate = isPrivate(path);\n\n      txn.emitted = this._silent || args.cancelEmit;\n\n      var txnId = transaction.getId(txn);\n      this._txns[txnId] = txn;\n      this._txnQueue.push(txnId);\n\n      // Evaluate the transaction, which is now on the queue\n      var out = this._specModel().$out;\n\n      // Commit needs to happen before emit, since emissions might create other\n      // transactions as a side effect\n      this._commit(txn);\n\n      if (txn.emitted) return out;\n\n      // Clone the args, so that they can be modified before being\n      // emitted without affecting the txn args\n      this.emit(method, args.slice(), out, true, this._pass);\n      txn.emitted = true;\n      return out;\n    }\n\n  , _applyTxn: function (txn, isLocal) {\n      var txnId = transaction.getId(txn);\n      if (txnId) this._removeTxn(txnId);\n      // Invalidate cache, since we're about to update this._memory._data\n      // beneath the spec model\n      this._specCache.invalidate();\n      var data = this._memory._data\n        , doEmit = !txn.emitted\n          // TODO Do we need Math.floor anymore?\n        , ver = Math.floor(transaction.getVer(txn))\n        , isCompound = transaction.isCompound(txn)\n        , out\n        ;\n      if (isCompound) {\n        var ops = transaction.ops(txn);\n        for (var i = 0, l = ops.length; i < l; i++) {\n          var op = ops[i];\n          this._applyMutation(transaction.op, op, ver, data, doEmit, isLocal);\n        }\n      } else {\n        // This commented out logic is incorrect. It is entirely valid to write to a\n        // property of a doc that doesn't exist yet in Racer's current API. This\n        // breaks example code and might not make sense with certain view bindings:\n\n        // For transactions on a document attribute, only apply it if the doc\n        // exists in our world. Otherwise, we are likely in a situation where\n        // we received a transaciton for something that we were just\n        // subscribed to but no longer are subscribed to. In this case, we\n        // would not want this transaction to play.\n        // Note: this.allowWritesOnAbsentDoc is for testing\n        // if (! this.allowWritesOnAbsentDoc && docIsntPresent(this, txn, data)) {\n        //   if (ver !== null) {\n        //     this._memory.setVersion(ver);\n        //   }\n        //   return;\n        // }\n        out = this._applyMutation(transaction, txn, ver, data, doEmit, isLocal);\n      }\n\n      var callback = txn.callback;\n      if (callback) {\n        if (isCompound) {\n          callback.apply(null, [null].concat(transaction.ops(txn)));\n        } else {\n          callback.apply(null, [null].concat(transaction.getArgs(txn), out));\n        }\n      }\n      return out;\n    }\n\n    // `extractor` is either `transaction` or `transaction.op`\n  , _applyMutation: function (extractor, txn, ver, data, doEmit, isLocal) {\n      var out = extractor.applyTxn(txn, data, this._memory, ver);\n      if (doEmit) {\n        var patch = txn.patch;\n        if (patch) {\n          for (var i = 0, l = patch.length; i < l; i++) {\n            var op = patch[i]\n              , method = op.method\n              , args = op.args\n              ;\n            this.emit(method, args, null, isLocal, this._pass);\n          }\n        } else {\n          var method = transaction.getMethod(txn)\n            , args = transaction.getArgs(txn);\n          this.emit(method, args, out, isLocal, this._pass);\n        }\n        txn.emitted = true;\n      }\n      return out;\n    }\n\n  , _specModel: function () {\n      var txns = this._txns\n        , txnQueue = this._txnQueue\n        , txn, out, data\n      while ((txn = txns[txnQueue[0]]) && txn.isPrivate) {\n        out = this._applyTxn(txn, true);\n      }\n\n      var len = txnQueue.length;\n      if (! len) {\n        data = this._memory._data;\n        data.$out = out;\n        return data;\n      }\n\n      var cache = this._specCache\n        , lastTxnId = cache.lastTxnId\n        , replayFrom\n        ;\n      if (lastTxnId) {\n        if (cache.lastTxnId === txnQueue[len - 1]) return cache.data;\n        data = cache.data;\n        replayFrom = 1 + txnQueue.indexOf(cache.lastTxnId);\n      } else {\n        replayFrom = 0;\n      }\n\n      if (! data) {\n        // Generate a specualtive model\n        data = cache.data = specCreate(this._memory._data);\n      }\n\n      var i = replayFrom;\n      while (i < len) {\n        // Apply each pending operation to the speculative model\n        var txn = txns[txnQueue[i++]];\n        if (transaction.isCompound(txn)) {\n          var ops = transaction.ops(txn);\n          for (var k = 0, kk = ops.length; k < kk; k++) {\n            this._applyMutation(transaction.op, ops[k], null, data);\n          }\n        } else {\n          // This commented out logic is incorrect. See comment above\n\n          // Note: this.allowWritesOnAbsentDoc is for testing\n          // if (! this.allowWritesOnAbsentDoc && docIsntPresent(this, txn, data)) {\n          //   continue;\n          // }\n          out = this._applyMutation(transaction, txn, null, data);\n        }\n      }\n\n      cache.data = data;\n      cache.lastTxnId = transaction.getId(txn);\n\n      data.$out = out;\n\n      return data;\n    }\n  }\n};\n\n// function docIsntPresent (model, txn, data) {\n//   var path = transaction.getPath(txn);\n//   if (! isPrivate(path) && ! isPathToDoc(path)) {\n//     if (path.indexOf('.') === -1) {\n//       return false; // Then this is a namespace collection\n//     }\n//     var pathToDoc = subPathToDoc(path);\n//     data || (data = model._memory._data);\n//     if (! lookup(pathToDoc, data.world)) {\n//       return true;\n//     }\n//   }\n//   return false;\n// }\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/txns/txns.Model.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/Serializer.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/**\n * Given a stream of out of order messages and an index, Serializer figures out\n * what messages to handle immediately and what messages to buffer and defer\n * handling until later, if the incoming message has to wait first for another\n * message.\n */\n\nvar DEFAULT_EXPIRY = 1000; // milliseconds\n\n// TODO Respect Single Responsibility -- place waiter code elsewhere\nmodule.exports = Serializer;\n\nfunction Serializer (options) {\n  this.withEach = options.withEach;\n  var onTimeout = this.onTimeout = options.onTimeout\n    , expiry = this.expiry = options.expiry;\n\n  if (onTimeout && ! expiry) {\n    this.expiry = DEFAULT_EXPIRY;\n  }\n\n  // Maps future indexes -> messages\n  this._pending = {};\n\n  var init = options.init;\n  // Corresponds to ver in Store and txnNum in Model\n  this._index = (init != null)\n              ? init\n              : 1;\n}\n\nSerializer.prototype = {\n  _setWaiter: function () {\n    if (!this.onTimeout || this._waiter) return;\n    var self = this;\n    this._waiter  = setTimeout( function () {\n      self.onTimeout();\n      self._clearWaiter();\n    }, this.expiry);\n  }\n\n, _clearWaiter: function () {\n    if (! this.onTimeout) return;\n    if (this._waiter) {\n      clearTimeout(this._waiter);\n      delete this._waiter;\n    }\n  }\n\n, add: function (msg, msgIndex, arg) {\n    // Cache this message to be applied later if it is not the next index\n    if (msgIndex > this._index) {\n      this._pending[msgIndex] = msg;\n      this._setWaiter();\n      return true;\n    }\n\n    // Ignore this message if it is older than the current index\n    if (msgIndex < this._index) return false;\n\n    // Otherwise apply it immediately\n    this.withEach(msg, this._index++, arg);\n    this._clearWaiter();\n\n    // And apply any messages that were waiting for txn\n    var pending = this._pending;\n    while (msg = pending[this._index]) {\n      this.withEach(msg, this._index, arg);\n      delete pending[this._index++];\n    }\n    return true;\n  }\n\n, setIndex: function (index) {\n    this._index = index;\n  }\n\n, clearPending: function () {\n    var index = this._index\n      , pending = this._pending;\n    for (var i in pending) {\n      if (i < index) delete pending[i];\n    }\n  }\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/Serializer.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/reconnect/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var mixinModel = require('./reconnect.Model')\n  , mixinStore = __dirname + '/reconnect.Store'\n\nexports = module.exports = plugin;\nexports.useWith = {server: true, browser: true};\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  racer.mixin(mixinModel, mixinStore);\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/reconnect/index.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/reconnect/reconnect.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  type: 'Model'\n, events: {\n    socket: onSocket \n  }\n};\n\nfunction onSocket(model, socket) {\n  var memory = model._memory;\n  // When the store asks the browser model to re-sync with the store, then\n  // the model should send the store its subscriptions and handle the\n  // receipt of instructions to get the model state back in sync with the\n  // store state (e.g., in the form of applying missed transaction, or in\n  // the form of diffing to a received store state)\n  socket.on('resyncWithStore', function (fn) {\n    var subs = model._allSubs();\n    fn(subs, memory.version, model._startId);\n  });\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/reconnect/reconnect.Model.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/racer.browser.js",Function(['require','module','exports','__dirname','__filename','process','global'],"/** WARNING\n * All racer modules for the browser should be included in racer.coffee and not\n * in this file.\n */\n\nvar configuration = require('./configuration')\n\n// Static isReady and model variables are used, so that the ready function can\n// be called anonymously. This assumes that only one instance of Racer is\n// running, which should be the case in the browser.\nvar IS_READY\n  , model;\n\nexports = module.exports = plugin;\nexports.useWith = { server: false, browser: true };\nexports.decorate = 'racer';\n\nfunction plugin (racer) {\n  var envs = ['browser'];\n  configuration.makeConfigurable(racer, envs);\n\n  racer.init = function (tuple, socket) {\n    var clientId  = tuple[0]\n      , memory    = tuple[1]\n      , count     = tuple[2]\n      , onLoad    = tuple[3]\n      , startId   = tuple[4]\n      , ioUri     = tuple[5]\n      , ioOptions = tuple[6]\n      , flags     = tuple[7]\n\n    model = new this.protected.Model;\n    model._clientId = clientId;\n    model._startId  = startId;\n    model._memory.init(memory);\n    model._count = count;\n    model.flags = flags;\n\n    // TODO: Configuration methods don't account for this env value not being\n    // available right away\n    envs.push(model.flags.nodeEnv);\n\n    for (var i = 0, l = onLoad.length; i < l; i++) {\n      var item = onLoad[i]\n        , method = item.shift();\n      model[method].apply(model, item);\n    }\n\n    racer.emit('init', model);\n\n    // TODO If socket is passed into racer, make sure to add clientId query param\n    ioOptions.query = 'clientId=' + clientId;\n    model._setSocket(socket || io.connect(ioUri + '?clientId=' + clientId, ioOptions));\n\n    IS_READY = true;\n    racer.emit('ready', model);\n    return racer;\n  };\n\n  racer.ready = function (onready) {\n    return function () {\n      if (IS_READY) return onready(model);\n      racer.on('ready', onready);\n    };\n  }\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/racer.browser.js"
));

require.define("/node_modules/derby/node_modules/racer/lib/configuration.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  makeConfigurable: makeConfigurable\n};\n\nfunction makeConfigurable (module, envs) {\n  if (envs) {\n    if (!Array.isArray(envs)) envs = [envs];\n  } else {\n    envs = [];\n  }\n\n  module.settings || (module.settings = {});\n\n  module.configure = function (env, callback) {\n    if (typeof env === 'function') {\n      callback = env;\n      env = 'all';\n    }\n    if ((env === 'all') || ~envs.indexOf(env)) {\n      callback.call(this);\n    }\n    return this;\n  };\n\n  module.set = function (setting, value) {\n    this.settings[setting] = value;\n    return this;\n  };\n  module.enable = function (setting) {\n    return this.set(setting, true);\n  };\n  module.disable = function (setting) {\n    return this.set(setting, false);\n  };\n\n  module.get = function (setting) {\n    return this.settings[setting];\n  };\n  module.enabled = function (setting) {\n    return !!this.get(setting);\n  };\n  module.disabled = function (setting) {\n    return !this.get(setting);\n  };\n\n  module.applyConfiguration = function (configurable) {\n    for (var setting in this.settings) {\n      configurable.set(setting, this.settings[setting]);\n    };\n  };\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/racer/lib/configuration.js"
));

require.define("/node_modules/derby/lib/component.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var EventEmitter = require('events').EventEmitter\n  , path = require('path')\n  , merge = require('racer').util.merge\n  , View = require('./View')\n  , arraySlice = Array.prototype.slice\n\nmodule.exports = componentPlugin;\n\nfunction componentPlugin(derby) {\n  derby._libraries = [];\n  derby._libraries.map = {};\n  derby.createLibrary = createLibrary;\n}\ncomponentPlugin.decorate = 'derby';\n\n\nvar componentProto = Object.create(EventEmitter.prototype);\n\ncomponentProto.emitCancellable = function() {\n  var cancelled = false\n    , args = arraySlice.call(arguments)\n\n  function cancel() {\n    cancelled = true;\n  }\n\n  args.push(cancel);\n  this.emit.apply(this, args);\n  return cancelled;\n};\n\ncomponentProto.emitDelayable = function() {\n  var delayed = false\n    , args = arraySlice.call(arguments, 0, -1)\n    , callback = arguments[arguments.length - 1]\n\n  function delay() {\n    delayed = true;\n  }\n\n  args.push(delay, callback);\n  this.emit.apply(this, args);\n  if (!delayed) callback();\n  return delayed;\n};\n\n// Hack needed for model bundling\ncomponentProto.toJSON = function() {}\n\nfunction type(view) {\n  return view === this.view ? 'lib:' + this.id : this.ns + ':' + this.id;\n}\n\nfunction createLibrary(config, options) {\n  if (!config || !config.filename) {\n    throw new Error ('Configuration argument with a filename is required');\n  }\n  if (!options) options = {};\n  var root = path.dirname(config.filename)\n    , ns = options.ns || config.ns || path.basename(root)\n    , scripts = config.scripts || {}\n    , view = new View\n    , constructors = {}\n    , library = {\n        ns: ns\n      , root: root\n      , view: view\n      , constructors: constructors\n      , styles: config.styles\n      }\n    , Component, proto, id, script;\n\n  view._selfNs = 'lib';\n  view._selfLibrary = library;\n\n  for (id in scripts) {\n    script = scripts[id];\n    script.setup && script.setup(library);\n\n    Component = function(model, scope) {\n      this.view = view;\n      this.model = model;\n      this.scope = scope;\n      this.history = null;\n      this.dom = null;\n\n      // Don't limit the number of listeners\n      this.setMaxListeners(0);\n\n      var component = this;\n      model.__on = model._on;\n      model._on = function(name, listener) {\n        component.on('destroy', function() {\n          model.removeListener(name, listener);\n        })\n        return model.__on(name, listener);\n      };\n      component.on('destroy', function() {\n        model.silent().del();\n      });\n    }\n    proto = Component.prototype = Object.create(componentProto);\n    merge(proto, script);\n\n    Component.view = view;\n    Component.ns = ns;\n    Component.id = id;\n    Component.type = type;\n\n    // Note that component names are all lowercased\n    constructors[id.toLowerCase()] = Component;\n  }\n\n  this._libraries.push(library);\n  this._libraries.map[ns] = library;\n  return library;\n}\n\n//@ sourceURL=/node_modules/derby/lib/component.js"
));

require.define("/node_modules/derby/lib/View.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var htmlUtil = require('html-util')\n  , md5 = require('MD5')\n  , parseHtml = htmlUtil.parse\n  , trimLeading = htmlUtil.trimLeading\n  , unescapeEntities = htmlUtil.unescapeEntities\n  , escapeHtml = htmlUtil.escapeHtml\n  , escapeAttribute = htmlUtil.escapeAttribute\n  , isVoid = htmlUtil.isVoid\n  , conditionalComment = htmlUtil.conditionalComment\n  , lookup = require('racer/lib/path').lookup\n  , markup = require('./markup')\n  , viewPath = require('./viewPath')\n  , patchCtx = viewPath.patchCtx\n  , wrapRemainder = viewPath.wrapRemainder\n  , ctxPath = viewPath.ctxPath\n  , extractPlaceholder = viewPath.extractPlaceholder\n  , dataValue = viewPath.dataValue\n  , pathFnArgs = viewPath.pathFnArgs\n  , isBound = viewPath.isBound\n  , eventBinding = require('./eventBinding')\n  , splitEvents = eventBinding.splitEvents\n  , fnListener = eventBinding.fnListener\n  , racer = require('racer')\n  , merge = racer.util.merge\n\nmodule.exports = View;\n\nfunction empty() {\n  return '';\n}\n\nvar defaultCtx = {\n  $aliases: {}\n, $paths: []\n, $indices: []\n};\n\nvar CAMEL_REGEXP = /([a-z])([A-Z])/g\n\nvar defaultGetFns = {\n  equal: function(a, b) {\n    return a === b;\n  }\n, not: function(value) {\n    return !value;\n  }\n, dash: function(value) {\n    return value && value\n      .replace(/[:_\\s]/g, '-')\n      .replace(CAMEL_REGEXP, '$1-$2')\n      .toLowerCase()\n  }\n, join: function(items, property, separator) {\n    var list, i;\n    if (!items) return;\n    if (property) {\n      list = [];\n      for (i = items.length; i--;) {\n        list[i] = items[i][property];\n      }\n    } else {\n      list = items;\n    }\n    return list.join(separator || ', ');\n  }\n, log: function(value) {\n    return console.log.apply(console, arguments);\n  }\n, path: function(name) {\n    return ctxPath(this.view, this.ctx, name);\n  }\n};\n\nvar defaultSetFns = {\n  equal: function(value, a) {\n    return value && {1: a};\n  }\n, not: function(value) {\n    return {0: !value};\n  }\n};\n\nfunction View(libraries, app, appFilename) {\n  this._libraries = libraries || (libraries = []);\n  this.app = app || {};\n  this._appFilename = appFilename;\n  this._inline = '';\n  this.clear();\n  this.getFns = Object.create(defaultGetFns);\n  this.setFns = Object.create(defaultSetFns);\n  if (this._init) this._init();\n}\nView.prototype = {\n  defaultViews: {\n    doctype: function() {\n      return '<!DOCTYPE html>';\n    }\n  , root: empty\n  , charset: function() {\n      return '<meta charset=utf-8>';\n    }\n  , title$s: empty\n  , head: empty\n  , header: empty\n  , body: empty\n  , footer: empty\n  , scripts: empty\n  , tail: empty\n  }\n\n, _selfNs: 'app'\n\n  // All automatically created ids start with a dollar sign\n  // TODO: change this since it messes up query selectors unless escaped\n, _uniqueId: uniqueId\n\n, clear: clear\n, _resetForRender: resetForRender\n, make: make\n, _makeAll: makeAll\n, _makeComponents: makeComponents\n, _findView: findView\n, _find: find\n, get: get\n, fn: fn\n, render: render\n, componentsByName: componentsByName\n, _componentConstructor: componentConstructor\n, _beforeRender: beforeRender\n, _afterRender: afterRender\n, _beforeRoute: beforeRoute\n\n  // TODO: This API is temporary until subscriptions can be properly cleaned up\n, whitelistCollections: whitelistCollections\n\n, inline: empty\n\n, escapeHtml: escapeHtml\n, escapeAttribute: escapeAttribute\n}\n\nView.valueBinding = valueBinding;\n\nfunction clear() {\n  this._views = Object.create(this.defaultViews);\n  this._renders = {};\n  this._resetForRender();\n}\n\nfunction resetForRender(model, componentInstances) {\n  componentInstances || (componentInstances = {});\n  if (model) this.model = model;\n  this._idCount = 0;\n  this._componentInstances = componentInstances;\n  var libraries = this._libraries\n    , i\n  for (i = libraries.length; i--;) {\n    libraries[i].view._resetForRender(model, componentInstances);\n  }\n}\n\nfunction componentsByName(name) {\n  return this._componentInstances[name] || [];\n}\n\nfunction componentConstructor(name) {\n  return this._selfLibrary && this._selfLibrary.constructors[name];\n}\n\nfunction uniqueId() {\n  return '$' + (this._idCount++).toString(36);\n}\n\nfunction make(name, template, options, templatePath) {\n  var view = this\n    , isString = options && options.literal\n    , noMinify = isString\n    , onBind, renderer, render, matchTitle;\n\n  if (templatePath && (render = this._renders[templatePath])) {\n    this._views[name] = render;\n    return\n  }\n\n  name = name.toLowerCase();\n  matchTitle = /(?:^|\\:)title(\\$s)?$/.exec(name);\n  if (matchTitle) {\n    isString = !!matchTitle[1];\n    if (isString) {\n      onBind = function(events, name) {\n        return bindEvents(events, name, render, ['$_doc', 'prop', 'title']);\n      };\n    } else {\n      this.make(name + '$s', template, options, templatePath);\n    }\n  }\n\n  renderer = function(ctx, model, triggerPath, triggerId) {\n    renderer = parse(view, name, template, isString, onBind, noMinify);\n    return renderer(ctx, model, triggerPath, triggerId);\n  }\n  render = function(ctx, model, triggerPath, triggerId) {\n    return renderer(ctx, model, triggerPath, triggerId);\n  }\n\n  render.nonvoid = options && options.nonvoid;\n\n  this._views[name] = render;\n  if (templatePath) this._renders[templatePath] = render;\n}\n\nfunction makeAll(templates, instances) {\n  var name, instance, options, templatePath;\n  if (!instances) return;\n  this.clear();\n  for (name in instances) {\n    instance = instances[name];\n    templatePath = instance[0];\n    options = instance[1];\n    this.make(name, templates[templatePath], options, templatePath);\n  }\n}\n\nfunction makeComponents(components) {\n  var librariesMap = this._libraries.map\n    , name, component, library;\n  for (name in components) {\n    component = components[name];\n    library = librariesMap[name];\n    library && library.view._makeAll(component.templates, component.instances);\n  }\n}\n\nfunction findView(name, ns) {\n  var items = this._views\n    , item, i, segments, testNs;\n  name = name.toLowerCase();\n  if (ns) {\n    ns = ns.toLowerCase();\n    item = items[ns + ':' + name];\n    if (item) return item;\n\n    segments = ns.split(':');\n    for (i = segments.length; i-- > 1;) {\n      testNs = segments.slice(0, i).join(':');\n      item = items[testNs + ':' + name];\n      if (item) return item;\n    }\n  }\n  return items[name];\n}\n\nfunction find(name, ns, optional) {\n  var view = this._findView(name, ns);\n  if (view) return view;\n  if (optional) return empty;\n  if (ns) name = ns + ':' + name;\n  throw new Error(\"Can't find template: \\n  \" + name + '\\n\\n' +\n    'Available templates: \\n  ' + Object.keys(this._views).join('\\n  ')\n  );\n}\n\nfunction get(name, ns, ctx) {\n  if (typeof ns === 'object') {\n    ctx = ns;\n    ns = '';\n  }\n  ctx = ctx ? extend(ctx, defaultCtx) : Object.create(defaultCtx);\n  var app = Object.create(this.app, {model: {value: this.model}});\n  ctx.$fnCtx = [app];\n  return this._find(name, ns)(ctx);\n}\n\nfunction fn(name, value) {\n  if (typeof name === 'object') {\n    for (var k in name) {\n      this.fn(k, name[k]);\n    }\n    return;\n  }\n  var get, set;\n  if (typeof value === 'object') {\n    get = value.get;\n    set = value.set;\n  } else {\n    get = value;\n  }\n  this.getFns[name] = get;\n  if (set) this.setFns[name] = set;\n}\n\nfunction emitRender(view, ns, ctx, name) {\n  if (view.isServer) return;\n  view.app.emit(name, ctx);\n  if (ns) view.app.emit(name + ':' + ns, ctx);\n}\nfunction beforeRender(model, ns, ctx) {\n  ctx = (ctx && Object.create(ctx)) || {};\n  ctx.$ns = ns;\n  ctx.$isProduction = model.flags.isProduction;\n  emitRender(this, ns, ctx, 'pre:render');\n  return ctx;\n}\nfunction afterRender(ns, ctx) {\n  this.app.dom._preventUpdates = false;\n  this.app.dom._emitUpdate();\n  emitRender(this, ns, ctx, 'render');\n}\nfunction beforeRoute() {\n  this.app.dom._preventUpdates = true;\n  this.app.dom.clear();\n  resetModel(this.model, this._collectionWhitelist);\n  var lastRender = this._lastRender;\n  if (!lastRender) return;\n  emitRender(this, lastRender.ns, lastRender.ctx, 'replace');\n}\n\n// TODO: This is a super big hack. Subscriptions should automatically clean up.\n// When called with an array of collection names, data not in a whitelisted collection\n// or a query to a whitelisted collection will be wiped before every route\nfunction whitelistCollections(names) {\n  if (!names) delete this._collectionWhitelist;\n  var whitelist = {'_$queries': true}\n    , i\n  for (i = names.length; i--;) {\n    whitelist[names[i]] = true;\n  }\n  this._collectionWhitelist = whitelist;\n}\nfunction resetModel(model, collectionWhitelist) {\n  if (collectionWhitelist) {\n    var world = model._memory._data.world\n      , queries = world._$queries\n      , key, collection\n    var subs = model._subs();\n    model.unsubscribe.apply(model, subs);\n    for (key in world) {\n      if (collectionWhitelist[key]) continue;\n      delete world[key];\n    }\n    for (key in queries) {\n      collection = queries[key] && queries[key].ns\n      if (collectionWhitelist[collection]) continue;\n      delete queries[key];\n    }\n    model._specCache.invalidate();\n    model.emit('removeModelListeners');\n  }\n  model.emit('cleanup');\n}\n\nfunction render(model, ns, ctx, renderHash) {\n  if (typeof ns === 'object') {\n    rendered = ctx;\n    ctx = ns;\n    ns = '';\n  }\n  this.model = model;\n\n  if (!renderHash) ctx = this._beforeRender(model, ns, ctx);\n  this._lastRender = {\n    ns: ns\n  , ctx: ctx\n  };\n\n  this._resetForRender();\n  model.__pathMap.clear();\n  model.__events.clear();\n  model.__blockPaths = {};\n  model.silent().del('_$component');\n\n  var title = this.get('title$s', ns, ctx)\n    , rootHtml = this.get('root', ns, ctx)\n    , bodyHtml = this.get('header', ns, ctx) +\n        this.get('body', ns, ctx) +\n        this.get('footer', ns, ctx)\n    , doc = window.document\n    , err\n\n  if (!model.flags.isProduction && renderHash) {\n    // Check hashes in development to help find rendering bugs\n    if (renderHash === md5(bodyHtml)) return;\n    err = new Error('Server and client page renders do not match');\n    setTimeout(function() {\n      throw err;\n    }, 0);\n  } else if (renderHash) {\n    // Don't finish rendering client side on the very first load\n    return;\n  }\n\n  var documentElement = doc.documentElement\n    , attrs = documentElement.attributes\n    , i, attr, fakeRoot, body;\n\n  // Remove all current attributes on the documentElement and replace\n  // them with the attributes in the rendered rootHtml\n  for (i = attrs.length; i--;) {\n    attr = attrs[i];\n    documentElement.removeAttribute(attr.name);\n  }\n  // Using the DOM to get the attributes on an <html> tag would require\n  // some sort of iframe hack until DOMParser has better browser support.\n  // String parsing the html should be simpler and more efficient\n  parseHtml(rootHtml, {\n    start: function(tag, tagName, attrs) {\n      if (tagName !== 'html') return;\n      for (var attr in attrs) {\n        documentElement.setAttribute(attr, attrs[attr]);\n      }\n    }\n  });\n\n  fakeRoot = doc.createElement('html');\n  fakeRoot.innerHTML = bodyHtml;\n  body = fakeRoot.getElementsByTagName('body')[0];\n  documentElement.replaceChild(body, doc.body);\n  doc.title = title;\n\n  this._afterRender(ns, ctx);\n}\n\n\nfunction extend(parent, obj) {\n  var out = Object.create(parent)\n    , key;\n  if (typeof obj !== 'object' || Array.isArray(obj)) {\n    return out;\n  }\n  for (key in obj) {\n    out[key] = obj[key];\n  }\n  return out;\n}\n\nfunction modelListener(params, triggerId, blockPaths, pathId, partial, ctx) {\n  var listener = typeof params === 'function'\n    ? params(triggerId, blockPaths, pathId)\n    : params;\n  listener.partial = partial;\n  listener.ctx = ctx.$stringCtx || ctx;\n  return listener;\n}\n\nfunction bindEvents(events, name, partial, params) {\n  if (~name.indexOf('(')) {\n    var args = pathFnArgs(name);\n    if (!args.length) return;\n    events.push(function(ctx, modelEvents, dom, pathMap, view, blockPaths, triggerId) {\n      var listener = modelListener(params, triggerId, blockPaths, null, partial, ctx)\n        , path, pathId, i;\n      listener.getValue = function(model, triggerPath) {\n        patchCtx(ctx, triggerPath);\n        return dataValue(view, ctx, model, name);\n      }\n      for (i = args.length; i--;) {\n        path = ctxPath(view, ctx, args[i]);\n        pathId = pathMap.id(path + '*');\n\n        modelEvents.ids[path] = listener[0];\n        modelEvents.bind(pathId, listener);\n      }\n    });\n    return;\n  }\n\n  var match = /(\\.*)(.*)/.exec(name)\n    , prefix = match[1] || ''\n    , relativeName = match[2] || ''\n    , segments = relativeName.split('.')\n    , bindName, i;\n  for (i = segments.length; i; i--) {\n    bindName = prefix + segments.slice(0, i).join('.');\n    (function(bindName) {\n      events.push(function(ctx, modelEvents, dom, pathMap, view, blockPaths, triggerId) {\n        var path = ctxPath(view, ctx, name)\n          , listener, pathId;\n        if (!path) return;\n        pathId = pathMap.id(path);\n        listener = modelListener(params, triggerId, blockPaths, pathId, partial, ctx);\n        if (name !== bindName) {\n          path = ctxPath(view, ctx, bindName);\n          pathId = pathMap.id(path);\n          listener.getValue = function(model, triggerPath) {\n            patchCtx(ctx, triggerPath);\n            return dataValue(view, ctx, model, name);\n          };\n        }\n\n        modelEvents.ids[path] = listener[0];\n        modelEvents.bind(pathId, listener);\n      });\n    })(bindName);\n  }\n}\n\nfunction bindEventsById(events, name, partial, attrs, method, prop, blockType) {\n  function params(triggerId, blockPaths, pathId) {\n    var id = attrs._id || attrs.id;\n    if (blockType && pathId) {\n      blockPaths[id] = {id: pathId, type: blockType};\n    }\n    return [id, method, prop];\n  }\n  bindEvents(events, name, partial, params);\n}\n\nfunction bindEventsByIdString(events, name, partial, attrs, method, prop) {\n  function params(triggerId) {\n    var id = triggerId || attrs._id || attrs.id;\n    return [id, method, prop];\n  }\n  bindEvents(events, name, partial, params);\n}\n\nfunction addId(view, attrs) {\n  if (attrs.id == null) {\n    attrs.id = function() {\n      return attrs._id = view._uniqueId();\n    };\n  }\n}\n\nfunction pushValue(html, i, value, isAttr, isId) {\n  if (typeof value === 'function') {\n    var fn = isId ? function(ctx, model) {\n      var id = value(ctx, model);\n      html.ids[id] = i + 1;\n      return id;\n    } : value;\n    i = html.push(fn, '') - 1;\n  } else {\n    if (isId) html.ids[value] = i + 1;\n    html[i] += isAttr ? escapeAttribute(value) : value;\n  }\n  return i;\n}\n\nfunction reduceStack(stack) {\n  var html = ['']\n    , i = 0\n    , attrs, bool, item, key, value, j, len;\n\n  html.ids = {};\n\n  for (j = 0, len = stack.length; j < len; j++) {\n    item = stack[j];\n    switch (item[0]) {\n      case 'start':\n        html[i] += '<' + item[1];\n        attrs = item[2];\n        // Make sure that the id attribute is rendered first\n        if ('id' in attrs) {\n          html[i] += ' id=';\n          i = pushValue(html, i, attrs.id, true, true);\n        }\n        for (key in attrs) {\n          if (key === 'id') continue;\n          value = attrs[key];\n          if (value != null) {\n            if (bool = value.bool) {\n              i = pushValue(html, i, bool);\n              continue;\n            }\n            html[i] += ' ' + key + '=';\n            i = pushValue(html, i, value, true);\n          } else {\n            html[i] += ' ' + key;\n          }\n        }\n        html[i] += '>';\n        break;\n      case 'text':\n        i = pushValue(html, i, item[1]);\n        break;\n      case 'end':\n        html[i] += '</' + item[1] + '>';\n        break;\n      case 'marker':\n        html[i] += '<!--' + item[1];\n        i = pushValue(html, i, item[2].id, false, !item[1]);\n        html[i] += '-->';\n    }\n  }\n  return html;\n}\n\nfunction renderer(view, items, events, onRender) {\n  return function(ctx, model, triggerPath, triggerId) {\n    patchCtx(ctx, triggerPath);\n\n    if (!model) model = view.model;  // Needed, since model parameter is optional\n    var pathMap = model.__pathMap\n      , modelEvents = model.__events\n      , blockPaths = model.__blockPaths\n      , idIndices = items.ids\n      , dom = global.DERBY && global.DERBY.app.dom\n      , html = []\n      , mutated = []\n      , onMutator, i, len, item, event, pathIds, id, index;\n\n    if (onRender) ctx = onRender(ctx);\n\n    onMutator = model.on('mutator', function(method, args) {\n      mutated.push(args[0][0])\n    });\n\n    for (i = 0, len = items.length; i < len; i++) {\n      item = items[i];\n      html[i] = (typeof item === 'function') ? item(ctx, model) || '' : item;\n    }\n\n    model.removeListener('mutator', onMutator)\n    pathIds = modelEvents.ids = {}\n\n    for (i = 0; event = events[i++];) {\n      event(ctx, modelEvents, dom, pathMap, view, blockPaths, triggerId);\n    }\n\n    // This detects when an already rendered bound value was later updated\n    // while rendering the rest of the template. This can happen when performing\n    // component initialization code.\n    // TODO: This requires creating a whole bunch of extra objects every time\n    // things are rendered. Should probably be refactored in a less hacky manner.\n    for (i = 0, len = mutated.length; i < len; i++) {\n      (id = pathIds[mutated[i]]) &&\n      (index = idIndices[id]) &&\n      (html[index] = items[index](ctx, model) || '')\n    }\n\n    return html.join('');\n  }\n}\n\nfunction bindComponentEvent(component, name, listener) {\n  if (name === 'init' || name === 'create') {\n    component.once(name, listener.fn);\n  } else {\n    // Extra indirection allows listener to overwrite itself after first run\n    component.on(name, function() {\n      listener.fn.apply(null, arguments);\n    });\n  }\n}\nfunction bindComponentEvents(ctx, component, events) {\n  var view = events.$view\n    , items = events.$events\n    , listenerCtx = Object.create(ctx)\n    , i, item, name, listener\n  // The fnCtx will include this component, but we want to emit\n  // on the parent component or app\n  listenerCtx.$fnCtx = listenerCtx.$fnCtx.slice(0, -1);\n  for (i = items.length; i--;) {\n    item = items[i];\n    name = item[0];\n    listener = fnListener(view, listenerCtx, item[2]);\n    bindComponentEvent(component, name, listener);\n  }\n}\n\nfunction createComponent(view, model, Component, scope, ctx, macroCtx) {\n  var scoped = model.at(scope)\n    , marker = '<!--' + scope + '-->'\n    , prefix = scope + '.'\n    , component = new Component(scoped, scope)\n    , parentFnCtx = model.__fnCtx || ctx.$fnCtx\n    , silentCtx = Object.create(ctx, {$silent: {value: true}})\n    , silentModel = model.silent()\n    , i, key, path, value, instanceName, instances\n\n  ctx.$fnCtx = model.__fnCtx = parentFnCtx.concat(component);\n\n  for (key in macroCtx) {\n    value = macroCtx[key];\n    if (key === 'bind') {\n      bindComponentEvents(ctx, component, value);\n      continue;\n    }\n    if (value && value.$matchName) {\n      path = ctxPath(view, ctx, value.$matchName);\n      if (value.$bound) {\n        silentModel.ref(prefix + key, path, null, true);\n        continue;\n      }\n      value = dataValue(view, ctx, model, path);\n      silentModel.set(prefix + key, value);\n      continue;\n    }\n    // TODO: figure out how to render when needed in component script\n    if (typeof value === 'function') {\n      try {\n        value = value(silentCtx, model);\n      } catch (err) {\n        continue;\n      }\n    }\n    silentModel.set(prefix + key, value);\n  }\n\n  instanceName = scoped.get('name');\n  if (instanceName) {\n    instances = view._componentInstances[instanceName] ||\n      (view._componentInstances[instanceName] = []);\n    instances.push(component);\n  }\n\n  if (component.init) component.init(scoped);\n\n  var parent = true\n    , fnCtx, type\n  for (i = parentFnCtx.length; fnCtx = parentFnCtx[--i];) {\n    type = Component.type(fnCtx.view);\n    if (parent) {\n      parent = false;\n      fnCtx.emit('init:child', component, type);\n    }\n    fnCtx.emit('init:descendant', component, type);\n  }\n  component.emit('init', component);\n\n  if (view.isServer || ctx.$silent) return marker;\n\n  var app = global.DERBY && global.DERBY.app\n    , dom = app.dom\n  component.dom = dom;\n  component.history = app.history;\n\n  dom.nextUpdate(function() {\n    // Correct for when components get created multiple times\n    // during rendering\n    if (!dom.marker(scope)) return component.emit('destroy');\n\n    dom.addComponent(ctx, component);\n    if (component.create) component.create(scoped, component.dom);\n\n    var parent = true\n      , fnCtx, type\n    for (i = parentFnCtx.length; fnCtx = parentFnCtx[--i];) {\n      type = Component.type(fnCtx.view);\n      if (parent) {\n        parent = false;\n        fnCtx.emit('create:child', component, type);\n      }\n      fnCtx.emit('create:descendant', component, type);\n    }\n    component.emit('create', component);\n  });\n\n  return marker;\n}\n\nfunction extendCtx(view, ctx, value, name, alias, index, isArray) {\n  var path = ctxPath(view, ctx, name, true)\n    , aliases;\n  ctx = extend(ctx, value);\n  ctx['this'] = value;\n  if (alias) {\n    aliases = ctx.$aliases = Object.create(ctx.$aliases);\n    aliases[alias] = ctx.$paths.length;\n  }\n  if (path) {\n    ctx.$paths = [[path, ctx.$indices.length]].concat(ctx.$paths);\n  }\n  if (index != null) {\n    ctx.$indices = [index].concat(ctx.$indices);\n    ctx.$index = index;\n    isArray = true;\n  }\n  if (isArray && ctx.$paths[0][0]) {\n    ctx.$paths[0][0] += '.$#';\n  }\n  return ctx;\n}\n\nfunction partialValue(view, ctx, model, name, value, listener) {\n  if (listener) return value;\n  return name ? dataValue(view, ctx, model, name) : true;\n}\n\nfunction partialFn(view, name, type, alias, render, ns, macroCtx) {\n  function partialBlock (ctx, model, triggerPath, triggerId, value, index, listener) {\n    // Inherit & render attribute context values\n    var renderMacroCtx = {}\n      , parentMacroCtx = ctx.$macroCtx\n      , mergedMacroCtx = macroCtx\n      , key, val, matchName\n    if (macroCtx.inherit) {\n      mergedMacroCtx = {};\n      merge(mergedMacroCtx, parentMacroCtx);\n      merge(mergedMacroCtx, macroCtx);\n      delete mergedMacroCtx.inherit;\n    }\n    for (key in mergedMacroCtx) {\n      val = mergedMacroCtx[key];\n      if (val && val.$matchName) {\n        matchName = ctxPath(view, ctx, val.$matchName);\n        if (matchName.charAt(0) === '@') {\n          val = dataValue(view, ctx, model, matchName);\n        } else {\n          val = Object.create(val);\n          val.$matchName = matchName;\n        }\n      }\n      renderMacroCtx[key] = val;\n    }\n\n    // Find the appropriate partial template\n    var partialNs, partialName, partialOptional, arr;\n    if (name === 'derby:view') {\n      partialNs = mergedMacroCtx.ns || view._selfNs;\n      partialName = mergedMacroCtx.view;\n      partialOptional = mergedMacroCtx.optional;\n      if (!partialName) throw new Error('<derby:view> tag without a \"view\" attribute')\n      if (partialNs.$matchName) {\n        partialNs = dataValue(view, ctx, model, partialNs.$matchName);\n      }\n      if (partialName.$matchName) {\n        partialName = dataValue(view, ctx, model, partialName.$matchName);\n      }\n    } else {\n      arr = splitPartial(name);\n      partialNs = arr[0];\n      partialName = arr[1];\n    }\n    // This can happen when using <derby:view view={{...}}>\n    if (typeof partialName === 'function') {\n      partialName = partialName(Object.create(ctx), model, triggerPath);\n    }\n    var partialView = nsView(view, partialNs)\n      , render = partialView._find(partialName, ns, partialOptional)\n      , Component = partialView._componentConstructor(partialName)\n      , renderCtx, scope, out, marker\n\n    // Prepare the context for rendering\n    if (Component) {\n      scope = '_$component.' + view._uniqueId();\n      renderCtx = extendCtx(view, ctx, null, scope, 'self', null, false);\n      renderCtx.$elements = {};\n      marker = createComponent(view, model, Component, scope, renderCtx, renderMacroCtx);\n    } else {\n      renderCtx = Object.create(ctx);\n    }\n    renderCtx.$macroCtx = renderMacroCtx;\n\n    out = render(renderCtx, model, triggerPath);\n    if (Component) {\n      model.__fnCtx = model.__fnCtx.slice(0, -1);\n      out = marker + out;\n    }\n    return out;\n  }\n\n  function withBlock(ctx, model, triggerPath, triggerId, value, index, listener) {\n    value = partialValue(view, ctx, model, name, value, listener);\n    return conditionalRender(ctx, model, triggerPath, value, index, true);\n  }\n\n  function ifBlock(ctx, model, triggerPath, triggerId, value, index, listener) {\n    value = partialValue(view, ctx, model, name, value, listener);\n    var condition = !!(Array.isArray(value) ? value.length : value);\n    return conditionalRender(ctx, model, triggerPath, value, index, condition);\n  }\n\n  function unlessBlock(ctx, model, triggerPath, triggerId, value, index, listener) {\n    value = partialValue(view, ctx, model, name, value, listener);\n    var condition = !(Array.isArray(value) ? value.length : value);\n    return conditionalRender(ctx, model, triggerPath, value, index, condition);\n  }\n\n  function eachBlock(ctx, model, triggerPath, triggerId, value, index, listener) {\n    var indices, isArray, item, out, renderCtx, i, len;\n    value = partialValue(view, ctx, model, name, value, listener);\n    isArray = Array.isArray(value);\n\n    if (listener && !isArray) {\n      return withBlock (ctx, model, triggerPath, triggerId, value, index, true);\n    }\n\n    if (!isArray || !value.length) return;\n\n    ctx = extendCtx(view, ctx, null, name, alias, null, true);\n\n    out = '';\n    indices = ctx.$indices;\n    for (i = 0, len = value.length; i < len; i++) {\n      item = value[i];\n      renderCtx = extend(ctx, item);\n      renderCtx['this'] = item;\n      renderCtx.$indices = [i].concat(indices);\n      renderCtx.$index = i;\n      out += render(renderCtx, model, triggerPath);\n    }\n    return out;\n  }\n\n  function conditionalRender(ctx, model, triggerPath, value, index, condition) {\n    if (!condition) return;\n    var renderCtx = extendCtx(view, ctx, value, name, alias, index, false);\n    return render(renderCtx, model, triggerPath);\n  }\n\n  var block =\n      (type === 'partial') ? partialBlock\n    : (type === 'with' || type === 'else') ? withBlock\n    : (type === 'if' || type === 'else if') ? ifBlock\n    : (type === 'unless') ? unlessBlock\n    : (type === 'each') ? eachBlock\n    : null\n\n  if (!block) throw new Error('Unknown block type: ' + type);\n  block.type = type;\n  return block;\n}\n\nvar objectToString = Object.prototype.toString;\nvar arrayToString = Array.prototype.toString;\n\nfunction valueBinding(value) {\n  return value == null ? '' :\n    (value.toString === objectToString || value.toString === arrayToString) ?\n    JSON.stringify(value) : value;\n}\n\nfunction valueText(value) {\n  return valueBinding(value).toString();\n}\n\nfunction textFn(view, name, escape, force) {\n  var filter = escape ? function(value) {\n    return escape(valueText(value));\n  } : valueText;\n  return function(ctx, model) {\n    return dataValue(view, ctx, model, name, filter, force);\n  }\n}\n\nfunction sectionFn(view, queue) {\n  var render = renderer(view, reduceStack(queue.stack), queue.events)\n    , block = queue.block\n    , type = block.type\n    , out = partialFn(view, block.name, type, block.alias, render)\n  return out;\n}\n\nfunction blockFn(view, sections) {\n  var len = sections.length;\n  if (!len) return;\n  if (len === 1) {\n    return sectionFn(view, sections[0]);\n\n  } else {\n    var fns = []\n      , i, out;\n    for (i = 0; i < len; i++) {\n      fns.push(sectionFn(view, sections[i]));\n    }\n    out = function(ctx, model, triggerPath, triggerId, value, index, listener) {\n      var out;\n      for (i = 0; i < len; i++) {\n        out = fns[i](ctx, model, triggerPath, triggerId, value, index, listener);\n        if (out != null) return out;\n      }\n    }\n    return out;\n  }\n}\n\nfunction parseMarkup(type, attr, tagName, events, attrs, value) {\n  var parser = markup[type][attr]\n    , anyOut, anyParser, elOut, elParser, out;\n  if (!parser) return;\n  if (anyParser = parser['*']) {\n    anyOut = anyParser(events, attrs, value);\n  }\n  if (elParser = parser[tagName]) {\n    elOut = elParser(events, attrs, value);\n  }\n  out = anyOut ? extend(anyOut, elOut) : elOut;\n  if (out && out.del) delete attrs[attr];\n  return out;\n}\n\nfunction pushText(stack, text) {\n  if (text) stack.push(['text', text]);\n}\n\nfunction pushVarFn(view, stack, fn, name, escapeFn) {\n  if (fn) {\n    pushText(stack, fn);\n  } else {\n    pushText(stack, textFn(view, name, escapeFn));\n  }\n}\n\nfunction isPartial(view, tagName) {\n  if (tagName === 'derby:view') return true;\n  var tagNs = splitPartial(tagName)[0];\n  return (tagNs === view._selfNs || !!view._libraries.map[tagNs]);\n}\n\nfunction isPartialSection(tagName) {\n  return tagName.charAt(0) === '@';\n}\n\nfunction partialSectionName(tagName) {\n  return isPartialSection(tagName) ? tagName.slice(1) : null;\n}\n\nfunction nsView(view, ns) {\n  if (ns === view._selfNs) return view;\n  var partialView = view._libraries.map[ns].view;\n  partialView._uniqueId = function() {\n    return view._uniqueId();\n  };\n  partialView.model = view.model;\n  return partialView;\n}\n\nfunction splitPartial(partial) {\n  var i = partial.indexOf(':')\n    , partialNs = partial.slice(0, i)\n    , partialName = partial.slice(i + 1)\n  return [partialNs, partialName];\n}\n\nfunction findComponent(view, partial, ns) {\n  var arr = splitPartial(partial)\n    , partialNs = arr[0]\n    , partialName = arr[1]\n    , partialView = nsView(view, partialNs)\n  return partialView._find(partialName, ns);\n}\n\nfunction isVoidComponent(view, partial, ns) {\n  if (partial === 'derby:view') return true;\n  return !findComponent(view, partial, ns).nonvoid;\n}\n\nfunction pushVar(view, ns, stack, events, remainder, match, fn) {\n  var name = match.name\n    , partial = match.partial\n    , escapeFn = match.escaped && escapeHtml\n    , attr, attrs, boundOut, last, tagName, wrap;\n\n  if (partial) {\n    fn = partialFn(view, partial, 'partial', null, null, ns, match.macroCtx);\n  }\n\n  else if (match.bound) {\n    last = lastItem(stack);\n    wrap = match.pre ||\n      !last ||\n      (last[0] !== 'start') ||\n      isVoid(tagName = last[1]) ||\n      wrapRemainder(tagName, remainder);\n\n    if (wrap) {\n      stack.push(['marker', '', attrs = {}]);\n    } else {\n      attrs = last[2];\n      for (attr in attrs) {\n        parseMarkup('boundParent', attr, tagName, events, attrs, match);\n      }\n      boundOut = parseMarkup('boundParent', '*', tagName, events, attrs, match);\n      if (boundOut) {\n        bindEventsById(events, name, null, attrs, boundOut.method, boundOut.property);\n      }\n    }\n    addId(view, attrs);\n\n    if (!boundOut) {\n      bindEventsById(events, name, fn, attrs, 'html', !fn && escapeFn, match.type);\n    }\n  }\n\n  pushVarFn(view, stack, fn, name, escapeFn);\n  if (wrap) {\n    stack.push([\n      'marker'\n    , '$'\n    , { id: function() { return attrs._id } }\n    ]);\n  }\n}\n\nfunction pushVarString(view, ns, stack, events, remainder, match, fn) {\n  var name = match.name\n    , escapeFn = !match.escaped && unescapeEntities;\n  function bindOnce(ctx) {\n    ctx.$onBind(events, name);\n    bindOnce = empty;\n  }\n  if (match.bound) {\n    events.push(function(ctx) {\n      bindOnce(ctx);\n    });\n  }\n  pushVarFn(view, stack, fn, name, escapeFn);\n}\n\nfunction parseMatchError(text, message) {\n  throw new Error(message + '\\n\\n' + text + '\\n');\n}\n\nfunction onBlock(start, end, block, queues, callbacks) {\n  var lastQueue, queue;\n  if (end) {\n    lastQueue = queues.pop();\n    queue = lastItem(queues);\n    queue.sections.push(lastQueue);\n  } else {\n    queue = lastItem(queues);\n  }\n\n  if (start) {\n    queue = {\n      stack: []\n    , events: []\n    , block: block\n    , sections: []\n    };\n    queues.push(queue);\n    callbacks.onStart(queue);\n  } else {\n    if (end) {\n      callbacks.onStart(queue);\n      callbacks.onEnd(queue.sections);\n      queue.sections = [];\n    } else {\n      callbacks.onContent(block);\n    }\n  }\n}\n\nfunction parseMatch(text, match, queues, callbacks) {\n  var hash = match.hash\n    , type = match.type\n    , name = match.name\n    , block = lastItem(queues).block\n    , blockType = block && block.type\n    , startBlock, endBlock;\n\n  if (type === 'if' || type === 'unless' || type === 'each' || type === 'with') {\n    if (hash === '#') {\n      startBlock = true;\n    } else if (hash === '/') {\n      endBlock = true;\n    } else {\n      parseMatchError(text, type + ' blocks must begin with a #');\n    }\n\n  } else if (type === 'else' || type === 'else if') {\n    if (hash) {\n      parseMatchError(text, type + ' blocks may not start with ' + hash);\n    }\n    if (blockType !== 'if' && blockType !== 'else if' &&\n        blockType !== 'unless' && blockType !== 'each') {\n      parseMatchError(text, type + ' may only follow `if`, `else if`, `unless`, or `each`');\n    }\n    startBlock = true;\n    endBlock = true;\n\n  } else if (hash === '/') {\n    endBlock = true;\n\n  } else if (hash === '#') {\n    parseMatchError(text, '# must be followed by `if`, `unless`, `each`, or `with`');\n  }\n\n  if (endBlock && !block) {\n    parseMatchError(text, 'Unmatched template end tag');\n  }\n\n  onBlock(startBlock, endBlock, match, queues, callbacks);\n}\n\nfunction parseAttr(view, viewName, events, tagName, attrs, attr) {\n  var value = attrs[attr];\n  if (typeof value === 'function') return;\n\n  var attrOut = parseMarkup('attr', attr, tagName, events, attrs, value) || {}\n    , boundOut, match, name, render, method, property;\n  if (attrOut.addId) addId(view, attrs);\n\n  if (match = extractPlaceholder(value)) {\n    name = match.name;\n\n    if (match.pre || match.post) {\n      // Attributes must be a single string, so create a string partial\n      addId(view, attrs);\n      render = parse(view, viewName, value, true, function(events, name) {\n        bindEventsByIdString(events, name, render, attrs, 'attr', attr);\n      });\n\n      attrs[attr] = attr === 'id' ? function(ctx, model) {\n        return attrs._id = escapeAttribute(render(ctx, model));\n      } : function(ctx, model) {\n        return escapeAttribute(render(ctx, model));\n      }\n      return;\n    }\n\n    if (match.bound) {\n      boundOut = parseMarkup('bound', attr, tagName, events, attrs, match) || {};\n      addId(view, attrs);\n      method = boundOut.method || 'attr';\n      property = boundOut.property || attr;\n      bindEventsById(events, name, null, attrs, method, property);\n    }\n\n    if (!attrOut.del) {\n      attrs[attr] = attrOut.bool ? {\n        bool: function(ctx, model) {\n          return (dataValue(view, ctx, model, name)) ? ' ' + attr : '';\n        }\n      } : textFn(view, name, escapeAttribute, true);\n    }\n  }\n}\n\nfunction parsePartialAttr(view, viewName, events, attrs, attr) {\n  var value = attrs[attr]\n    , match;\n\n  if (!value) {\n    // A true boolean attribute will have a value of null\n    if (value === null) attrs[attr] = true;\n    return;\n  }\n\n  if (attr === 'bind') {\n    attrs[attr] = {$events: splitEvents(value), $view: view};\n    return;\n  }\n\n  if (match = extractPlaceholder(value)) {\n    // This attribute needs to be treated as a section\n    if (match.pre || match.post) return true;\n\n    attrs[attr] = {$matchName: match.name, $bound: match.bound};\n\n  } else if (value === 'true') {\n    attrs[attr] = true;\n  } else if (value === 'false') {\n    attrs[attr] = false;\n  } else if (value === 'null') {\n    attrs[attr] = null;\n  } else if (!isNaN(value)) {\n    attrs[attr] = +value;\n  } else if (/^[{[]/.test(value)) {\n    try {\n      attrs[attr] = JSON.parse(value)\n    } catch (err) {}\n  }\n}\n\nfunction lastItem(arr) {\n  return arr[arr.length - 1];\n}\n\nfunction parse(view, viewName, template, isString, onBind, noMinify) {\n  var queues, stack, events, onRender, push;\n\n  queues = [{\n    stack: stack = []\n  , events: events = []\n  , sections: []\n  }];\n\n  function onStart(queue) {\n    stack = queue.stack;\n    events = queue.events;\n  }\n\n  if (isString) {\n    push = pushVarString;\n    onRender = function(ctx) {\n      if (ctx.$stringCtx) return ctx;\n      ctx = Object.create(ctx);\n      ctx.$onBind = onBind;\n      ctx.$stringCtx = ctx;\n      return ctx;\n    }\n  } else {\n    push = pushVar;\n  }\n\n  var index = viewName.lastIndexOf(':')\n    , ns = ~index ? viewName.slice(0, index) : ''\n\n  function parseStart(tag, tagName, attrs) {\n    var attr, block, out, parser, isSection, attrBlock\n    if ('x-no-minify' in attrs) {\n      delete attrs['x-no-minify'];\n      noMinify = true;\n    }\n\n    if (isPartial(view, tagName)) {\n      block = {\n        partial: tagName\n      , macroCtx: attrs\n      };\n      onBlock(true, false, block, queues, {onStart: onStart});\n\n      for (attr in attrs) {\n        isSection = parsePartialAttr(view, viewName, events, attrs, attr);\n        if (!isSection) continue;\n        attrBlock = {\n          partial: '@' + attr\n        , macroCtx: lastItem(queues).block.macroCtx\n        };\n        onBlock(true, false, attrBlock, queues, {onStart: onStart});\n        parseText(attrs[attr]);\n        parseEnd(tag, '@' + attr);\n      }\n\n      if (isVoidComponent(view, tagName, ns)) {\n        onBlock(false, true, null, queues, {\n          onStart: onStart\n        , onEnd: function(queues) {\n            push(view, ns, stack, events, '', block);\n          }\n        })\n      }\n      return;\n    }\n\n    if (isPartialSection(tagName)) {\n      block = {\n        partial: tagName\n      , macroCtx: lastItem(queues).block.macroCtx\n      };\n      onBlock(true, false, block, queues, {onStart: onStart});\n      return;\n    }\n\n    if (parser = markup.element[tagName]) {\n      out = parser(events, attrs);\n      if (out != null ? out.addId : void 0) {\n        addId(view, attrs);\n      }\n    }\n\n    for (attr in attrs) {\n      parseAttr(view, viewName, events, tagName, attrs, attr);\n    }\n    stack.push(['start', tagName, attrs]);\n  }\n\n  function parseText(text, isRawText, remainder) {\n    var match = extractPlaceholder(text)\n      , post, pre;\n    if (!match || isRawText) {\n      if (!noMinify) {\n        text = isString ? unescapeEntities(trimLeading(text)) : trimLeading(text);\n      }\n      pushText(stack, text);\n      return;\n    }\n\n    pre = match.pre;\n    post = match.post;\n    if (isString) pre = unescapeEntities(pre);\n    pushText(stack, pre);\n    remainder = post || remainder;\n\n    parseMatch(text, match, queues, {\n      onStart: onStart\n    , onEnd: function(sections) {\n        var fn = blockFn(view, sections);\n        push(view, ns, stack, events, remainder, sections[0].block, fn);\n      }\n    , onContent: function(match) {\n        push(view, ns, stack, events, remainder, match);\n      }\n    });\n\n    if (post) return parseText(post);\n  }\n\n  function parseEnd(tag, tagName) {\n    var sectionName = partialSectionName(tagName)\n      , endsPartial = isPartial(view, tagName)\n    if (endsPartial && isVoidComponent(view, tagName, ns)) {\n      throw new Error('End tag \"' + tag + '\" is not allowed for void component')\n    }\n    if (sectionName || endsPartial) {\n      onBlock(false, true, null, queues, {\n        onStart: onStart\n      , onEnd: function(queues) {\n          var queue = queues[0]\n            , block = queue.block\n            , fn = renderer(view, reduceStack(queue.stack), queue.events)\n          fn.unescaped = true;\n          if (sectionName) {\n            block.macroCtx[sectionName] = fn;\n            return;\n          }\n          // Put the remaining content not in a section in the default \"content\" section,\n          // unless \"inherit\" is specified and there is no content, so that the parent\n          // content can be inherited\n          if (queue.stack.length || !block.macroCtx.inherit) {\n            block.macroCtx.content = fn;\n          }\n          push(view, ns, stack, events, '', block);\n        }\n      })\n      return;\n    }\n    stack.push(['end', tagName]);\n  }\n\n  if (isString) {\n    parseText(template);\n  } else {\n    parseHtml(template, {\n      start: parseStart\n    , text: parseText\n    , end: parseEnd\n    , comment: function(tag) {\n        if (conditionalComment(tag)) pushText(stack, tag);\n      }\n    , other: function(tag) {\n        pushText(stack, tag);\n      }\n    });\n  }\n  return renderer(view, reduceStack(stack), events, onRender);\n}\n\n//@ sourceURL=/node_modules/derby/lib/View.js"
));

require.define("/node_modules/derby/node_modules/html-util/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./lib/index.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/html-util/package.json"
));

require.define("/node_modules/derby/node_modules/html-util/lib/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var entityCode = require('./entityCode')\n  , parse = require('./parse')\n\nmodule.exports = {\n  parse: parse\n, escapeHtml: escapeHtml\n, escapeAttribute: escapeAttribute\n, unescapeEntities: unescapeEntities\n, isVoid: isVoid\n, conditionalComment: conditionalComment\n, trimLeading: trimLeading\n, trimTag: trimTag\n, minify: minify\n}\n\nfunction escapeHtml(value) {\n  if (value == null) return ''\n\n  return value\n    .toString()\n    .replace(/&(?!\\s)|</g, function(match) {\n      return match === '&' ? '&amp;' : '&lt;'\n    })\n}\n\nfunction escapeAttribute(value) {\n  if (value == null || value === '') return '\"\"'\n\n  value = value\n    .toString()\n    .replace(/&(?!\\s)|\"/g, function(match) {\n      return match === '&' ? '&amp;' : '&quot;'\n    })\n  return /[ =<>']/.test(value) ? '\"' + value + '\"' : value\n}\n\n// Based on:\n// http://code.google.com/p/jslibs/wiki/JavascriptTips#Escape_and_unescape_HTML_entities\nfunction unescapeEntities(html) {\n  return html.replace(/&([^;]+);/g, function(match, entity) {\n    var charCode = entity.charAt(0) === '#'\n          ? entity.charAt(1) === 'x'\n            ? entity.slice(2, 17)\n            : entity.slice(1)\n          : entityCode[entity]\n    return String.fromCharCode(charCode)\n  })\n}\n\nvar voidElement = {\n  area: 1\n, base: 1\n, br: 1\n, col: 1\n, command: 1\n, embed: 1\n, hr: 1\n, img: 1\n, input: 1\n, keygen: 1\n, link: 1\n, meta: 1\n, param: 1\n, source: 1\n, track: 1\n, wbr: 1\n}\nfunction isVoid(name) {\n  return name in voidElement\n}\n\n// Assume any HTML comment that starts with `<!--[` or ends with `]-->`\n// is a conditional comment. This can also be used to keep comments in\n// minified HTML, such as `<!--[ Copyright John Doe, MIT Licensed ]-->`\nfunction conditionalComment(tag) {\n  return /(?:^<!--\\[)|(?:\\]-->$)/.test(tag)\n}\n\n// Remove leading whitespace and newlines from a string. Note that trailing\n// whitespace is not removed in case whitespace is desired between lines\nfunction trimLeading(text) {\n  return text ? text.replace(/\\n\\s*/g, '') : ''\n}\n\n// Within a tag, remove leading whitespace. Keep a linebreak, since this\n// could be the separator between attributes\nfunction trimTag(tag) {\n  return tag.replace(/(?:\\n\\s*)+/g, '\\n')\n}\n\n// Remove linebreaks, leading space, and comments. Maintain a linebreak between\n// HTML tag attributes and maintain conditional comments.\nfunction minify(html) {\n  var minified = ''\n    , minifyContent = true\n\n  parse(html, {\n    start: function(tag, tagName, attrs) {\n      minifyContent = !('x-no-minify' in attrs)\n      minified += trimTag(tag)\n    }\n  , end: function(tag) {\n      minified += trimTag(tag)\n    }\n  , text: function(text) {\n      minified += minifyContent ? trimLeading(text) : text\n    }\n  , comment: function(tag) {\n      if (conditionalComment(tag)) minified += tag\n    }\n  , other: function(tag) {\n      minified += tag\n    }\n  })\n  return minified\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/html-util/lib/index.js"
));

require.define("/node_modules/derby/node_modules/html-util/lib/entityCode.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  quot: 0x0022\n, amp: 0x0026\n, apos: 0x0027\n, lpar: 0x0028\n, rpar: 0x0029\n, lt: 0x003C\n, gt: 0x003E\n, nbsp: 0x00A0\n, iexcl: 0x00A1\n, cent: 0x00A2\n, pound: 0x00A3\n, curren: 0x00A4\n, yen: 0x00A5\n, brvbar: 0x00A6\n, sect: 0x00A7\n, uml: 0x00A8\n, copy: 0x00A9\n, ordf: 0x00AA\n, laquo: 0x00AB\n, not: 0x00AC\n, shy: 0x00AD\n, reg: 0x00AE\n, macr: 0x00AF\n, deg: 0x00B0\n, plusmn: 0x00B1\n, sup2: 0x00B2\n, sup3: 0x00B3\n, acute: 0x00B4\n, micro: 0x00B5\n, para: 0x00B6\n, middot: 0x00B7\n, cedil: 0x00B8\n, sup1: 0x00B9\n, ordm: 0x00BA\n, raquo: 0x00BB\n, frac14: 0x00BC\n, frac12: 0x00BD\n, frac34: 0x00BE\n, iquest: 0x00BF\n, Agrave: 0x00C0\n, Aacute: 0x00C1\n, Acirc: 0x00C2\n, Atilde: 0x00C3\n, Auml: 0x00C4\n, Aring: 0x00C5\n, AElig: 0x00C6\n, Ccedil: 0x00C7\n, Egrave: 0x00C8\n, Eacute: 0x00C9\n, Ecirc: 0x00CA\n, Euml: 0x00CB\n, Igrave: 0x00CC\n, Iacute: 0x00CD\n, Icirc: 0x00CE\n, Iuml: 0x00CF\n, ETH: 0x00D0\n, Ntilde: 0x00D1\n, Ograve: 0x00D2\n, Oacute: 0x00D3\n, Ocirc: 0x00D4\n, Otilde: 0x00D5\n, Ouml: 0x00D6\n, times: 0x00D7\n, Oslash: 0x00D8\n, Ugrave: 0x00D9\n, Uacute: 0x00DA\n, Ucirc: 0x00DB\n, Uuml: 0x00DC\n, Yacute: 0x00DD\n, THORN: 0x00DE\n, szlig: 0x00DF\n, agrave: 0x00E0\n, aacute: 0x00E1\n, acirc: 0x00E2\n, atilde: 0x00E3\n, auml: 0x00E4\n, aring: 0x00E5\n, aelig: 0x00E6\n, ccedil: 0x00E7\n, egrave: 0x00E8\n, eacute: 0x00E9\n, ecirc: 0x00EA\n, euml: 0x00EB\n, igrave: 0x00EC\n, iacute: 0x00ED\n, icirc: 0x00EE\n, iuml: 0x00EF\n, eth: 0x00F0\n, ntilde: 0x00F1\n, ograve: 0x00F2\n, oacute: 0x00F3\n, ocirc: 0x00F4\n, otilde: 0x00F5\n, ouml: 0x00F6\n, divide: 0x00F7\n, oslash: 0x00F8\n, ugrave: 0x00F9\n, uacute: 0x00FA\n, ucirc: 0x00FB\n, uuml: 0x00FC\n, yacute: 0x00FD\n, thorn: 0x00FE\n, yuml: 0x00FF\n, OElig: 0x0152\n, oelig: 0x0153\n, Scaron: 0x0160\n, scaron: 0x0161\n, Yuml: 0x0178\n, fnof: 0x0192\n, circ: 0x02C6\n, tilde: 0x02DC\n, Alpha: 0x0391\n, Beta: 0x0392\n, Gamma: 0x0393\n, Delta: 0x0394\n, Epsilon: 0x0395\n, Zeta: 0x0396\n, Eta: 0x0397\n, Theta: 0x0398\n, Iota: 0x0399\n, Kappa: 0x039A\n, Lambda: 0x039B\n, Mu: 0x039C\n, Nu: 0x039D\n, Xi: 0x039E\n, Omicron: 0x039F\n, Pi: 0x03A0\n, Rho: 0x03A1\n, Sigma: 0x03A3\n, Tau: 0x03A4\n, Upsilon: 0x03A5\n, Phi: 0x03A6\n, Chi: 0x03A7\n, Psi: 0x03A8\n, Omega: 0x03A9\n, alpha: 0x03B1\n, beta: 0x03B2\n, gamma: 0x03B3\n, delta: 0x03B4\n, epsilon: 0x03B5\n, zeta: 0x03B6\n, eta: 0x03B7\n, theta: 0x03B8\n, iota: 0x03B9\n, kappa: 0x03BA\n, lambda: 0x03BB\n, mu: 0x03BC\n, nu: 0x03BD\n, xi: 0x03BE\n, omicron: 0x03BF\n, pi: 0x03C0\n, rho: 0x03C1\n, sigmaf: 0x03C2\n, sigma: 0x03C3\n, tau: 0x03C4\n, upsilon: 0x03C5\n, phi: 0x03C6\n, chi: 0x03C7\n, psi: 0x03C8\n, omega: 0x03C9\n, thetasym: 0x03D1\n, upsih: 0x03D2\n, piv: 0x03D6\n, ensp: 0x2002\n, emsp: 0x2003\n, thinsp: 0x2009\n, zwnj: 0x200C\n, zwj: 0x200D\n, lrm: 0x200E\n, rlm: 0x200F\n, ndash: 0x2013\n, mdash: 0x2014\n, lsquo: 0x2018\n, rsquo: 0x2019\n, sbquo: 0x201A\n, ldquo: 0x201C\n, rdquo: 0x201D\n, bdquo: 0x201E\n, dagger: 0x2020\n, Dagger: 0x2021\n, bull: 0x2022\n, hellip: 0x2026\n, permil: 0x2030\n, prime: 0x2032\n, Prime: 0x2033\n, lsaquo: 0x2039\n, rsaquo: 0x203A\n, oline: 0x203E\n, frasl: 0x2044\n, euro: 0x20AC\n, image: 0x2111\n, weierp: 0x2118\n, real: 0x211C\n, trade: 0x2122\n, alefsym: 0x2135\n, larr: 0x2190\n, uarr: 0x2191\n, rarr: 0x2192\n, darr: 0x2193\n, harr: 0x2194\n, crarr: 0x21B5\n, lArr: 0x21D0\n, uArr: 0x21D1\n, rArr: 0x21D2\n, dArr: 0x21D3\n, hArr: 0x21D4\n, forall: 0x2200\n, part: 0x2202\n, exist: 0x2203\n, empty: 0x2205\n, nabla: 0x2207\n, isin: 0x2208\n, notin: 0x2209\n, ni: 0x220B\n, prod: 0x220F\n, sum: 0x2211\n, minus: 0x2212\n, lowast: 0x2217\n, radic: 0x221A\n, prop: 0x221D\n, infin: 0x221E\n, ang: 0x2220\n, and: 0x2227\n, or: 0x2228\n, cap: 0x2229\n, cup: 0x222A\n, int: 0x222B\n, there4: 0x2234\n, sim: 0x223C\n, cong: 0x2245\n, asymp: 0x2248\n, ne: 0x2260\n, equiv: 0x2261\n, le: 0x2264\n, ge: 0x2265\n, sub: 0x2282\n, sup: 0x2283\n, nsub: 0x2284\n, sube: 0x2286\n, supe: 0x2287\n, oplus: 0x2295\n, otimes: 0x2297\n, perp: 0x22A5\n, sdot: 0x22C5\n, lceil: 0x2308\n, rceil: 0x2309\n, lfloor: 0x230A\n, rfloor: 0x230B\n, lang: 0x2329\n, rang: 0x232A\n, loz: 0x25CA\n, spades: 0x2660\n, clubs: 0x2663\n, hearts: 0x2665\n, diams: 0x2666\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/html-util/lib/entityCode.js"
));

require.define("/node_modules/derby/node_modules/html-util/lib/parse.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var startTag = /^<([^\\s=\\/!>]+)((?:\\s+[^\\s=\\/>]+(?:\\s*=\\s*(?:(?:\"[^\"]*\")|(?:'[^']*')|[^>\\s]+)?)?)*)\\s*(\\/?)\\s*>/\n  , endTag = /^<\\/([^\\s=\\/!>]+)[^>]*>/\n  , comment = /^<!--([\\s\\S]*?)-->/\n  , commentInside = /<!--[\\s\\S]*?-->/\n  , other = /^<([\\s\\S]*?)>/\n  , attr = /([^\\s=]+)(?:\\s*(=)\\s*(?:(?:\"((?:\\\\.|[^\"])*)\")|(?:'((?:\\\\.|[^'])*)')|([^>\\s]+))?)?/g\n  , rawTagsDefault = /^(style|script)$/i\n\nfunction empty() {}\n\nfunction matchEndDefault(tagName) {\n  return new RegExp('</' + tagName, 'i')\n}\n\nfunction onStartTag(html, match, handler) {\n  var attrs = {}\n    , tag = match[0]\n    , tagName = match[1]\n    , remainder = match[2]\n  html = html.slice(tag.length)\n\n  remainder.replace(attr, function(match, name, equals, attr0, attr1, attr2) {\n    attrs[name.toLowerCase()] = attr0 || attr1 || attr2 || (equals ? '' : null)\n  })\n  handler(tag, tagName.toLowerCase(), attrs, html)\n\n  return html\n}\n\nfunction onTag(html, match, handler) {\n  var tag = match[0]\n    , data = match[1]\n  html = html.slice(tag.length)\n\n  handler(tag, data, html)\n\n  return html\n}\n\nfunction onText(html, index, isRawText, handler) {\n  var text\n  if (~index) {\n    text = html.slice(0, index)\n    html = html.slice(index)\n  } else {\n    text = html\n    html = ''\n  }\n\n  if (text) handler(text, isRawText, html)\n\n  return html\n}\n\nfunction rawEnd(html, ending, offset) {\n  offset || (offset = 0)\n  var index = html.search(ending)\n    , commentMatch = html.match(commentInside)\n    , commentEnd\n  // Make sure that the ending condition isn't inside of an HTML comment\n  if (commentMatch && commentMatch.index < index) {\n    commentEnd = commentMatch.index + commentMatch[0].length\n    offset += commentEnd\n    html = html.slice(commentEnd)\n    return rawEnd(html, ending, offset)\n  }\n  return index + offset\n}\n\nmodule.exports = function(html, options) {\n  if (options == null) options = {}\n\n  if (!html) return\n\n  var startHandler = options.start || empty\n    , endHandler = options.end || empty\n    , textHandler = options.text || empty\n    , commentHandler = options.comment || empty\n    , otherHandler = options.other || empty\n    , matchEnd = options.matchEnd || matchEndDefault\n    , errorHandler = options.error\n    , rawTags = options.rawTags || rawTagsDefault\n    , index, last, match, tagName, err\n\n  while (html) {\n    if (html === last) {\n      err = new Error('HTML parse error: ' + html)\n      if (errorHandler) {\n        errorHandler(err)\n      } else {\n        throw err\n      }\n    }\n    last = html\n\n    if (html[0] === '<') {\n      if (match = html.match(startTag)) {\n        html = onStartTag(html, match, startHandler)\n\n        tagName = match[1]\n        if (rawTags.test(tagName)) {\n          index = rawEnd(html, matchEnd(tagName))\n          html = onText(html, index, true, textHandler)\n        }\n        continue\n      }\n\n      if (match = html.match(endTag)) {\n        match[1] = match[1].toLowerCase()  // tagName\n        html = onTag(html, match, endHandler)\n        continue\n      }\n\n      if (match = html.match(comment)) {\n        html = onTag(html, match, commentHandler)\n        continue\n      }\n\n      if (match = html.match(other)) {\n        html = onTag(html, match, otherHandler)\n        continue\n      }\n    }\n\n    index = html.indexOf('<')\n    html = onText(html, index, false, textHandler)\n  }\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/html-util/lib/parse.js"
));

require.define("/node_modules/derby/node_modules/MD5/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"md5.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/MD5/package.json"
));

require.define("/node_modules/derby/node_modules/MD5/md5.js",Function(['require','module','exports','__dirname','__filename','process','global'],"(function(){\r\n  var crypt = require('crypt'),\r\n      utf8 = require('charenc').utf8,\r\n      bin = require('charenc').bin,\r\n\r\n  // The core\r\n  md5 = function (message) {\r\n    // Convert to byte array\r\n    if (message.constructor == String)\r\n      message = utf8.stringToBytes(message);\r\n    // else, assume byte array already\r\n\r\n    var m = crypt.bytesToWords(message),\r\n        l = message.length * 8,\r\n        a =  1732584193,\r\n        b = -271733879,\r\n        c = -1732584194,\r\n        d =  271733878;\r\n\r\n    // Swap endian\r\n    for (var i = 0; i < m.length; i++) {\r\n      m[i] = ((m[i] <<  8) | (m[i] >>> 24)) & 0x00FF00FF |\r\n             ((m[i] << 24) | (m[i] >>>  8)) & 0xFF00FF00;\r\n    }\r\n\r\n    // Padding\r\n    m[l >>> 5] |= 0x80 << (l % 32);\r\n    m[(((l + 64) >>> 9) << 4) + 14] = l;\r\n\r\n    // Method shortcuts\r\n    var FF = md5._ff,\r\n        GG = md5._gg,\r\n        HH = md5._hh,\r\n        II = md5._ii;\r\n\r\n    for (var i = 0; i < m.length; i += 16) {\r\n\r\n      var aa = a,\r\n          bb = b,\r\n          cc = c,\r\n          dd = d;\r\n\r\n      a = FF(a, b, c, d, m[i+ 0],  7, -680876936);\r\n      d = FF(d, a, b, c, m[i+ 1], 12, -389564586);\r\n      c = FF(c, d, a, b, m[i+ 2], 17,  606105819);\r\n      b = FF(b, c, d, a, m[i+ 3], 22, -1044525330);\r\n      a = FF(a, b, c, d, m[i+ 4],  7, -176418897);\r\n      d = FF(d, a, b, c, m[i+ 5], 12,  1200080426);\r\n      c = FF(c, d, a, b, m[i+ 6], 17, -1473231341);\r\n      b = FF(b, c, d, a, m[i+ 7], 22, -45705983);\r\n      a = FF(a, b, c, d, m[i+ 8],  7,  1770035416);\r\n      d = FF(d, a, b, c, m[i+ 9], 12, -1958414417);\r\n      c = FF(c, d, a, b, m[i+10], 17, -42063);\r\n      b = FF(b, c, d, a, m[i+11], 22, -1990404162);\r\n      a = FF(a, b, c, d, m[i+12],  7,  1804603682);\r\n      d = FF(d, a, b, c, m[i+13], 12, -40341101);\r\n      c = FF(c, d, a, b, m[i+14], 17, -1502002290);\r\n      b = FF(b, c, d, a, m[i+15], 22,  1236535329);\r\n\r\n      a = GG(a, b, c, d, m[i+ 1],  5, -165796510);\r\n      d = GG(d, a, b, c, m[i+ 6],  9, -1069501632);\r\n      c = GG(c, d, a, b, m[i+11], 14,  643717713);\r\n      b = GG(b, c, d, a, m[i+ 0], 20, -373897302);\r\n      a = GG(a, b, c, d, m[i+ 5],  5, -701558691);\r\n      d = GG(d, a, b, c, m[i+10],  9,  38016083);\r\n      c = GG(c, d, a, b, m[i+15], 14, -660478335);\r\n      b = GG(b, c, d, a, m[i+ 4], 20, -405537848);\r\n      a = GG(a, b, c, d, m[i+ 9],  5,  568446438);\r\n      d = GG(d, a, b, c, m[i+14],  9, -1019803690);\r\n      c = GG(c, d, a, b, m[i+ 3], 14, -187363961);\r\n      b = GG(b, c, d, a, m[i+ 8], 20,  1163531501);\r\n      a = GG(a, b, c, d, m[i+13],  5, -1444681467);\r\n      d = GG(d, a, b, c, m[i+ 2],  9, -51403784);\r\n      c = GG(c, d, a, b, m[i+ 7], 14,  1735328473);\r\n      b = GG(b, c, d, a, m[i+12], 20, -1926607734);\r\n\r\n      a = HH(a, b, c, d, m[i+ 5],  4, -378558);\r\n      d = HH(d, a, b, c, m[i+ 8], 11, -2022574463);\r\n      c = HH(c, d, a, b, m[i+11], 16,  1839030562);\r\n      b = HH(b, c, d, a, m[i+14], 23, -35309556);\r\n      a = HH(a, b, c, d, m[i+ 1],  4, -1530992060);\r\n      d = HH(d, a, b, c, m[i+ 4], 11,  1272893353);\r\n      c = HH(c, d, a, b, m[i+ 7], 16, -155497632);\r\n      b = HH(b, c, d, a, m[i+10], 23, -1094730640);\r\n      a = HH(a, b, c, d, m[i+13],  4,  681279174);\r\n      d = HH(d, a, b, c, m[i+ 0], 11, -358537222);\r\n      c = HH(c, d, a, b, m[i+ 3], 16, -722521979);\r\n      b = HH(b, c, d, a, m[i+ 6], 23,  76029189);\r\n      a = HH(a, b, c, d, m[i+ 9],  4, -640364487);\r\n      d = HH(d, a, b, c, m[i+12], 11, -421815835);\r\n      c = HH(c, d, a, b, m[i+15], 16,  530742520);\r\n      b = HH(b, c, d, a, m[i+ 2], 23, -995338651);\r\n\r\n      a = II(a, b, c, d, m[i+ 0],  6, -198630844);\r\n      d = II(d, a, b, c, m[i+ 7], 10,  1126891415);\r\n      c = II(c, d, a, b, m[i+14], 15, -1416354905);\r\n      b = II(b, c, d, a, m[i+ 5], 21, -57434055);\r\n      a = II(a, b, c, d, m[i+12],  6,  1700485571);\r\n      d = II(d, a, b, c, m[i+ 3], 10, -1894986606);\r\n      c = II(c, d, a, b, m[i+10], 15, -1051523);\r\n      b = II(b, c, d, a, m[i+ 1], 21, -2054922799);\r\n      a = II(a, b, c, d, m[i+ 8],  6,  1873313359);\r\n      d = II(d, a, b, c, m[i+15], 10, -30611744);\r\n      c = II(c, d, a, b, m[i+ 6], 15, -1560198380);\r\n      b = II(b, c, d, a, m[i+13], 21,  1309151649);\r\n      a = II(a, b, c, d, m[i+ 4],  6, -145523070);\r\n      d = II(d, a, b, c, m[i+11], 10, -1120210379);\r\n      c = II(c, d, a, b, m[i+ 2], 15,  718787259);\r\n      b = II(b, c, d, a, m[i+ 9], 21, -343485551);\r\n\r\n      a = (a + aa) >>> 0;\r\n      b = (b + bb) >>> 0;\r\n      c = (c + cc) >>> 0;\r\n      d = (d + dd) >>> 0;\r\n    }\r\n\r\n    return crypt.endian([a, b, c, d]);\r\n  };\r\n\r\n  // Auxiliary functions\r\n  md5._ff  = function (a, b, c, d, x, s, t) {\r\n    var n = a + (b & c | ~b & d) + (x >>> 0) + t;\r\n    return ((n << s) | (n >>> (32 - s))) + b;\r\n  };\r\n  md5._gg  = function (a, b, c, d, x, s, t) {\r\n    var n = a + (b & d | c & ~d) + (x >>> 0) + t;\r\n    return ((n << s) | (n >>> (32 - s))) + b;\r\n  };\r\n  md5._hh  = function (a, b, c, d, x, s, t) {\r\n    var n = a + (b ^ c ^ d) + (x >>> 0) + t;\r\n    return ((n << s) | (n >>> (32 - s))) + b;\r\n  };\r\n  md5._ii  = function (a, b, c, d, x, s, t) {\r\n    var n = a + (c ^ (b | ~d)) + (x >>> 0) + t;\r\n    return ((n << s) | (n >>> (32 - s))) + b;\r\n  };\r\n\r\n  // Package private blocksize\r\n  md5._blocksize = 16;\r\n  md5._digestsize = 16;\r\n\r\n  module.exports = function (message, options) {\r\n    var digestbytes = crypt.wordsToBytes(md5(message));\r\n    return options && options.asBytes ? digestbytes :\r\n        options && options.asString ? bin.bytesToString(digestbytes) :\r\n        crypt.bytesToHex(digestbytes);\r\n  };\r\n\r\n})();\r\n\n//@ sourceURL=/node_modules/derby/node_modules/MD5/md5.js"
));

require.define("/node_modules/derby/node_modules/MD5/node_modules/crypt/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"crypt.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/MD5/node_modules/crypt/package.json"
));

require.define("/node_modules/derby/node_modules/MD5/node_modules/crypt/crypt.js",Function(['require','module','exports','__dirname','__filename','process','global'],"(function() {\n  var base64map\n      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',\n\n  crypt = {\n    // Bit-wise rotation left\n    rotl: function(n, b) {\n      return (n << b) | (n >>> (32 - b));\n    },\n\n    // Bit-wise rotation right\n    rotr: function(n, b) {\n      return (n << (32 - b)) | (n >>> b);\n    },\n\n    // Swap big-endian to little-endian and vice versa\n    endian: function(n) {\n      // If number given, swap endian\n      if (n.constructor == Number) {\n        return crypt.rotl(n, 8) & 0x00FF00FF | crypt.rotl(n, 24) & 0xFF00FF00;\n      }\n\n      // Else, assume array and swap all items\n      for (var i = 0; i < n.length; i++)\n        n[i] = crypt.endian(n[i]);\n      return n;\n    },\n\n    // Generate an array of any length of random bytes\n    randomBytes: function(n) {\n      for (var bytes = []; n > 0; n--)\n        bytes.push(Math.floor(Math.random() * 256));\n      return bytes;\n    },\n\n    // Convert a byte array to big-endian 32-bit words\n    bytesToWords: function(bytes) {\n      for (var words = [], i = 0, b = 0; i < bytes.length; i++, b += 8)\n        words[b >>> 5] |= bytes[i] << (24 - b % 32);\n      return words;\n    },\n\n    // Convert big-endian 32-bit words to a byte array\n    wordsToBytes: function(words) {\n      for (var bytes = [], b = 0; b < words.length * 32; b += 8)\n        bytes.push((words[b >>> 5] >>> (24 - b % 32)) & 0xFF);\n      return bytes;\n    },\n\n    // Convert a byte array to a hex string\n    bytesToHex: function(bytes) {\n      for (var hex = [], i = 0; i < bytes.length; i++) {\n        hex.push((bytes[i] >>> 4).toString(16));\n        hex.push((bytes[i] & 0xF).toString(16));\n      }\n      return hex.join('');\n    },\n\n    // Convert a hex string to a byte array\n    hexToBytes: function(hex) {\n      for (var bytes = [], c = 0; c < hex.length; c += 2)\n        bytes.push(parseInt(hex.substr(c, 2), 16));\n      return bytes;\n    },\n\n    // Convert a byte array to a base-64 string\n    bytesToBase64: function(bytes) {\n      for (var base64 = [], i = 0; i < bytes.length; i += 3) {\n        var triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];\n        for (var j = 0; j < 4; j++)\n          if (i * 8 + j * 6 <= bytes.length * 8)\n            base64.push(base64map.charAt((triplet >>> 6 * (3 - j)) & 0x3F));\n          else\n            base64.push('=');\n      }\n      return base64.join('');\n    },\n\n    // Convert a base-64 string to a byte array\n    base64ToBytes: function(base64) {\n      // Remove non-base-64 characters\n      base64 = base64.replace(/[^A-Z0-9+\\/]/ig, '');\n\n      for (var bytes = [], i = 0, imod4 = 0; i < base64.length;\n          imod4 = ++i % 4) {\n        if (imod4 == 0) continue;\n        bytes.push(((base64map.indexOf(base64.charAt(i - 1))\n            & (Math.pow(2, -2 * imod4 + 8) - 1)) << (imod4 * 2))\n            | (base64map.indexOf(base64.charAt(i)) >>> (6 - imod4 * 2)));\n      }\n      return bytes;\n    }\n  };\n\n  module.exports = crypt;\n})();\n\n//@ sourceURL=/node_modules/derby/node_modules/MD5/node_modules/crypt/crypt.js"
));

require.define("/node_modules/derby/node_modules/MD5/node_modules/charenc/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"charenc.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/MD5/node_modules/charenc/package.json"
));

require.define("/node_modules/derby/node_modules/MD5/node_modules/charenc/charenc.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var charenc = {\n  // UTF-8 encoding\n  utf8: {\n    // Convert a string to a byte array\n    stringToBytes: function(str) {\n      return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));\n    },\n\n    // Convert a byte array to a string\n    bytesToString: function(bytes) {\n      return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));\n    }\n  },\n\n  // Binary encoding\n  bin: {\n    // Convert a string to a byte array\n    stringToBytes: function(str) {\n      for (var bytes = [], i = 0; i < str.length; i++)\n        bytes.push(str.charCodeAt(i) & 0xFF);\n      return bytes;\n    },\n\n    // Convert a byte array to a string\n    bytesToString: function(bytes) {\n      for (var str = [], i = 0; i < bytes.length; i++)\n        str.push(String.fromCharCode(bytes[i]));\n      return str.join('');\n    }\n  }\n};\n\nmodule.exports = charenc;\n\n//@ sourceURL=/node_modules/derby/node_modules/MD5/node_modules/charenc/charenc.js"
));

require.define("/node_modules/derby/lib/markup.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var eventBinding = require('./eventBinding')\n  , splitEvents = eventBinding.splitEvents\n  , containsEvent = eventBinding.containsEvent\n  , addDomEvent = eventBinding.addDomEvent\n  , TEXT_EVENTS = 'keyup,keydown,paste/0,dragover/0,blur'\n  , AUTOCOMPLETE_OFF = {\n      checkbox: true\n    , radio: true\n    }\n  , onBindA, onBindForm;\n\nmodule.exports = {\n  bound: {\n    'value': {\n      'input': function(events, attrs, match) {\n        var type = attrs.type\n          , eventNames, method;\n        if (type === 'radio' || type === 'checkbox') return;\n        if (type === 'range' || 'x-blur' in attrs) {\n          // Only update after the element loses focus\n          delete attrs['x-blur'];\n          eventNames = 'change,blur';\n        } else {\n          // By default, update as the user types\n          eventNames = TEXT_EVENTS;\n        }\n        if ('x-ignore-focus' in attrs) {\n          // Update value regardless of focus\n          delete attrs['x-ignore-focus'];\n          method = 'prop';\n        } else {\n          // Update value unless window and element are focused\n          method = 'propPolite';\n        }\n        addDomEvent(events, attrs, eventNames, match, {\n          method: 'prop'\n        , property: 'value'\n        });\n        return {method: method};\n      }\n    }\n\n  , 'checked': {\n      '*': function(events,  attrs, match) {\n        addDomEvent(events, attrs, 'change', match, {\n          method: 'prop'\n        , property: 'checked'\n        });\n        return {method: 'prop'};\n      }\n    }\n\n  , 'selected': {\n      '*': function(events, attrs, match) {\n        addDomEvent(events, attrs, 'change', match, {\n          method: 'prop'\n        , property: 'selected'\n        });\n        return {method: 'prop'};\n      }\n    }\n\n  , 'disabled': {\n      '*': function() {\n        return {method: 'prop'};\n      }\n    }\n  }\n\n, boundParent: {\n    'contenteditable': {\n      '*': function(events, attrs, match) {\n        addDomEvent(events, attrs, TEXT_EVENTS, match, {\n          method: 'html'\n        });\n      }\n    }\n\n  , '*': {\n      'textarea': function(events, attrs, match) {\n        addDomEvent(events, attrs, TEXT_EVENTS, match, {\n          method: 'prop'\n        , property: 'value'\n        });\n        return {method: 'prop', property: 'value'};\n      }\n    }\n  }\n\n, element: {\n    'select': function(events, attrs) {\n      // Distribute change event to child nodes of select elements\n      addDomEvent(events, attrs, 'change:$forChildren');\n      return {addId: true};\n    }\n\n  , 'input': function(events, attrs) {\n      if (AUTOCOMPLETE_OFF[attrs.type] && !('autocomplete' in attrs)) {\n        attrs.autocomplete = 'off';\n      }\n      if (attrs.type === 'radio') {\n        // Distribute change events to other elements with the same name\n        addDomEvent(events, attrs, 'change:$forName');\n      }\n    }\n  }\n\n, attr: {\n    'x-bind': {\n      '*': function(events, attrs, eventNames) {\n        addDomEvent(events, attrs, eventNames);\n        return {addId: true, del: true};\n      }\n\n    , 'a': onBindA = function(events, attrs, eventNames) {\n        if (containsEvent(eventNames, ['click', 'focus']) && !('href' in attrs)) {\n          attrs.href = '#';\n          if (!('onclick' in attrs)) {\n            attrs.onclick = 'return false';\n          }\n        }\n      }\n\n    , 'form': onBindForm = function(events, attrs, eventNames) {\n        if (containsEvent(eventNames, 'submit')) {\n          if (!('onsubmit' in attrs)) {\n            attrs.onsubmit = 'return false';\n          }\n        }\n      }\n    }\n\n  , 'x-capture': {\n      '*': function(events, attrs, eventNames) {\n        addDomEvent(events, attrs, eventNames, null, {capture: true});\n        return {addId: true, del: true};\n      }\n    , 'a': onBindA\n    , 'form': onBindForm\n    }\n\n  , 'x-as': {\n      '*': function(events, attrs, name) {\n        events.push(function(ctx) {\n          ctx.$elements[name] = attrs._id || attrs.id;\n        });\n        return {addId: true, del: true}\n      }\n  }\n\n  , 'checked': {\n      '*': function() {\n        return {bool: true};\n      }\n    }\n\n  , 'selected': {\n      '*': function() {\n        return {bool: true};\n      }\n    }\n\n  , 'disabled': {\n      '*': function() {\n        return {bool: true};\n      }\n    }\n\n  , 'autofocus': {\n      '*': function() {\n        return {bool: true};\n      }\n    }\n  }\n\n, TEXT_EVENTS: TEXT_EVENTS\n, AUTOCOMPLETE_OFF: AUTOCOMPLETE_OFF\n};\n\n//@ sourceURL=/node_modules/derby/lib/markup.js"
));

require.define("/node_modules/derby/lib/eventBinding.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var util = require('racer').util\n  , lookup = require('racer/lib/path').lookup\n  , merge = util.merge\n  , viewPath = require('./viewPath')\n  , extractPlaceholder = viewPath.extractPlaceholder\n  , dataValue = viewPath.dataValue\n  , ctxPath = viewPath.ctxPath\n  , pathFnArgs = viewPath.pathFnArgs\n  , setBoundFn = viewPath.setBoundFn\n  , arraySlice = [].slice\n\nexports.splitEvents = splitEvents;\nexports.fnListener = fnListener;\nexports.containsEvent = containsEvent;\nexports.addDomEvent = util.isServer ? empty : addDomEvent;\n\nfunction splitEvents(eventNames) {\n  var pairs = eventNames.split(',')\n    , eventList = []\n    , i, j, pair, segments, name, eventName, delay, fns, fn;\n  for (i = pairs.length; i--;) {\n    pair = pairs[i];\n    segments = pair.split(':');\n    name = segments[0].split('/');\n    eventName = name[0].trim();\n    delay = name[1];\n    fns = (segments[1] || '').trim().split(/\\s+/);\n    for (j = fns.length; j--;) {\n      fn = fns[j];\n      fns[j] = extractPlaceholder(fn) || fn;\n    }\n    eventList.push([eventName, delay, fns]);\n  }\n  return eventList;\n}\n\nfunction containsEvent(eventNames, expected) {\n  if (!Array.isArray(expected)) expected = [expected];\n  var eventList = splitEvents(eventNames)\n    , i, j, eventName\n  for (i = eventList.length; i--;) {\n    eventName = eventList[i][0];\n    for (j = expected.length; j--;) {\n      if (eventName === expected[j]) return true;\n    }\n  }\n  return false;\n}\n\nfunction addDomEvent(events, attrs, eventNames, match, options) {\n  var eventList = splitEvents(eventNames)\n    , args, name;\n\n  if (match) {\n    name = match.name;\n\n    if (~name.indexOf('(')) {\n      args = pathFnArgs(name);\n      if (!args.length) return;\n\n      events.push(function(ctx, modelEvents, dom, pathMap, view) {\n        var id = attrs._id || attrs.id\n          , paths = []\n          , arg, path, pathId, event, eventName, eventOptions, i, j;\n        options.setValue = function(model, value) {\n          return setBoundFn(view, ctx, model, name, value);\n        }\n        for (i = args.length; i--;) {\n          arg = args[i];\n          path = ctxPath(view, ctx, arg);\n          paths.push(path);\n          pathId = pathMap.id(path);\n          for (j = eventList.length; j--;) {\n            event = eventList[j];\n            eventName = event[0];\n            eventOptions = merge({view: view, ctx: ctx, pathId: pathId, delay: event[1]}, options);\n            dom.bind(eventName, id, eventOptions);\n          }\n        }\n      });\n      return;\n    }\n\n    events.push(function(ctx, modelEvents, dom, pathMap, view) {\n      var id = attrs._id || attrs.id\n        , pathId = pathMap.id(ctxPath(view, ctx, name))\n        , event, eventName, eventOptions, i;\n      for (i = eventList.length; i--;) {\n        event = eventList[i];\n        eventName = event[0];\n        eventOptions = merge({view: view, ctx: ctx, pathId: pathId, delay: event[1]}, options);\n        dom.bind(eventName, id, eventOptions);\n      }\n    });\n    return;\n  }\n\n  events.push(function(ctx, modelEvents, dom, pathMap, view) {\n    var id = attrs._id || attrs.id\n      , pathId = pathMap.id(ctxPath(view, ctx, '.'))\n      , event, eventName, eventOptions, i;\n    for (i = eventList.length; i--;) {\n      event = eventList[i];\n      eventName = event[0];\n      eventOptions = fnListener(view, ctx, event[2], dom);\n      eventOptions.delay = event[1];\n      merge(eventOptions, options);\n      merge(eventOptions, {view: view, ctx: ctx, pathId: pathId});\n      dom.bind(eventName, id, eventOptions);\n    }\n  });\n}\n\nfunction eachFnListener(view, ctx, fnObj, dom) {\n  var fnName, fn, fnCtxs, i, fnCtx;\n\n  fnName = typeof fnObj === 'object'\n    ? dataValue(view, ctx, view.model, fnObj.name)\n    : fnName = fnObj;\n\n  // If a placeholder for an event name does not have a value, do nothing\n  if (!fnName) return empty;\n\n  // See if it is a built-in function\n  fn = dom && dom.fns[fnName];\n\n  // Lookup the function name on the component script or app\n\n  // TODO: This simply looks in the local scope for the function\n  // and then goes up the scope if a function name is not found.\n  // Better would be to actually figure out the scope of where the\n  // function name is specfied, since there could easily be namespace\n  // conflicts between functions in a component and functions in an\n  // app using that component. How to implement this correctly is not\n  // obvious at the moment.\n  if (!fn) {\n    fnCtxs = ctx.$fnCtx;\n    for (i = fnCtxs.length; i--;) {\n      fnCtx = fnCtxs[i];\n      fn = fnCtx[fnName] || lookup(fnName, fnCtx);\n      if (fn) break;\n    }\n  }\n  if (!fn) throw new Error('Bound function not found: ' + fnName);\n\n  // Bind the listener to the app or component object on which it\n  // was defined so that the `this` context will be the instance\n  return fn.bind(fnCtx);\n}\n\nfunction fnListener(view, ctx, fnNames, dom) {\n  var listener = {\n    fn: function() {\n      var len = fnNames.length\n        , args = arraySlice.call(arguments)\n        , i, fn, boundFns\n\n      if (len === 0) {\n        // Don't do anything if no handler functions were specified\n        return listener.fn = empty;\n\n      } else if (len === 1) {\n        fn = eachFnListener(view, ctx, fnNames[0], dom);\n\n      } else {\n        boundFns = [];\n        for (i = len; i--;) {\n          boundFns.push(eachFnListener(view, ctx, fnNames[i], dom));\n        }\n        fn = function() {\n          var args = arraySlice.call(arguments)\n          for (var i = boundFns.length; i--;) {\n            boundFns[i].apply(null, args);\n          }\n        }\n      }\n\n      listener.fn = fn;\n      fn.apply(null, args);\n    }\n  };\n  return listener;\n}\n\nfunction empty() {}\n\n//@ sourceURL=/node_modules/derby/lib/eventBinding.js"
));

require.define("/node_modules/derby/lib/viewPath.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var lookup = require('racer/lib/path').lookup\n  , trimLeading = require('html-util').trimLeading;\n\nexports.wrapRemainder = wrapRemainder;\nexports.extractPlaceholder = extractPlaceholder;\nexports.pathFnArgs = pathFnArgs;\nexports.ctxPath = ctxPath;\nexports.getValue = getValue;\nexports.dataValue = dataValue;\nexports.setBoundFn = setBoundFn;\nexports.patchCtx = patchCtx;\n\nfunction wrapRemainder(tagName, remainder) {\n  if (!remainder) return false;\n  return !(new RegExp('^<\\/' + tagName, 'i')).test(remainder);\n}\n\nvar openPlaceholder = /^([\\s\\S]*?)(\\{{1,3})\\s*([\\s\\S]*)/\n  , aliasContent = /^([\\s\\S]*)\\s+as\\s+:(\\S+)\\s*$/\n  , blockContent = /^([\\#\\/]?)(else\\sif|if|else|unless|each|with|unescaped)?\\s*([\\s\\S]*?)\\s*$/\n  , closeMap = { 1: '}', 2: '}}' }\nfunction extractPlaceholder(text) {\n  var match = openPlaceholder.exec(text);\n  if (!match) return;\n  var pre = match[1]\n    , open = match[2]\n    , remainder = match[3]\n    , openLen = open.length\n    , bound = openLen === 1\n    , end = matchBraces(remainder, openLen, 0, '{', '}')\n    , endInner = end - openLen\n    , inner = remainder.slice(0, endInner)\n    , post = remainder.slice(end)\n    , alias, hash, type, name, escaped;\n\n  if (/[\"{[]/.test(inner)) {\n    // Make sure that we didn't accidentally match a JSON literal\n    try {\n      JSON.parse(open + inner + closeMap[openLen]);\n      return;\n    } catch (e) {}\n  }\n\n  match = aliasContent.exec(inner);\n  if (match) {\n    inner = match[1];\n    alias = match[2];\n  }\n\n  match = blockContent.exec(inner)\n  if (!match) return;\n  hash = match[1];\n  type = match[2];\n  name = match[3];\n\n  escaped = true;\n  if (type === 'unescaped') {\n    escaped = false;\n    type = '';\n  }\n  if (bound) name = name.replace(/\\bthis\\b/, '.');\n  return {\n    pre: pre\n  , post: post\n  , bound: bound\n  , alias: alias\n  , hash: hash\n  , type: type\n  , name: name\n  , escaped: escaped\n  , source: text\n  };\n}\n\nfunction matchBraces(text, num, i, openChar, closeChar) {\n  var close, hasClose, hasOpen, open;\n  i++;\n  while (num) {\n    close = text.indexOf(closeChar, i);\n    open = text.indexOf(openChar, i);\n    hasClose = ~close;\n    hasOpen = ~open;\n    if (hasClose && (!hasOpen || (close < open))) {\n      i = close + 1;\n      num--;\n      continue;\n    } else if (hasOpen) {\n      i = open + 1;\n      num++;\n      continue;\n    } else {\n      return;\n    }\n  }\n  return i;\n}\n\nvar fnCall = /^([^(]+)\\s*\\(\\s*([\\s\\S]*?)\\s*\\)\\s*$/\n  , argSeparator = /\\s*([,(])\\s*/g\n  , notSeparator = /[^,\\s]/g\n  , notPathArg = /(?:^['\"\\d\\-[{])|(?:^null$)|(?:^true$)|(?:^false$)/;\n\nfunction fnArgs(inner) {\n  var args = []\n    , lastIndex = 0\n    , match, end, last;\n  while (match = argSeparator.exec(inner)) {\n    if (match[1] === '(') {\n      end = matchBraces(inner, 1, argSeparator.lastIndex, '(', ')');\n      args.push(inner.slice(lastIndex, end));\n      notSeparator.lastIndex = end;\n      lastIndex = argSeparator.lastIndex =\n        notSeparator.test(inner) ? notSeparator.lastIndex - 1 : end;\n      continue;\n    }\n    args.push(inner.slice(lastIndex, match.index));\n    lastIndex = argSeparator.lastIndex;\n  }\n  last = inner.slice(lastIndex);\n  if (last) args.push(last);\n  return args;\n}\n\nfunction fnCallError(name) {\n  throw new Error('malformed view function call: ' + name);\n}\n\nfunction fnArgValue(view, ctx, model, name, arg) {\n  var literal = literalValue(arg)\n    , argIds, path, pathId;\n  if (literal === undefined) {\n    argIds = ctx.hasOwnProperty('$fnArgIds') ?\n      ctx.$fnArgIds : (ctx.$fnArgIds = {});\n    if (pathId = argIds[arg]) {\n      path = model.__pathMap.paths[pathId];\n    } else {\n      path = ctxPath(view, ctx, arg);\n      argIds[arg] = model.__pathMap.id(path);\n    }\n    return dataValue(view, ctx, model, path);\n  }\n  return literal;\n}\n\nfunction fnValue(view, ctx, model, name) {\n  var match = fnCall.exec(name) || fnCallError(name)\n    , fnName = match[1]\n    , args = fnArgs(match[2])\n    , fn, fnName, i;\n  for (i = args.length; i--;) {\n    args[i] = fnArgValue(view, ctx, model, name, args[i]);\n  }\n  if (!(fn = view.getFns[fnName])) {\n    throw new Error('view function \"' + fnName + '\" not found for call: ' + name);\n  }\n  return fn.apply({view: view, ctx: ctx, model: model}, args);\n}\n\nfunction pathFnArgs(name, paths) {\n  var match = fnCall.exec(name) || fnCallError(name)\n    , args = fnArgs(match[2])\n    , i, arg;\n  if (paths == null) paths = [];\n  for (i = args.length; i--;) {\n    arg = args[i];\n    if (notPathArg.test(arg)) continue;\n    if (~arg.indexOf('(')) {\n      pathFnArgs(arg, paths);\n      continue;\n    }\n    paths.push(arg);\n  }\n  return paths;\n}\n\nvar indexPlaceholder = /\\$#/g;\n\nfunction relativePath(ctx, i, remainder, noReplace) {\n  var meta = ctx.$paths[i - 1] || []\n    , base = meta[0]\n    , name = base + remainder\n    , offset, indices, index, placeholders\n\n  // Replace `$#` segments in a path with the proper indicies\n  if (!noReplace && (placeholders = name.match(indexPlaceholder))) {\n    indices = ctx.$indices;\n    index = placeholders.length + indices.length - meta[1] - 1;\n    name = name.replace(indexPlaceholder, function() {\n      return indices[--index];\n    });\n  }\n\n  return name;\n}\n\nfunction macroName(view, ctx, name) {\n  if (name.charAt(0) !== '@') return;\n\n  var macroCtx = ctx.$macroCtx\n    , segments = name.slice(1).split('.')\n    , base = segments.shift().toLowerCase()\n    , remainder = segments.join('.')\n    , value = lookup(base, macroCtx)\n    , matchName = value && value.$matchName\n  if (matchName) {\n    if (!remainder) return value;\n    return {$matchName: matchName + '.' + remainder};\n  }\n  return remainder ? base + '.' + remainder : base;\n}\n\nfunction ctxPath(view, ctx, name, noReplace) {\n  var macroPath = macroName(view, ctx, name);\n  if (macroPath && macroPath.$matchName) name = macroPath.$matchName;\n\n  var firstChar = name.charAt(0)\n    , i, aliasName, remainder\n\n  // Resolve path aliases\n  if (firstChar === ':') {\n    if (~(i = name.search(/[.[]/))) {\n      aliasName = name.slice(1, i);\n      remainder = name.slice(i);\n    } else {\n      aliasName = name.slice(1);\n      remainder = '';\n    }\n    i = ctx.$paths.length - ctx.$aliases[aliasName];\n    if (i !== i) throw new Error('Cannot find alias for ' + aliasName);\n\n    name = relativePath(ctx, i, remainder, noReplace);\n\n  // Resolve relative paths\n  } else if (firstChar === '.') {\n    i = 0;\n    while (name.charAt(i) === '.') {\n      i++;\n    }\n    remainder = i === name.length ? '' : name.slice(i - 1);\n\n    name = relativePath(ctx, i, remainder, noReplace);\n  }\n\n  // Perform path interpolation\n  // TODO: This should nest properly and currently is only one level deep\n  // TODO: This should also set up bindings\n  return name.replace(/\\[([^\\]]+)\\]/g, function(match, property, offset) {\n    var segment = getValue(view, ctx, view.model, property);\n    if (offset === 0 || name.charAt(offset - 1) === '.') return segment;\n    return '.' + segment;\n  });\n}\n\nfunction escapeValue(value, escape) {\n  return escape ? escape(value) : value;\n}\n\nfunction literalValue(value) {\n  if (value === 'null') return null;\n  if (value === 'true') return true;\n  if (value === 'false') return false;\n  var firstChar = value.charAt(0)\n    , match;\n  if (firstChar === \"'\") {\n    match = /^'(.*)'$/.exec(value) || fnCallError(value);\n    return match[1];\n  }\n  if (firstChar === '\"') {\n    match = /^\"(.*)\"$/.exec(value) || fnCallError(value);\n    return match[1];\n  }\n  if (/^[\\d\\-]/.test(firstChar) && !isNaN(value)) {\n    return +value;\n  }\n  if (firstChar === '[' || firstChar === '{') {\n    try {\n      return JSON.parse(value);\n    } catch (e) {}\n  }\n  return undefined;\n}\n\nfunction getValue(view, ctx, model, name, escape, forceEscape) {\n  var literal = literalValue(name)\n  if (literal === undefined) {\n    return dataValue(view, ctx, model, name, escape, forceEscape);\n  }\n  return literal;\n}\n\nfunction dataValue(view, ctx, model, name, escape, forceEscape) {\n  var macroPath, path, value;\n  if (~name.indexOf('(')) {\n    value = fnValue(view, ctx, model, name);\n    return escapeValue(value, escape);\n  }\n  path = ctxPath(view, ctx, name);\n  macroPath = macroName(view, ctx, path);\n  if (macroPath) {\n    if (macroPath.$matchName) {\n      path = macroPath.$matchName;\n    } else {\n      value = lookup(macroPath, ctx.$macroCtx);\n      if (typeof value === 'function') {\n        if (value.unescaped && !forceEscape) return value(ctx, model);\n        value = value(ctx, model);\n      }\n      return escapeValue(value, escape);\n    }\n  }\n  value = lookup(path, ctx);\n  if (value !== void 0) return escapeValue(value, escape);\n  value = model.get(path);\n  value = value !== void 0 ? value : model[path];\n  return escapeValue(value, escape);\n}\n\nfunction setBoundFn(view, ctx, model, name, value) {\n  var match = fnCall.exec(name) || fnCallError(name)\n    , fnName = match[1]\n    , args = fnArgs(match[2])\n    , get = view.getFns[fnName]\n    , set = view.setFns[fnName]\n    , numInputs = set && set.length - 1\n    , arg, i, inputs, out, key, path, len;\n\n  if (!(get && set)) {\n    throw new Error('view function \"' + fnName + '\" setter not found for binding to: ' + name);\n  }\n\n  if (numInputs) {\n    inputs = [value];\n    i = 0;\n    while (i < numInputs) {\n      inputs.push(fnArgValue(view, ctx, model, name, args[i++]));\n    }\n    out = set.apply(null, inputs);\n  } else {\n    out = set(value);\n  }\n  if (!out) return;\n\n  for (key in out) {\n    value = out[key];\n    arg = args[key];\n    if (~arg.indexOf('(')) {\n      setBoundFn(view, ctx, model, arg, value);\n      continue;\n    }\n    if (value === void 0 || notPathArg.test(arg)) continue;\n    path = ctxPath(view, ctx, arg);\n    if (model.get(path) === value) continue;\n    model.set(path, value);\n  }\n}\n\nfunction patchCtx(ctx, triggerPath) {\n  var meta, path;\n  if (!(triggerPath && (meta = ctx.$paths[0]) && (path = meta[0]))) return;\n\n  var segments = path.split('.')\n    , triggerSegments = triggerPath.replace(/\\*$/, '').split('.')\n    , indices = ctx.$indices.slice()\n    , index = indices.length\n    , i, len, segment, triggerSegment, n;\n  for (i = 0, len = segments.length; i < len; i++) {\n    segment = segments[i];\n    triggerSegment = triggerSegments[i];\n    // `(n = +triggerSegment) === n` will be false only if segment is NaN\n    if (segment === '$#' && (n = +triggerSegment) === n) {\n      indices[--index] = n;\n    } else if (segment !== triggerSegment) {\n      break;\n    }\n  }\n  ctx.$indices = indices;\n  ctx.$index = indices[0];\n}\n\n//@ sourceURL=/node_modules/derby/lib/viewPath.js"
));

require.define("/node_modules/derby/lib/derby.browser.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var racer = require('racer')\n  , tracks = require('tracks')\n  , sharedCreateApp = require('./app').create\n  , derbyModel = require('./derby.Model')\n  , Dom = require('./Dom')\n  , collection = require('./collection')\n  , autoRefresh = require('./refresh').autoRefresh\n\nmodule.exports = derbyBrowser;\n\nfunction derbyBrowser(derby) {\n  // This assumes that only a single instance of this module can run at a time,\n  // which is reasonable in the browser. This is written like this so that\n  // the DERBY global can be used to initialize templates and data.\n  global.DERBY = derby;\n  derby.createApp = createApp;\n  derby.init = init;\n}\nderbyBrowser.decorate = 'derby';\nderbyBrowser.useWith = {server: false, browser: true};\n\nfunction createApp(appModule) {\n  if (derbyBrowser.created) {\n    throw new Error('derby.createApp() called multiple times in the browser');\n  } else {\n    derbyBrowser.created = true;\n  }\n\n  var app = sharedCreateApp(this, appModule)\n  global.DERBY.app = app;\n\n  // Adds get, post, put, del, enter, and exit methods\n  // as well as history to app\n  tracks.setup(app, createPage, onRoute);\n\n  onRenderError = function(err, url) {\n    setTimeout(function() {\n      window.location = url;\n    }, 0);\n    throw err;\n  }\n\n  function Page(app) {\n    this.app = app;\n    this.model = app.model;\n    this.dom = app.dom;\n    this.history = app.history;\n    this._collections = [];\n    this._routing = false;\n  }\n  Page.prototype.render = function(ns, ctx) {\n    try {\n      app.view.render(this.model, ns, ctx);\n      this._routing = false;\n      tracks.render(this, {\n        url: this.params.url\n      , previous: this.params.previous\n      , method: 'enter'\n      , noNavigate: true\n      });\n    } catch (err) {\n      onRenderError(err, this.params.url);\n    }\n  };\n  Page.prototype.init = collection.pageInit;\n\n  function createPage() {\n    return new Page(app);\n  }\n  function onRoute(callback, page, params, next, isTransitional) {\n    try {\n      if (isTransitional) {\n        callback(page.model, params, next);\n        return;\n      }\n\n      if (params.method === 'enter' || params.method === 'exit') {\n        callback.call(app, page.model, params);\n        next();\n        return;\n      }\n\n      if (!page._routing) {\n        app.view._beforeRoute();\n        tracks.render(page, {\n          url: page.params.previous\n        , method: 'exit'\n        , noNavigate: true\n        });\n      }\n      page._routing = true;\n      callback(page, page.model, params, next);\n    } catch (err) {\n      onRenderError(err, page.params.url);\n    }\n  }\n\n  app.ready = function(fn) {\n    racer.on('ready', function(model) {\n      fn.call(app, model);\n    });\n  };\n  return app;\n}\n\nfunction init(modelBundle, ctx) {\n  var app = global.DERBY.app\n    , ns = ctx.$ns\n    , appHash = ctx.$appHash\n    , renderHash = ctx.$renderHash\n    , derby = this\n\n  // The init event is fired after the model data is initialized but\n  // before the socket object is set\n  racer.on('init', function(model) {\n    var dom = new Dom(model);\n\n    app.model = model;\n    app.dom = dom;\n\n    // Calling history.page() creates the initial page, which is only\n    // created one time on the client\n    // TODO: This is a rather obtuse mechanism\n    var page = app.history.page();\n    app.page = page;\n\n    // Reinitialize any collections which were already initialized\n    // during rendering on the server\n    if (ctx.$collections) {\n      var Collections = ctx.$collections.map(function(name) {\n        return app._Collections[name];\n      });\n      page.init.apply(page, Collections);\n    }\n\n    // Update events should wait until after first render is done\n    dom._preventUpdates = true;\n\n    derbyModel.init(derby, app);\n    // Catch errors thrown when rendering and then throw from a setTimeout.\n    // This way, the remaining init code can run and the app still connects\n    try {\n      // Render immediately upon initialization so that the page is in\n      // EXACTLY the same state it was when rendered on the server\n      app.view.render(model, ns, ctx, renderHash);\n    } catch (err) {\n      setTimeout(function() {\n        throw err;\n      }, 0);\n    }\n  });\n\n  // The ready event is fired after the model data is initialized and\n  // the socket object is set  \n  racer.on('ready', function(model) {\n    model.socket.on('connect', function() {\n      model.socket.emit('derbyClient', appHash, function(reload) {\n        if (reload) {\n          var retries = 0\n            , reloadOnEmpty = function() {\n                // TODO: Don't hack the Racer internal API so much\n                if (model._txnQueue.length && retries++ < 20) {\n                  // Clear out private path transactions that could get stuck\n                  model._specModel();\n                  return setTimeout(reloadOnEmpty, 100);\n                }\n                window.location.reload(true);\n              }\n          reloadOnEmpty();\n        }\n      });\n    });\n    var debug = !model.flags.isProduction;\n    if (debug) autoRefresh(app.view, model);\n    tracks.set('debug', debug);\n\n    tracks.render(app.history.page(), {\n      url: window.location.pathname + window.location.search\n    , method: 'enter'\n    , noNavigate: true\n    });\n\n    // Delaying here to make sure that all ready callbacks are called before\n    // the create functions run on various components\n    setTimeout(function() {\n      app.view._afterRender(ns, ctx);\n    }, 0);\n  });\n  racer.init(modelBundle);\n}\n\n//@ sourceURL=/node_modules/derby/lib/derby.browser.js"
));

require.define("/node_modules/derby/node_modules/tracks/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./lib/index.js\",\"browserify\":{\"main\":\"./lib/browser.js\"}}\n//@ sourceURL=/node_modules/derby/node_modules/tracks/package.json"
));

require.define("/node_modules/derby/node_modules/tracks/lib/browser.js",Function(['require','module','exports','__dirname','__filename','process','global'],"// This is a dirty hack to ignore the require of connect.mime,\n// which is included by Express as of Express 3.0.0\nrequire.modules.connect = function() {\n  return {mime: null}\n}\n\nvar Route = require('express/lib/router/route')\n  , History = require('./History')\n  , router = module.exports = require('./router')\n  , isTransitional = router._isTransitional\n\nrouter.setup = setup\n\nfunction setup(app, createPage, onRoute) {\n  var routes = {\n    queue: {}\n  , transitional: {}\n  }\n  app.history = new History(createPage, routes)\n\n  ;['get', 'post', 'put', 'del', 'enter', 'exit'].forEach(function(method) {\n    var queue = routes.queue[method] = []\n      , transitional = routes.transitional[method] = []\n\n    app[method] = function(pattern, callback, callback2) {\n      if (Array.isArray(pattern)) {\n        pattern.forEach(function(item) {\n          app[method](item, callback, callback2)\n        })\n        return app\n      }\n\n      var callbacks = {onRoute: onRoute}\n\n      if (isTransitional(pattern)) {\n        var from = pattern.from\n          , to = pattern.to\n          , forward = pattern.forward || callback.forward || callback\n          , back = pattern.back || callback.back || callback2 || forward\n          , backCallbacks = {onRoute: onRoute, callback: back}\n          , forwardCallbacks = {onRoute: onRoute, callback: forward}\n          , fromRoute = new Route(method, from, backCallbacks)\n          , toRoute = new Route(method, to, forwardCallbacks)\n        transitional.push({\n          from: fromRoute\n        , to: toRoute\n        }, {\n          from: toRoute\n        , to: fromRoute\n        })\n        callbacks.forward = forward\n        callbacks.from = from\n        queue.push(new Route(method, to, callbacks))\n        return app\n      }\n\n      callbacks.callback = callback\n      queue.push(new Route(method, pattern, callbacks))\n      return app\n    }\n  })\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/tracks/lib/browser.js"
));

require.define("/node_modules/derby/node_modules/tracks/node_modules/express/lib/router/route.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\n/**\n * Module dependencies.\n */\n\nvar utils = require('../utils');\n\n/**\n * Expose `Route`.\n */\n\nmodule.exports = Route;\n\n/**\n * Initialize `Route` with the given HTTP `method`, `path`,\n * and an array of `callbacks` and `options`.\n *\n * Options:\n *\n *   - `sensitive`    enable case-sensitive routes\n *   - `strict`       enable strict matching for trailing slashes\n *\n * @param {String} method\n * @param {String} path\n * @param {Array} callbacks\n * @param {Object} options.\n * @api private\n */\n\nfunction Route(method, path, callbacks, options) {\n  options = options || {};\n  this.path = path;\n  this.method = method;\n  this.callbacks = callbacks;\n  this.regexp = utils.pathRegexp(path\n    , this.keys = []\n    , options.sensitive\n    , options.strict);\n}\n\n/**\n * Check if this route matches `path`, if so\n * populate `.params`.\n *\n * @param {String} path\n * @return {Boolean}\n * @api private\n */\n\nRoute.prototype.match = function(path){\n  var keys = this.keys\n    , params = this.params = []\n    , m = this.regexp.exec(path);\n\n  if (!m) return false;\n\n  for (var i = 1, len = m.length; i < len; ++i) {\n    var key = keys[i - 1];\n\n    var val = 'string' == typeof m[i]\n      ? decodeURIComponent(m[i])\n      : m[i];\n\n    if (key) {\n      params[key.name] = val;\n    } else {\n      params.push(val);\n    }\n  }\n\n  return true;\n};\n\n//@ sourceURL=/node_modules/derby/node_modules/tracks/node_modules/express/lib/router/route.js"
));

require.define("/node_modules/derby/node_modules/tracks/node_modules/express/lib/utils.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\n/**\n * Module dependencies.\n */\n\nvar mime = require('connect').mime\n  , crc32 = require('buffer-crc32');\n\n/**\n * Return ETag for `body`.\n *\n * @param {String|Buffer} body\n * @return {String}\n * @api private\n */\n\nexports.etag = function(body){\n  return '\"' + crc32.signed(body) + '\"';\n};\n\n/**\n * Make `locals()` bound to the given `obj`.\n *  \n * This is used for `app.locals` and `res.locals`. \n *\n * @param {Object} obj\n * @return {Function}\n * @api private\n */\n\nexports.locals = function(obj){\n  obj.viewCallbacks = obj.viewCallbacks || [];\n\n  function locals(obj){\n    for (var key in obj) locals[key] = obj[key];\n    return obj;\n  };\n\n  return locals;\n};\n\n/**\n * Check if `path` looks absolute.\n *\n * @param {String} path\n * @return {Boolean}\n * @api private\n */\n\nexports.isAbsolute = function(path){\n  if ('/' == path[0]) return true;\n  if (':' == path[1] && '\\\\' == path[2]) return true;\n};\n\n/**\n * Flatten the given `arr`.\n *\n * @param {Array} arr\n * @return {Array}\n * @api private\n */\n\nexports.flatten = function(arr, ret){\n  var ret = ret || []\n    , len = arr.length;\n  for (var i = 0; i < len; ++i) {\n    if (Array.isArray(arr[i])) {\n      exports.flatten(arr[i], ret);\n    } else {\n      ret.push(arr[i]);\n    }\n  }\n  return ret;\n};\n\n/**\n * Normalize the given `type`, for example \"html\" becomes \"text/html\".\n *\n * @param {String} type\n * @return {String}\n * @api private\n */\n\nexports.normalizeType = function(type){\n  return ~type.indexOf('/') ? type : mime.lookup(type);\n};\n\n/**\n * Normalize `types`, for example \"html\" becomes \"text/html\".\n *\n * @param {Array} types\n * @return {Array}\n * @api private\n */\n\nexports.normalizeTypes = function(types){\n  var ret = [];\n\n  for (var i = 0; i < types.length; ++i) {\n    ret.push(~types[i].indexOf('/')\n      ? types[i]\n      : mime.lookup(types[i]));\n  }\n\n  return ret;\n};\n\n/**\n * Return the acceptable type in `types`, if any.\n *\n * @param {Array} types\n * @param {String} str\n * @return {String}\n * @api private\n */\n\nexports.acceptsArray = function(types, str){\n  // accept anything when Accept is not present\n  if (!str) return types[0];\n\n  // parse\n  var accepted = exports.parseAccept(str)\n    , normalized = exports.normalizeTypes(types)\n    , len = accepted.length;\n\n  for (var i = 0; i < len; ++i) {\n    for (var j = 0, jlen = types.length; j < jlen; ++j) {\n      if (exports.accept(normalized[j].split('/'), accepted[i])) {\n        return types[j];\n      }\n    }\n  }\n};\n\n/**\n * Check if `type(s)` are acceptable based on\n * the given `str`.\n *\n * @param {String|Array} type(s)\n * @param {String} str\n * @return {Boolean|String}\n * @api private\n */\n\nexports.accepts = function(type, str){\n  if ('string' == typeof type) type = type.split(/ *, */);\n  return exports.acceptsArray(type, str);\n};\n\n/**\n * Check if `type` array is acceptable for `other`.\n *\n * @param {Array} type\n * @param {Object} other\n * @return {Boolean}\n * @api private\n */\n\nexports.accept = function(type, other){\n  return (type[0] == other.type || '*' == other.type)\n    && (type[1] == other.subtype || '*' == other.subtype);\n};\n\n/**\n * Parse accept `str`, returning\n * an array objects containing\n * `.type` and `.subtype` along\n * with the values provided by\n * `parseQuality()`.\n *\n * @param {Type} name\n * @return {Type}\n * @api private\n */\n\nexports.parseAccept = function(str){\n  return exports\n    .parseQuality(str)\n    .map(function(obj){\n      var parts = obj.value.split('/');\n      obj.type = parts[0];\n      obj.subtype = parts[1];\n      return obj;\n    });\n};\n\n/**\n * Parse quality `str`, returning an\n * array of objects with `.value` and\n * `.quality`.\n *\n * @param {Type} name\n * @return {Type}\n * @api private\n */\n\nexports.parseQuality = function(str){\n  return str\n    .split(/ *, */)\n    .map(quality)\n    .filter(function(obj){\n      return obj.quality;\n    })\n    .sort(function(a, b){\n      return b.quality - a.quality;\n    });\n};\n\n/**\n * Parse quality `str` returning an\n * object with `.value` and `.quality`.\n *\n * @param {String} str\n * @return {Object}\n * @api private\n */\n\nfunction quality(str) {\n  var parts = str.split(/ *; */)\n    , val = parts[0];\n\n  var q = parts[1]\n    ? parseFloat(parts[1].split(/ *= */)[1])\n    : 1;\n\n  return { value: val, quality: q };\n}\n\n/**\n * Escape special characters in the given string of html.\n *\n * @param  {String} html\n * @return {String}\n * @api private\n */\n\nexports.escape = function(html) {\n  return String(html)\n    .replace(/&/g, '&amp;')\n    .replace(/\"/g, '&quot;')\n    .replace(/</g, '&lt;')\n    .replace(/>/g, '&gt;');\n};\n\n/**\n * Normalize the given path string,\n * returning a regular expression.\n *\n * An empty array should be passed,\n * which will contain the placeholder\n * key names. For example \"/user/:id\" will\n * then contain [\"id\"].\n *\n * @param  {String|RegExp|Array} path\n * @param  {Array} keys\n * @param  {Boolean} sensitive\n * @param  {Boolean} strict\n * @return {RegExp}\n * @api private\n */\n\nexports.pathRegexp = function(path, keys, sensitive, strict) {\n  if (path instanceof RegExp) return path;\n  if (Array.isArray(path)) path = '(' + path.join('|') + ')';\n  path = path\n    .concat(strict ? '' : '/?')\n    .replace(/\\/\\(/g, '(?:/')\n    .replace(/(\\/)?(\\.)?:(\\w+)(?:(\\(.*?\\)))?(\\?)?(\\*)?/g, function(_, slash, format, key, capture, optional, star){\n      keys.push({ name: key, optional: !! optional });\n      slash = slash || '';\n      return ''\n        + (optional ? '' : slash)\n        + '(?:'\n        + (optional ? slash : '')\n        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'\n        + (optional || '')\n        + (star ? '(/*)?' : '');\n    })\n    .replace(/([\\/.])/g, '\\\\$1')\n    .replace(/\\*/g, '(.*)');\n  return new RegExp('^' + path + '$', sensitive ? '' : 'i');\n}\n//@ sourceURL=/node_modules/derby/node_modules/tracks/node_modules/express/lib/utils.js"
));

require.define("/node_modules/derby/node_modules/tracks/node_modules/express/node_modules/buffer-crc32/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/tracks/node_modules/express/node_modules/buffer-crc32/package.json"
));

require.define("/node_modules/derby/node_modules/tracks/node_modules/express/node_modules/buffer-crc32/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var Buffer = require('buffer').Buffer;\n\nvar CRC_TABLE = [\n  0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419,\n  0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4,\n  0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07,\n  0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,\n  0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856,\n  0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,\n  0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4,\n  0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,\n  0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3,\n  0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a,\n  0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599,\n  0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,\n  0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190,\n  0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f,\n  0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e,\n  0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,\n  0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed,\n  0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,\n  0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3,\n  0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,\n  0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a,\n  0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5,\n  0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010,\n  0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,\n  0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17,\n  0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6,\n  0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615,\n  0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,\n  0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344,\n  0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,\n  0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a,\n  0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,\n  0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1,\n  0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c,\n  0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef,\n  0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,\n  0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe,\n  0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31,\n  0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c,\n  0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,\n  0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b,\n  0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,\n  0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1,\n  0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,\n  0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278,\n  0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7,\n  0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66,\n  0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,\n  0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605,\n  0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8,\n  0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b,\n  0x2d02ef8d\n];\n\nfunction bufferizeInt(num) {\n  var tmp = Buffer(4);\n  tmp.writeInt32BE(num, 0);\n  return tmp;\n}\n\nfunction _crc32(buf) {\n  if (!Buffer.isBuffer(buf))\n    buf = Buffer(buf);\n  var crc = 0xffffffff;\n  for (var n = 0; n < buf.length; n++) {\n    crc = CRC_TABLE[(crc ^ buf[n]) & 0xff] ^ (crc >>> 8);\n  }\n  return (crc ^ 0xffffffff);\n}\n\nfunction crc32() {\n  return bufferizeInt(_crc32.apply(null, arguments));\n}\ncrc32.signed = function () {\n  return _crc32.apply(null, arguments);\n};\ncrc32.unsigned = function () {\n  return crc32.apply(null, arguments).readUInt32BE(0);\n};\n\nmodule.exports = crc32;\n\n//@ sourceURL=/node_modules/derby/node_modules/tracks/node_modules/express/node_modules/buffer-crc32/index.js"
));

require.define("buffer",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = require(\"buffer-browserify\")\n//@ sourceURL=buffer"
));

require.define("/node_modules/buffer-browserify/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index.js\",\"browserify\":\"index.js\"}\n//@ sourceURL=/node_modules/buffer-browserify/package.json"
));

require.define("/node_modules/buffer-browserify/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"function SlowBuffer (size) {\n    this.length = size;\n};\n\nvar assert = require('assert');\n\nexports.INSPECT_MAX_BYTES = 50;\n\n\nfunction toHex(n) {\n  if (n < 16) return '0' + n.toString(16);\n  return n.toString(16);\n}\n\nfunction utf8ToBytes(str) {\n  var byteArray = [];\n  for (var i = 0; i < str.length; i++)\n    if (str.charCodeAt(i) <= 0x7F)\n      byteArray.push(str.charCodeAt(i));\n    else {\n      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');\n      for (var j = 0; j < h.length; j++)\n        byteArray.push(parseInt(h[j], 16));\n    }\n\n  return byteArray;\n}\n\nfunction asciiToBytes(str) {\n  var byteArray = []\n  for (var i = 0; i < str.length; i++ )\n    // Node's code seems to be doing this and not & 0x7F..\n    byteArray.push( str.charCodeAt(i) & 0xFF );\n\n  return byteArray;\n}\n\nfunction base64ToBytes(str) {\n  return require(\"base64-js\").toByteArray(str);\n}\n\nSlowBuffer.byteLength = function (str, encoding) {\n  switch (encoding || \"utf8\") {\n    case 'hex':\n      return str.length / 2;\n\n    case 'utf8':\n    case 'utf-8':\n      return utf8ToBytes(str).length;\n\n    case 'ascii':\n    case 'binary':\n      return str.length;\n\n    case 'base64':\n      return base64ToBytes(str).length;\n\n    default:\n      throw new Error('Unknown encoding');\n  }\n};\n\nfunction blitBuffer(src, dst, offset, length) {\n  var pos, i = 0;\n  while (i < length) {\n    if ((i+offset >= dst.length) || (i >= src.length))\n      break;\n\n    dst[i + offset] = src[i];\n    i++;\n  }\n  return i;\n}\n\nSlowBuffer.prototype.utf8Write = function (string, offset, length) {\n  var bytes, pos;\n  return SlowBuffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);\n};\n\nSlowBuffer.prototype.asciiWrite = function (string, offset, length) {\n  var bytes, pos;\n  return SlowBuffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);\n};\n\nSlowBuffer.prototype.binaryWrite = SlowBuffer.prototype.asciiWrite;\n\nSlowBuffer.prototype.base64Write = function (string, offset, length) {\n  var bytes, pos;\n  return SlowBuffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);\n};\n\nSlowBuffer.prototype.base64Slice = function (start, end) {\n  var bytes = Array.prototype.slice.apply(this, arguments)\n  return require(\"base64-js\").fromByteArray(bytes);\n}\n\nfunction decodeUtf8Char(str) {\n  try {\n    return decodeURIComponent(str);\n  } catch (err) {\n    return String.fromCharCode(0xFFFD); // UTF 8 invalid char\n  }\n}\n\nSlowBuffer.prototype.utf8Slice = function () {\n  var bytes = Array.prototype.slice.apply(this, arguments);\n  var res = \"\";\n  var tmp = \"\";\n  var i = 0;\n  while (i < bytes.length) {\n    if (bytes[i] <= 0x7F) {\n      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);\n      tmp = \"\";\n    } else\n      tmp += \"%\" + bytes[i].toString(16);\n\n    i++;\n  }\n\n  return res + decodeUtf8Char(tmp);\n}\n\nSlowBuffer.prototype.asciiSlice = function () {\n  var bytes = Array.prototype.slice.apply(this, arguments);\n  var ret = \"\";\n  for (var i = 0; i < bytes.length; i++)\n    ret += String.fromCharCode(bytes[i]);\n  return ret;\n}\n\nSlowBuffer.prototype.binarySlice = SlowBuffer.prototype.asciiSlice;\n\nSlowBuffer.prototype.inspect = function() {\n  var out = [],\n      len = this.length;\n  for (var i = 0; i < len; i++) {\n    out[i] = toHex(this[i]);\n    if (i == exports.INSPECT_MAX_BYTES) {\n      out[i + 1] = '...';\n      break;\n    }\n  }\n  return '<SlowBuffer ' + out.join(' ') + '>';\n};\n\n\nSlowBuffer.prototype.hexSlice = function(start, end) {\n  var len = this.length;\n\n  if (!start || start < 0) start = 0;\n  if (!end || end < 0 || end > len) end = len;\n\n  var out = '';\n  for (var i = start; i < end; i++) {\n    out += toHex(this[i]);\n  }\n  return out;\n};\n\n\nSlowBuffer.prototype.toString = function(encoding, start, end) {\n  encoding = String(encoding || 'utf8').toLowerCase();\n  start = +start || 0;\n  if (typeof end == 'undefined') end = this.length;\n\n  // Fastpath empty strings\n  if (+end == start) {\n    return '';\n  }\n\n  switch (encoding) {\n    case 'hex':\n      return this.hexSlice(start, end);\n\n    case 'utf8':\n    case 'utf-8':\n      return this.utf8Slice(start, end);\n\n    case 'ascii':\n      return this.asciiSlice(start, end);\n\n    case 'binary':\n      return this.binarySlice(start, end);\n\n    case 'base64':\n      return this.base64Slice(start, end);\n\n    case 'ucs2':\n    case 'ucs-2':\n      return this.ucs2Slice(start, end);\n\n    default:\n      throw new Error('Unknown encoding');\n  }\n};\n\n\nSlowBuffer.prototype.hexWrite = function(string, offset, length) {\n  offset = +offset || 0;\n  var remaining = this.length - offset;\n  if (!length) {\n    length = remaining;\n  } else {\n    length = +length;\n    if (length > remaining) {\n      length = remaining;\n    }\n  }\n\n  // must be an even number of digits\n  var strLen = string.length;\n  if (strLen % 2) {\n    throw new Error('Invalid hex string');\n  }\n  if (length > strLen / 2) {\n    length = strLen / 2;\n  }\n  for (var i = 0; i < length; i++) {\n    var byte = parseInt(string.substr(i * 2, 2), 16);\n    if (isNaN(byte)) throw new Error('Invalid hex string');\n    this[offset + i] = byte;\n  }\n  SlowBuffer._charsWritten = i * 2;\n  return i;\n};\n\n\nSlowBuffer.prototype.write = function(string, offset, length, encoding) {\n  // Support both (string, offset, length, encoding)\n  // and the legacy (string, encoding, offset, length)\n  if (isFinite(offset)) {\n    if (!isFinite(length)) {\n      encoding = length;\n      length = undefined;\n    }\n  } else {  // legacy\n    var swap = encoding;\n    encoding = offset;\n    offset = length;\n    length = swap;\n  }\n\n  offset = +offset || 0;\n  var remaining = this.length - offset;\n  if (!length) {\n    length = remaining;\n  } else {\n    length = +length;\n    if (length > remaining) {\n      length = remaining;\n    }\n  }\n  encoding = String(encoding || 'utf8').toLowerCase();\n\n  switch (encoding) {\n    case 'hex':\n      return this.hexWrite(string, offset, length);\n\n    case 'utf8':\n    case 'utf-8':\n      return this.utf8Write(string, offset, length);\n\n    case 'ascii':\n      return this.asciiWrite(string, offset, length);\n\n    case 'binary':\n      return this.binaryWrite(string, offset, length);\n\n    case 'base64':\n      return this.base64Write(string, offset, length);\n\n    case 'ucs2':\n    case 'ucs-2':\n      return this.ucs2Write(string, offset, length);\n\n    default:\n      throw new Error('Unknown encoding');\n  }\n};\n\n\n// slice(start, end)\nSlowBuffer.prototype.slice = function(start, end) {\n  if (end === undefined) end = this.length;\n\n  if (end > this.length) {\n    throw new Error('oob');\n  }\n  if (start > end) {\n    throw new Error('oob');\n  }\n\n  return new Buffer(this, end - start, +start);\n};\n\nSlowBuffer.prototype.copy = function(target, targetstart, sourcestart, sourceend) {\n  var temp = [];\n  for (var i=sourcestart; i<sourceend; i++) {\n    assert.ok(typeof this[i] !== 'undefined', \"copying undefined buffer bytes!\");\n    temp.push(this[i]);\n  }\n\n  for (var i=targetstart; i<targetstart+temp.length; i++) {\n    target[i] = temp[i-targetstart];\n  }\n};\n\nSlowBuffer.prototype.fill = function(value, start, end) {\n  if (end > this.length) {\n    throw new Error('oob');\n  }\n  if (start > end) {\n    throw new Error('oob');\n  }\n\n  for (var i = start; i < end; i++) {\n    this[i] = value;\n  }\n}\n\nfunction coerce(length) {\n  // Coerce length to a number (possibly NaN), round up\n  // in case it's fractional (e.g. 123.456) then do a\n  // double negate to coerce a NaN to 0. Easy, right?\n  length = ~~Math.ceil(+length);\n  return length < 0 ? 0 : length;\n}\n\n\n// Buffer\n\nfunction Buffer(subject, encoding, offset) {\n  if (!(this instanceof Buffer)) {\n    return new Buffer(subject, encoding, offset);\n  }\n\n  var type;\n\n  // Are we slicing?\n  if (typeof offset === 'number') {\n    this.length = coerce(encoding);\n    this.parent = subject;\n    this.offset = offset;\n  } else {\n    // Find the length\n    switch (type = typeof subject) {\n      case 'number':\n        this.length = coerce(subject);\n        break;\n\n      case 'string':\n        this.length = Buffer.byteLength(subject, encoding);\n        break;\n\n      case 'object': // Assume object is an array\n        this.length = coerce(subject.length);\n        break;\n\n      default:\n        throw new Error('First argument needs to be a number, ' +\n                        'array or string.');\n    }\n\n    if (this.length > Buffer.poolSize) {\n      // Big buffer, just alloc one.\n      this.parent = new SlowBuffer(this.length);\n      this.offset = 0;\n\n    } else {\n      // Small buffer.\n      if (!pool || pool.length - pool.used < this.length) allocPool();\n      this.parent = pool;\n      this.offset = pool.used;\n      pool.used += this.length;\n    }\n\n    // Treat array-ish objects as a byte array.\n    if (isArrayIsh(subject)) {\n      for (var i = 0; i < this.length; i++) {\n        if (subject instanceof Buffer) {\n          this.parent[i + this.offset] = subject.readUInt8(i);\n        }\n        else {\n          this.parent[i + this.offset] = subject[i];\n        }\n      }\n    } else if (type == 'string') {\n      // We are a string\n      this.length = this.write(subject, 0, encoding);\n    }\n  }\n\n}\n\nfunction isArrayIsh(subject) {\n  return Array.isArray(subject) || Buffer.isBuffer(subject) ||\n         subject && typeof subject === 'object' &&\n         typeof subject.length === 'number';\n}\n\nexports.SlowBuffer = SlowBuffer;\nexports.Buffer = Buffer;\n\nBuffer.poolSize = 8 * 1024;\nvar pool;\n\nfunction allocPool() {\n  pool = new SlowBuffer(Buffer.poolSize);\n  pool.used = 0;\n}\n\n\n// Static methods\nBuffer.isBuffer = function isBuffer(b) {\n  return b instanceof Buffer || b instanceof SlowBuffer;\n};\n\nBuffer.concat = function (list, totalLength) {\n  if (!Array.isArray(list)) {\n    throw new Error(\"Usage: Buffer.concat(list, [totalLength])\\n \\\n      list should be an Array.\");\n  }\n\n  if (list.length === 0) {\n    return new Buffer(0);\n  } else if (list.length === 1) {\n    return list[0];\n  }\n\n  if (typeof totalLength !== 'number') {\n    totalLength = 0;\n    for (var i = 0; i < list.length; i++) {\n      var buf = list[i];\n      totalLength += buf.length;\n    }\n  }\n\n  var buffer = new Buffer(totalLength);\n  var pos = 0;\n  for (var i = 0; i < list.length; i++) {\n    var buf = list[i];\n    buf.copy(buffer, pos);\n    pos += buf.length;\n  }\n  return buffer;\n};\n\n// Inspect\nBuffer.prototype.inspect = function inspect() {\n  var out = [],\n      len = this.length;\n\n  for (var i = 0; i < len; i++) {\n    out[i] = toHex(this.parent[i + this.offset]);\n    if (i == exports.INSPECT_MAX_BYTES) {\n      out[i + 1] = '...';\n      break;\n    }\n  }\n\n  return '<Buffer ' + out.join(' ') + '>';\n};\n\n\nBuffer.prototype.get = function get(i) {\n  if (i < 0 || i >= this.length) throw new Error('oob');\n  return this.parent[this.offset + i];\n};\n\n\nBuffer.prototype.set = function set(i, v) {\n  if (i < 0 || i >= this.length) throw new Error('oob');\n  return this.parent[this.offset + i] = v;\n};\n\n\n// write(string, offset = 0, length = buffer.length-offset, encoding = 'utf8')\nBuffer.prototype.write = function(string, offset, length, encoding) {\n  // Support both (string, offset, length, encoding)\n  // and the legacy (string, encoding, offset, length)\n  if (isFinite(offset)) {\n    if (!isFinite(length)) {\n      encoding = length;\n      length = undefined;\n    }\n  } else {  // legacy\n    var swap = encoding;\n    encoding = offset;\n    offset = length;\n    length = swap;\n  }\n\n  offset = +offset || 0;\n  var remaining = this.length - offset;\n  if (!length) {\n    length = remaining;\n  } else {\n    length = +length;\n    if (length > remaining) {\n      length = remaining;\n    }\n  }\n  encoding = String(encoding || 'utf8').toLowerCase();\n\n  var ret;\n  switch (encoding) {\n    case 'hex':\n      ret = this.parent.hexWrite(string, this.offset + offset, length);\n      break;\n\n    case 'utf8':\n    case 'utf-8':\n      ret = this.parent.utf8Write(string, this.offset + offset, length);\n      break;\n\n    case 'ascii':\n      ret = this.parent.asciiWrite(string, this.offset + offset, length);\n      break;\n\n    case 'binary':\n      ret = this.parent.binaryWrite(string, this.offset + offset, length);\n      break;\n\n    case 'base64':\n      // Warning: maxLength not taken into account in base64Write\n      ret = this.parent.base64Write(string, this.offset + offset, length);\n      break;\n\n    case 'ucs2':\n    case 'ucs-2':\n      ret = this.parent.ucs2Write(string, this.offset + offset, length);\n      break;\n\n    default:\n      throw new Error('Unknown encoding');\n  }\n\n  Buffer._charsWritten = SlowBuffer._charsWritten;\n\n  return ret;\n};\n\n\n// toString(encoding, start=0, end=buffer.length)\nBuffer.prototype.toString = function(encoding, start, end) {\n  encoding = String(encoding || 'utf8').toLowerCase();\n\n  if (typeof start == 'undefined' || start < 0) {\n    start = 0;\n  } else if (start > this.length) {\n    start = this.length;\n  }\n\n  if (typeof end == 'undefined' || end > this.length) {\n    end = this.length;\n  } else if (end < 0) {\n    end = 0;\n  }\n\n  start = start + this.offset;\n  end = end + this.offset;\n\n  switch (encoding) {\n    case 'hex':\n      return this.parent.hexSlice(start, end);\n\n    case 'utf8':\n    case 'utf-8':\n      return this.parent.utf8Slice(start, end);\n\n    case 'ascii':\n      return this.parent.asciiSlice(start, end);\n\n    case 'binary':\n      return this.parent.binarySlice(start, end);\n\n    case 'base64':\n      return this.parent.base64Slice(start, end);\n\n    case 'ucs2':\n    case 'ucs-2':\n      return this.parent.ucs2Slice(start, end);\n\n    default:\n      throw new Error('Unknown encoding');\n  }\n};\n\n\n// byteLength\nBuffer.byteLength = SlowBuffer.byteLength;\n\n\n// fill(value, start=0, end=buffer.length)\nBuffer.prototype.fill = function fill(value, start, end) {\n  value || (value = 0);\n  start || (start = 0);\n  end || (end = this.length);\n\n  if (typeof value === 'string') {\n    value = value.charCodeAt(0);\n  }\n  if (!(typeof value === 'number') || isNaN(value)) {\n    throw new Error('value is not a number');\n  }\n\n  if (end < start) throw new Error('end < start');\n\n  // Fill 0 bytes; we're done\n  if (end === start) return 0;\n  if (this.length == 0) return 0;\n\n  if (start < 0 || start >= this.length) {\n    throw new Error('start out of bounds');\n  }\n\n  if (end < 0 || end > this.length) {\n    throw new Error('end out of bounds');\n  }\n\n  return this.parent.fill(value,\n                          start + this.offset,\n                          end + this.offset);\n};\n\n\n// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)\nBuffer.prototype.copy = function(target, target_start, start, end) {\n  var source = this;\n  start || (start = 0);\n  end || (end = this.length);\n  target_start || (target_start = 0);\n\n  if (end < start) throw new Error('sourceEnd < sourceStart');\n\n  // Copy 0 bytes; we're done\n  if (end === start) return 0;\n  if (target.length == 0 || source.length == 0) return 0;\n\n  if (target_start < 0 || target_start >= target.length) {\n    throw new Error('targetStart out of bounds');\n  }\n\n  if (start < 0 || start >= source.length) {\n    throw new Error('sourceStart out of bounds');\n  }\n\n  if (end < 0 || end > source.length) {\n    throw new Error('sourceEnd out of bounds');\n  }\n\n  // Are we oob?\n  if (end > this.length) {\n    end = this.length;\n  }\n\n  if (target.length - target_start < end - start) {\n    end = target.length - target_start + start;\n  }\n\n  return this.parent.copy(target.parent,\n                          target_start + target.offset,\n                          start + this.offset,\n                          end + this.offset);\n};\n\n\n// slice(start, end)\nBuffer.prototype.slice = function(start, end) {\n  if (end === undefined) end = this.length;\n  if (end > this.length) throw new Error('oob');\n  if (start > end) throw new Error('oob');\n\n  return new Buffer(this.parent, end - start, +start + this.offset);\n};\n\n\n// Legacy methods for backwards compatibility.\n\nBuffer.prototype.utf8Slice = function(start, end) {\n  return this.toString('utf8', start, end);\n};\n\nBuffer.prototype.binarySlice = function(start, end) {\n  return this.toString('binary', start, end);\n};\n\nBuffer.prototype.asciiSlice = function(start, end) {\n  return this.toString('ascii', start, end);\n};\n\nBuffer.prototype.utf8Write = function(string, offset) {\n  return this.write(string, offset, 'utf8');\n};\n\nBuffer.prototype.binaryWrite = function(string, offset) {\n  return this.write(string, offset, 'binary');\n};\n\nBuffer.prototype.asciiWrite = function(string, offset) {\n  return this.write(string, offset, 'ascii');\n};\n\nBuffer.prototype.readUInt8 = function(offset, noAssert) {\n  var buffer = this;\n\n  if (!noAssert) {\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset < buffer.length,\n        'Trying to read beyond buffer length');\n  }\n\n  if (offset >= buffer.length) return;\n\n  return buffer.parent[buffer.offset + offset];\n};\n\nfunction readUInt16(buffer, offset, isBigEndian, noAssert) {\n  var val = 0;\n\n\n  if (!noAssert) {\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 1 < buffer.length,\n        'Trying to read beyond buffer length');\n  }\n\n  if (offset >= buffer.length) return 0;\n\n  if (isBigEndian) {\n    val = buffer.parent[buffer.offset + offset] << 8;\n    if (offset + 1 < buffer.length) {\n      val |= buffer.parent[buffer.offset + offset + 1];\n    }\n  } else {\n    val = buffer.parent[buffer.offset + offset];\n    if (offset + 1 < buffer.length) {\n      val |= buffer.parent[buffer.offset + offset + 1] << 8;\n    }\n  }\n\n  return val;\n}\n\nBuffer.prototype.readUInt16LE = function(offset, noAssert) {\n  return readUInt16(this, offset, false, noAssert);\n};\n\nBuffer.prototype.readUInt16BE = function(offset, noAssert) {\n  return readUInt16(this, offset, true, noAssert);\n};\n\nfunction readUInt32(buffer, offset, isBigEndian, noAssert) {\n  var val = 0;\n\n  if (!noAssert) {\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 3 < buffer.length,\n        'Trying to read beyond buffer length');\n  }\n\n  if (offset >= buffer.length) return 0;\n\n  if (isBigEndian) {\n    if (offset + 1 < buffer.length)\n      val = buffer.parent[buffer.offset + offset + 1] << 16;\n    if (offset + 2 < buffer.length)\n      val |= buffer.parent[buffer.offset + offset + 2] << 8;\n    if (offset + 3 < buffer.length)\n      val |= buffer.parent[buffer.offset + offset + 3];\n    val = val + (buffer.parent[buffer.offset + offset] << 24 >>> 0);\n  } else {\n    if (offset + 2 < buffer.length)\n      val = buffer.parent[buffer.offset + offset + 2] << 16;\n    if (offset + 1 < buffer.length)\n      val |= buffer.parent[buffer.offset + offset + 1] << 8;\n    val |= buffer.parent[buffer.offset + offset];\n    if (offset + 3 < buffer.length)\n      val = val + (buffer.parent[buffer.offset + offset + 3] << 24 >>> 0);\n  }\n\n  return val;\n}\n\nBuffer.prototype.readUInt32LE = function(offset, noAssert) {\n  return readUInt32(this, offset, false, noAssert);\n};\n\nBuffer.prototype.readUInt32BE = function(offset, noAssert) {\n  return readUInt32(this, offset, true, noAssert);\n};\n\n\n/*\n * Signed integer types, yay team! A reminder on how two's complement actually\n * works. The first bit is the signed bit, i.e. tells us whether or not the\n * number should be positive or negative. If the two's complement value is\n * positive, then we're done, as it's equivalent to the unsigned representation.\n *\n * Now if the number is positive, you're pretty much done, you can just leverage\n * the unsigned translations and return those. Unfortunately, negative numbers\n * aren't quite that straightforward.\n *\n * At first glance, one might be inclined to use the traditional formula to\n * translate binary numbers between the positive and negative values in two's\n * complement. (Though it doesn't quite work for the most negative value)\n * Mainly:\n *  - invert all the bits\n *  - add one to the result\n *\n * Of course, this doesn't quite work in Javascript. Take for example the value\n * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of\n * course, Javascript will do the following:\n *\n * > ~0xff80\n * -65409\n *\n * Whoh there, Javascript, that's not quite right. But wait, according to\n * Javascript that's perfectly correct. When Javascript ends up seeing the\n * constant 0xff80, it has no notion that it is actually a signed number. It\n * assumes that we've input the unsigned value 0xff80. Thus, when it does the\n * binary negation, it casts it into a signed value, (positive 0xff80). Then\n * when you perform binary negation on that, it turns it into a negative number.\n *\n * Instead, we're going to have to use the following general formula, that works\n * in a rather Javascript friendly way. I'm glad we don't support this kind of\n * weird numbering scheme in the kernel.\n *\n * (BIT-MAX - (unsigned)val + 1) * -1\n *\n * The astute observer, may think that this doesn't make sense for 8-bit numbers\n * (really it isn't necessary for them). However, when you get 16-bit numbers,\n * you do. Let's go back to our prior example and see how this will look:\n *\n * (0xffff - 0xff80 + 1) * -1\n * (0x007f + 1) * -1\n * (0x0080) * -1\n */\nBuffer.prototype.readInt8 = function(offset, noAssert) {\n  var buffer = this;\n  var neg;\n\n  if (!noAssert) {\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset < buffer.length,\n        'Trying to read beyond buffer length');\n  }\n\n  if (offset >= buffer.length) return;\n\n  neg = buffer.parent[buffer.offset + offset] & 0x80;\n  if (!neg) {\n    return (buffer.parent[buffer.offset + offset]);\n  }\n\n  return ((0xff - buffer.parent[buffer.offset + offset] + 1) * -1);\n};\n\nfunction readInt16(buffer, offset, isBigEndian, noAssert) {\n  var neg, val;\n\n  if (!noAssert) {\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 1 < buffer.length,\n        'Trying to read beyond buffer length');\n  }\n\n  val = readUInt16(buffer, offset, isBigEndian, noAssert);\n  neg = val & 0x8000;\n  if (!neg) {\n    return val;\n  }\n\n  return (0xffff - val + 1) * -1;\n}\n\nBuffer.prototype.readInt16LE = function(offset, noAssert) {\n  return readInt16(this, offset, false, noAssert);\n};\n\nBuffer.prototype.readInt16BE = function(offset, noAssert) {\n  return readInt16(this, offset, true, noAssert);\n};\n\nfunction readInt32(buffer, offset, isBigEndian, noAssert) {\n  var neg, val;\n\n  if (!noAssert) {\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 3 < buffer.length,\n        'Trying to read beyond buffer length');\n  }\n\n  val = readUInt32(buffer, offset, isBigEndian, noAssert);\n  neg = val & 0x80000000;\n  if (!neg) {\n    return (val);\n  }\n\n  return (0xffffffff - val + 1) * -1;\n}\n\nBuffer.prototype.readInt32LE = function(offset, noAssert) {\n  return readInt32(this, offset, false, noAssert);\n};\n\nBuffer.prototype.readInt32BE = function(offset, noAssert) {\n  return readInt32(this, offset, true, noAssert);\n};\n\nfunction readFloat(buffer, offset, isBigEndian, noAssert) {\n  if (!noAssert) {\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset + 3 < buffer.length,\n        'Trying to read beyond buffer length');\n  }\n\n  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,\n      23, 4);\n}\n\nBuffer.prototype.readFloatLE = function(offset, noAssert) {\n  return readFloat(this, offset, false, noAssert);\n};\n\nBuffer.prototype.readFloatBE = function(offset, noAssert) {\n  return readFloat(this, offset, true, noAssert);\n};\n\nfunction readDouble(buffer, offset, isBigEndian, noAssert) {\n  if (!noAssert) {\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset + 7 < buffer.length,\n        'Trying to read beyond buffer length');\n  }\n\n  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,\n      52, 8);\n}\n\nBuffer.prototype.readDoubleLE = function(offset, noAssert) {\n  return readDouble(this, offset, false, noAssert);\n};\n\nBuffer.prototype.readDoubleBE = function(offset, noAssert) {\n  return readDouble(this, offset, true, noAssert);\n};\n\n\n/*\n * We have to make sure that the value is a valid integer. This means that it is\n * non-negative. It has no fractional component and that it does not exceed the\n * maximum allowed value.\n *\n *      value           The number to check for validity\n *\n *      max             The maximum value\n */\nfunction verifuint(value, max) {\n  assert.ok(typeof (value) == 'number',\n      'cannot write a non-number as a number');\n\n  assert.ok(value >= 0,\n      'specified a negative value for writing an unsigned value');\n\n  assert.ok(value <= max, 'value is larger than maximum value for type');\n\n  assert.ok(Math.floor(value) === value, 'value has a fractional component');\n}\n\nBuffer.prototype.writeUInt8 = function(value, offset, noAssert) {\n  var buffer = this;\n\n  if (!noAssert) {\n    assert.ok(value !== undefined && value !== null,\n        'missing value');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset < buffer.length,\n        'trying to write beyond buffer length');\n\n    verifuint(value, 0xff);\n  }\n\n  if (offset < buffer.length) {\n    buffer.parent[buffer.offset + offset] = value;\n  }\n};\n\nfunction writeUInt16(buffer, value, offset, isBigEndian, noAssert) {\n  if (!noAssert) {\n    assert.ok(value !== undefined && value !== null,\n        'missing value');\n\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 1 < buffer.length,\n        'trying to write beyond buffer length');\n\n    verifuint(value, 0xffff);\n  }\n\n  for (var i = 0; i < Math.min(buffer.length - offset, 2); i++) {\n    buffer.parent[buffer.offset + offset + i] =\n        (value & (0xff << (8 * (isBigEndian ? 1 - i : i)))) >>>\n            (isBigEndian ? 1 - i : i) * 8;\n  }\n\n}\n\nBuffer.prototype.writeUInt16LE = function(value, offset, noAssert) {\n  writeUInt16(this, value, offset, false, noAssert);\n};\n\nBuffer.prototype.writeUInt16BE = function(value, offset, noAssert) {\n  writeUInt16(this, value, offset, true, noAssert);\n};\n\nfunction writeUInt32(buffer, value, offset, isBigEndian, noAssert) {\n  if (!noAssert) {\n    assert.ok(value !== undefined && value !== null,\n        'missing value');\n\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 3 < buffer.length,\n        'trying to write beyond buffer length');\n\n    verifuint(value, 0xffffffff);\n  }\n\n  for (var i = 0; i < Math.min(buffer.length - offset, 4); i++) {\n    buffer.parent[buffer.offset + offset + i] =\n        (value >>> (isBigEndian ? 3 - i : i) * 8) & 0xff;\n  }\n}\n\nBuffer.prototype.writeUInt32LE = function(value, offset, noAssert) {\n  writeUInt32(this, value, offset, false, noAssert);\n};\n\nBuffer.prototype.writeUInt32BE = function(value, offset, noAssert) {\n  writeUInt32(this, value, offset, true, noAssert);\n};\n\n\n/*\n * We now move onto our friends in the signed number category. Unlike unsigned\n * numbers, we're going to have to worry a bit more about how we put values into\n * arrays. Since we are only worrying about signed 32-bit values, we're in\n * slightly better shape. Unfortunately, we really can't do our favorite binary\n * & in this system. It really seems to do the wrong thing. For example:\n *\n * > -32 & 0xff\n * 224\n *\n * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of\n * this aren't treated as a signed number. Ultimately a bad thing.\n *\n * What we're going to want to do is basically create the unsigned equivalent of\n * our representation and pass that off to the wuint* functions. To do that\n * we're going to do the following:\n *\n *  - if the value is positive\n *      we can pass it directly off to the equivalent wuint\n *  - if the value is negative\n *      we do the following computation:\n *         mb + val + 1, where\n *         mb   is the maximum unsigned value in that byte size\n *         val  is the Javascript negative integer\n *\n *\n * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If\n * you do out the computations:\n *\n * 0xffff - 128 + 1\n * 0xffff - 127\n * 0xff80\n *\n * You can then encode this value as the signed version. This is really rather\n * hacky, but it should work and get the job done which is our goal here.\n */\n\n/*\n * A series of checks to make sure we actually have a signed 32-bit number\n */\nfunction verifsint(value, max, min) {\n  assert.ok(typeof (value) == 'number',\n      'cannot write a non-number as a number');\n\n  assert.ok(value <= max, 'value larger than maximum allowed value');\n\n  assert.ok(value >= min, 'value smaller than minimum allowed value');\n\n  assert.ok(Math.floor(value) === value, 'value has a fractional component');\n}\n\nfunction verifIEEE754(value, max, min) {\n  assert.ok(typeof (value) == 'number',\n      'cannot write a non-number as a number');\n\n  assert.ok(value <= max, 'value larger than maximum allowed value');\n\n  assert.ok(value >= min, 'value smaller than minimum allowed value');\n}\n\nBuffer.prototype.writeInt8 = function(value, offset, noAssert) {\n  var buffer = this;\n\n  if (!noAssert) {\n    assert.ok(value !== undefined && value !== null,\n        'missing value');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset < buffer.length,\n        'Trying to write beyond buffer length');\n\n    verifsint(value, 0x7f, -0x80);\n  }\n\n  if (value >= 0) {\n    buffer.writeUInt8(value, offset, noAssert);\n  } else {\n    buffer.writeUInt8(0xff + value + 1, offset, noAssert);\n  }\n};\n\nfunction writeInt16(buffer, value, offset, isBigEndian, noAssert) {\n  if (!noAssert) {\n    assert.ok(value !== undefined && value !== null,\n        'missing value');\n\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 1 < buffer.length,\n        'Trying to write beyond buffer length');\n\n    verifsint(value, 0x7fff, -0x8000);\n  }\n\n  if (value >= 0) {\n    writeUInt16(buffer, value, offset, isBigEndian, noAssert);\n  } else {\n    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);\n  }\n}\n\nBuffer.prototype.writeInt16LE = function(value, offset, noAssert) {\n  writeInt16(this, value, offset, false, noAssert);\n};\n\nBuffer.prototype.writeInt16BE = function(value, offset, noAssert) {\n  writeInt16(this, value, offset, true, noAssert);\n};\n\nfunction writeInt32(buffer, value, offset, isBigEndian, noAssert) {\n  if (!noAssert) {\n    assert.ok(value !== undefined && value !== null,\n        'missing value');\n\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 3 < buffer.length,\n        'Trying to write beyond buffer length');\n\n    verifsint(value, 0x7fffffff, -0x80000000);\n  }\n\n  if (value >= 0) {\n    writeUInt32(buffer, value, offset, isBigEndian, noAssert);\n  } else {\n    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);\n  }\n}\n\nBuffer.prototype.writeInt32LE = function(value, offset, noAssert) {\n  writeInt32(this, value, offset, false, noAssert);\n};\n\nBuffer.prototype.writeInt32BE = function(value, offset, noAssert) {\n  writeInt32(this, value, offset, true, noAssert);\n};\n\nfunction writeFloat(buffer, value, offset, isBigEndian, noAssert) {\n  if (!noAssert) {\n    assert.ok(value !== undefined && value !== null,\n        'missing value');\n\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 3 < buffer.length,\n        'Trying to write beyond buffer length');\n\n    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);\n  }\n\n  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,\n      23, 4);\n}\n\nBuffer.prototype.writeFloatLE = function(value, offset, noAssert) {\n  writeFloat(this, value, offset, false, noAssert);\n};\n\nBuffer.prototype.writeFloatBE = function(value, offset, noAssert) {\n  writeFloat(this, value, offset, true, noAssert);\n};\n\nfunction writeDouble(buffer, value, offset, isBigEndian, noAssert) {\n  if (!noAssert) {\n    assert.ok(value !== undefined && value !== null,\n        'missing value');\n\n    assert.ok(typeof (isBigEndian) === 'boolean',\n        'missing or invalid endian');\n\n    assert.ok(offset !== undefined && offset !== null,\n        'missing offset');\n\n    assert.ok(offset + 7 < buffer.length,\n        'Trying to write beyond buffer length');\n\n    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);\n  }\n\n  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,\n      52, 8);\n}\n\nBuffer.prototype.writeDoubleLE = function(value, offset, noAssert) {\n  writeDouble(this, value, offset, false, noAssert);\n};\n\nBuffer.prototype.writeDoubleBE = function(value, offset, noAssert) {\n  writeDouble(this, value, offset, true, noAssert);\n};\n\nSlowBuffer.prototype.readUInt8 = Buffer.prototype.readUInt8;\nSlowBuffer.prototype.readUInt16LE = Buffer.prototype.readUInt16LE;\nSlowBuffer.prototype.readUInt16BE = Buffer.prototype.readUInt16BE;\nSlowBuffer.prototype.readUInt32LE = Buffer.prototype.readUInt32LE;\nSlowBuffer.prototype.readUInt32BE = Buffer.prototype.readUInt32BE;\nSlowBuffer.prototype.readInt8 = Buffer.prototype.readInt8;\nSlowBuffer.prototype.readInt16LE = Buffer.prototype.readInt16LE;\nSlowBuffer.prototype.readInt16BE = Buffer.prototype.readInt16BE;\nSlowBuffer.prototype.readInt32LE = Buffer.prototype.readInt32LE;\nSlowBuffer.prototype.readInt32BE = Buffer.prototype.readInt32BE;\nSlowBuffer.prototype.readFloatLE = Buffer.prototype.readFloatLE;\nSlowBuffer.prototype.readFloatBE = Buffer.prototype.readFloatBE;\nSlowBuffer.prototype.readDoubleLE = Buffer.prototype.readDoubleLE;\nSlowBuffer.prototype.readDoubleBE = Buffer.prototype.readDoubleBE;\nSlowBuffer.prototype.writeUInt8 = Buffer.prototype.writeUInt8;\nSlowBuffer.prototype.writeUInt16LE = Buffer.prototype.writeUInt16LE;\nSlowBuffer.prototype.writeUInt16BE = Buffer.prototype.writeUInt16BE;\nSlowBuffer.prototype.writeUInt32LE = Buffer.prototype.writeUInt32LE;\nSlowBuffer.prototype.writeUInt32BE = Buffer.prototype.writeUInt32BE;\nSlowBuffer.prototype.writeInt8 = Buffer.prototype.writeInt8;\nSlowBuffer.prototype.writeInt16LE = Buffer.prototype.writeInt16LE;\nSlowBuffer.prototype.writeInt16BE = Buffer.prototype.writeInt16BE;\nSlowBuffer.prototype.writeInt32LE = Buffer.prototype.writeInt32LE;\nSlowBuffer.prototype.writeInt32BE = Buffer.prototype.writeInt32BE;\nSlowBuffer.prototype.writeFloatLE = Buffer.prototype.writeFloatLE;\nSlowBuffer.prototype.writeFloatBE = Buffer.prototype.writeFloatBE;\nSlowBuffer.prototype.writeDoubleLE = Buffer.prototype.writeDoubleLE;\nSlowBuffer.prototype.writeDoubleBE = Buffer.prototype.writeDoubleBE;\n\n//@ sourceURL=/node_modules/buffer-browserify/index.js"
));

require.define("assert",Function(['require','module','exports','__dirname','__filename','process','global'],"// UTILITY\nvar util = require('util');\nvar Buffer = require(\"buffer\").Buffer;\nvar pSlice = Array.prototype.slice;\n\nfunction objectKeys(object) {\n  if (Object.keys) return Object.keys(object);\n  var result = [];\n  for (var name in object) {\n    if (Object.prototype.hasOwnProperty.call(object, name)) {\n      result.push(name);\n    }\n  }\n  return result;\n}\n\n// 1. The assert module provides functions that throw\n// AssertionError's when particular conditions are not met. The\n// assert module must conform to the following interface.\n\nvar assert = module.exports = ok;\n\n// 2. The AssertionError is defined in assert.\n// new assert.AssertionError({ message: message,\n//                             actual: actual,\n//                             expected: expected })\n\nassert.AssertionError = function AssertionError(options) {\n  this.name = 'AssertionError';\n  this.message = options.message;\n  this.actual = options.actual;\n  this.expected = options.expected;\n  this.operator = options.operator;\n  var stackStartFunction = options.stackStartFunction || fail;\n\n  if (Error.captureStackTrace) {\n    Error.captureStackTrace(this, stackStartFunction);\n  }\n};\nutil.inherits(assert.AssertionError, Error);\n\nfunction replacer(key, value) {\n  if (value === undefined) {\n    return '' + value;\n  }\n  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {\n    return value.toString();\n  }\n  if (typeof value === 'function' || value instanceof RegExp) {\n    return value.toString();\n  }\n  return value;\n}\n\nfunction truncate(s, n) {\n  if (typeof s == 'string') {\n    return s.length < n ? s : s.slice(0, n);\n  } else {\n    return s;\n  }\n}\n\nassert.AssertionError.prototype.toString = function() {\n  if (this.message) {\n    return [this.name + ':', this.message].join(' ');\n  } else {\n    return [\n      this.name + ':',\n      truncate(JSON.stringify(this.actual, replacer), 128),\n      this.operator,\n      truncate(JSON.stringify(this.expected, replacer), 128)\n    ].join(' ');\n  }\n};\n\n// assert.AssertionError instanceof Error\n\nassert.AssertionError.__proto__ = Error.prototype;\n\n// At present only the three keys mentioned above are used and\n// understood by the spec. Implementations or sub modules can pass\n// other keys to the AssertionError's constructor - they will be\n// ignored.\n\n// 3. All of the following functions must throw an AssertionError\n// when a corresponding condition is not met, with a message that\n// may be undefined if not provided.  All assertion methods provide\n// both the actual and expected values to the assertion error for\n// display purposes.\n\nfunction fail(actual, expected, message, operator, stackStartFunction) {\n  throw new assert.AssertionError({\n    message: message,\n    actual: actual,\n    expected: expected,\n    operator: operator,\n    stackStartFunction: stackStartFunction\n  });\n}\n\n// EXTENSION! allows for well behaved errors defined elsewhere.\nassert.fail = fail;\n\n// 4. Pure assertion tests whether a value is truthy, as determined\n// by !!guard.\n// assert.ok(guard, message_opt);\n// This statement is equivalent to assert.equal(true, guard,\n// message_opt);. To test strictly for the value true, use\n// assert.strictEqual(true, guard, message_opt);.\n\nfunction ok(value, message) {\n  if (!!!value) fail(value, true, message, '==', assert.ok);\n}\nassert.ok = ok;\n\n// 5. The equality assertion tests shallow, coercive equality with\n// ==.\n// assert.equal(actual, expected, message_opt);\n\nassert.equal = function equal(actual, expected, message) {\n  if (actual != expected) fail(actual, expected, message, '==', assert.equal);\n};\n\n// 6. The non-equality assertion tests for whether two objects are not equal\n// with != assert.notEqual(actual, expected, message_opt);\n\nassert.notEqual = function notEqual(actual, expected, message) {\n  if (actual == expected) {\n    fail(actual, expected, message, '!=', assert.notEqual);\n  }\n};\n\n// 7. The equivalence assertion tests a deep equality relation.\n// assert.deepEqual(actual, expected, message_opt);\n\nassert.deepEqual = function deepEqual(actual, expected, message) {\n  if (!_deepEqual(actual, expected)) {\n    fail(actual, expected, message, 'deepEqual', assert.deepEqual);\n  }\n};\n\nfunction _deepEqual(actual, expected) {\n  // 7.1. All identical values are equivalent, as determined by ===.\n  if (actual === expected) {\n    return true;\n\n  } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {\n    if (actual.length != expected.length) return false;\n\n    for (var i = 0; i < actual.length; i++) {\n      if (actual[i] !== expected[i]) return false;\n    }\n\n    return true;\n\n  // 7.2. If the expected value is a Date object, the actual value is\n  // equivalent if it is also a Date object that refers to the same time.\n  } else if (actual instanceof Date && expected instanceof Date) {\n    return actual.getTime() === expected.getTime();\n\n  // 7.3. Other pairs that do not both pass typeof value == 'object',\n  // equivalence is determined by ==.\n  } else if (typeof actual != 'object' && typeof expected != 'object') {\n    return actual == expected;\n\n  // 7.4. For all other Object pairs, including Array objects, equivalence is\n  // determined by having the same number of owned properties (as verified\n  // with Object.prototype.hasOwnProperty.call), the same set of keys\n  // (although not necessarily the same order), equivalent values for every\n  // corresponding key, and an identical 'prototype' property. Note: this\n  // accounts for both named and indexed properties on Arrays.\n  } else {\n    return objEquiv(actual, expected);\n  }\n}\n\nfunction isUndefinedOrNull(value) {\n  return value === null || value === undefined;\n}\n\nfunction isArguments(object) {\n  return Object.prototype.toString.call(object) == '[object Arguments]';\n}\n\nfunction objEquiv(a, b) {\n  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))\n    return false;\n  // an identical 'prototype' property.\n  if (a.prototype !== b.prototype) return false;\n  //~~~I've managed to break Object.keys through screwy arguments passing.\n  //   Converting to array solves the problem.\n  if (isArguments(a)) {\n    if (!isArguments(b)) {\n      return false;\n    }\n    a = pSlice.call(a);\n    b = pSlice.call(b);\n    return _deepEqual(a, b);\n  }\n  try {\n    var ka = objectKeys(a),\n        kb = objectKeys(b),\n        key, i;\n  } catch (e) {//happens when one is a string literal and the other isn't\n    return false;\n  }\n  // having the same number of owned properties (keys incorporates\n  // hasOwnProperty)\n  if (ka.length != kb.length)\n    return false;\n  //the same set of keys (although not necessarily the same order),\n  ka.sort();\n  kb.sort();\n  //~~~cheap key test\n  for (i = ka.length - 1; i >= 0; i--) {\n    if (ka[i] != kb[i])\n      return false;\n  }\n  //equivalent values for every corresponding key, and\n  //~~~possibly expensive deep test\n  for (i = ka.length - 1; i >= 0; i--) {\n    key = ka[i];\n    if (!_deepEqual(a[key], b[key])) return false;\n  }\n  return true;\n}\n\n// 8. The non-equivalence assertion tests for any deep inequality.\n// assert.notDeepEqual(actual, expected, message_opt);\n\nassert.notDeepEqual = function notDeepEqual(actual, expected, message) {\n  if (_deepEqual(actual, expected)) {\n    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);\n  }\n};\n\n// 9. The strict equality assertion tests strict equality, as determined by ===.\n// assert.strictEqual(actual, expected, message_opt);\n\nassert.strictEqual = function strictEqual(actual, expected, message) {\n  if (actual !== expected) {\n    fail(actual, expected, message, '===', assert.strictEqual);\n  }\n};\n\n// 10. The strict non-equality assertion tests for strict inequality, as\n// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);\n\nassert.notStrictEqual = function notStrictEqual(actual, expected, message) {\n  if (actual === expected) {\n    fail(actual, expected, message, '!==', assert.notStrictEqual);\n  }\n};\n\nfunction expectedException(actual, expected) {\n  if (!actual || !expected) {\n    return false;\n  }\n\n  if (expected instanceof RegExp) {\n    return expected.test(actual);\n  } else if (actual instanceof expected) {\n    return true;\n  } else if (expected.call({}, actual) === true) {\n    return true;\n  }\n\n  return false;\n}\n\nfunction _throws(shouldThrow, block, expected, message) {\n  var actual;\n\n  if (typeof expected === 'string') {\n    message = expected;\n    expected = null;\n  }\n\n  try {\n    block();\n  } catch (e) {\n    actual = e;\n  }\n\n  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +\n            (message ? ' ' + message : '.');\n\n  if (shouldThrow && !actual) {\n    fail('Missing expected exception' + message);\n  }\n\n  if (!shouldThrow && expectedException(actual, expected)) {\n    fail('Got unwanted exception' + message);\n  }\n\n  if ((shouldThrow && actual && expected &&\n      !expectedException(actual, expected)) || (!shouldThrow && actual)) {\n    throw actual;\n  }\n}\n\n// 11. Expected to throw an error:\n// assert.throws(block, Error_opt, message_opt);\n\nassert.throws = function(block, /*optional*/error, /*optional*/message) {\n  _throws.apply(this, [true].concat(pSlice.call(arguments)));\n};\n\n// EXTENSION! This is annoying to write outside this module.\nassert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {\n  _throws.apply(this, [false].concat(pSlice.call(arguments)));\n};\n\nassert.ifError = function(err) { if (err) {throw err;}};\n\n//@ sourceURL=assert"
));

require.define("/node_modules/buffer-browserify/node_modules/base64-js/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"lib/b64.js\"}\n//@ sourceURL=/node_modules/buffer-browserify/node_modules/base64-js/package.json"
));

require.define("/node_modules/buffer-browserify/node_modules/base64-js/lib/b64.js",Function(['require','module','exports','__dirname','__filename','process','global'],"(function (exports) {\n\t'use strict';\n\n\tvar lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';\n\n\tfunction b64ToByteArray(b64) {\n\t\tvar i, j, l, tmp, placeHolders, arr;\n\t\n\t\tif (b64.length % 4 > 0) {\n\t\t\tthrow 'Invalid string. Length must be a multiple of 4';\n\t\t}\n\n\t\t// the number of equal signs (place holders)\n\t\t// if there are two placeholders, than the two characters before it\n\t\t// represent one byte\n\t\t// if there is only one, then the three characters before it represent 2 bytes\n\t\t// this is just a cheap hack to not do indexOf twice\n\t\tplaceHolders = b64.indexOf('=');\n\t\tplaceHolders = placeHolders > 0 ? b64.length - placeHolders : 0;\n\n\t\t// base64 is 4/3 + up to two characters of the original data\n\t\tarr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);\n\n\t\t// if there are placeholders, only get up to the last complete 4 chars\n\t\tl = placeHolders > 0 ? b64.length - 4 : b64.length;\n\n\t\tfor (i = 0, j = 0; i < l; i += 4, j += 3) {\n\t\t\ttmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);\n\t\t\tarr.push((tmp & 0xFF0000) >> 16);\n\t\t\tarr.push((tmp & 0xFF00) >> 8);\n\t\t\tarr.push(tmp & 0xFF);\n\t\t}\n\n\t\tif (placeHolders === 2) {\n\t\t\ttmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);\n\t\t\tarr.push(tmp & 0xFF);\n\t\t} else if (placeHolders === 1) {\n\t\t\ttmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);\n\t\t\tarr.push((tmp >> 8) & 0xFF);\n\t\t\tarr.push(tmp & 0xFF);\n\t\t}\n\n\t\treturn arr;\n\t}\n\n\tfunction uint8ToBase64(uint8) {\n\t\tvar i,\n\t\t\textraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes\n\t\t\toutput = \"\",\n\t\t\ttemp, length;\n\n\t\tfunction tripletToBase64 (num) {\n\t\t\treturn lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];\n\t\t};\n\n\t\t// go through the array every three bytes, we'll deal with trailing stuff later\n\t\tfor (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {\n\t\t\ttemp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);\n\t\t\toutput += tripletToBase64(temp);\n\t\t}\n\n\t\t// pad the end with zeros, but make sure to not forget the extra bytes\n\t\tswitch (extraBytes) {\n\t\t\tcase 1:\n\t\t\t\ttemp = uint8[uint8.length - 1];\n\t\t\t\toutput += lookup[temp >> 2];\n\t\t\t\toutput += lookup[(temp << 4) & 0x3F];\n\t\t\t\toutput += '==';\n\t\t\t\tbreak;\n\t\t\tcase 2:\n\t\t\t\ttemp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);\n\t\t\t\toutput += lookup[temp >> 10];\n\t\t\t\toutput += lookup[(temp >> 4) & 0x3F];\n\t\t\t\toutput += lookup[(temp << 2) & 0x3F];\n\t\t\t\toutput += '=';\n\t\t\t\tbreak;\n\t\t}\n\n\t\treturn output;\n\t}\n\n\tmodule.exports.toByteArray = b64ToByteArray;\n\tmodule.exports.fromByteArray = uint8ToBase64;\n}());\n\n//@ sourceURL=/node_modules/buffer-browserify/node_modules/base64-js/lib/b64.js"
));

require.define("/node_modules/buffer-browserify/buffer_ieee754.js",Function(['require','module','exports','__dirname','__filename','process','global'],"exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {\n  var e, m,\n      eLen = nBytes * 8 - mLen - 1,\n      eMax = (1 << eLen) - 1,\n      eBias = eMax >> 1,\n      nBits = -7,\n      i = isBE ? 0 : (nBytes - 1),\n      d = isBE ? 1 : -1,\n      s = buffer[offset + i];\n\n  i += d;\n\n  e = s & ((1 << (-nBits)) - 1);\n  s >>= (-nBits);\n  nBits += eLen;\n  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);\n\n  m = e & ((1 << (-nBits)) - 1);\n  e >>= (-nBits);\n  nBits += mLen;\n  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);\n\n  if (e === 0) {\n    e = 1 - eBias;\n  } else if (e === eMax) {\n    return m ? NaN : ((s ? -1 : 1) * Infinity);\n  } else {\n    m = m + Math.pow(2, mLen);\n    e = e - eBias;\n  }\n  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);\n};\n\nexports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {\n  var e, m, c,\n      eLen = nBytes * 8 - mLen - 1,\n      eMax = (1 << eLen) - 1,\n      eBias = eMax >> 1,\n      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),\n      i = isBE ? (nBytes - 1) : 0,\n      d = isBE ? -1 : 1,\n      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;\n\n  value = Math.abs(value);\n\n  if (isNaN(value) || value === Infinity) {\n    m = isNaN(value) ? 1 : 0;\n    e = eMax;\n  } else {\n    e = Math.floor(Math.log(value) / Math.LN2);\n    if (value * (c = Math.pow(2, -e)) < 1) {\n      e--;\n      c *= 2;\n    }\n    if (e + eBias >= 1) {\n      value += rt / c;\n    } else {\n      value += rt * Math.pow(2, 1 - eBias);\n    }\n    if (value * c >= 2) {\n      e++;\n      c /= 2;\n    }\n\n    if (e + eBias >= eMax) {\n      m = 0;\n      e = eMax;\n    } else if (e + eBias >= 1) {\n      m = (value * c - 1) * Math.pow(2, mLen);\n      e = e + eBias;\n    } else {\n      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);\n      e = 0;\n    }\n  }\n\n  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);\n\n  e = (e << mLen) | m;\n  eLen += mLen;\n  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);\n\n  buffer[offset + i - d] |= s * 128;\n};\n\n//@ sourceURL=/node_modules/buffer-browserify/buffer_ieee754.js"
));

require.define("/node_modules/derby/node_modules/tracks/lib/History.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var qs = require('qs')\n  , url = require('url')\n  , parseUrl = url.parse\n  , resolveUrl = url.resolve\n  , renderRoute = require('./router').render\n  , win = window\n  , winHistory = win.history\n  , winLocation = win.location\n  , doc = win.document\n  , currentPath = winLocation.pathname + winLocation.search\n\n// Replace the initial state with the current URL immediately,\n// so that it will be rendered if the state is later popped\nif (winHistory.replaceState) {\n  winHistory.replaceState({\n    $render: true,\n    $method: 'get'\n  }, null, winLocation.href)\n}\n\nmodule.exports = History\n\nfunction History(createPage, routes) {\n  this._createPage = createPage\n  this._routes = routes\n\n  if (winHistory.pushState) {\n    addListeners(this)\n    return\n  }\n  this.push = function(url) {\n    winLocation.assign(url)\n  }\n  this.replace = function(url) {\n    winLocation.replace(url)\n  }\n  this.refresh = function() {\n    winLocation.reload()\n  }\n}\n\nHistory.prototype = {\n  push: function(url, render, state, e) {\n    this._update('pushState', url, render, state, e)\n  }\n\n, replace: function(url, render, state, e) {\n    this._update('replaceState', url, render, state, e)\n  }\n\n  // Rerender the current url locally\n, refresh: function() {\n    var path = routePath(winLocation.href)\n    renderRoute(this.page(), {url: path, previous: path, method: 'get'})\n  }\n\n, back: function() {\n    winHistory.back()\n  }\n\n, forward: function() {\n    winHistory.forward()\n  }\n\n, go: function(i) {\n    winHistory.go(i)\n  }\n\n, _update: function(historyMethod, relativeUrl, render, state, e) {\n    var url = resolveUrl(winLocation.href, relativeUrl)\n      , path = routePath(url)\n      , options\n\n    // TODO: history.push should set the window.location with external urls\n    if (!path) return\n    if (render == null) render = true\n    if (state == null) state = {}\n\n    // Update the URL\n    options = renderOptions(e, path)\n    state.$render = true\n    state.$method = options.method\n    winHistory[historyMethod](state, null, url)\n    currentPath = winLocation.pathname + winLocation.search\n    if (render) renderRoute(this.page(), options, e)\n  }\n\n, page: function() {\n    if (this._page) return this._page\n\n    var page = this._page = this._createPage()\n      , history = this\n\n    function redirect(url) {\n      if (url === 'back') return history.back()\n      // TODO: Add support for `basepath` option like Express\n      if (url === 'home') url = '\\\\'\n      history.replace(url, true)\n    }\n\n    page.redirect = redirect\n    page._routes = this._routes\n    return page\n  }\n}\n\n// Get the pathname if it is on the same protocol and domain\nfunction routePath(url) {\n  var match = parseUrl(url)\n  return match &&\n    match.protocol === winLocation.protocol &&\n    match.host === winLocation.host &&\n    match.pathname + (match.search || '')\n}\n\nfunction renderOptions(e, path) {\n  var form, elements, query, name, value, override, method, body\n\n  // If this is a form submission, extract the form data and\n  // append it to the url for a get or params.body for a post\n  if (e && e.type === 'submit') {\n    form = e.target\n    elements = form.elements\n    query = []\n    for (var i = 0, len = elements.length, el; i < len; i++) {\n      el = elements[i]\n      if (name = el.name) {\n        value = el.value\n        query.push(encodeURIComponent(name) + '=' + encodeURIComponent(value))\n        if (name === '_method') {\n          override = value.toLowerCase()\n          if (override === 'delete') {\n            override = 'del'\n          }\n        }\n      }\n    }\n    query = query.join('&')\n    if (form.method.toLowerCase() === 'post') {\n      method = override || 'post'\n      body = qs.parse(query)\n    } else {\n      method = 'get'\n      path += '?' + query\n    }\n  } else {\n    method = 'get'\n  }\n  return {\n    method: method\n  , url: path\n  , previous: winLocation.pathname + winLocation.search\n  , body: body\n  , form: form\n  }\n}\n\nfunction addListeners(history) {\n\n  // Detect clicks on links\n  function onClick(e) {\n    var el = e.target\n      , url, hashIndex\n\n    // Ignore command click, control click, and non-left click\n    if (e.metaKey || e.which !== 1) return\n\n    // Ignore if already prevented\n    if (e.defaultPrevented || e.returnValue === false) return\n\n    // Also look up for parent links (<a><img></a>)\n    while (el) {\n      if (url = el.href) {\n\n        // Ignore links meant to open in a different window or frame\n        if (el.target && el.target !== '_self') return\n\n        // Ignore hash links to the same page\n        hashIndex = url.indexOf('#')\n        if (~hashIndex && url.slice(0, hashIndex) === winLocation.href.replace(/#.*/, '')) {\n          return\n        }\n\n        history.push(url, true, null, e)\n        return\n      }\n\n      el = el.parentNode\n    }\n  }\n\n  function onSubmit(e) {\n    var target = e.target\n      , url\n\n    // Ignore if already prevented\n    if (e.defaultPrevented || e.returnValue === false) return\n\n    // Only handle if emitted on a form element that isn't multipart\n    if (target.tagName.toLowerCase() !== 'form') return\n    if (target._forceSubmit || target.enctype === 'multipart/form-data') return\n\n    // Use the url from the form action, defaulting to the current url\n    url = target.action || winLocation.href\n    history.push(url, true, null, e)\n  }\n\n  function onPopState(e) {\n    var previous = currentPath\n      , state = e.state\n      , options\n    currentPath = winLocation.pathname + winLocation.search\n\n    options = {\n      previous: previous\n    , url: currentPath\n    }\n\n    if (state) {\n      if (!state.$render) return\n      options.method = state.$method\n      // Note that the post body is only sent on the initial reqest\n      // and it is empty if the state is later popped\n      return renderRoute(history.page(), options)\n    }\n\n    // The state object will be null for states created by jump links.\n    // window.location.hash cannot be used, because it returns nothing\n    // if the url ends in just a hash character\n    var url = winLocation.href\n      , hashIndex = url.indexOf('#')\n      , el, id\n    if (~hashIndex && currentPath !== previous) {\n      options.method = 'get'\n      renderRoute(history.page(), options)\n      id = url.slice(hashIndex + 1)\n      if (el = doc.getElementById(id) || doc.getElementsByName(id)[0]) {\n        el.scrollIntoView()\n      }\n    }\n  }\n\n  doc.addEventListener('click', onClick, false)\n  doc.addEventListener('submit', onSubmit, false)\n  win.addEventListener('popstate', onPopState, false)\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/tracks/lib/History.js"
));

require.define("/node_modules/derby/node_modules/tracks/node_modules/qs/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"index\"}\n//@ sourceURL=/node_modules/derby/node_modules/tracks/node_modules/qs/package.json"
));

require.define("/node_modules/derby/node_modules/tracks/node_modules/qs/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"\n/**\n * Object#toString() ref for stringify().\n */\n\nvar toString = Object.prototype.toString;\n\n/**\n * Cache non-integer test regexp.\n */\n\nvar isint = /^[0-9]+$/;\n\nfunction promote(parent, key) {\n  if (parent[key].length == 0) return parent[key] = {};\n  var t = {};\n  for (var i in parent[key]) t[i] = parent[key][i];\n  parent[key] = t;\n  return t;\n}\n\nfunction parse(parts, parent, key, val) {\n  var part = parts.shift();\n  // end\n  if (!part) {\n    if (Array.isArray(parent[key])) {\n      parent[key].push(val);\n    } else if ('object' == typeof parent[key]) {\n      parent[key] = val;\n    } else if ('undefined' == typeof parent[key]) {\n      parent[key] = val;\n    } else {\n      parent[key] = [parent[key], val];\n    }\n    // array\n  } else {\n    var obj = parent[key] = parent[key] || [];\n    if (']' == part) {\n      if (Array.isArray(obj)) {\n        if ('' != val) obj.push(val);\n      } else if ('object' == typeof obj) {\n        obj[Object.keys(obj).length] = val;\n      } else {\n        obj = parent[key] = [parent[key], val];\n      }\n      // prop\n    } else if (~part.indexOf(']')) {\n      part = part.substr(0, part.length - 1);\n      if (!isint.test(part) && Array.isArray(obj)) obj = promote(parent, key);\n      parse(parts, obj, part, val);\n      // key\n    } else {\n      if (!isint.test(part) && Array.isArray(obj)) obj = promote(parent, key);\n      parse(parts, obj, part, val);\n    }\n  }\n}\n\n/**\n * Merge parent key/val pair.\n */\n\nfunction merge(parent, key, val){\n  if (~key.indexOf(']')) {\n    var parts = key.split('[')\n      , len = parts.length\n      , last = len - 1;\n    parse(parts, parent, 'base', val);\n    // optimize\n  } else {\n    if (!isint.test(key) && Array.isArray(parent.base)) {\n      var t = {};\n      for (var k in parent.base) t[k] = parent.base[k];\n      parent.base = t;\n    }\n    set(parent.base, key, val);\n  }\n\n  return parent;\n}\n\n/**\n * Parse the given obj.\n */\n\nfunction parseObject(obj){\n  var ret = { base: {} };\n  Object.keys(obj).forEach(function(name){\n    merge(ret, name, obj[name]);\n  });\n  return ret.base;\n}\n\n/**\n * Parse the given str.\n */\n\nfunction parseString(str){\n  return String(str)\n    .split('&')\n    .reduce(function(ret, pair){\n      var eql = pair.indexOf('=')\n        , brace = lastBraceInKey(pair)\n        , key = pair.substr(0, brace || eql)\n        , val = pair.substr(brace || eql, pair.length)\n        , val = val.substr(val.indexOf('=') + 1, val.length);\n\n      // ?foo\n      if ('' == key) key = pair, val = '';\n\n      return merge(ret, decode(key), decode(val));\n    }, { base: {} }).base;\n}\n\n/**\n * Parse the given query `str` or `obj`, returning an object.\n *\n * @param {String} str | {Object} obj\n * @return {Object}\n * @api public\n */\n\nexports.parse = function(str){\n  if (null == str || '' == str) return {};\n  return 'object' == typeof str\n    ? parseObject(str)\n    : parseString(str);\n};\n\n/**\n * Turn the given `obj` into a query string\n *\n * @param {Object} obj\n * @return {String}\n * @api public\n */\n\nvar stringify = exports.stringify = function(obj, prefix) {\n  if (Array.isArray(obj)) {\n    return stringifyArray(obj, prefix);\n  } else if ('[object Object]' == toString.call(obj)) {\n    return stringifyObject(obj, prefix);\n  } else if ('string' == typeof obj) {\n    return stringifyString(obj, prefix);\n  } else {\n    return prefix + '=' + encodeURIComponent(String(obj));\n  }\n};\n\n/**\n * Stringify the given `str`.\n *\n * @param {String} str\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyString(str, prefix) {\n  if (!prefix) throw new TypeError('stringify expects an object');\n  return prefix + '=' + encodeURIComponent(str);\n}\n\n/**\n * Stringify the given `arr`.\n *\n * @param {Array} arr\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyArray(arr, prefix) {\n  var ret = [];\n  if (!prefix) throw new TypeError('stringify expects an object');\n  for (var i = 0; i < arr.length; i++) {\n    ret.push(stringify(arr[i], prefix + '[' + i + ']'));\n  }\n  return ret.join('&');\n}\n\n/**\n * Stringify the given `obj`.\n *\n * @param {Object} obj\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyObject(obj, prefix) {\n  var ret = []\n    , keys = Object.keys(obj)\n    , key;\n\n  for (var i = 0, len = keys.length; i < len; ++i) {\n    key = keys[i];\n    ret.push(stringify(obj[key], prefix\n      ? prefix + '[' + encodeURIComponent(key) + ']'\n      : encodeURIComponent(key)));\n  }\n\n  return ret.join('&');\n}\n\n/**\n * Set `obj`'s `key` to `val` respecting\n * the weird and wonderful syntax of a qs,\n * where \"foo=bar&foo=baz\" becomes an array.\n *\n * @param {Object} obj\n * @param {String} key\n * @param {String} val\n * @api private\n */\n\nfunction set(obj, key, val) {\n  var v = obj[key];\n  if (undefined === v) {\n    obj[key] = val;\n  } else if (Array.isArray(v)) {\n    v.push(val);\n  } else {\n    obj[key] = [v, val];\n  }\n}\n\n/**\n * Locate last brace in `str` within the key.\n *\n * @param {String} str\n * @return {Number}\n * @api private\n */\n\nfunction lastBraceInKey(str) {\n  var len = str.length\n    , brace\n    , c;\n  for (var i = 0; i < len; ++i) {\n    c = str[i];\n    if (']' == c) brace = false;\n    if ('[' == c) brace = true;\n    if ('=' == c && !brace) return i;\n  }\n}\n\n/**\n * Decode `str`.\n *\n * @param {String} str\n * @return {String}\n * @api private\n */\n\nfunction decode(str) {\n  try {\n    return decodeURIComponent(str.replace(/\\+/g, ' '));\n  } catch (err) {\n    return str;\n  }\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/tracks/node_modules/qs/index.js"
));

require.define("url",Function(['require','module','exports','__dirname','__filename','process','global'],"var punycode = { encode : function (s) { return s } };\n\nexports.parse = urlParse;\nexports.resolve = urlResolve;\nexports.resolveObject = urlResolveObject;\nexports.format = urlFormat;\n\nfunction arrayIndexOf(array, subject) {\n    for (var i = 0, j = array.length; i < j; i++) {\n        if(array[i] == subject) return i;\n    }\n    return -1;\n}\n\nvar objectKeys = Object.keys || function objectKeys(object) {\n    if (object !== Object(object)) throw new TypeError('Invalid object');\n    var keys = [];\n    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;\n    return keys;\n}\n\n// Reference: RFC 3986, RFC 1808, RFC 2396\n\n// define these here so at least they only have to be\n// compiled once on the first module load.\nvar protocolPattern = /^([a-z0-9.+-]+:)/i,\n    portPattern = /:[0-9]+$/,\n    // RFC 2396: characters reserved for delimiting URLs.\n    delims = ['<', '>', '\"', '`', ' ', '\\r', '\\n', '\\t'],\n    // RFC 2396: characters not allowed for various reasons.\n    unwise = ['{', '}', '|', '\\\\', '^', '~', '[', ']', '`'].concat(delims),\n    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.\n    autoEscape = ['\\''],\n    // Characters that are never ever allowed in a hostname.\n    // Note that any invalid chars are also handled, but these\n    // are the ones that are *expected* to be seen, so we fast-path\n    // them.\n    nonHostChars = ['%', '/', '?', ';', '#']\n      .concat(unwise).concat(autoEscape),\n    nonAuthChars = ['/', '@', '?', '#'].concat(delims),\n    hostnameMaxLen = 255,\n    hostnamePartPattern = /^[a-zA-Z0-9][a-z0-9A-Z_-]{0,62}$/,\n    hostnamePartStart = /^([a-zA-Z0-9][a-z0-9A-Z_-]{0,62})(.*)$/,\n    // protocols that can allow \"unsafe\" and \"unwise\" chars.\n    unsafeProtocol = {\n      'javascript': true,\n      'javascript:': true\n    },\n    // protocols that never have a hostname.\n    hostlessProtocol = {\n      'javascript': true,\n      'javascript:': true\n    },\n    // protocols that always have a path component.\n    pathedProtocol = {\n      'http': true,\n      'https': true,\n      'ftp': true,\n      'gopher': true,\n      'file': true,\n      'http:': true,\n      'ftp:': true,\n      'gopher:': true,\n      'file:': true\n    },\n    // protocols that always contain a // bit.\n    slashedProtocol = {\n      'http': true,\n      'https': true,\n      'ftp': true,\n      'gopher': true,\n      'file': true,\n      'http:': true,\n      'https:': true,\n      'ftp:': true,\n      'gopher:': true,\n      'file:': true\n    },\n    querystring = require('querystring');\n\nfunction urlParse(url, parseQueryString, slashesDenoteHost) {\n  if (url && typeof(url) === 'object' && url.href) return url;\n\n  if (typeof url !== 'string') {\n    throw new TypeError(\"Parameter 'url' must be a string, not \" + typeof url);\n  }\n\n  var out = {},\n      rest = url;\n\n  // cut off any delimiters.\n  // This is to support parse stuff like \"<http://foo.com>\"\n  for (var i = 0, l = rest.length; i < l; i++) {\n    if (arrayIndexOf(delims, rest.charAt(i)) === -1) break;\n  }\n  if (i !== 0) rest = rest.substr(i);\n\n\n  var proto = protocolPattern.exec(rest);\n  if (proto) {\n    proto = proto[0];\n    var lowerProto = proto.toLowerCase();\n    out.protocol = lowerProto;\n    rest = rest.substr(proto.length);\n  }\n\n  // figure out if it's got a host\n  // user@server is *always* interpreted as a hostname, and url\n  // resolution will treat //foo/bar as host=foo,path=bar because that's\n  // how the browser resolves relative URLs.\n  if (slashesDenoteHost || proto || rest.match(/^\\/\\/[^@\\/]+@[^@\\/]+/)) {\n    var slashes = rest.substr(0, 2) === '//';\n    if (slashes && !(proto && hostlessProtocol[proto])) {\n      rest = rest.substr(2);\n      out.slashes = true;\n    }\n  }\n\n  if (!hostlessProtocol[proto] &&\n      (slashes || (proto && !slashedProtocol[proto]))) {\n    // there's a hostname.\n    // the first instance of /, ?, ;, or # ends the host.\n    // don't enforce full RFC correctness, just be unstupid about it.\n\n    // If there is an @ in the hostname, then non-host chars *are* allowed\n    // to the left of the first @ sign, unless some non-auth character\n    // comes *before* the @-sign.\n    // URLs are obnoxious.\n    var atSign = arrayIndexOf(rest, '@');\n    if (atSign !== -1) {\n      // there *may be* an auth\n      var hasAuth = true;\n      for (var i = 0, l = nonAuthChars.length; i < l; i++) {\n        var index = arrayIndexOf(rest, nonAuthChars[i]);\n        if (index !== -1 && index < atSign) {\n          // not a valid auth.  Something like http://foo.com/bar@baz/\n          hasAuth = false;\n          break;\n        }\n      }\n      if (hasAuth) {\n        // pluck off the auth portion.\n        out.auth = rest.substr(0, atSign);\n        rest = rest.substr(atSign + 1);\n      }\n    }\n\n    var firstNonHost = -1;\n    for (var i = 0, l = nonHostChars.length; i < l; i++) {\n      var index = arrayIndexOf(rest, nonHostChars[i]);\n      if (index !== -1 &&\n          (firstNonHost < 0 || index < firstNonHost)) firstNonHost = index;\n    }\n\n    if (firstNonHost !== -1) {\n      out.host = rest.substr(0, firstNonHost);\n      rest = rest.substr(firstNonHost);\n    } else {\n      out.host = rest;\n      rest = '';\n    }\n\n    // pull out port.\n    var p = parseHost(out.host);\n    var keys = objectKeys(p);\n    for (var i = 0, l = keys.length; i < l; i++) {\n      var key = keys[i];\n      out[key] = p[key];\n    }\n\n    // we've indicated that there is a hostname,\n    // so even if it's empty, it has to be present.\n    out.hostname = out.hostname || '';\n\n    // validate a little.\n    if (out.hostname.length > hostnameMaxLen) {\n      out.hostname = '';\n    } else {\n      var hostparts = out.hostname.split(/\\./);\n      for (var i = 0, l = hostparts.length; i < l; i++) {\n        var part = hostparts[i];\n        if (!part) continue;\n        if (!part.match(hostnamePartPattern)) {\n          var newpart = '';\n          for (var j = 0, k = part.length; j < k; j++) {\n            if (part.charCodeAt(j) > 127) {\n              // we replace non-ASCII char with a temporary placeholder\n              // we need this to make sure size of hostname is not\n              // broken by replacing non-ASCII by nothing\n              newpart += 'x';\n            } else {\n              newpart += part[j];\n            }\n          }\n          // we test again with ASCII char only\n          if (!newpart.match(hostnamePartPattern)) {\n            var validParts = hostparts.slice(0, i);\n            var notHost = hostparts.slice(i + 1);\n            var bit = part.match(hostnamePartStart);\n            if (bit) {\n              validParts.push(bit[1]);\n              notHost.unshift(bit[2]);\n            }\n            if (notHost.length) {\n              rest = '/' + notHost.join('.') + rest;\n            }\n            out.hostname = validParts.join('.');\n            break;\n          }\n        }\n      }\n    }\n\n    // hostnames are always lower case.\n    out.hostname = out.hostname.toLowerCase();\n\n    // IDNA Support: Returns a puny coded representation of \"domain\".\n    // It only converts the part of the domain name that\n    // has non ASCII characters. I.e. it dosent matter if\n    // you call it with a domain that already is in ASCII.\n    var domainArray = out.hostname.split('.');\n    var newOut = [];\n    for (var i = 0; i < domainArray.length; ++i) {\n      var s = domainArray[i];\n      newOut.push(s.match(/[^A-Za-z0-9_-]/) ?\n          'xn--' + punycode.encode(s) : s);\n    }\n    out.hostname = newOut.join('.');\n\n    out.host = (out.hostname || '') +\n        ((out.port) ? ':' + out.port : '');\n    out.href += out.host;\n  }\n\n  // now rest is set to the post-host stuff.\n  // chop off any delim chars.\n  if (!unsafeProtocol[lowerProto]) {\n\n    // First, make 100% sure that any \"autoEscape\" chars get\n    // escaped, even if encodeURIComponent doesn't think they\n    // need to be.\n    for (var i = 0, l = autoEscape.length; i < l; i++) {\n      var ae = autoEscape[i];\n      var esc = encodeURIComponent(ae);\n      if (esc === ae) {\n        esc = escape(ae);\n      }\n      rest = rest.split(ae).join(esc);\n    }\n\n    // Now make sure that delims never appear in a url.\n    var chop = rest.length;\n    for (var i = 0, l = delims.length; i < l; i++) {\n      var c = arrayIndexOf(rest, delims[i]);\n      if (c !== -1) {\n        chop = Math.min(c, chop);\n      }\n    }\n    rest = rest.substr(0, chop);\n  }\n\n\n  // chop off from the tail first.\n  var hash = arrayIndexOf(rest, '#');\n  if (hash !== -1) {\n    // got a fragment string.\n    out.hash = rest.substr(hash);\n    rest = rest.slice(0, hash);\n  }\n  var qm = arrayIndexOf(rest, '?');\n  if (qm !== -1) {\n    out.search = rest.substr(qm);\n    out.query = rest.substr(qm + 1);\n    if (parseQueryString) {\n      out.query = querystring.parse(out.query);\n    }\n    rest = rest.slice(0, qm);\n  } else if (parseQueryString) {\n    // no query string, but parseQueryString still requested\n    out.search = '';\n    out.query = {};\n  }\n  if (rest) out.pathname = rest;\n  if (slashedProtocol[proto] &&\n      out.hostname && !out.pathname) {\n    out.pathname = '/';\n  }\n\n  //to support http.request\n  if (out.pathname || out.search) {\n    out.path = (out.pathname ? out.pathname : '') +\n               (out.search ? out.search : '');\n  }\n\n  // finally, reconstruct the href based on what has been validated.\n  out.href = urlFormat(out);\n  return out;\n}\n\n// format a parsed object into a url string\nfunction urlFormat(obj) {\n  // ensure it's an object, and not a string url.\n  // If it's an obj, this is a no-op.\n  // this way, you can call url_format() on strings\n  // to clean up potentially wonky urls.\n  if (typeof(obj) === 'string') obj = urlParse(obj);\n\n  var auth = obj.auth || '';\n  if (auth) {\n    auth = auth.split('@').join('%40');\n    for (var i = 0, l = nonAuthChars.length; i < l; i++) {\n      var nAC = nonAuthChars[i];\n      auth = auth.split(nAC).join(encodeURIComponent(nAC));\n    }\n    auth += '@';\n  }\n\n  var protocol = obj.protocol || '',\n      host = (obj.host !== undefined) ? auth + obj.host :\n          obj.hostname !== undefined ? (\n              auth + obj.hostname +\n              (obj.port ? ':' + obj.port : '')\n          ) :\n          false,\n      pathname = obj.pathname || '',\n      query = obj.query &&\n              ((typeof obj.query === 'object' &&\n                objectKeys(obj.query).length) ?\n                 querystring.stringify(obj.query) :\n                 '') || '',\n      search = obj.search || (query && ('?' + query)) || '',\n      hash = obj.hash || '';\n\n  if (protocol && protocol.substr(-1) !== ':') protocol += ':';\n\n  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.\n  // unless they had them to begin with.\n  if (obj.slashes ||\n      (!protocol || slashedProtocol[protocol]) && host !== false) {\n    host = '//' + (host || '');\n    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;\n  } else if (!host) {\n    host = '';\n  }\n\n  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;\n  if (search && search.charAt(0) !== '?') search = '?' + search;\n\n  return protocol + host + pathname + search + hash;\n}\n\nfunction urlResolve(source, relative) {\n  return urlFormat(urlResolveObject(source, relative));\n}\n\nfunction urlResolveObject(source, relative) {\n  if (!source) return relative;\n\n  source = urlParse(urlFormat(source), false, true);\n  relative = urlParse(urlFormat(relative), false, true);\n\n  // hash is always overridden, no matter what.\n  source.hash = relative.hash;\n\n  if (relative.href === '') {\n    source.href = urlFormat(source);\n    return source;\n  }\n\n  // hrefs like //foo/bar always cut to the protocol.\n  if (relative.slashes && !relative.protocol) {\n    relative.protocol = source.protocol;\n    //urlParse appends trailing / to urls like http://www.example.com\n    if (slashedProtocol[relative.protocol] &&\n        relative.hostname && !relative.pathname) {\n      relative.path = relative.pathname = '/';\n    }\n    relative.href = urlFormat(relative);\n    return relative;\n  }\n\n  if (relative.protocol && relative.protocol !== source.protocol) {\n    // if it's a known url protocol, then changing\n    // the protocol does weird things\n    // first, if it's not file:, then we MUST have a host,\n    // and if there was a path\n    // to begin with, then we MUST have a path.\n    // if it is file:, then the host is dropped,\n    // because that's known to be hostless.\n    // anything else is assumed to be absolute.\n    if (!slashedProtocol[relative.protocol]) {\n      relative.href = urlFormat(relative);\n      return relative;\n    }\n    source.protocol = relative.protocol;\n    if (!relative.host && !hostlessProtocol[relative.protocol]) {\n      var relPath = (relative.pathname || '').split('/');\n      while (relPath.length && !(relative.host = relPath.shift()));\n      if (!relative.host) relative.host = '';\n      if (!relative.hostname) relative.hostname = '';\n      if (relPath[0] !== '') relPath.unshift('');\n      if (relPath.length < 2) relPath.unshift('');\n      relative.pathname = relPath.join('/');\n    }\n    source.pathname = relative.pathname;\n    source.search = relative.search;\n    source.query = relative.query;\n    source.host = relative.host || '';\n    source.auth = relative.auth;\n    source.hostname = relative.hostname || relative.host;\n    source.port = relative.port;\n    //to support http.request\n    if (source.pathname !== undefined || source.search !== undefined) {\n      source.path = (source.pathname ? source.pathname : '') +\n                    (source.search ? source.search : '');\n    }\n    source.slashes = source.slashes || relative.slashes;\n    source.href = urlFormat(source);\n    return source;\n  }\n\n  var isSourceAbs = (source.pathname && source.pathname.charAt(0) === '/'),\n      isRelAbs = (\n          relative.host !== undefined ||\n          relative.pathname && relative.pathname.charAt(0) === '/'\n      ),\n      mustEndAbs = (isRelAbs || isSourceAbs ||\n                    (source.host && relative.pathname)),\n      removeAllDots = mustEndAbs,\n      srcPath = source.pathname && source.pathname.split('/') || [],\n      relPath = relative.pathname && relative.pathname.split('/') || [],\n      psychotic = source.protocol &&\n          !slashedProtocol[source.protocol];\n\n  // if the url is a non-slashed url, then relative\n  // links like ../.. should be able\n  // to crawl up to the hostname, as well.  This is strange.\n  // source.protocol has already been set by now.\n  // Later on, put the first path part into the host field.\n  if (psychotic) {\n\n    delete source.hostname;\n    delete source.port;\n    if (source.host) {\n      if (srcPath[0] === '') srcPath[0] = source.host;\n      else srcPath.unshift(source.host);\n    }\n    delete source.host;\n    if (relative.protocol) {\n      delete relative.hostname;\n      delete relative.port;\n      if (relative.host) {\n        if (relPath[0] === '') relPath[0] = relative.host;\n        else relPath.unshift(relative.host);\n      }\n      delete relative.host;\n    }\n    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');\n  }\n\n  if (isRelAbs) {\n    // it's absolute.\n    source.host = (relative.host || relative.host === '') ?\n                      relative.host : source.host;\n    source.hostname = (relative.hostname || relative.hostname === '') ?\n                      relative.hostname : source.hostname;\n    source.search = relative.search;\n    source.query = relative.query;\n    srcPath = relPath;\n    // fall through to the dot-handling below.\n  } else if (relPath.length) {\n    // it's relative\n    // throw away the existing file, and take the new path instead.\n    if (!srcPath) srcPath = [];\n    srcPath.pop();\n    srcPath = srcPath.concat(relPath);\n    source.search = relative.search;\n    source.query = relative.query;\n  } else if ('search' in relative) {\n    // just pull out the search.\n    // like href='?foo'.\n    // Put this after the other two cases because it simplifies the booleans\n    if (psychotic) {\n      source.hostname = source.host = srcPath.shift();\n      //occationaly the auth can get stuck only in host\n      //this especialy happens in cases like\n      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')\n      var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?\n                       source.host.split('@') : false;\n      if (authInHost) {\n        source.auth = authInHost.shift();\n        source.host = source.hostname = authInHost.shift();\n      }\n    }\n    source.search = relative.search;\n    source.query = relative.query;\n    //to support http.request\n    if (source.pathname !== undefined || source.search !== undefined) {\n      source.path = (source.pathname ? source.pathname : '') +\n                    (source.search ? source.search : '');\n    }\n    source.href = urlFormat(source);\n    return source;\n  }\n  if (!srcPath.length) {\n    // no path at all.  easy.\n    // we've already handled the other stuff above.\n    delete source.pathname;\n    //to support http.request\n    if (!source.search) {\n      source.path = '/' + source.search;\n    } else {\n      delete source.path;\n    }\n    source.href = urlFormat(source);\n    return source;\n  }\n  // if a url ENDs in . or .., then it must get a trailing slash.\n  // however, if it ends in anything else non-slashy,\n  // then it must NOT get a trailing slash.\n  var last = srcPath.slice(-1)[0];\n  var hasTrailingSlash = (\n      (source.host || relative.host) && (last === '.' || last === '..') ||\n      last === '');\n\n  // strip single dots, resolve double dots to parent dir\n  // if the path tries to go above the root, `up` ends up > 0\n  var up = 0;\n  for (var i = srcPath.length; i >= 0; i--) {\n    last = srcPath[i];\n    if (last == '.') {\n      srcPath.splice(i, 1);\n    } else if (last === '..') {\n      srcPath.splice(i, 1);\n      up++;\n    } else if (up) {\n      srcPath.splice(i, 1);\n      up--;\n    }\n  }\n\n  // if the path is allowed to go above the root, restore leading ..s\n  if (!mustEndAbs && !removeAllDots) {\n    for (; up--; up) {\n      srcPath.unshift('..');\n    }\n  }\n\n  if (mustEndAbs && srcPath[0] !== '' &&\n      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {\n    srcPath.unshift('');\n  }\n\n  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {\n    srcPath.push('');\n  }\n\n  var isAbsolute = srcPath[0] === '' ||\n      (srcPath[0] && srcPath[0].charAt(0) === '/');\n\n  // put the host back\n  if (psychotic) {\n    source.hostname = source.host = isAbsolute ? '' :\n                                    srcPath.length ? srcPath.shift() : '';\n    //occationaly the auth can get stuck only in host\n    //this especialy happens in cases like\n    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')\n    var authInHost = source.host && arrayIndexOf(source.host, '@') > 0 ?\n                     source.host.split('@') : false;\n    if (authInHost) {\n      source.auth = authInHost.shift();\n      source.host = source.hostname = authInHost.shift();\n    }\n  }\n\n  mustEndAbs = mustEndAbs || (source.host && srcPath.length);\n\n  if (mustEndAbs && !isAbsolute) {\n    srcPath.unshift('');\n  }\n\n  source.pathname = srcPath.join('/');\n  //to support request.http\n  if (source.pathname !== undefined || source.search !== undefined) {\n    source.path = (source.pathname ? source.pathname : '') +\n                  (source.search ? source.search : '');\n  }\n  source.auth = relative.auth || source.auth;\n  source.slashes = source.slashes || relative.slashes;\n  source.href = urlFormat(source);\n  return source;\n}\n\nfunction parseHost(host) {\n  var out = {};\n  var port = portPattern.exec(host);\n  if (port) {\n    port = port[0];\n    out.port = port.substr(1);\n    host = host.substr(0, host.length - port.length);\n  }\n  if (host) out.hostname = host;\n  return out;\n}\n\n//@ sourceURL=url"
));

require.define("querystring",Function(['require','module','exports','__dirname','__filename','process','global'],"var isArray = typeof Array.isArray === 'function'\n    ? Array.isArray\n    : function (xs) {\n        return Object.prototype.toString.call(xs) === '[object Array]'\n    };\n\nvar objectKeys = Object.keys || function objectKeys(object) {\n    if (object !== Object(object)) throw new TypeError('Invalid object');\n    var keys = [];\n    for (var key in object) if (object.hasOwnProperty(key)) keys[keys.length] = key;\n    return keys;\n}\n\n\n/*!\n * querystring\n * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>\n * MIT Licensed\n */\n\n/**\n * Library version.\n */\n\nexports.version = '0.3.1';\n\n/**\n * Object#toString() ref for stringify().\n */\n\nvar toString = Object.prototype.toString;\n\n/**\n * Cache non-integer test regexp.\n */\n\nvar notint = /[^0-9]/;\n\n/**\n * Parse the given query `str`, returning an object.\n *\n * @param {String} str\n * @return {Object}\n * @api public\n */\n\nexports.parse = function(str){\n  if (null == str || '' == str) return {};\n\n  function promote(parent, key) {\n    if (parent[key].length == 0) return parent[key] = {};\n    var t = {};\n    for (var i in parent[key]) t[i] = parent[key][i];\n    parent[key] = t;\n    return t;\n  }\n\n  return String(str)\n    .split('&')\n    .reduce(function(ret, pair){\n      try{ \n        pair = decodeURIComponent(pair.replace(/\\+/g, ' '));\n      } catch(e) {\n        // ignore\n      }\n\n      var eql = pair.indexOf('=')\n        , brace = lastBraceInKey(pair)\n        , key = pair.substr(0, brace || eql)\n        , val = pair.substr(brace || eql, pair.length)\n        , val = val.substr(val.indexOf('=') + 1, val.length)\n        , parent = ret;\n\n      // ?foo\n      if ('' == key) key = pair, val = '';\n\n      // nested\n      if (~key.indexOf(']')) {\n        var parts = key.split('[')\n          , len = parts.length\n          , last = len - 1;\n\n        function parse(parts, parent, key) {\n          var part = parts.shift();\n\n          // end\n          if (!part) {\n            if (isArray(parent[key])) {\n              parent[key].push(val);\n            } else if ('object' == typeof parent[key]) {\n              parent[key] = val;\n            } else if ('undefined' == typeof parent[key]) {\n              parent[key] = val;\n            } else {\n              parent[key] = [parent[key], val];\n            }\n          // array\n          } else {\n            obj = parent[key] = parent[key] || [];\n            if (']' == part) {\n              if (isArray(obj)) {\n                if ('' != val) obj.push(val);\n              } else if ('object' == typeof obj) {\n                obj[objectKeys(obj).length] = val;\n              } else {\n                obj = parent[key] = [parent[key], val];\n              }\n            // prop\n            } else if (~part.indexOf(']')) {\n              part = part.substr(0, part.length - 1);\n              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);\n              parse(parts, obj, part);\n            // key\n            } else {\n              if(notint.test(part) && isArray(obj)) obj = promote(parent, key);\n              parse(parts, obj, part);\n            }\n          }\n        }\n\n        parse(parts, parent, 'base');\n      // optimize\n      } else {\n        if (notint.test(key) && isArray(parent.base)) {\n          var t = {};\n          for(var k in parent.base) t[k] = parent.base[k];\n          parent.base = t;\n        }\n        set(parent.base, key, val);\n      }\n\n      return ret;\n    }, {base: {}}).base;\n};\n\n/**\n * Turn the given `obj` into a query string\n *\n * @param {Object} obj\n * @return {String}\n * @api public\n */\n\nvar stringify = exports.stringify = function(obj, prefix) {\n  if (isArray(obj)) {\n    return stringifyArray(obj, prefix);\n  } else if ('[object Object]' == toString.call(obj)) {\n    return stringifyObject(obj, prefix);\n  } else if ('string' == typeof obj) {\n    return stringifyString(obj, prefix);\n  } else {\n    return prefix;\n  }\n};\n\n/**\n * Stringify the given `str`.\n *\n * @param {String} str\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyString(str, prefix) {\n  if (!prefix) throw new TypeError('stringify expects an object');\n  return prefix + '=' + encodeURIComponent(str);\n}\n\n/**\n * Stringify the given `arr`.\n *\n * @param {Array} arr\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyArray(arr, prefix) {\n  var ret = [];\n  if (!prefix) throw new TypeError('stringify expects an object');\n  for (var i = 0; i < arr.length; i++) {\n    ret.push(stringify(arr[i], prefix + '[]'));\n  }\n  return ret.join('&');\n}\n\n/**\n * Stringify the given `obj`.\n *\n * @param {Object} obj\n * @param {String} prefix\n * @return {String}\n * @api private\n */\n\nfunction stringifyObject(obj, prefix) {\n  var ret = []\n    , keys = objectKeys(obj)\n    , key;\n  for (var i = 0, len = keys.length; i < len; ++i) {\n    key = keys[i];\n    ret.push(stringify(obj[key], prefix\n      ? prefix + '[' + encodeURIComponent(key) + ']'\n      : encodeURIComponent(key)));\n  }\n  return ret.join('&');\n}\n\n/**\n * Set `obj`'s `key` to `val` respecting\n * the weird and wonderful syntax of a qs,\n * where \"foo=bar&foo=baz\" becomes an array.\n *\n * @param {Object} obj\n * @param {String} key\n * @param {String} val\n * @api private\n */\n\nfunction set(obj, key, val) {\n  var v = obj[key];\n  if (undefined === v) {\n    obj[key] = val;\n  } else if (isArray(v)) {\n    v.push(val);\n  } else {\n    obj[key] = [v, val];\n  }\n}\n\n/**\n * Locate last brace in `str` within the key.\n *\n * @param {String} str\n * @return {Number}\n * @api private\n */\n\nfunction lastBraceInKey(str) {\n  var len = str.length\n    , brace\n    , c;\n  for (var i = 0; i < len; ++i) {\n    c = str[i];\n    if (']' == c) brace = false;\n    if ('[' == c) brace = true;\n    if ('=' == c && !brace) return i;\n  }\n}\n\n//@ sourceURL=querystring"
));

require.define("/node_modules/derby/node_modules/tracks/lib/router.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var qs = require('qs')\n  , settings = {}\n\nexports.render = render\nexports._mapRoute = mapRoute\nexports.settings = settings\nexports.set = function(setting, value) {\n  this.settings[setting] = value\n  return this\n}\nexports.get = function(setting) {\n  return settings[setting]\n}\nexports._isTransitional = function(pattern) {\n  return pattern.hasOwnProperty('from') && pattern.hasOwnProperty('to')\n}\n\nfunction mapRoute(from, params) {\n  var i, path, queryString, url\n  url = params.url\n  queryString = ~(i = url.indexOf('?')) ? url.slice(i) : ''\n  i = 0\n  path = from.replace(/(?:(?:\\:([^?\\/:*]+))|\\*)\\??/g, function(match, key) {\n    if (key) return params[key]\n    return params[i++]\n  })\n  return path + queryString\n}\n\nfunction cancelRender(url, options, e) {\n  // Don't do anything if this is the result of an event, since the\n  // appropriate action will happen by default\n  if (e || options.noNavigate) return\n  // Otherwise, manually perform appropriate action\n  if (options.form) {\n    form._forceSubmit = true\n    return form.submit()\n  } else {\n    return window.location = url\n  }\n}\n\nfunction render(page, options, e) {\n  var routes = page._routes\n    , url = options.url.replace(/#.*/, '')\n    , querySplit = url.split('?')\n    , path = querySplit[0]\n    , queryString = querySplit[1]\n    , query = queryString ? qs.parse(queryString) : {}\n    , method = options.method\n    , body = options.body || {}\n    , previous = options.previous\n    , transitional = routes.transitional[method]\n    , queue = routes.queue[method]\n\n  function reroute(url) {\n    var path = url.replace(/\\?.*/, '')\n    renderQueued(previous, path, url, options, null, onMatch, transitional, queue, 0)\n  }\n\n  function onMatch(path, url, i, route, renderNext, isTransitional) {\n    // Stop the default browser action, such as clicking a link or submitting a form\n    if (e) e.preventDefault()\n\n    var routeParams = route.params\n      , params = routeParams.slice()\n      , key\n    for (key in routeParams) {\n      params[key] = routeParams[key]\n    }\n    params.previous = previous\n    params.url = url\n    params.body = body\n    params.query = query\n    params.method = method\n    page.params = params\n\n    function next(err) {\n      if (err != null) return cancelRender(url, options)\n      renderNext(previous, path, url, options, null, onMatch, transitional, queue, i)\n    }\n\n    if (settings.debug) {\n      return run(route, page, params, next, reroute, isTransitional)\n    }\n    try {\n      run(route, page, params, next, reroute, isTransitional)\n    } catch (err) {\n      cancelRender(url, options)\n    }\n  }\n  return renderTransitional(previous, path, url, options, e, onMatch, transitional, queue, 0)\n}\n\nfunction run(route, page, params, next, reroute, isTransitional) {\n  var callbacks = route.callbacks\n    , onRoute = callbacks.onRoute\n\n  if (callbacks.forward) {\n    var render = page.render\n    page.render = function() {\n      onRoute(callbacks.forward, page, params, next, true)\n      page.render = render\n      render.apply(page, arguments)\n    }\n    return reroute(mapRoute(callbacks.from, params))\n  }\n  onRoute(callbacks.callback, page, params, next, isTransitional)\n}\n\nfunction renderTransitional(previous, path, url, options, e, onMatch, transitional, queue, i) {\n  var item\n  while (item = transitional[i++]) {\n    if (!item.to.match(path)) continue\n    if (!item.from.match(previous)) continue\n    return onMatch(path, url, i, item.to, renderTransitional, true)\n  }\n  return renderQueued(previous, path, url, options, e, onMatch, transitional, queue, 0)\n}\n\nfunction renderQueued(previous, path, url, options, e, onMatch, transitional, queue, i) {\n  var route\n  while (route = queue[i++]) {\n    if (!route.match(path)) continue\n    return onMatch(path, url, i, route, renderQueued)\n  }\n  // Cancel rendering by this app if no routes match\n  return cancelRender(url, options, e)\n}\n\n//@ sourceURL=/node_modules/derby/node_modules/tracks/lib/router.js"
));

require.define("/node_modules/derby/lib/app.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var EventEmitter = require('events').EventEmitter\n  , racer = require('racer')\n  , View = require('./View')\n  , collection = require('./collection')\n  , isServer = racer.util.isServer\n\nexports.create = createApp;\nexports.treeMerge = treeMerge;\n\nfunction createApp(derby, appModule) {\n  var app = racer.util.merge(appModule.exports, EventEmitter.prototype)\n\n  app.view = new View(derby._libraries, app, appModule.filename);\n  app.fn = appFn;\n\n  function appFn(value, fn) {\n    if (typeof value === 'string') {\n      pathMerge(app, value, fn, app);\n    } else {\n      treeMerge(app, value, app);\n    }\n    return app;\n  }\n\n  app._Collections = {};\n  app.Collection = collection.construct.bind(app);\n\n  return app;\n}\n\nfunction traverseNode(node, segments) {\n  var i, len, segment\n  for (i = 0, len = segments.length; i < len; i++) {\n    segment = segments[i];\n    node = node[segment] || (node[segment] = {});\n  }\n  return node;\n}\n\n// Recursively set nested objects based on a path\nfunction pathMerge(node, path, value, app) {\n  var segments = path.split('.')\n    , last, i, len, segment\n  if (typeof value === 'object') {\n    node = traverseNode(node, segments);\n    treeMerge(node, value, app);\n    return;\n  }\n  last = segments.pop();\n  node = traverseNode(node, segments);\n  node[last] = bindPage(value, app);\n}\n\n// Recursively set objects such that the non-objects are\n// merged with the corresponding structure of the base node\nfunction treeMerge(node, tree, app) {\n  var key, child, value\n  for (key in tree) {\n    value = tree[key];\n    if (typeof value === 'object') {\n      child = node[key] || (node[key] = {});\n      treeMerge(child, value, app);\n      continue;\n    }\n    node[key] = bindPage(value, app);\n  }\n}\n\nfunction bindPage(fn, app) {\n  // Don't bind the function on the server, since each\n  // render gets passed a new model as part of the app\n  if (isServer) return fn;\n  return function() {\n    return fn.apply(app.page, arguments);\n  };\n}\n\n//@ sourceURL=/node_modules/derby/lib/app.js"
));

require.define("/node_modules/derby/lib/collection.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\n  construct: construct\n, pageInit: pageInit\n};\n\nfunction construct(name, proto) {\n  function Collection(page) {\n    return createCollection(page, name, proto);\n  }\n  // Keep a map of defined collections so that they can\n  // be reinitialized from their name on the client\n  this._Collections[name] = Collection;\n  // This makes it possible to subscribe to the entire collection\n  // by making it look like a scoped model\n  Collection._at = name;\n  // TODO: Query builder on the collection\n  return Collection;\n}\n\nfunction createCollection(page, name, proto) {\n  // Collections are actually just scoped models for now\n  var _super = page.model.at(name)\n    , collection = Object.create(_super)\n\n  // Mixin collection specific methods\n  collection._super = _super;\n  collection.page = page;\n  for (key in proto) {\n    collection[key] = proto[key];\n  }\n\n  // Make collection available on the page for use in\n  // event callbacks and other functions\n  page[name] = collection;\n\n  // Keep track of collections that were created so that\n  // they can be recreated on the client if first rendered\n  // on the server\n  page._collections.push(name);\n\n  return collection;\n}\n\nfunction pageInit() {\n  var i = 0\n    , len = arguments.length\n    , items = []\n    , item\n  // All collections are created first before any of their\n  // init methods are called. That way collections created\n  // together can rely on each other being available for use\n  for (i = 0; i < len; i++) {\n    item = arguments[i](this);\n    items.push(item);\n  }\n  // Call the init method of each collection if defined\n  for (i = 0; i < len; i++) {\n    item = items[i];\n    if (item.hasOwnProperty('init')) {\n      item.init();\n    }\n  }\n}\n\n//@ sourceURL=/node_modules/derby/lib/collection.js"
));

require.define("/node_modules/derby/lib/derby.Model.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var EventDispatcher = require('./EventDispatcher')\n  , PathMap = require('./PathMap')\n  , racer = require('racer')\n  , Model = racer[\"protected\"].Model\n  , valueBinding = require('./View').valueBinding\n  , arraySlice = [].slice;\n\nexports.init = init;\n\n// Add support for creating a model alias from a DOM node or jQuery object\nModel.prototype.__at = Model.prototype.at;\nModel.prototype.at = function(node, absolute) {\n  var isNode = node && (node.parentNode || node.jquery && (node = node[0]));\n  if (!isNode) return this.__at(node, absolute);\n\n  updateMarkers();\n\n  var blockPaths = this.__blockPaths\n    , pathMap = this.__pathMap\n    , root = this._root\n    , child, i, id, last, path, blockPath, children, len;\n  while (node) {\n    if (node.$derbyMarkerParent && last) {\n      node = last;\n      while (node = node.previousSibling) {\n        if (!(id = node.$derbyMarkerId)) continue;\n        blockPath = blockPaths[id];\n        if (node.$derbyMarkerEnd || !blockPath) break;\n\n        path = pathMap.paths[blockPath.id];\n        if ((blockPath.type === 'each') && last) {\n          i = 0;\n          while (node = node.nextSibling) {\n            if (node === last) {\n              path = path + '.' + i;\n              break;\n            }\n            i++;\n          }\n        }\n        return this.__at(path, true);\n      }\n      last = last.parentNode;\n      node = last.parentNode;\n      continue;\n    }\n    if ((id = node.id) && (blockPath = blockPaths[id])) {\n      path = pathMap.paths[blockPath.id];\n      if ((blockPath.type === 'each') && last) {\n        children = node.childNodes;\n        for (i = 0, len = children.length; i < len; i++) {\n          child = children[i];\n          if (child === last) {\n            path = path + '.' + i;\n            break;\n          }\n        }\n      }\n      return this.__at(path, true);\n    }\n    last = node;\n    node = node.parentNode;\n  }\n\n  // Just return the root scope if a path can't be found\n  return root;\n}\n\nfunction updateMarkers() {\n  // NodeFilter.SHOW_COMMENT == 128\n  var commentIterator = document.createTreeWalker(document.body, 128, null, false)\n    , comment, id;\n  while (comment = commentIterator.nextNode()) {\n    if (comment.$derbyChecked) continue;\n    comment.$derbyChecked = true;\n    id = comment.data;\n    if (id.charAt(0) !== '$') continue;\n    if (id.charAt(1) === '$') {\n      comment.$derbyMarkerEnd = true;\n      id = id.slice(1);\n    }\n    comment.$derbyMarkerId = id;\n    comment.parentNode.$derbyMarkerParent = true;\n  }\n}\n\nfunction init(derby, app) {\n  var model = app.model\n    , dom = app.dom\n    , pathMap = model.__pathMap = new PathMap\n    , events = model.__events = new EventDispatcher({onTrigger: derbyModelTrigger})\n\n  function derbyModelTrigger(pathId, listener, type, local, options, value, index, arg) {\n    var id = listener[0]\n      , el = dom.item(id);\n\n    // Fail and remove the listener if the element can't be found\n    if (!el) return false;\n\n    var method = listener[1]\n      , property = listener[2]\n      , partial = listener.partial\n      , path = pathMap.paths[pathId]\n      , triggerId;\n    if (method === 'propPolite' && local) method = 'prop';\n    if (partial) {\n      triggerId = id;\n      if (method === 'html' && type) {\n        if (partial.type === 'each' && !derby.get('disableArrayBindings')) {\n          // Handle array updates\n          method = type;\n          if (type === 'append') {\n            path += '.' + (index = model.get(path).length - 1);\n            triggerId = null;\n          } else if (type === 'insert') {\n            path += '.' + index;\n            triggerId = null;\n          } else if (type === 'remove') {\n            partial = null;\n          } else if (type === 'move') {\n            partial = null;\n            property = arg;\n          }\n        } else {\n          value = model.get(path)\n        }\n      }\n    }\n    if (listener.getValue) {\n      value = listener.getValue(model, path);\n    }\n    if (partial) {\n      value = partial(listener.ctx, model, path, triggerId, value, index, listener);\n    }\n    value = valueBinding(value);\n    dom.update(el, method, options && options.ignore, value, property, index);\n  }\n\n  // Derby's mutator listeners are added via unshift instead of model.on, because\n  // it needs to handle events in the same order that racer applies mutations.\n  // If there is a listener to an event that applies a mutation, event listeners\n  // later in the listeners queues could receive events in a different order\n\n  model.listeners('set').unshift(function listenerDerbySet(args, out, local, pass) {\n    var arrayPath, i, index, path, value;\n    model.emit('pre:set', args, out, local, pass);\n    path = args[0], value = args[1];\n\n    // For set operations on array items, also emit a remove and insert in case the\n    // array is bound\n    if (/\\.\\d+$/.test(path)) {\n      i = path.lastIndexOf('.');\n      arrayPath = path.slice(0, i);\n      index = path.slice(i + 1);\n      triggerEach(arrayPath, 'remove', local, pass, index);\n      triggerEach(arrayPath, 'insert', local, pass, value, index);\n    }\n    return triggerEach(path, 'html', local, pass, value);\n  });\n\n  model.listeners('del').unshift(function listenerDerbyDel(args, out, local, pass) {\n    model.emit('pre:del', args, out, local, pass);\n    var path = args[0];\n    return triggerEach(path, 'html', local, pass);\n  });\n\n  model.listeners('push').unshift(function listenerDerbyPush(args, out, local, pass) {\n    model.emit('pre:push', args, out, local, pass);\n    var path = args[0]\n      , values = arraySlice.call(args, 1);\n    for (var i = 0, len = values.length, value; i < len; i++) {\n      value = values[i];\n      triggerEach(path, 'append', local, pass, value);\n    }\n  });\n\n  model.listeners('move').unshift(function listenerDerbyMove(args, out, local, pass) {\n    model.emit('pre:move', args, out, local, pass);\n    var path = args[0]\n      , from = args[1]\n      , to = args[2]\n      , howMany = args[3]\n      , len = model.get(path).length;\n    from = refIndex(from);\n    to = refIndex(to);\n    if (from < 0) from += len;\n    if (to < 0) to += len;\n    if (from === to) return;\n    // Update indicies in pathMap\n    pathMap.onMove(path, from, to, howMany);\n    triggerEach(path, 'move', local, pass, from, howMany, to);\n  });\n\n  model.listeners('unshift').unshift(function listenerDerbyUnshift(args, out, local, pass) {\n    model.emit('pre:unshift', args, out, local, pass);\n    var path = args[0]\n      , values = arraySlice.call(args, 1);\n    insert(path, 0, values, local, pass);\n  });\n\n  model.listeners('insert').unshift(function listenerDerbyInsert(args, out, local, pass) {\n    model.emit('pre:insert', args, out, local, pass);\n    var path = args[0]\n      , index = args[1]\n      , values = arraySlice.call(args, 2);\n    insert(path, index, values, local, pass);\n  });\n\n  model.listeners('remove').unshift(function listenerDerbyRemove(args, out, local, pass) {\n    model.emit('pre:remove', args, out, local, pass);\n    var path = args[0]\n      , start = args[1]\n      , howMany = args[2];\n    remove(path, start, howMany, local, pass);\n  });\n\n  model.listeners('pop').unshift(function listenerDerbyPop(args, out, local, pass) {\n    model.emit('pre:pop', args, out, local, pass);\n    var path = args[0];\n    remove(path, model.get(path).length, 1, local, pass);\n  });\n\n  model.listeners('shift').unshift(function listenerDerbyShift(args, out, local, pass) {\n    model.emit('pre:shift', args, out, local, pass);\n    var path = args[0];\n    remove(path, 0, 1, local, pass);\n  });\n\n  ['connected', 'canConnect'].forEach(function(event) {\n    model.listeners(event).unshift(function(value) {\n      triggerEach(event, null, true, null, value);\n    });\n  });\n\n  model.on('reInit', function() {\n    app.history.refresh();\n  });\n\n  function triggerEach(path, arg0, arg1, arg2, arg3, arg4, arg5) {\n    // While rendering the entire page, don't update any bindings\n    if (dom._preventUpdates) return;\n\n    var id = pathMap.ids[path]\n      , segments = path.split('.')\n      , i, pattern;\n\n    // Trigger an event on the path if it has a pathMap ID\n    if (id) events.trigger(id, arg0, arg1, arg2, arg3, arg4, arg5);\n\n    // Also trigger a pattern event for the path and each of its parent paths\n    // This is used by view helper functions to match updates on a path\n    // or any of its child segments\n    i = segments.length + 1;\n    while (--i) {\n      pattern = segments.slice(0, i).join('.') + '*';\n      if (id = pathMap.ids[pattern]) {\n        events.trigger(id, arg0, arg1, arg2, arg3, arg4, arg5);\n      }\n    }\n  }\n\n  // Get index if event was from refList id object\n  function refIndex(obj) {\n    return typeof obj === 'object' ? obj.index : +obj;\n  }\n\n  function insert(path, start, values, local, pass) {\n    start = refIndex(start);\n    // Update indicies in pathMap\n    pathMap.onInsert(path, start, values.length);\n    for (var i = 0, len = values.length, value; i < len; i++) {\n      value = values[i];\n      triggerEach(path, 'insert', local, pass, value, start + i);\n    }\n  }\n\n  function remove(path, start, howMany, local, pass) {\n    start = refIndex(start);\n    var end = start + howMany;\n    // Update indicies in pathMap\n    pathMap.onRemove(path, start, howMany);\n    for (var i = start; i < end; i++) {\n      triggerEach(path, 'remove', local, pass, start);\n    }\n  }\n\n  return model;\n}\n\n//@ sourceURL=/node_modules/derby/lib/derby.Model.js"
));

require.define("/node_modules/derby/lib/EventDispatcher.js",Function(['require','module','exports','__dirname','__filename','process','global'],"function empty() {}\n\nmodule.exports = EventDispatcher;\n\nfunction EventDispatcher(options) {\n  if (options == null) options = {};\n  this._onTrigger = options.onTrigger || empty;\n  this._onBind = options.onBind || empty;\n  this.clear();\n}\n\nEventDispatcher.prototype = {\n  clear: function() {\n    this.names = {};\n  }\n\n, bind: function(name, listener, arg0) {\n    this._onBind(name, listener, arg0);\n    var names = this.names\n      , obj = names[name] || {};\n    obj[JSON.stringify(listener)] = listener;\n    return names[name] = obj;\n  }\n\n, trigger: function(name, value, arg0, arg1, arg2, arg3, arg4, arg5) {\n    var names = this.names\n      , listeners = names[name]\n      , onTrigger = this._onTrigger\n      , count = 0\n      , key, listener;\n    for (key in listeners) {\n      listener = listeners[key];\n      count++;\n      if (false !== onTrigger(name, listener, value, arg0, arg1, arg2, arg3, arg4, arg5)) {\n        continue;\n      }\n      delete listeners[key];\n      count--;\n    }\n    if (!count) delete names[name];\n    return count;\n  }\n}\n\n//@ sourceURL=/node_modules/derby/lib/EventDispatcher.js"
));

require.define("/node_modules/derby/lib/PathMap.js",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = PathMap\n\nfunction PathMap() {\n  this.clear();\n}\nPathMap.prototype = {\n  clear: function() {\n    this.count = 0;\n    this.ids = {};\n    this.paths = {};\n    this.arrays = {};\n  }\n\n, id: function(path) {\n    var id;\n    // Return the path for an id, or create a new id and index it\n    return this.ids[path] || (\n      id = ++this.count\n    , this.paths[id] = path\n    , this._indexArray(path, id)\n    , this.ids[path] = id\n    );\n  }\n\n, _indexArray: function(path, id) {\n    var arr, index, match, nested, remainder, set, setArrays;\n    while (match = /^(.+)\\.(\\d+)(\\*?(?:\\..+|$))/.exec(path)) {\n      path = match[1];\n      index = +match[2];\n      remainder = match[3];\n      arr = this.arrays[path] || (this.arrays[path] = []);\n      set = arr[index] || (arr[index] = {});\n      if (nested) {\n        setArrays = set.arrays || (set.arrays = {});\n        setArrays[remainder] = true;\n      } else {\n        set[id] = remainder;\n      }\n      nested = true;\n    }\n  }\n\n, _incrItems: function(path, map, start, end, byNum, oldArrays, oldPath) {\n    var arrayMap, arrayPath, arrayPathTo, i, id, ids, itemPath, remainder;\n    if (oldArrays == null) oldArrays = {};\n\n    for (i = start; i < end; i++) {\n      ids = map[i];\n      if (!ids) continue;\n\n      for (id in ids) {\n        remainder = ids[id];\n        if (id === 'arrays') {\n          for (remainder in ids[id]) {\n            arrayPath = (oldPath || path) + '.' + i + remainder;\n            arrayMap = oldArrays[arrayPath] || this.arrays[arrayPath];\n            if (arrayMap) {\n              arrayPathTo = path + '.' + (i + byNum) + remainder;\n              this.arrays[arrayPathTo] = arrayMap;\n              this._incrItems(arrayPathTo, arrayMap, 0, arrayMap.length, 0, oldArrays, arrayPath);\n            }\n          }\n          continue;\n        }\n\n        itemPath = path + '.' + (i + byNum) + remainder;\n        this.paths[id] = itemPath;\n        this.ids[itemPath] = +id;\n      }\n    }\n  }\n\n, _delItems: function(path, map, start, end, len, oldArrays) {\n    var arrayLen, arrayMap, arrayPath, i, id, ids, itemPath, remainder;\n    if (oldArrays == null) oldArrays = {};\n\n    for (i = start; i < len; i++) {\n      ids = map[i];\n      if (!ids) continue;\n\n      for (id in ids) {\n        if (id === 'arrays') {\n          for (remainder in ids[id]) {\n            arrayPath = path + '.' + i + remainder;\n            if (arrayMap = this.arrays[arrayPath]) {\n              arrayLen = arrayMap.length;\n              this._delItems(arrayPath, arrayMap, 0, arrayLen, arrayLen, oldArrays);\n              oldArrays[arrayPath] = arrayMap;\n              delete this.arrays[arrayPath];\n            }\n          }\n          continue;\n        }\n\n        itemPath = this.paths[id];\n        delete this.ids[itemPath];\n        if (i > end) continue;\n        delete this.paths[id];\n      }\n    }\n\n    return oldArrays;\n  }\n\n, onRemove: function(path, start, howMany) {\n    var map = this.arrays[path]\n      , end, len, oldArrays;\n    if (!map) return;\n    end = start + howMany;\n    len = map.length;\n    // Delete indicies for removed items\n    oldArrays = this._delItems(path, map, start, end + 1, len);\n    // Decrement indicies of later items\n    this._incrItems(path, map, end, len, -howMany, oldArrays);\n    map.splice(start, howMany);\n  }\n\n, onInsert: function(path, start, howMany) {\n    var map = this.arrays[path]\n      , end, len, oldArrays;\n    if (!map) return;\n    end = start + howMany;\n    len = map.length;\n    // Delete indicies for items in inserted positions\n    oldArrays = this._delItems(path, map, start, end + 1, len);\n    // Increment indicies of later items\n    this._incrItems(path, map, start, len, howMany, oldArrays);\n    while (howMany--) {\n      map.splice(start, 0, {});\n    }\n  }\n\n, onMove: function(path, from, to, howMany) {\n    var map = this.arrays[path]\n      , afterFrom, afterTo, items, oldArrays;\n    if (!map) return;\n    afterFrom = from + howMany;\n    afterTo = to + howMany;\n    // Adjust paths for items between from and to\n    if (from > to) {\n      oldArrays = this._delItems(path, map, to, afterFrom, afterFrom);\n      this._incrItems(path, map, to, from, howMany, oldArrays);\n    } else {\n      oldArrays = this._delItems(path, map, from, afterTo, afterTo);\n      this._incrItems(path, map, afterFrom, afterTo, -howMany, oldArrays);\n    }\n    // Adjust paths for the moved item(s)\n    this._incrItems(path, map, from, afterFrom, to - from, oldArrays);\n    // Fix the array index\n    items = map.splice(from, howMany);\n    map.splice.apply(map, [to, 0].concat(items));\n  }\n}\n\n//@ sourceURL=/node_modules/derby/lib/PathMap.js"
));

require.define("/node_modules/derby/lib/Dom.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var racer = require('racer')\n  , domShim = require('dom-shim')\n  , EventDispatcher = require('./EventDispatcher')\n  , viewPath = require('./viewPath')\n  , escapeHtml = require('html-util').escapeHtml\n  , merge = racer.util.merge\n  , win = window\n  , doc = win.document\n  , markers = {}\n  , elements = {\n      $_win: win\n    , $_doc: doc\n    }\n  , addListener, removeListener;\n\nmodule.exports = Dom;\n\nfunction Dom(model) {\n  var dom = this\n    , fns = this.fns\n\n      // Map dom event name -> true\n    , listenerAdded = {}\n    , captureListenerAdded = {};\n\n  // DOM listener capturing allows blur and focus to be delegated\n  // http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html\n  var captureEvents = this._captureEvents = new EventDispatcher({\n    onTrigger: onCaptureTrigger\n  , onBind: onCaptureBind\n  });\n  function onCaptureTrigger(name, listener, e) {\n    var id = listener.id\n      , el = doc.getElementById(id);\n\n    // Remove listener if element isn't found\n    if (!el) return false;\n\n    if (el.tagName === 'HTML' || el.contains(e.target)) {\n      onDomTrigger(name, listener, id, e, el);\n    }\n  }\n  function onCaptureBind(name, listener) {\n    if (captureListenerAdded[name]) return;\n    addListener(doc, name, captureTrigger, true);\n    captureListenerAdded[name] = true;\n  }\n\n  var events = this._events = new EventDispatcher({\n    onTrigger: onDomTrigger\n  , onBind: onDomBind\n  });\n  function onDomTrigger(name, listener, id, e, el, next) {\n    var delay = listener.delay\n      , finish = listener.fn;\n\n    e.path = function(name) {\n      var path = model.__pathMap.paths[listener.pathId];\n      if (!name) return path;\n      viewPath.patchCtx(listener.ctx, path)\n      return viewPath.ctxPath(listener.view, listener.ctx, name);\n    };\n    e.get = function(name) {\n      var path = e.path(name);\n      return viewPath.dataValue(listener.view, listener.ctx, model, path);\n    };\n    e.at = function(name) {\n      return model.at(e.path(name));\n    };\n\n    if (!finish) {\n      // Update the model when the element's value changes\n      finish = function() {\n        var value = dom.getMethods[listener.method](el, listener.property)\n          , setValue = listener.setValue;\n\n        // Allow the listener to override the setting function\n        if (setValue) {\n          setValue(model, value);\n          return;\n        }\n\n        // Remove this listener if its path id is no longer registered\n        var path = model.__pathMap.paths[listener.pathId];\n        if (!path) return false;\n\n        // Set the value if changed\n        if (model.get(path) === value) return;\n        model.pass(e).set(path, value);\n      }\n    }\n\n    if (delay != null) {\n      setTimeout(finish, delay, e, el, next, dom);\n    } else {\n      finish(e, el, next, dom);\n    }\n  }\n  function onDomBind(name, listener, eventName) {\n    if (listenerAdded[eventName]) return;\n    addListener(doc, eventName, triggerDom, true);\n    listenerAdded[eventName] = true;\n  }\n\n  function triggerDom(e, el, noBubble, continued) {\n    if (!el) el = e.target;\n    var prefix = e.type + ':'\n      , id;\n\n    // Next can be called from a listener to continue bubbling\n    function next() {\n      triggerDom(e, el.parentNode, false, true);\n    }\n    next.firstTrigger = !continued;\n    if (noBubble && (id = el.id)) {\n      return events.trigger(prefix + id, id, e, el, next);\n    }\n    while (true) {\n      while (!(id = el.id)) {\n        if (!(el = el.parentNode)) return;\n      }\n      // Stop bubbling once the event is handled\n      if (events.trigger(prefix + id, id, e, el, next)) return;\n      if (!(el = el.parentNode)) return;\n    }\n  }\n\n  function captureTrigger(e) {\n    captureEvents.trigger(e.type, e);\n  }\n\n  this.trigger = triggerDom;\n  this.captureTrigger = captureTrigger;\n\n  this._listeners = [];\n  this._components = [];\n  this._pendingUpdates = [];\n\n  function componentCleanup() {\n    var components = dom._components\n      , map = getMarkers()\n      , i, component\n    for (i = components.length; i--;) {\n      component = components[i];\n      if (component && !getMarker(map, component.scope)) {\n        component.emit('destroy');\n      }\n    }\n  }\n  // This cleanup listeners is placed at the beginning so that component\n  // scopes are cleared before any ref cleanups are checked\n  model.listeners('cleanup').unshift(componentCleanup);\n}\n\nDom.prototype = {\n  clear: domClear\n, bind: domBind\n, item: domItem\n, marker: domMarker\n, update: domUpdate\n, nextUpdate: nextUpdate\n, _emitUpdate: emitUpdate\n, addListener: domAddListener\n, removeListener: domRemoveListener\n, addComponent: addComponent\n\n, getMethods: {\n    attr: getAttr\n  , prop: getProp\n  , propPolite: getProp\n  , html: getHtml\n    // These methods return NaN, because it never equals anything else. Thus,\n    // when compared against the new value, the new value will always be set\n  , append: getNaN\n  , insert: getNaN\n  , remove: getNaN\n  , move: getNaN\n  }\n\n, setMethods: {\n    attr: setAttr\n  , prop: setProp\n  , propPolite: setProp\n  , html: setHtml\n  , append: setAppend\n  , insert: setInsert\n  , remove: setRemove\n  , move: setMove\n  }\n\n, fns: {\n    $forChildren: forChildren\n  , $forName: forName\n  }\n}\n\nfunction domClear() {\n  this._events.clear();\n  this._captureEvents.clear();\n  var components = this._components\n    , listeners = this._listeners\n    , i, component\n  for (i = listeners.length; i--;) {\n    removeListener.apply(null, listeners[i]);\n  }\n  this._listeners = [];\n  for (i = components.length; i--;) {\n    component = components[i];\n    component && component.emit('destroy');\n  }\n  this._components = [];\n  markers = {};\n}\n\nfunction domListenerHash() {\n  var out = {}\n    , key\n  for (key in this) {\n    if (key === 'view' || key === 'ctx' || key === 'pathId') continue;\n    out[key] = this[key];\n  }\n  return out;\n}\n\nfunction domBind(eventName, id, listener) {\n  listener.toJSON = domListenerHash;\n  if (listener.capture) {\n    listener.id = id;\n    this._captureEvents.bind(eventName, listener);\n  } else {\n    this._events.bind(\"\" + eventName + \":\" + id, listener, eventName);\n  }\n}\n\nfunction domItem(id) {\n  return doc.getElementById(id) || elements[id] || getRange(id);\n}\n\nfunction domUpdate(el, method, ignore, value, property, index) {\n  // Set to true during rendering\n  if (this._preventUpdates) return;\n\n  // Wrapped in a try / catch so that errors thrown on DOM updates don't\n  // stop subsequent code from running\n  try {\n    // Don't do anything if the element is already up to date\n    if (value === this.getMethods[method](el, property)) return;\n    this.setMethods[method](el, ignore, value, property, index);\n    this._emitUpdate();\n  } catch (err) {\n    setTimeout(function() {\n      throw err;\n    }, 0);\n  }\n}\nfunction nextUpdate(callback) {\n  this._pendingUpdates.push(callback);\n}\nfunction emitUpdate() {\n  var fns = this._pendingUpdates\n    , len = fns.length\n    , i;\n  if (!len) return;\n  this._pendingUpdates = [];\n  // Give the browser a chance to render the page before initializing\n  // components and other delayed updates\n  setTimeout(function() {\n    for (i = 0; i < len; i++) {\n      fns[i]();\n    }\n  }, 0);\n}\n\nfunction domAddListener(el, name, callback, captures) {\n  this._listeners.push([el, name, callback, captures]);\n  addListener(el, name, callback, captures);\n}\nfunction domRemoveListener(el, name, callback, captures) {\n  removeListener(el, name, callback, captures);\n}\n\nfunction addComponent(ctx, component) {\n  var components = this._components\n    , dom = component.dom = Object.create(this);\n\n  components.push(component);\n  component.on('destroy', function() {\n    var index = components.indexOf(component);\n    if (index === -1) return;\n    // The components array gets replaced on a dom.clear, so we allow\n    // it to get sparse as individual components are destroyed\n    delete components[index];\n  });\n\n  dom.addListener = function(el, name, callback, captures) {\n    component.on('destroy', function() {\n      removeListener(el, name, callback, captures);\n    });\n    addListener(el, name, callback, captures);\n  };\n\n  dom.element = function(name) {\n    var id = ctx.$elements[name];\n    return document.getElementById(id);\n  };\n\n  return dom;\n}\n\n\nfunction getAttr(el, attr) {\n  return el.getAttribute(attr);\n}\nfunction getProp(el, prop) {\n  return el[prop];\n}\nfunction getHtml(el) {\n  return el.innerHTML;\n}\nfunction getNaN() {\n  return NaN;\n}\n\nfunction setAttr(el, ignore, value, attr) {\n  if (ignore && el.id === ignore) return;\n  el.setAttribute(attr, value);\n}\nfunction setProp(el, ignore, value, prop) {\n  if (ignore && el.id === ignore) return;\n  el[prop] = value;\n}\nfunction propPolite(el, ignore, value, prop) {\n  if (ignore && el.id === ignore) return;\n  if (el !== doc.activeElement || !doc.hasFocus()) {\n    el[prop] = value;\n  }\n}\n\nfunction makeSVGFragment(fragment, svgElement) {\n  // TODO: Allow optional namespace declarations\n  var pre = '<svg xmlns=http://www.w3.org/2000/svg xmlns:xlink=http://www.w3.org/1999/xlink>' \n    , post = '</svg>'\n    , range = document.createRange()\n  range.selectNode(svgElement);\n  return range.createContextualFragment(pre + fragment + post);\n}\nfunction appendSVG(element, fragment, svgElement) {\n  var frag = makeSVGFragment(fragment, svgElement)\n    , children = frag.childNodes[0].childNodes\n    , i\n  for (i = children.length; i--;) {\n    element.appendChild(children[0]);\n  }\n}\nfunction insertBeforeSVG(element, fragment, svgElement) {\n  var frag = makeSVGFragment(fragment, svgElement)\n    , children = frag.childNodes[0].childNodes\n    , parent = element.parentNode\n    , i\n  for (i = children.length; i--;) {\n    parent.insertBefore(children[0], element);\n  }\n}\nfunction removeChildren(element) {\n  var children = element.childNodes\n    , i\n  for (i = children.length; i--;) {\n    element.removeChild(children[0]);\n  }\n}\n\nfunction isSVG(obj) {\n  return !!obj.ownerSVGElement || obj.tagName === \"svg\";\n}\nfunction svgRoot(obj) {\n  return obj.ownerSVGElement || obj;\n}\nfunction isRange(obj) {\n  return !!obj.cloneRange;\n}\n\nfunction setHtml(obj, ignore, value, escape) {\n  if (escape) value = escapeHtml(value);\n  if(isRange(obj)) {\n    if(isSVG(obj.startContainer)) {\n      // SVG Element\n      obj.deleteContents();\n      var svgElement = svgRoot(obj.startContainer);\n      obj.insertNode(makeSVGFragment(value, svgElement));\n      return;\n    } else {\n      // Range\n      obj.deleteContents();\n      obj.insertNode(obj.createContextualFragment(value));\n      return;\n    }\n  }\n  if (isSVG(obj)) {\n    // SVG Element\n    var svgElement = svgRoot(obj);\n    removeChildren(obj);\n    appendSVG(obj, value, svgElement);\n    return;\n  }\n  // HTML Element\n  if (ignore && obj.id === ignore) return;\n  obj.innerHTML = value;\n}\nfunction setAppend(obj, ignore, value, escape) {\n  if (escape) value = escapeHtml(value);\n  if (isSVG(obj)) {\n    // SVG Element\n    var svgElement = obj.ownerSVGElement || obj;\n    appendSVG(obj, value, svgElement);\n    return;\n  }\n  if (obj.nodeType) {\n    // HTML Element\n    obj.insertAdjacentHTML('beforeend', value);\n  } else {\n    // Range\n    if(isSVG(obj.startContainer)) {\n      var el = obj.endContainer\n        , ref = el.childNodes[obj.endOffset];\n      var svgElement = svgRoot(ref);\n      el.insertBefore(makeSVGFragment(value, svgElement), ref)\n    } else {\n      var el = obj.endContainer\n        , ref = el.childNodes[obj.endOffset];\n      el.insertBefore(obj.createContextualFragment(value), ref);\n    }\n  }\n}\nfunction setInsert(obj, ignore, value, escape, index) {\n  if (escape) value = escapeHtml(value);\n  if (obj.nodeType) {\n    // Element\n    if (ref = obj.childNodes[index]) {\n      if (isSVG(obj)) {\n        var svgElement = obj.ownerSVGElement || obj;\n        insertBeforeSVG(ref, value, svgElement);\n        return;\n      }\n      ref.insertAdjacentHTML('beforebegin', value);\n    } else {\n      if (isSVG(obj)) {\n        var svgElement = obj.ownerSVGElement || obj;\n        appendSVG(obj, value, svgElement);\n        return;\n      }\n      obj.insertAdjacentHTML('beforeend', value);\n    }\n  } else {\n    // Range\n    if(isSVG(obj.startContainer)) {\n      var el = obj.startContainer\n      , ref = el.childNodes[obj.startOffset + index];\n      var svgElement = svgRoot(ref);\n      el.insertBefore(makeSVGFragment(value, svgElement), ref)\n    } else {\n      var el = obj.startContainer\n        , ref = el.childNodes[obj.startOffset + index];\n      el.insertBefore(obj.createContextualFragment(value), ref);\n    }\n  }\n}\nfunction setRemove(el, ignore, index) {\n  if (!el.nodeType) {\n    // Range\n    index += el.startOffset;\n    el = el.startContainer;\n  }\n  var child = el.childNodes[index];\n  if (child) el.removeChild(child);\n}\nfunction setMove(el, ignore, from, to, howMany) {\n  var child, fragment, nextChild, offset, ref, toEl;\n  if (!el.nodeType) {\n    offset = el.startOffset;\n    from += offset;\n    to += offset;\n    el = el.startContainer;\n  }\n  child = el.childNodes[from];\n\n  // Don't move if the item at the destination is passed as the ignore\n  // option, since this indicates the intended item was already moved\n  // Also don't move if the child to move matches the ignore option\n  if (!child || ignore && (toEl = el.childNodes[to]) &&\n      toEl.id === ignore || child.id === ignore) return;\n\n  ref = el.childNodes[to > from ? to + howMany : to];\n  if (howMany > 1) {\n    fragment = document.createDocumentFragment();\n    while (howMany--) {\n      nextChild = child.nextSibling;\n      fragment.appendChild(child);\n      if (!(child = nextChild)) break;\n    }\n    el.insertBefore(fragment, ref);\n    return;\n  }\n  el.insertBefore(child, ref);\n}\n\nfunction forChildren(e, el, next, dom) {\n  // Prevent infinte emission\n  if (!next.firstTrigger) return;\n\n  // Re-trigger the event on all child elements\n  var children = el.childNodes;\n  for (var i = 0, len = children.length, child; i < len; i++) {\n    child = children[i];\n    if (child.nodeType !== 1) continue;  // Node.ELEMENT_NODE\n    dom.trigger(e, child, true, true);\n    forChildren(e, child, next, dom);\n  }\n}\n\nfunction forName(e, el, next, dom) {\n  // Prevent infinte emission\n  if (!next.firstTrigger) return;\n\n  var name = el.getAttribute('name');\n  if (!name) return;\n\n  // Re-trigger the event on all other elements with\n  // the same 'name' attribute\n  var elements = doc.getElementsByName(name)\n    , len = elements.length;\n  if (!(len > 1)) return;\n  for (var i = 0, element; i < len; i++) {\n    element = elements[i];\n    if (element === el) continue;\n    dom.trigger(e, element, false, true);\n  }\n}\n\nfunction getMarkers() {\n  var map = {}\n      // NodeFilter.SHOW_COMMENT == 128\n    , commentIterator = doc.createTreeWalker(doc, 128, null, false)\n    , comment\n  while (comment = commentIterator.nextNode()) {\n    map[comment.data] = comment;\n  }\n  return map;\n}\n\nfunction getMarker(map, name) {\n  var marker = map[name];\n  if (!marker) return;\n\n  // Comment nodes may continue to exist even if they have been removed from\n  // the page. Thus, make sure they are still somewhere in the page body\n  if (!doc.contains(marker)) {\n    delete map[name];\n    return;\n  }\n  return marker;\n}\n\nfunction domMarker(name) {\n  var marker = getMarker(markers, name);\n  if (!marker) {\n    markers = getMarkers();\n    marker = getMarker(markers, name);\n    if (!marker) return;\n  }\n  return marker;\n}\n\nfunction getRange(name) {\n  var start = domMarker(name);\n  if (!start) return;\n  var end = domMarker('$' + name);\n  if (!end) return;\n\n  var range = doc.createRange();\n  range.setStartAfter(start);\n  range.setEndBefore(end);\n  return range;\n}\n\nif (doc.addEventListener) {\n  addListener = function(el, name, callback, captures) {\n    el.addEventListener(name, callback, captures || false);\n  };\n  removeListener = function(el, name, callback, captures) {\n    el.removeEventListener(name, callback, captures || false);\n  };\n\n} else if (doc.attachEvent) {\n  addListener = function(el, name, callback) {\n    function listener() {\n      if (!event.target) event.target = event.srcElement;\n      callback(event);\n    }\n    callback.$derbyListener = listener;\n    el.attachEvent('on' + name, listener);\n  };\n  removeListener = function(el, name, callback) {\n    el.detachEvent('on' + name, callback.$derbyListener);\n  };\n}\n\n//@ sourceURL=/node_modules/derby/lib/Dom.js"
));

require.define("/node_modules/derby/node_modules/dom-shim/package.json",Function(['require','module','exports','__dirname','__filename','process','global'],"module.exports = {\"main\":\"./lib/index.js\"}\n//@ sourceURL=/node_modules/derby/node_modules/dom-shim/package.json"
));

require.define("/node_modules/derby/node_modules/dom-shim/lib/index.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var doc = document\n  , elementProto = HTMLElement.prototype\n  , nodeProto = Node.prototype\n\n// Add support for Node.contains for Firefox < 9\nif (!doc.contains) {\n  nodeProto.contains = function(node) {\n    return !!(this.compareDocumentPosition(node) & 16)\n  }\n}\n\n// Add support for insertAdjacentHTML for Firefox < 8\n// Based on insertAdjacentHTML.js by Eli Grey, http://eligrey.com\nif (!doc.body.insertAdjacentHTML) {\n  elementProto.insertAdjacentHTML = function(position, html) {\n    var position = position.toLowerCase()\n      , ref = this\n      , parent = ref.parentNode\n      , container = doc.createElement(parent.tagName)\n      , firstChild, nextSibling, node\n\n    container.innerHTML = html\n    if (position === 'beforeend') {\n      while (node = container.firstChild) {\n        ref.appendChild(node)\n      }\n    } else if (position === 'beforebegin') {\n      while (node = container.firstChild) {\n        parent.insertBefore(node, ref)\n      }\n    } else if (position === 'afterend') {\n      nextSibling = ref.nextSibling\n      while (node = container.lastChild) {\n        nextSibling = parent.insertBefore(node, nextSibling)\n      }\n    } else if (position === 'afterbegin') {\n      firstChild = ref.firstChild\n      while (node = container.lastChild) {\n        firstChild = ref.insertBefore(node, firstChild)\n      }\n    }\n  }\n}\n\nelementProto.matches =\n  elementProto.webkitMatchesSelector ||\n  elementProto.mozMatchesSelector ||\n  elementProto.oMatchesSelector ||\n  elementProto.msMatchesSelector\n\n//@ sourceURL=/node_modules/derby/node_modules/dom-shim/lib/index.js"
));

require.define("/node_modules/derby/lib/refresh.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var escapeHtml = require('html-util').escapeHtml\n  , errors = {};\n\nexports.errorHtml = errorHtml;\nexports.autoRefresh = autoRefresh;\n\nfunction errorHtml(errors) {\n  var text = ''\n    , type, err;\n  for (type in errors) {\n    err = errors[type];\n    text += '<h3>' + escapeHtml(type) + ' Error</h3><pre>' + escapeHtml(err) + '</pre>';\n  }\n  if (!text) return;\n  return '<div id=$_derbyError style=\"position:absolute;background:rgba(0,0,0,.7);top:0;left:0;right:0;bottom:0;text-align:center\">' +\n    '<div style=\"background:#fff;padding:20px 40px;margin:60px;display:inline-block;text-align:left\">' +\n    text + '</div></div>';\n}\n\nfunction autoRefresh(view, model) {\n  var socket = model.socket;\n\n  socket.on('refreshCss', function(err, css) {\n    var el = document.getElementById('$_css');\n    if (el) el.innerHTML = css;\n    updateError('CSS', err);\n  });\n\n  socket.on('refreshHtml', function(err, templates, instances, libraryData) {\n    view._makeAll(templates, instances);\n    view._makeComponents(libraryData);\n    try {\n      view.app.dom._preventUpdates = true;\n      view.app.history.refresh();\n    } catch (_err) {\n      err || (err = _err.stack);\n    }\n    updateError('Template', err);\n  });\n}\n\nfunction updateError(type, err) {\n  if (err) {\n    errors[type] = err;\n  } else {\n    delete errors[type];\n  }\n  var el = document.getElementById('$_derbyError')\n    , html = errorHtml(errors)\n    , fragment, range;\n  if (html) {\n    if (el) {\n      el.outerHTML = html;\n    } else {\n      range = document.createRange();\n      range.selectNode(document.body);\n      fragment = range.createContextualFragment(html);\n      document.body.appendChild(fragment);\n    }\n  } else {\n    if (el) el.parentNode.removeChild(el);\n  }\n}\n\n//@ sourceURL=/node_modules/derby/lib/refresh.js"
));

require.define("/main.js",Function(['require','module','exports','__dirname','__filename','process','global'],"var app = require('derby').createApp(module);\n\napp.changeDatabase = function(e,element,next) {\n  console.log('@@@',element.value);\n  app.model.set('_dbName',element.value);\n};\n\napp.get('/main', function (page, model) {\n\n  // model.on('set','message.test.text',function(object){\n  //   console.log(object)\n  // });\n  model.subscribe('dbs',function(){\n\n  });\n  model.subscribe('collections',function(){\n\n  });\n  model.subscribe('message.test.text', function (e,dbName) {\n    console.log(model.get('message.test'));\n    console.log(dbName);\n    model.ref('_dbName', dbName)\n    // model.on('set','_room',function(value){\n      // console.log('1',value)    \n\n    // });\n    page.render();  \n  });\n  \n});\n//@ sourceURL=/main.js"
));
require("/main.js");
})();

;(function() {
var view = DERBY.app.view;
view._makeAll({
  "main.html:body": "<span>List of databases</span><select name=\"dbs\" x-bind=\"change: changeDatabase\">{{#each dbs.databases}}<option value=\"{name}\" selected=\"{equal(name, message.test.text)}\">{name}</option>{{/}}</select><div>{{#each collections}}<option value=\"{name}\">{{name}}</option>{{/}}    </div><div><input value=\"{_dbName}\"/><p>{_dbName}</p></div><pre><code>{{collections}}</code></pre>",
  "main.html:doctype": "",
  "main.html:footer": "",
  "main.html:header": "",
  "main.html:title": "mongoui"
}, {
  "body": [
  "main.html:body",
  {}
],
  "doctype": [
  "main.html:doctype",
  {}
],
  "footer": [
  "main.html:footer",
  {}
],
  "header": [
  "main.html:header",
  {}
],
  "title": [
  "main.html:title",
  {}
]
});
view._makeComponents({});
})();