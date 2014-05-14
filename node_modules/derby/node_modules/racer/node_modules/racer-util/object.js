module.exports = {
  merge: merge
, extract: extract
, deepEqual: deepEqual
, only: objectWithOnly
, filter: filter
};

function merge () {
  var merged = {};
  for (var i = 0, l = arguments.length; i < l; i++) {
    var obj = arguments[i];
    for (var k in obj) {
      merged[k] = obj[k];
    }
  }
  return merged;
}

function extract (key, obj) {
  return obj[key];
}

/**
 * Modified from node's assert.js
 */
function deepEqual (actual, expected, ignore) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  if (actual instanceof Date && expected instanceof Date)
    return actual.getTime() === expected.getTime();

  if (typeof actual === 'function' && typeof expected === 'function')
    return actual === expected || actual.toString() === expected.toString();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  if (typeof actual !== 'object' && typeof expected !== 'object')
    return actual === expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  if (ignore) {
    var ignoreMap = {}
      , i = ignore.length
    while (i--) {
      ignoreMap[ignore[i]] = true;
    }
  }
  return objEquiv(actual, expected, ignoreMap);
}

/** Private Functions **/

/**
 * Modified from node's assert.js
 */
function objEquiv (a, b, ignoreMap) {
  var i, key, ka, kb;

  if (a == null || b == null) return false;

  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;

  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (! isArguments(b)) return false;
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b);
  }
  try {
    if (ignoreMap) {
      ka = keysWithout(a, ignoreMap);
      kb = keysWithout(b, ignoreMap);
    } else {
      ka = Object.keys(a);
      kb = Object.keys(b);
    }
  } catch (e) {
    // happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length) return false;

  // the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();

  //~~~cheap key test
  i = ka.length;
  while (i--) {
    if (ka[i] !== kb[i]) return false;
  }

  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  i = ka.length;
  while (i--) {
    key = ka[i];
    if (! deepEqual(a[key], b[key])) return false;
  }
  return true;
}

function isArguments (obj) {
  return toString.call(obj) === '[object Arguments]';
}

function objectWithOnly (obj, paths) {
  var projectedDoc = {};
  for (var i = 0, l = paths.length; i < l; i++) {
    var path = paths[i];
    assign(projectedDoc, path, lookup(path, obj));
  }
  return projectedDoc;
}

function filter (obj, fn) {
  var filtered = {};
  for (var k in obj) {
    var curr = obj[k];
    if (fn(curr, k)) filtered[k] = curr;
  }
  return filtered;
}

function assign (obj, path, val) {
  var parts = path.split('.')
    , lastIndex = parts.length - 1;
  for (var i = 0, l = parts.length; i < l; i++) {
    var prop = parts[i];
    if (i === lastIndex) obj[prop] = val;
    else                 obj = obj[prop] || (obj[prop] = {});
  }
};

function lookup (path, obj) {
  if (!obj) return;
  if (path.indexOf('.') === -1) return obj[path];

  var parts = path.split('.');
  for (var i = 0, l = parts.length; i < l; i++) {
    if (!obj) return obj;

    var prop = parts[i];
    obj = obj[prop];
  }
  return obj;
};
