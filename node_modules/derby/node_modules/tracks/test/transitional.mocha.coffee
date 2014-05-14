expect = require 'expect.js'

global.window =
  location: {}
  history: {}

tracks = require '../lib/browser'
router = require '../lib/router'


describe 'transitional routes', ->
  it 'should parse an empty query params when going from -> to, when no querystring in the url', (done) ->
    @timeout 2000
    app = {}
    createPage = (req, res) ->
      return {model: {}}
    onRoute = (callback, page, params, next, isTransitional, done) ->
      if isTransitional
        if callback.length is 4
          callback(page.model, params, next, done)
          return true
        else
          callback(page.model, params, next)
          return
      callback(page, page.model, params, next)

    routes = tracks.setup app, createPage, onRoute

    app.get from: '/a/b', to: '/x/y', (model, params, next) ->
      expect(params.query).to.eql {}
      done()

    history = app.history
    options =
      method: 'get'
      url: '/x/y'
      previous: '/a/b'
      body: ''
    router.render(history.page(), options)
