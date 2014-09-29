var assert = require('assert');
var fs = require('fs');

var crass = require('crass');

var walker = require('./walker');


var SPRITE_DECL_NAME = 'sprite';


function validateSpriteDecl(decl) {
    // This function asserts that the sprite declaration is valid.

    function mustBePxDimension(val) {
        assert(val instanceof crass.objects.Dimension);
        assert.equal(val.unit, 'px');
    }

    assert(decl.expr.chain[0][1] instanceof crass.objects.String, 'First expression must be a string');

    if (decl.expr.chain.length > 1) {
        assert.equal(decl.expr.chain.length, 2);
        assert(decl.expr.chain[1][1] instanceof crass.objects.Func, 'Subsequent expressions must be functions');
        assert.equal(decl.expr.chain[1][1].name, 'dest-size');

        assert(decl.expr.chain[1][1].content instanceof crass.objects.Expression);
        assert.equal(decl.expr.chain[1][1].content.chain.length, 2);
        mustBePxDimension(decl.expr.chain[1][1].content.chain[0][1]);
        mustBePxDimension(decl.expr.chain[1][1].content.chain[1][1]);

    }

}


function Processor(path) {
    this.path = path;
    this.data = fs.readFileSync(path).toString();
    this.stripped = null;

    this.parsed = crass.parse(this.data);
    this.rulesets = [];
    this.foundSprites = [];
}

Processor.prototype.search = function() {
    if(/\/\* shalam! \*\//.exec(this.data)) {
        this.data = this.data.replace(/\/\* shalam! \*\/(.|\n)*\/\* end shalam \*\//, function() {
            return '';
        });
    }

    var me = this;
    walker.walk(this.parsed, function(ruleset) {
        var decl;
        var spriteDecl;
        for (var i = 0; i < ruleset.content.length; i++) {
            decl = ruleset.content[i];
            if (decl.ident !== SPRITE_DECL_NAME) continue;
            spriteDecl = decl;
        }
        if (!spriteDecl) return;

        validateSpriteDecl(spriteDecl);

        me.foundSprites.push(spriteDecl.expr.chain[0][1]);
        me.rulesets.push({
            ruleset: ruleset,
            declaration: spriteDecl,
        });
    });
};

Processor.prototype.hasMatches = function() {
    return !!this.rulesets.length;
};


module.exports = Processor;
