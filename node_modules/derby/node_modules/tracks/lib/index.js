var ExpressRouter = require('../vendor/express/router')
var router = module.exports = require('./router')
var compose = require('./compose')

router.setup = setup

function setup(app, createPage, onRoute) {
  var routes = []
  ;['get', 'post', 'put', 'del'].forEach(function(method) {
    app[method] = function(pattern, callback) {
      routes.push([method, pattern, callback])
      return app
    }
  })
  ;['enter', 'exit'].forEach(function(method) {
    app[method] = function() {}
  })

  function pageParams(req) {
    var reqParams = req.params
    var params = {
      url: req.url
    , body: req.body
    , query: req.query
    }
    for (var key in reqParams) {
      params[key] = reqParams[key]
    }
    return params
  }

  // router options default to:
  //   caseSensitive: false
  //   strict: false
  app.router = function(options) {
    var expressRouter = new ExpressRouter(options)
    var expressRouterTransitional = new ExpressRouter(options)

    function middleware(req, res, next) {
      // To avoid naming conflicts just in case
      var _tracksPage = req._tracksPage
      var _tracksAttempted = req._tracksAttempted

      var page = createPage(req, res)
      page._res = res
      page.redirect = redirect
      req._tracksPage = page
      expressRouter._dispatch(req, res, function(err) {
        if (err) return next(err)
        // Transitional routes change the URL, so change it back afterward
        // if we failed to handle the request already
        var url = req.url
        req._tracksAttempted = []
        expressRouterTransitional._dispatch(req, res, function(err) {
          req._tracksPage = _tracksPage
          req._tracksAttempted = _tracksAttempted
          req.url = url
          next(err)
        })
      })
    }

    var transitionalCalls = []
    routes.forEach(function(route) {
      var method = route[0]
      var pattern = route[1]
      var callback = route[2]

      if (router.isTransitional(pattern)) {
        transitionalCalls.push({
          method: method
        , from: pattern.from
        , to: pattern.to
        , forward: pattern.forward || (callback && callback.forward) || callback
        , back: pattern.back || (callback && callback.back)
        })
        return
      }

      // Create a normal route
      expressRouter.route(method, pattern, function(req, res, next) {
        var page = req._tracksPage
        var params = page.params = pageParams(req)
        return onRoute(callback, page, params, next)
      })
    })

    transitionalCalls.forEach(function(route) {
      addForwardAndBack(route)
      compose.transition(function(composed) {
        composed.method = route.method
        transitionalCalls.push(composed)
        addForwardAndBack(composed)
      }, transitionalCalls, route.from, route.to, route.forward, route.back)
    })
    function addForwardAndBack(route) {
      addTransitional(route.method, route.to, route.from, route.forward)
      if (route.back) {
        addTransitional(route.method, route.from, route.to, route.back)
      }
    }
    function addTransitional(method, to, from, callback) {
      function fn(req, res, next) {
        // Only try each transitional route once per request
        if (~req._tracksAttempted.indexOf(fn)) return next()
        req._tracksAttempted.push(fn)

        var page = req._tracksPage
        var params = pageParams(req)

        // Wrap the render function to run the forward callback
        // immediately before rendering
        var render = page.render
        page.render = function() {
          var renderArguments = arguments
          var skipped = false
          function wrapNext(err) {
            skipped = true
            page.render = render
            params.previous = void 0
            next(err)
          }
          function done(err) {
            if (skipped) return
            page.render = render
            params.previous = void 0
            render.apply(page, renderArguments)
          }
          page.params = params
          params.previous = req.url
          var isAsync = onRoute(callback, page, params, wrapNext, true, done)
          if (isAsync) return
          done()
        }
        // Reroute with the new URL and modified page
        var url = req.url
        req.url = router.mapRoute(from, params)
        expressRouter._dispatch(req, res, function(err) {
          if (err) return next(err)
          // Try again
          req.url = url
          page.render = render
          expressRouterTransitional._dispatch(req, res, next)
        })
      }
      expressRouterTransitional.route(method, to, fn)
    }
    return middleware
  }

  return routes
}

function redirect(url, status) {
  // TODO: Appears there is a bug that Express throws when an undefined
  // status is passed. Fix bug and remove this condition
  if (status) {
    this._res.redirect(url, status)
  } else {
    this._res.redirect(url)
  }
}
