var qs = require('qs')
var nodeUrl = require('url');

module.exports = {
  render: render
, isTransitional: isTransitional
, mapRoute: mapRoute
}

function isTransitional(pattern) {
  return pattern.hasOwnProperty('from') && pattern.hasOwnProperty('to')
}

function mapRoute(from, params) {
  var i = params.url.indexOf('?')
  var queryString = (~i) ? params.url.slice(i) : ''
  // If the route looks like /:a/:b?/:c/:d?
  // and :b and :d are missing, return /a/c
  // Thus, skip the / if the value is missing
  var i = 0
  var path = from.replace(/\/(?:(?:\:([^?\/:*]+))|\*)(\?)?/g, onMatch)
  function onMatch(match, key, optional) {
    var value = key ? params[key] : params[i++]
    return (optional && value === void 0) ? '' : '/' + value
  }
  return path + queryString
}

function render(page, options, e) {
  var req = new RenderReq(page, options, e)
  req.routeTransitional(0, function() {
    req.routeQueue(0, function() {
      req.routeAndTransition(0, function() {
        // Cancel rendering by this app if no routes match
        req.cancel()
      })
    })
  })
}

function RenderReq(page, options, e) {
  this.page = page
  this.options = options
  this.e = e
  this.setUrl(options.url.replace(/#.*/, ''))
  var queryString = nodeUrl.parse(this.url).query;
  this.query = queryString ? qs.parse(queryString) : {}
  this.method = options.method
  this.body = options.body || {}
  this.previous = options.previous
  var routes = page._routes
  this.transitional = routes.transitional[this.method]
  this.queue = routes.queue[this.method]
  this.onRoute = routes.onRoute
}

RenderReq.prototype.cancel = function() {
  var options = this.options
  // Don't do anything if this is the result of an event, since the
  // appropriate action will happen by default
  if (this.e || options.noNavigate) return
  // Otherwise, manually perform appropriate action
  if (options.form) {
    options.form.setAttribute('data-router-ignore', '')
    options.form.submit()
  } else if (options.link) {
    options.link.setAttribute('data-router-ignore', '')
    options.link.click()
  } else {
    window.location.assign(options.url)
  }
}

RenderReq.prototype.setUrl = function(url) {
  this.url = url
  this.path = this.url.replace(/\?.*/, '')
}

RenderReq.prototype.routeTransitional = function(i, next) {
  i || (i = 0)
  var item
  while (item = this.transitional[i++]) {
    if (!item.to.match(this.path) || !item.from.match(this.previous)) continue
    var req = this
    var otherParams = this.routeParams(item.from)
    var params = this.routeParams(item.to, otherParams)
    // Even though we don't need to do anything after a done, pass a
    // no op function, so that routes can expect it to be defined
    function done() {}
    this.onMatch(item.to, params, function(err) {
      if (err) return req.cancel()
      req.routeTransitional(i, next)
    }, done)
    return
  }
  next()
}

RenderReq.prototype.routeQueue = function(i, next) {
  i || (i = 0)
  var route
  while (route = this.queue[i++]) {
    if (!route.match(this.path)) continue
    var req = this
    var params = this.routeParams(route)
    this.onMatch(route, params, function(err) {
      if (err) return req.cancel()
      req.routeQueue(i, next)
    })
    return
  }
  next()
}

RenderReq.prototype.routeAndTransition = function(i, next) {
  i || (i = 0)
  var render = this.page.render
  var item
  while (item = this.transitional[i++]) {
    if (!item.to.match(this.path)) continue
    var url = this.url
    var params = this.routeParams(item.to)
    this.setUrl(mapRoute(item.from.path, params))
    var req = this
    var skipped = false
    function continueNext() {
      skipped = true
      req.setUrl(url)
      req.page.render = render
      req.routeAndTransition(i, next)
    }
    this.page.render = function() {
      var renderArguments = arguments
      function done() {
        if (skipped) return
        req.page.render = render
        render.apply(req.page, renderArguments)
      }
      req.setUrl(url)
      var isAsync = req.onMatch(item.to, params, continueNext, done)
      if (isAsync) return
      done()
    }
    this.routeQueue(0, continueNext)
    return
  }
  next()
}

RenderReq.prototype.onMatch = function(route, params, next, done) {
  // Stop the default browser action, such as clicking a link or submitting a form
  if (this.e) {
    this.e.preventDefault()
    this.e = null
  }
  this.page.params = params
  return this.onRoute(
    route.callbacks
  , this.page
  , this.page.params
  , next
  , route.isTransitional
  , done
  )
}

RenderReq.prototype.routeParams = function(route, otherParams) {
  var routeParams = route.params
  var params = routeParams.slice()
  if (otherParams) {
    for (var key in otherParams) {
      params[key] = otherParams[key]
    }
  }
  for (var key in routeParams) {
    params[key] = routeParams[key]
  }
  params.previous = this.previous
  params.url = this.url
  params.body = this.body
  params.query = this.query
  params.method = this.method
  return params
}
