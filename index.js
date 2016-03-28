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

app.get('/api/databases', function(req, res) {
  req.admin.listDatabases(function(error, dbs) {
    res.json(dbs)
  })
})

app.get('/api/collections', function(req, res) {
  req.db.collections(function(e, names) {
    let collections = names.map((collection)=>{
      log(collection.s.name)
      return {name: collection.s.name}
    })
    res.json(collections)
  })
})
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
