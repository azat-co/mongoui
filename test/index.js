"use strict"
let log = console.log
let mocha = require('mocha')
let expect = require('chai').expect
let request = require('request')
const config = require("../config").public;

let baseUrl = `${config.api.protocol}://${config.api.host}:${config.api.port}`

before((done)=>{
  let app = require('../index.js')
  app.listen(config.api.port, ()=>{
    done()
  })
})

describe('server', ()=>{
  it('should respond', (done)=>{
    request
      .get(baseUrl)
      .on('response', function(response) {
        // console.log(response.statusCode) // 200
        // console.log(response.headers['content-type']) // 'image/png'
        expect(response.statusCode).to.equal(200)
        done()
      })
  })
})

describe('server route /api/dbs', ()=>{
  it('should respond with list of databases', (done)=>{
    request({url: `${baseUrl}/api/dbs`, json: true}, (error, response, body) =>{
        log(body)
        expect(response.statusCode).to.equal(200)
        expect(body.databases).to.be.instanceof(Array)
        done()
      })
  })
})


// app.get('/api.json', function(req, res) {
//   db.driver.admin.listDatabases(function(e, dbs) {
//     res.json(dbs);
//   });
// });
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
