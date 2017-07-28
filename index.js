#!/usr/bin/env node
"use strict"

const opn = require('opn')

let log = console.log
const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const expressHandlebars = require('express-handlebars')
const errorHandler = require('errorhandler')
const cors = require('cors')

const favicon = require('serve-favicon')
const path = require('path')

let mongoDb = require('mongodb')
let mongoskin = require('mongoskin')
let OId = require('mongoskin').ObjectId

let config = require('./config')

const port = config.api.port

let dbHostName, dbPortNumber, dbName

dbHostName = config.database.host
dbPortNumber = config.database.port
dbName = config.database.name

var app = express()
app.use(favicon(path.join(__dirname, 'public', 'img', 'favicons', 'favicon.ico')))
app.use(errorHandler())
app.use(cors({credential: false}))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname,'public')))

app.use(compression())

app.get('/api/dbs', function(req, res) {
  if (!req.admin) req.admin = mongoskin.db(`mongodb://${dbHostName}:${dbPortNumber}/${dbName}`).admin()
  req.admin.listDatabases(function(error, dbs) {
    res.json(dbs)
  })
})

app.param('dbName', function(req, res, next, dbName){
  var db = mongoskin.db(`mongodb://${dbHostName}:${dbPortNumber}/${dbName}`)
  req.db = db
  req.admin = db.admin()
  return next()
})
app.param('collectionName', function(req, res, next, collectionName){
  req.collection = req.db.collection(collectionName)
  return next()
})


app.get('/api/dbs/:dbName/collections', function(req, res, next) {
  req.db.collections(function(e, names) {
    if (!names) next(new Error('No collections'))
    let collections = names.map((collection)=>{
      log(collection.s.name)
      return {name: collection.s.name}
    })
    res.json({collections: collections})
  })
})

app.get('/api/dbs/:dbName/collections/:collectionName', function(req, res, next) {
  let query = {}
  try {
    query = JSON.parse(req.query.query)
    //recognize and convert any regex queries from strings into regex objects
    for (var prop in query){
      if ((query[prop][0] == "R" && query[prop][1] == "/") //arbitrary letter 'R' used by this app
        && (query[prop].length > 3)   //avoids a few corner cases
        && ((query[prop][(query[prop].length - 1) ] == "/" ) || (query[prop][(query[prop].length - 2)] == "/") || (query[prop][query[prop].length - 3 ] == "/" )|| (query[prop][query[prop].length - 4 ] == "/"  ))
      ){
        var splitRegex = query[prop].split("/")
        var makeRegex = new RegExp( splitRegex[1], splitRegex[2])
        query[prop] = makeRegex
      }
    }
  } catch (error) {
    console.log('Invalid query, cannot parse it.')
    query = {} // fail more gracefully.
    // return next(new Error('Invalid query, cannot parse it'))
  }
  if (query._id) {
    if (query._id['$in'] && Array.isArray(query._id.$in)) {
      query._id.$in = query._id.$in.map((id)=>{
        return OId(id)
      })
    } else query._id = OId(query._id)
  }
  req.collection.find(query || {}, {limit: req.query.limit || 20}).toArray(function(e, docs) {
    console.log('boo', docs, query)
    res.json({docs: docs})
  })
})

app.post('/api/dbs/:dbName/collections/:collectionName', function(req, res) {
  delete req.body._id
  req.collection.insert(req.body, function(e, results) {
    // console.log('boo', e, results)
    res.json(results)
  })
})

app.delete('/api/dbs/:dbName/collections/:collectionName/:id', function(req, res) {
  if (req.body._id && req.body._id != req.params.id) return res.status(400).json({error: 'ID in the body is not matching ID in the URL'})
  delete req.body._id
  req.collection.remove({ _id: mongoDb.ObjectId(req.params.id)}, function(e, results) {
    res.json(results)
  })
})

app.patch('/api/dbs/:dbName/collections/:collectionName/:id', function(req, res) {
  if (req.body._id && req.body._id != req.params.id) return res.status(400).json({error: 'ID in the body is not matching ID in the URL'})
  delete req.body._id
  req.collection.updateById(req.params.id, {$set: req.body}, function(e, results) {
    // console.log('boo', e, results)
    res.json(results)
  })
})


if (require.main === module) {
  app.listen(port, function(){
    if (process.env.NODE_ENV && process.env.NODE_ENV=='dev') {
      console.log('Mongoui API is listening on: %s', config.api.port)
    } else {
      console.log('Mongoui web app is listening on: %s', config.api.port)    
      // Opens the url in the default browser 
      opn(`http://localhost:${config.api.port}`)
    }
  })
} else {
  module.exports = app
}
