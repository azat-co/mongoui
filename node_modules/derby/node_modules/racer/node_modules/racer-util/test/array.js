var expect = require('expect.js');
var arrayUtil = require('../array');

describe('array utils', function () {
  function isNumber (x) {
    return typeof x === 'number';
  }

  describe('any(xs, fn)', function () {
    var any = arrayUtil.any;

    it('should return true if at least one x in xs evals to fn(x) === true', function () {
      var hasNumber = any(['a', 1], isNumber);
      expect(hasNumber).to.be.ok();
    });

    it('should return false if no x in xs evals to fn(x) === true', function () {
      var hasNumber = any(['a', 'b'], isNumber);
      expect(hasNumber).to.not.be.ok();
    });
  });

  describe('indexOfFn(xs, fn)', function () {
    var indexOfFn = arrayUtil.indexOfFn;

    it('should return the first left-most index of the x in xs that evaluates to fn(x) === true', function () {
      var index = indexOfFn(['a', 1], isNumber);
      expect(index).to.equal(1);
    });

    it('should return -1 if no x in xs evals to fn(x) === true', function () {
      var index = indexOfFn(['a', 'b'], isNumber);
      expect(index).to.equal(-1);
    });
  });

  describe('deepIndexOf(xs, obj)', function () {
    var deepIndexOf = arrayUtil.deepIndexOf;

    it('should return the first left-most index of the x in xs that deepEquals obj', function () {
      var index = deepIndexOf([{a: 1}, {b: 2}], {b: 2});
      expect(index).to.equal(1);
    });

    it('should return -1 if no x in xs deepEquals obj', function () {
      var index = deepIndexOf([{a: 1}, {b: 2}], {c: 3});
      expect(index).to.equal(-1);
    });
  });
});
