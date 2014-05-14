
var monk = require('..');
var db = monk('localhost:27017/local');

var oplog = db.get('oplog.rs');
oplog.find({}, { tailable: true, awaitData: true })
  .each(function(){
    console.log(arguments);
  })
