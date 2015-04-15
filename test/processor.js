var assert = require('assert');

var crass = require('crass');

var Processor = require('../lib/processor');


describe('Processor', function() {
    describe('stripData()', function() {

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

    describe('hasMatches()', function() {

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

    describe('search()', function() {

        it('should find sprite declarations in a CSS file', function() {
            var proc = {
                parsed: crass.parse('x y z{-shalam-sprite: "foo/bar";}'),
                foundSprites: [],
                rulesets: [],
            };

            Processor.prototype.search.call(proc);

            assert.deepEqual(proc.foundSprites, ['foo/bar']);
            assert.equal(proc.rulesets.length, 1);
            assert.ok(proc.rulesets[0].ruleset instanceof crass.objects.Ruleset);
            assert.deepEqual(proc.rulesets[0].spriteData, {
                path: 'foo/bar',
                destWidth: -1,
                destHeight: -1,
                destX: null,
                destY: null,
            });
        });

        it('should ignore non-shalam declarations', function() {
            var proc = {
                parsed: crass.parse('x y z{foo: bar}'),
                foundSprites: [],
                rulesets: [],
            };

            Processor.prototype.search.call(proc);

            assert.equal(proc.foundSprites.length, 0);
            assert.equal(proc.rulesets.length, 0);
        });

    });

});

describe('getSpriteDecl()', function() {

    function getDeclaration(input) {
        var res = crass.parse('foo{' + input + '}');
        return res.content[0].content[0];
    }

    it('should reject declarations that do not have an initial string', function() {
        assert.throws(function() {
            Processor.getSpriteDecl(getDeclaration('sprite: 123'));
        });
    });

    it('should accept bare strings', function() {
        assert.deepEqual(
            Processor.getSpriteDecl(getDeclaration('sprite: "foo/bar.png"')),
            {
                path: 'foo/bar.png',
                destWidth: -1,
                destHeight: -1,
                destX: null,
                destY: null,
            }
        );
    });

    it('should reject declarations that have non-function second expression elements', function() {
        assert.throws(function() {
            Processor.getSpriteDecl(getDeclaration('sprite: "foo" 123'));
        });
    });

    it('should reject declarations that have more than two expression elements', function() {
        assert.throws(function() {
            Processor.getSpriteDecl(getDeclaration('sprite: "foo" dest-size(10px 10px) 123'));
        });
    });

    it('should reject declarations that do not use dest-size as the second expression element', function() {
        assert.throws(function() {
            Processor.getSpriteDecl(getDeclaration('sprite: "foo" foo-size(10px 10px)'));
        });
    });

    it('should reject declarations that have an invalid dest-size', function() {
        assert.throws(function() {
            Processor.getSpriteDecl(getDeclaration('sprite: "foo" dest-size(10px)'));
        });
    });

    it('should accept sized strings', function() {
        assert.deepEqual(
            Processor.getSpriteDecl(getDeclaration('sprite: "foo/bar.png" dest-size(12px 34px)')),
            {
                path: 'foo/bar.png',
                destWidth: 12,
                destHeight: 34,
                destX: null,
                destY: null,
            }
        );
    });

});

describe('generateRulesetSpriteData()', function() {
    it('should return the expected ruleset for empty input', function() {
        assert.equal(
            Processor.generateRulesetSpriteData(
                {newRules: []},
                '    '
            ),
            '\n    /* shalam! */;\n    /* end shalam */'
        );
    });

    it('should return the expected ruleset for non-empty input', function() {
        assert.equal(
            Processor.generateRulesetSpriteData(
                {newRules: [
                    new crass.objects.Declaration(
                        'foo',
                        new crass.objects.Expression([
                            [null, new crass.objects.Number(123)],
                        ])
                    )
                ]},
                '    '
            ),
            '\n    /* shalam! */;\n    foo: 123;\n    /* end shalam */'
        );
    });

});

describe('newDimension()', function() {
    it('should return a Crass Dimension object', function() {
        assert.equal(
            Processor.newDimension(123).toString(),
            '123px'
        );
    });

    it('should return a Crass Dimension object with units', function() {
        assert.equal(
            Processor.newDimension(123, 'in').toString(),
            '123in'
        );
    });

    it('should return a Crass Number object without units when the input is zero', function() {
        assert.equal(
            Processor.newDimension(0, 'px').toString(),
            '0'
        );
    });

});

describe('newDeclaration()', function() {
    it('should return a Crass Declaration object', function() {
        assert.equal(
            Processor.newDeclaration(
                'foo',
                [[null, Processor.newDimension(123)]]
            ).toString(),
            'foo:123px'
        );
    });

});
