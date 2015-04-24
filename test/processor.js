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

    describe('getSortedRulesets', function() {
        var mockProcessor = {
            rulesets: [],
        };

        function getFakeRuleset(start, end) {
            return {
                ruleset: {
                    range: {
                        range: [start, end],
                    },
                },
            };
        }

        it('should return the rulesets sorted by end position', function() {
            var first = getFakeRuleset(0, 10);
            var second = getFakeRuleset(11, 20);
            var third = getFakeRuleset(21, 30);

            mockProcessor.rulesets.push(second);
            mockProcessor.rulesets.push(first);
            mockProcessor.rulesets.push(third);

            var output = Processor.prototype.getSortedRulesets.call(mockProcessor);

            assert.equal(output[0], first);
            assert.equal(output[1], second);
            assert.equal(output[2], third);

        });

    });

    describe('guessFileIndentation', function() {
        var mockRange = [];
        var mockProcessor = {
            data: 'foo {\n\tabc: def;\n}\n',
            rulesets: [
                {
                    declaration: {
                        range: {
                            range: mockRange,
                        },
                    }
                },
            ],
        };

        it('should return four spaces by default', function() {
            mockProcessor.data = 'foo {\n    abc: def;\n}\n';
            mockRange[0] = 10;
            mockRange[1] = 19;
            var output = Processor.prototype.guessFileIndentation.call(mockProcessor);
            assert.equal(output, '    ');
        });

        it('should return a tab when a tab is set', function() {
            mockProcessor.data = 'foo {\n\tabc: def;\n}\n';
            mockRange[0] = 7;
            mockRange[1] = 16;
            var output = Processor.prototype.guessFileIndentation.call(mockProcessor);
            assert.equal(output, '\t');
        });

    });

    describe('getSpriteRelativePath', function() {
        it('should generate the correct relative path', function() {
            var mockProcessor = {
                path: '/opt/shalam/style.css',
            };
            assert.equal(
                Processor.prototype.getSpriteRelativePath.call(mockProcessor, '/opt/shalam/sprite.png'),
                'sprite.png'
            );
        });

        it('should generate the correct relative path across directories', function() {
            var mockProcessor = {
                path: '/opt/shalam/static/css/style.css',
            };
            assert.equal(
                Processor.prototype.getSpriteRelativePath.call(mockProcessor, '/opt/shalam/static/img/sprite.png'),
                '../img/sprite.png'
            );
        });

    });

    describe('generateRulesetSpriteData', function() {

        it('should return the expected ruleset for empty input', function() {
            assert.equal(
                Processor.prototype.generateRulesetSpriteData(
                    {newRules: []},
                    '    '
                ),
                '\n    /* shalam! */;\n    /* end shalam */'
            );
        });

        it('should return the expected ruleset for non-empty input', function() {
            assert.equal(
                Processor.prototype.generateRulesetSpriteData(
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

    describe('rewriteCSS', function() {

        it('should inject Shalam data in all the right places', function() {
            var mockCSS = 'foo {\n\
                bar: 123px;\n\
                -shalam-sprite: "foo";\n\
            }\n\
            zip {\n\
                -shalam-sprite: "foo";\n\
                bar: 123px;\n\
            }\n\
            dupe {\n\
                -shalam-sprite: "foo";\n\
                bar: 123px;\n\
                -shalam-sprite: "foo";\n\
            }';
            var parsed = crass.parse(mockCSS);

            var declarationIndices = [1, 0, 2]; // Indices of -shalam-sprite in the css above
            var mockProcessor = {
                data: mockCSS,
                guessFileIndentation: function() {
                    return '    ';
                },
                generateRulesetSpriteData: function() {
                    // This represents the indentation of this file.
                    return '\n                /* << shalam >> */';
                },
            };
            var rulesets = parsed.content.map(function(ruleset, i) {
                return {
                    declaration: ruleset.content[declarationIndices[i]],
                    ruleset: ruleset,
                };
            });

            Processor.prototype.rewriteCSS.call(mockProcessor, rulesets);
            var expectedOutput = 'foo {\n\
                bar: 123px;\n\
                -shalam-sprite: "foo";\n\
                /* << shalam >> */\n\
            }\n\
            zip {\n\
                -shalam-sprite: "foo";\n\
                /* << shalam >> */\n\
                bar: 123px;\n\
            }\n\
            dupe {\n\
                -shalam-sprite: "foo";\n\
                bar: 123px;\n\
                -shalam-sprite: "foo";\n\
                /* << shalam >> */\n\
            }';
            assert.equal(mockProcessor.data, expectedOutput);

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
            Processor.getSpriteDecl(getDeclaration('-shalam-sprite: 123'));
        });
    });

    it('should accept bare strings', function() {
        assert.deepEqual(
            Processor.getSpriteDecl(getDeclaration('-shalam-sprite: "foo/bar.png"')),
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
            Processor.getSpriteDecl(getDeclaration('-shalam-sprite: "foo" 123'));
        });
    });

    it('should reject declarations that have more than two expression elements', function() {
        assert.throws(function() {
            Processor.getSpriteDecl(getDeclaration('-shalam-sprite: "foo" dest-size(10px 10px) 123'));
        });
    });

    it('should reject declarations that do not use dest-size as the second expression element', function() {
        assert.throws(function() {
            Processor.getSpriteDecl(getDeclaration('-shalam-sprite: "foo" foo-size(10px 10px)'));
        });
    });

    it('should reject declarations that have an invalid dest-size', function() {
        assert.throws(function() {
            Processor.getSpriteDecl(getDeclaration('-shalam-sprite: "foo" dest-size(10px)'));
        });
    });

    it('should accept sized strings', function() {
        assert.deepEqual(
            Processor.getSpriteDecl(getDeclaration('-shalam-sprite: "foo/bar.png" dest-size(12px 34px)')),
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
