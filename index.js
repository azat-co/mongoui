var http = require('http');
var async = require('async');
//var mongo = require('mongodb');
var express = require('express');
var monk = require('monk');
var config = require('./config.json');
var db = monk(config.database.default.host + 
  ':' + 
  config.database.default.port + 
  '/' +
  config.database.default.name);

// var db= monk('localhost:27017/test')
var derby = require('derby');

var highlight = require('highlight').Highlight;
// derby.use(require('derby-ui-boot'));

var app = new express();

var server = http.createServer(app);

derby.use(derby.logPlugin);
var store = derby.createStore({
  listen: server
});
var model = store.createModel();

store.afterDb("set", "dbName", function(txn, doc, prevDoc, done) {
  if (txn && (txn.length > 2) && txn[3][1]) {
    //filter dbName based on existing list
    db = monk(config.database.default.host + ':' + config.database.default.port + '/' + txn[3][1]);
    db.driver.collectionNames(function(e, names) {
      //TODO: abstract it
      names.forEach(function(el,i,list){
        el.name=el.name.split('.')[1];
      })
      model.set('collections', names);
      if (names.length>0) model.set('collectionName', names[0].name)      
      // model.subscribe('collections', function() {
      console.log(model.get('collections'))
      done();
      // });
    });
  }
});



store.afterDb("set", "collectionName", function(txn, doc, prevDoc, done) {
  if (txn && (txn.length > 2) && txn[3][1]) {
    console.log(txn[3][1]);
    var collectionName = txn[3][1];
    db.get(collectionName).find({}, {
      limit: 20
      //,
      // skip: 20,
      // sort:{_id: 1}
    }, function(e, items) {
      if (e) console.error(e)
      // db.get(txn[3][1]).find({},{$limit:20}, function (e, items){
      if (items.length === 0) {
        model.set('collectionBox', {msg:"Collection is empty"});  
      } else {
        model.set('collectionBox', JSON.stringify(items,0,2));  
      }      
      done()
    })
  }
})



app.use(store.modelMiddleware());

var derbyApp = require('./main');

derbyApp.get('/', function(page, model, params, next) {
  page.redirect('/main')
});

if (config.database.default.name) {
  model.set('dbName', config.database.default.name);  
}    

var localDbs = {};

async.waterfall([

function(callback) {
  db.driver.admin.listDatabases(function(e, dbs) {
    callback(null, e, dbs);
  });
}, function(e, dbs, callback) {
  localDbs = dbs;

    callback(null);

}, function(callback) {
  model.subscribe('dbName', function(e, dbName) {
    model.subscribe('collectionBox', function() {
      model.subscribe('collectionName', function(){
        callback();
      })
    });      
  });
}]);

derbyApp.get('/main', function(page, model, params, next) {
  model.set('dbs',localDbs);
  page.render();
});

derbyApp.get('/host/:host_name/dbs/:db_name', function(page, model, params, next){
  model.subscribe('collections', function() {
    // console.log('YO')
  });  
  model.subscribe('dbs', function() {
    // console.log('YO')
  });      
    model.subscribe('collectionBox', function() {
    // console.log('YO')
  });  
  model.set('collectionName', '');
  model.set('dbs', localDbs)
  if (params.db_name!== model.get('dbName') ) {
    model.set('dbName', params.db_name);    
    // console.log("!!!CHANGEDB!!!",params.db_name);
  }
  page.render();
})

derbyApp.get('/host/:host_name/dbs/:db_name/collections/:collection_name', function(page, model, params, next){

  model.set('dbs', localDbs)
  model.subscribe('collections', function() {
    // console.log('YO')
  });  
  model.subscribe('dbs', function() {
    // console.log('YO')
  });      
    model.subscribe('collectionBox', function() {
    // console.log('YO')
  });  
      model.subscribe('dbName', function() {
    // console.log('YO')
  });  
  model.subscribe('collectionName', function() {
    // console.log('YO')
  });      

  if (params.db_name !== model.get('dbName') ) {
    // console.log("!!!CHANGE!!!",params.db_name);
    model.set('dbName', params.db_name);    
  }
  console.log(typeof params.query)
  if (params.query.query && params.collection_name) {
    // console.log(params.query);
    // console.log(params.query.query)
    var query = decodeURI(params.query.query);
    // console.log(typeof query);
    try {
      query = JSON.parse(query);
    } catch(e) {
      next(e);
    }
    //TODO cast types properly if 1 -> use number, not string 
   // db.get(params.collection_name).find({_access:1}, {
   db.get(params.collection_name).find(query, {
      limit: 20
      //,
      // skip: 20,
      // sort:{_id: 1}
    }, function(e, items) {
      if (e) console.error(e)      
      if (items.length === 0) {
        model.set('collectionBox', {msg:"No matches"});  
      } else {
        var html = highlight ( JSON.stringify(items,0,2));
        model.set('collectionBox',html);  
        //edit if one match
        if (items.length === 1) {
          model.set('item',items[0]);
          var itemConverted = editMode(items[0]);
          model.set('itemConverted', itemConverted);
          model.subscribe('itemConverted',function(){
            console.log('editing mode item subscribed')
          });

        }
      }      
      page.render(params);
    })    
  } else {
    model.set('collectionName', params.collection_name);
    page.render(params);
  }
  // model.set('query', decodeURI(params.query));

  // next();
})

app.use(derbyApp.router());

app.use(express.static(__dirname + '/public'));


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
app.get('/api/dbs/:db/collections/:name.json', function(req, res) {
  // console.log('!',db)
  var collection = db.get(req.params.name);
  collection.find({}, {
    limit: 20
  }, function(e, docs) {
    // console.log('boo', docs);
    res.json(docs);
  });
});

console.log('listening on port 3000');
server.listen(3000);

function editMode(item) {
    var rowList = [];
  // var level = 0;
  var iterate = function(object, list, level) {
    // console.log(typeof object)
    for (var key in object) {
      console.log(key)
    // Object.keys(object).forEach(function(key){
      if (typeof object[key] === 'object' ) {
        iterate(object[key],list,level+1);
      } if (typeof object[key] === 'function' ) {
          //do nothing
      } else {
        list.push({
          key: key,
          value: object[key],
          level: level,
          type: typeof object[key]
        });        
      };
    }; 
    // }); 
    return list;   
  }
  return iterate(item, rowList, 0);
  return rowList;
}