var assert = require('assert');

var Processor = require('../lib/processor');


describe('Processor', function() {
    describe('Processor.stripData', function() {

        var mockProcessor = {};

        it('should strip existing shalam declarations', function() {
            mockProcessor.data = 'foo {/* shalam! */ hello: goodbye; /* end shalam */}';
            Processor.prototype.stripData.call(mockProcessor);

            assert.equal(mockProcessor.data, 'foo {}');
        });

        it('should strip existing shalam declarations while preserving whitespace', function() {
            mockProcessor.data = 'foo {\n    first: foo;\n    /* shalam! */\n    hello: goodbye;\n    /* end shalam */\n}';
            Processor.prototype.stripData.call(mockProcessor);

            assert.equal(mockProcessor.data, 'foo {\n    first: foo;\n}');
        });

        it('should strip existing shalam declarations while preserving whitespace between other declarations', function() {
            mockProcessor.data = 'foo {\n    first: foo;\n    /* shalam! */\n    hello: goodbye;\n    /* end shalam */\n    second: bar;\n}';
            Processor.prototype.stripData.call(mockProcessor);

            assert.equal(mockProcessor.data, 'foo {\n    first: foo;\n    second: bar;\n}');
        });

    });

    describe('Processor.hasMatches', function() {

        var mockProcessor = {};

        it('should return true when there are matches', function() {
            mockProcessor.rulesets = ['first', 'second'];
            assert(Processor.prototype.hasMatches.call(mockProcessor));
        });

        it('should return false when there are no matches', function() {
            mockProcessor.rulesets = [];
            assert(!Processor.prototype.hasMatches.call(mockProcessor));
        });

    });

});
