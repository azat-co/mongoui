var express = require('express');
var monk = require('monk');
var db =  monk('localhost:27017/test');
var app = new express();

app.use(express.static(__dirname + '/public'));
app.get('/',function(req,res){
  res.json({});
})
app.get('/collections/:name',function(req,res){
  var collection = db.get(req.params.name);
  collection.find({},{limit:20},function(e,docs){
    res.json(docs);
  })
});
app.listen(3000)