"use strict"

let port = 3001
let log = console.log
let express = require('express')
let bodyParser = require('body-parser')
let compression = require('compression')
let expressHandlebars = require('express-handlebars')
let cors = require('cors')

let config = require('./config.json')
let mongoskin = require('mongoskin')

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

var highlight = require('highlight').Highlight
var app = express()
app.use(cors({credential: false}))
app.use(bodyParser.json())
app.use(express.static('public'))
app.use(compression())


// app.get('/', function(req, res, next) {
//   res.status(200).render('home')
// })
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

app.get('/api/dbs', function(req, res) {
  if (!req.admin) req.admin = mongoskin.db(`mongodb://${dbHostName}:${dbPortNumber}/${dbName}`).admin()
  req.admin.listDatabases(function(error, dbs) {
    res.json(dbs)
  })
})

app.get('/api/dbs/:dbName/collections', function(req, res) {
  req.db.collections(function(e, names) {
    let collections = names.map((collection)=>{
      log(collection.s.name)
      return {name: collection.s.name}
    })
    res.json({collections: collections})
  })
})
app.get('/api/dbs/:dbName/collections/:collectionName', function(req, res) {
  let collection = req.db.collection(req.params.collectionName, {strict: true})
  console.log(req.query);
  collection.find(req.query || {}, {limit: req.query.limit || 20}).toArray(function(e, docs) {
    // console.log('boo', docs)
    res.json({docs: docs})
  })
})

app.put('/api/dbs/:dbName/collections/:collectionName/:id', function(req, res) {
  let collection = req.db.collection(req.params.collectionName, {strict: true})
  collection.findById(req.params.id, {$set: req.body}, function(e, results) {
    // console.log('boo', docs)
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
