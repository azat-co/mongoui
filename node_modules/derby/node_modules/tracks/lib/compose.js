var router = module.exports = require('./router')

module.exports = {
  transition: transition
}

/**
 * @param {Function} add (e.g., app.get, app.post, etc.)
 * @param {Array} transitionCalls is an array of objects that look 
 *   like {from, to, forward, back}
 * @param {String} from
 * @param {String} to
 * @param {Function} forward
 * @param {Function} back
 */
function transition(add, calls, from, to, forward, back) {
  if (from === to) return
  for (var i = 0, len = calls.length; i < len; i++) {
    var call = calls[i]
    if (call.from === to) {
      if (hasTransition(calls, from, call.to)) continue
      var composedForward = composeCallbacks(forward, call.forward, to)
      if (back && call.back) {
        var composedBack = composeCallbacks(call.back, back, to)
      }
      add({
        from: from
      , to: call.to
      , forward: composedForward
      , back: composedBack
      })
    } else if (call.to === from) {
      if (hasTransition(calls, call.from, to)) continue
      var composedForward = composeCallbacks(call.forward, forward, from)
      if (back && call.back) {
        var composedBack = composeCallbacks(back, call.back, from)
      }
      add({
        from: call.from
      , to: to
      , forward: composedForward
      , back: composedBack
      })
    }
  }
}

function hasTransition(calls, from, to) {
  for (var i = calls.length; i--;) {
    var call = calls[i];
    if (call.from === from && call.to === to) return true
  }
  return false
}

// TODO: Async support
function composeCallbacks(first, second, intermediatePath) {
  function composed(self, model, params, next, done) {
    var intermediateUrl = router.mapRoute(intermediatePath, params)
    var url = params.url
    var skipped = false
    function wrapNext(err) {
      skipped = true
      next(err)
    }
    params.url = intermediateUrl
    if (first.length === 4) {
      first.call(self, model, params, wrapNext, doneFirst)
    } else {
      first.call(self, model, params, wrapNext)
      doneFirst()
    }
    function doneFirst() {
      if (skipped) return
      params.previous = intermediateUrl
      params.url = url
      if (second.length === 4) {
        second.call(self, model, params, next, done)
      } else {
        second.call(self, model, params, next)
        done && done()
      }
    }
  }
  // These need to be defined individually, since their
  // argument length will be checked
  function asyncComposedCallback(model, params, next, done) {
    composed(this, model, params, next, done);
  }
  function composedCallback(model, params, next) {
    composed(this, model, params, next);
  }
  return (first.length === 4 || second.length === 4) ?
    asyncComposedCallback : composedCallback;
}
