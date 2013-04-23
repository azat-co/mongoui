var http = require('http');
var async = require('async');
//var mongo = require('mongodb');
var express = require('express');
var monk = require('monk');
var config = require('./config.json');
var db = monk(config.database.
default.host + ':' + config.database.
default.port + '/' + config.database.
default.name);
// var db= monk('localhost:27017/test')
var derby = require('derby');

var app = new express();
// console.log(config.database.default.host+':'+config.database.default.port+'/' + config.database.default.name);
var server = http.createServer(app);
// console.log(derby.logPlugin)
derby.use(derby.logPlugin);
var store = derby.createStore({
  listen: server
});
store.afterDb("set", "dbName", function(txn, doc, prevDoc, done) {
  console.log(txn, txn.length, txn[3][1]);
  if (txn && (txn.length > 2) && txn[3][1]) {
    console.log(txn[3][1]);
    //filter dbName based on existing list
    db = monk(config.database.
    default.host + ':' + config.database.
    default.port + '/' + txn[3][1]);
    // model.set('dbName',txn[3].dbName);
    // db.driver.admin.listDatabases(function(e,dbs){
    // model.set('dbs',dbs);
    db.driver.collectionNames(function(e, names) {
      console.log(names);
      model.set('collections', names);
      model.subscribe('collections', function() {
        done();

      });
      // derbyApp.page.redirect('main');
    });
    // });
  }

});
var model = store.createModel();
// console.log(Object.keys(store))
// console.log(store.io)
// io.sockets.on('connection',function(socket){
// socket.on('set')
// })
// model.on('set',function(path,obj){
// console.log('***',path,obj)
// })


// console.log(con)

app.use(store.modelMiddleware());

var derbyApp = require('./main');

derbyApp.get('/main', function(page, model, params, next) {
  //asyc is used to tame the stream of callbacks
  //see: https://github.com/caolan/async

  async.waterfall([
    function(callback) {
      model.set('dbName', config.database.default.name);
      db.driver.admin.listDatabases(function(e, dbs) {
        callback(null, e, dbs);
      });
    }, function(e, dbs, callback) {
      model.set('dbs', dbs);
      //iterate trhough collection names
      db.driver.collectionNames(function(e, names) {
        callback(null, e, names);
      });
    }, function(e, names, callback){
      console.log(names);
      model.set('collections', names);
      //iterate through database names
      model.subscribe('dbs', function() {
        callback(null);
      });
    }, function(callback) {
      //iterate through collections
      model.subscribe('collections', function() {
        callback(null);
      });
    }, function(callback) {
      //for each database, render to page;
      model.subscribe('dbName', function(e, dbName) {
        page.render();
      });
    }
  ]);
});

// derbyApp.on('changeDatabase',function(obj,obj){
// console.log('HAHAHA')
// })
app.use(derbyApp.router());

app.use(express.static(__dirname + '/public'));
// console.log(Object.keys(model.async))
// console.log(model)
app.get('/main', function(req, res) {
  console.log(req.getModel().get('dbName'));
});
app.get('/api.json', function(req, res) {
  db.driver.admin.listDatabases(function(e, dbs) {
    res.json(dbs);
  });
});
app.get('/api/collections.json', function(req, res) {
  db.driver.collectionNames(function(e, names) {
    res.json(names);
  });
});
app.get('/api/collections/:db.:name.json', function(req, res) {
  // console.log('!',db)
  var collection = db.get(req.params.name);
  collection.find({}, {
    limit: 20
  }, function(e, docs) {
    console.log('boo',docs);
    res.json(docs);
  });
});

console.log('listening on port 3000');
server.listen(3000);
