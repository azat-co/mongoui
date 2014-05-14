var expect = require('expect.js');
var fn = require('../fn');

describe('fn', function () {
  describe('curry', function () {
    var curry = fn.curry;

    it('should work', function () {
      function sum (a, b, c) {
        return a + b + c;
      }
      var addToFive = curry(sum, 5);
      expect(addToFive(10, 20)).to.equal(5 + 10 + 20);
    });

  });
});
