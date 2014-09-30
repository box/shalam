var assert = require('assert');

var crass = require('crass');

var walker = require('../lib/walker');


describe('Walker', function() {

    describe('walk()', function() {

        function countHits(stylesheet, expectedCount) {
            var hits = 0;
            walker.walk(crass.parse(stylesheet), function() {
                hits += 1;
            });
            assert.equal(hits, expectedCount);
        }

        it('should find rulesets in the root of a stylesheet', function() {
            countHits('x {foo: bar} y {zip: zap}', 2);
        });

        it('should find rulesets in media queries', function() {
            countHits('@media (min-width: 960px) {x {foo: bar} y {zip: zap}}', 2);
        });

        it('should find rulesets in support blocks', function() {
            countHits('@supports (transform: rotateX(10deg)) {x {foo: bar} y {zip: zap}}', 2);
        });

        it('should find page margins', function() {
            countHits('@page :first {@top-right {foo: bar}}', 1);
        });

        it('should find keyframes', function() {
            countHits('@keyframes foo {to{foo: bar} from{zip:zap}}', 2);
        });

    });

});
