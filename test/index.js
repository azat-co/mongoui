"use strict"

let mocha = require('mocha')
let expect = require('chai').expect
let request = require('request')

before((done)=>{
  let app = require('../index.js')
  app.listen(3000, ()=>{
    done()
  })
})

describe('server', ()=>{
  it('should respond', (done)=>{
    request
      .get('http://localhost:3000/')
      .on('response', function(response) {
        // console.log(response.statusCode) // 200
        // console.log(response.headers['content-type']) // 'image/png'
        expect(response.statusCode).to.equal(200)
        done()
      })
  })
})
