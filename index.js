"use strict"

let log = console.log
let express = require('express')
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
var db = mongoskin.db(`mongodb://${dbHostName}:${dbPortNumber}/${dbName}`)

var highlight = require('highlight').Highlight
var app = express()
app.use((req, res, next)=>{
  req.db = db
  req.admin = db.admin()
  next()
})


app.get('/', function(req, res, next) {
  res.status(200).send()
})
//
// derbyApp.get('/host/:host_name/dbs/:db_name', function(page, model, params, next){
//   model.subscribe('collections', function() {
//     // console.log('YO')
//   });
//   model.subscribe('dbs', function() {
//     // console.log('YO')
//   });
//     model.subscribe('collectionBox', function() {
//     // console.log('YO')
//   });
//   model.set('collectionName', '');
//   model.set('dbs', localDbs)
//   if (params.db_name!== model.get('dbName') ) {
//     model.set('dbName', params.db_name);
//     // console.log("!!!CHANGEDB!!!",params.db_name);
//   }
//   page.render({dbHostName: dbHostName});
// })
//
// derbyApp.get('/host/:host_name/dbs/:db_name/collections/:collection_name', function(page, model, params, next){
//   var url = '/host/' + params.host_name + '/dbs/' + params.db_name + '/collections/' + params.collection_name;
//   model.set('dbs', localDbs)
//   model.subscribe('collections', function() {
//     // console.log('YO')
//   });
//   model.subscribe('dbs', function() {
//     // console.log('YO')
//   });
//     model.subscribe('collectionBox', function() {
//     // console.log('YO')
//   });
//       model.subscribe('dbName', function() {
//     // console.log('YO')
//   });
//   model.subscribe('collectionName', function() {
//     // console.log('YO')
//   });
//
//   if (params.db_name !== model.get('dbName') ) {
//     // console.log("!!!CHANGE!!!",params.db_name);
//     model.set('dbName', params.db_name);
//   }
//   // console.log(typeof params.query)
//   if (params.collection_name) {
//     // console.log(params.query);
//     // console.log(params.query.query)
//     if (params.query.query) {
//       var query = decodeURI(params.query.query);
//       // console.log(typeof query);
//       try {
//         query = JSON.parse(query);
//         for (var key in query) { //monk has casting but let's do this anyways
//           if (typeof query[key] === 'string' && query[key].indexOf('ObjectId')>-1) {
//             var idValue = query[key].substr(10,24); //let's hope this never causes bugs
//             query[key] = db.id(idValue)
//             // console.log(query)
//           }
//         }
//       } catch(e) {
//         next(e);
//       }
//     } else {
//       var query = {};
//     }
//
//     //TODO cast types properly if 1 -> use number, not string
//     // db.get(params.collection_name).find({_access:1}, {
//     db.get(params.collection_name).find(query, {
//       limit: 20
//       //,
//       // skip: 20,
//       // sort:{_id: 1}
//     }, function(e, items) {
//       if (e) console.error(e)
//       var queryArr = [];
//       for (var k in query) {
//         queryArr.push({
//           'key': k,
//           'value': query[k],
//           'type': typeof query[k],
//           'isString': (typeof query[k]==='string' || typeof query[k] === 'object'),
//           'isNumber': typeof query[k]==='number'
//         });
//       }
//       // console.log(queryArr)
//       if (items.length === 0) {
//            page.render({dbHostName: dbHostName, queryResultHTML: "No matches", query: queryArr, url: url});
//         // model.set('collectionBox', {msg:"No matches"});
//       } else {
//         var html = highlight ( JSON.stringify(items,0,2));
//         // console.log(html)
//         // model.set('collectionBox',html);
//         //edit if one match
//         if (items.length === 1) {
//           model.set('item',items[0]);
//           var itemConverted = editMode(items[0], params.collection_name);
//           model.set('itemConverted', itemConverted);
//           model.subscribe('itemConverted',function(){
//             // console.log('editing mode item subscribed')
//             // console.log('***')
//
//             page.render({dbHostName: dbHostName, queryResultHTML: html, query: queryArr, url: url});
//           });
//         } else {
//           // console.log('@@@')
//           page.render({dbHostName: dbHostName, queryResultHTML: html});
//         }
//       }
//       // page.render(params);
//
//     })
//   } else {
//     model.set('collectionName', params.collection_name);
//     // page.render(params);
//     page.render({dbHostName: dbHostName});
//   }
//   // model.set('query', decodeURI(params.query));
//
//   // next();
// })
//
// app.use(derbyApp.router());
//
// app.use(express.static(__dirname + '/public'));
//
// // app.use(express.basicAuth('StorifyDev', 'St0rify!mongoui'));
//
app.get('/api.json', function(req, res) {
  // log(req.admin)
  req.admin.listDatabases(function(error, dbs) {
    // log(dbs)
    res.json(dbs)
  })
})
// app.get('/api/collections.json', function(req, res) {
//   db.driver.collectionNames(function(e, names) {
//     res.json(names);
//   });
// });
// app.get('/api/dbs/:db/collections/:name.json', function(req, res) {
//   // console.log('!',db)
//   var collection = db.get(req.params.name);
//   collection.find({}, {
//     limit: 20
//   }, function(e, docs) {
//     // console.log('boo', docs);
//     res.json(docs);
//   });
// });
//
//

if (require.main === module) {
  app.listen(3000, function(){
    console.log('mongoui is listening on: 3000');
  });
} else {
  module.exports = app
}

//
// function editMode(item, collectionName) {
//     var rowList = [];
//   // var level = 0;
//   var iterate = function(object, list, level, path) {
//     // console.log(typeof object)
//     for (var key in object) {
//       // console.log(key)
//     // Object.keys(object).forEach(function(key){
//       if (typeof object[key] === 'object' ) {
//         if (object[key] && !object[key]["_bsontype"]) {
//           iterate(object[key],list,level+1);
//         }
//       } if (typeof object[key] === 'function' ) {
//           //do nothing
//       } else {
//         list.push({
//           key: key,
//           isId: key === '_id',
//           value: object[key],
//           level: level*2,
//           type: typeof object[key],
//           path: [path, key].join('.')
//         });
//       };
//     };
//     // console.log(list);
//     // });
//     return list;
//   }
//   return iterate(item, rowList, 0, collectionName +'._'+item._id);
// }
