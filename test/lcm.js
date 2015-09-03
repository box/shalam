var assert = require('assert');

var lcm = require('../lib/lcm').lcm;


describe('lcm', function() {

	[
		{ints: [1, 2], result: 2},
		{ints: [2, 3, 5], result: 30},
		{ints: [2, 3, 5, 6], result: 30},
		{ints: [1, 2, 4], result: 4},
		{ints: [1, 2, 3], result: 6},
	].forEach(function(params) {
		it('should find lowest common multiple for ' + JSON.stringify(params), function() {
			var out = lcm(params.ints);
			assert.equal(params.result, out);
		});
	});

});
