var http = require('http');
var async = require('async');
//var mongo = require('mongodb');
var express = require('express');
var monk = require('monk');
var config = require('./config.json');

var dbHostName, dbPortNumber, dbName;
if (config && config.database) {
  dbHostName = config.database.default.host;
  dbPortNumber = config.database.default.port;
  dbName = config.database.default.name;
} else {
  dbHostName = 'localhost';
  dbPortNumber = 27017;
  dbName = 'mongoui';
}
var db = monk(dbHostName + ':' + 
  dbPortNumber + '/' +
  dbName);

// var db= monk('localhost:27017/test')
var derby = require('derby');

var highlight = require('highlight').Highlight;


var app = new express();

var server = http.createServer(app);
// derby.use(require('derby-ui-boot'));

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
      if (e) {
        console.error(e);
        process.exit(1);
      }
      //TODO: abstract it
      names.forEach(function(el,i,list){
        // console.log(el.name)
        el.name = el.name.split('.')[1];  
        if (el.name === 'system' ) { //let's not show system.indexes collections
          delete list[i];
        }
      })
      model.set('collections', names);
      if (names.length>0 && names[0]) model.set('collectionName', names[0].name)      
      // model.subscribe('collections', function() {
      // console.log(model.get('collections'))
      done();
      // });
    });
  }
});


store.afterDb("set", "itemConverted.*.value",function(txn, doc, prevDoc, done) {
  // console.log('***',txn, doc, prevDoc)
  done();
  if (txn && (txn.length > 2) && txn[3][1]) {
    
    var newValue = txn[3][1];
    var path = doc.path.split('.');
    var id = path[1].substr(1);
    var collection = path[0];
    var pathStr = path[2];

    // db.get(path[0]).update({
    //   _id: path[1].substr(1)
    // }, {
    //   $set: { path[2]: newValue }
    // }, function (e, results) {
    var setObj = {};
    setObj[pathStr] = newValue;

    db.get(collection).updateById(id, {  $set: setObj}, function(e,results){
       // console.log(e, results);
      // model.set(txn[3][0], newValue);
    })
  }  
});


store.afterDb("set", "collectionName", function(txn, doc, prevDoc, done) {
  if (txn && (txn.length > 2) && txn[3][1]) {
    // console.log(txn[3][1]);
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

derbyApp.get('/', function(page, model, params, next) {
  model.set('dbs',localDbs);
  page.render({dbHostName:dbHostName});
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
  page.render({dbHostName: dbHostName});
})

derbyApp.get('/host/:host_name/dbs/:db_name/collections/:collection_name', function(page, model, params, next){
  var url = '/host/' + params.host_name + '/dbs/' + params.db_name + '/collections/' + params.collection_name;
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
  // console.log(typeof params.query)
  if (params.collection_name) {
    // console.log(params.query);
    // console.log(params.query.query)
    if (params.query.query) {
      var query = decodeURI(params.query.query);
      // console.log(typeof query);
      try {
        query = JSON.parse(query);
        for (var key in query) { //monk has casting but let's do this anyways
          if (typeof query[key] === 'string' && query[key].indexOf('ObjectId')>-1) {
            var idValue = query[key].substr(10,24); //let's hope this never causes bugs
            query[key] = db.id(idValue)
            // console.log(query)
          }
        }
      } catch(e) {
        next(e);
      }      
    } else {
      var query = {};
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
      var queryArr = [];
      for (var k in query) {
        queryArr.push({
          'key': k,
          'value': query[k],
          'type': typeof query[k],
          'isString': (typeof query[k]==='string' || typeof query[k] === 'object'),
          'isNumber': typeof query[k]==='number'
        });
      }
      // console.log(queryArr)        
      if (items.length === 0) {
           page.render({dbHostName: dbHostName, queryResultHTML: "No matches", query: queryArr, url: url});  
        // model.set('collectionBox', {msg:"No matches"});  
      } else {
        var html = highlight ( JSON.stringify(items,0,2));        
        // console.log(html)
        // model.set('collectionBox',html);  
        //edit if one match
        if (items.length === 1) {
          model.set('item',items[0]);
          var itemConverted = editMode(items[0], params.collection_name);
          model.set('itemConverted', itemConverted);
          model.subscribe('itemConverted',function(){
            // console.log('editing mode item subscribed')
            // console.log('***')

            page.render({dbHostName: dbHostName, queryResultHTML: html, query: queryArr, url: url});
          });
        } else {
          // console.log('@@@')
          page.render({dbHostName: dbHostName, queryResultHTML: html});
        }
      }      
      // page.render(params);
      
    })    
  } else {
    model.set('collectionName', params.collection_name);
    // page.render(params);
    page.render({dbHostName: dbHostName});
  }
  // model.set('query', decodeURI(params.query));

  // next();
})

app.use(derbyApp.router());

app.use(express.static(__dirname + '/public'));

// app.use(express.basicAuth('StorifyDev', 'St0rify!mongoui'));

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




server.listen(3000, function(){
  console.log('mongoui is listening on: %s:%s', server.address().address, server.address().port);  
});


function editMode(item, collectionName) {
    var rowList = [];
  // var level = 0;
  var iterate = function(object, list, level, path) {
    // console.log(typeof object)
    for (var key in object) {
      // console.log(key)
    // Object.keys(object).forEach(function(key){
      if (typeof object[key] === 'object' ) {
        if (object[key] && !object[key]["_bsontype"]) {
          iterate(object[key],list,level+1);          
        }
      } if (typeof object[key] === 'function' ) {
          //do nothing
      } else {
        list.push({
          key: key,
          isId: key === '_id',
          value: object[key],
          level: level*2,
          type: typeof object[key],
          path: [path, key].join('.')
        });        
      };
    }; 
    // console.log(list);
    // }); 
    return list;   
  }
  return iterate(item, rowList, 0, collectionName +'._'+item._id);
}