var fs = require('fs');

var crass = require('crass');

var walker = require('./walker');


var SPRITE_DECL_NAME = 'sprite';


function Processor(path) {
    this.path = path;
    this.data = fs.readFileSync(path);
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
        this.foundSprites.push(spriteDecl.expr);
        me.rulesets.push(ruleset);
    });
};


module.exports = Processor;
