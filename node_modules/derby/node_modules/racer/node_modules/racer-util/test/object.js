var expect = require('expect.js');
var objectUtil = require('../object');

describe('object utils', function () {
  describe('merge', function () {
    var merge = objectUtil.merge;

    it('should be able to merge 2 objects', function () {
      var a = {x: 1};
      var b = {y: 2};
      expect(merge(a, b)).to.eql({x: 1, y: 2});
    });

    it('should not modify the state of the inputs', function () {
      var a = {x: 1};
      var b = {y: 2};
      merge(a, b);
      expect(a).to.eql({x: 1});
      expect(b).to.eql({y: 2});
    });

    it('should give precedence to arguments that appear later', function () {
      var a = {x: 1};
      var b = {x: 2};
      expect(merge(a, b)).to.eql({x: 2});
    });

    it('should be able to merge > 2 objects', function () {
      var a = {x: 1};
      var b = {y: 2};
      var c = {z: 3};
      expect(merge(a, b, c)).to.eql({x: 1, y: 2, z: 3});
    });

    it('should be able to merge objects that have 2+ keys', function () {
      var a = {x: 1, y: 2};
      var b = {y: 3, z: 4};
      expect(merge(a, b)).to.eql({x: 1, y: 3, z: 4});
    });
  });

  describe('extract', function () {
    var extract = objectUtil.extract;

    it('should return the value of a key lookup on an object', function () {
      var obj = {name: 'Brian'};
      var key = 'name';
      var val = extract(key, obj);
      expect(val).to.equal('Brian');
    });
  });

  describe('deepEqual', function () {
    var deepEqual = objectUtil.deepEqual;

    describe('btwn objects', function () {
      it('should return true if the keys & values are all equal', function () {
        var x = {a: 1, b: 2};
        var y = {a: 1, b: 2};
        expect(deepEqual(x, y)).to.be.ok();
      });

      it('should return false if at least one key/value are unequal', function () {
        var x = {a: 1, b: 2};
        var y = {a: 1, b: 3};
        expect(deepEqual(x, y)).to.not.be.ok();
      });

      it('should return true if the keys & values are all equal for deeply nested objects', function () {
        var x = {a: {b: 'c'}};
        var y = {a: {b: 'c'}};
        expect(deepEqual(x, y)).to.be.ok();
      });

      it('should return false if at least one key/value are unequal for deeply nested objects', function () {
        var x = {a: {b: 'c'}};
        var y = {a: {b: 'd'}};
        expect(deepEqual(x, y)).to.not.be.ok();
      });
    });

    describe('btwn arrays', function () {
      it('should return true between equiv arrays of non-objects', function () {
        var x = [1, 2, 3];
        var y = [1, 2, 3];
        expect(deepEqual(x, y)).to.be.ok();
      });

      it('should return false between non-equiv arrays of non-objects', function () {
        var x = [1, 2, 3];
        var y = [1, 2, 4];
        expect(deepEqual(x, y)).to.not.be.ok();
      });

      it('should return true between equiv arrays of objects', function () {
        var x = [{a: 1}, {b: 2}];
        var y = [{a: 1}, {b: 2}];
        expect(deepEqual(x, y)).to.be.ok();
      });

      it('should return false between non-equiv arrays of objects', function () {
        var x = [{a: 1}, {b: 2}];
        var y = [{a: 1}, {b: 3}];
        expect(deepEqual(x, y)).to.not.be.ok();
      });
    });

  });
});
