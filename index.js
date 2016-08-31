"use strict"

let port = 3001
let log = console.log
const express = require('express')
const bodyParser = require('body-parser')
const compression = require('compression')
const expressHandlebars = require('express-handlebars')
const errorHandler = require('errorhandler')
const cors = require('cors')

const favicon = require('serve-favicon')
const path = require('path')

let config = require('./config.json')
let mongoDb = require('mongodb')
let mongoskin = require('mongoskin')
let OId = require('mongoskin').ObjectId

let dbHostName, dbPortNumber, dbName
if (config && config.database) {
  dbHostName = config.database.default.host
  dbPortNumber = config.database.default.port
  dbName = config.database.default.name
} else {
  dbHostName = 'localhost'
  dbPortNumber = 27017
  dbName = 'mongoui'
}

var app = express()
app.use(favicon(path.join(__dirname, 'public', 'img', 'favicons', 'favicon.ico')))
app.use(errorHandler())
app.use(cors({credential: false}))
app.use(bodyParser.json())
app.use(express.static('public'))
app.use(compression())

app.get('/', function(req, res, next) {
  res.status(200).render('Welcome to the MongoUI API. Please read the documentation on how to use the endpoints.')
})

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
    return next(new Error('Invalid query, cannot parse it'))
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
    console.log('mongoui is listening on: %s', port);
  });
} else {
  module.exports = app
}
