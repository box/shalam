var assert = require('assert');
var fs = require('fs');
var path = require('path');

var crass = require('crass');

var walker = require('./walker');


var SHALAM_COMMENT_PATTERN = '[\\s\\n\\t]*\\/\\* shalam! \\*\\/(.|\\n|\\s)*?\\/\\* end shalam \\*\\/([\\s\\n\\t]*)';
var SPRITE_DECL_NAME = 'sprite';


function getSpriteDecl(decl) {
    // This function asserts that the sprite declaration is valid.

    var data = {
        destX: null,
        destY: null,
    };

    function mustBePxDimension(val) {
        assert(val instanceof crass.objects.Dimension);
        assert.equal(val.unit, 'px');
    }

    assert(decl.expr.chain[0][1] instanceof crass.objects.String, 'First expression must be a string');
    data.path = decl.expr.chain[0][1].value;

    if (decl.expr.chain.length > 1) {
        assert.equal(decl.expr.chain.length, 2);
        assert(decl.expr.chain[1][1] instanceof crass.objects.Func, 'Subsequent expressions must be functions');
        assert.equal(decl.expr.chain[1][1].name, 'dest-size');

        // Test that the first is the dest-expr function
        var destExpr = decl.expr.chain[1][1].content;
        assert(destExpr instanceof crass.objects.Expression);
        assert.equal(destExpr.chain.length, 2);
        mustBePxDimension(destExpr.chain[0][1]);
        mustBePxDimension(destExpr.chain[1][1]);

        // Save those values
        data.destWidth = destExpr.chain[0][1].number.value;
        data.destHeight = destExpr.chain[1][1].number.value;

    }

    return data;

}


function Processor(path) {
    this.path = path;
    this.data = fs.readFileSync(path).toString();
    this.stripData();

    this.parsed = crass.parse(this.data);
    this.rulesets = [];
    this.foundSprites = [];

    this.search();
}

Processor.prototype.stripData = function() {
    if(/\/\* shalam! \*\//.exec(this.data)) {
        this.data = this.data.replace(new RegExp(SHALAM_COMMENT_PATTERN, 'gi'), function(match) {
            // This allows us to match the line ending for the end of the
            // comment. By returning the last bit of whitespace (matches[2]),
            // it looks as if the shalam comment was never there.
            var matches = new RegExp(SHALAM_COMMENT_PATTERN).exec(match);
            return matches[2] || '';
        });
    }
};

Processor.prototype.search = function() {
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

        var spriteData = getSpriteDecl(spriteDecl);
        me.foundSprites.push(spriteData.path);
        me.rulesets.push({
            declaration: spriteDecl,
            spriteData: spriteData,
            ruleset: ruleset,
        });
    });
};

Processor.prototype.hasMatches = function() {
    return !!this.rulesets.length;
};

Processor.prototype.applyLayout = function(layout, spriteDestination) {
    var spritePath = path.relative(this.path, spriteDestination);

    // Sort each of the rulesets by its position in the stylesheet
    var rulesets = this.rulesets;
    rulesets.sort(function(a, b) {
        return a.ruleset.range.range[1] - b.ruleset.range.range[1];
    });

    rulesets.forEach(function(rulesetItem) {
        var layoutItem = layout.mapping[rulesetItem.spriteData.path];
        var newRules = [];

        newRules.push(newDeclaration(
            'background-image',
            [
                [null, new crass.objects.URI(spritePath)]
            ]
        ));

        var xScale = 1;
        var yScale = 1;

        // If we have destination size information, use that.
        if (rulesetItem.spriteData.destWidth) {
            // Update the scale factor for the sprite. This is necessary
            // because background-position uses units relative to the scaled
            // background size rather than the source background size.
            xScale = rulesetItem.spriteData.destWidth / layoutItem.width;
            yScale = rulesetItem.spriteData.destHeight / layoutItem.height;

            newRules.push(newDeclaration(
                'background-size',
                [
                    [null, newDimension(layout.width * xScale)],
                    [null, newDimension(layout.height * yScale)],
                ]
            ));
        }
        // Write the background position declaration with scaling.
        newRules.push(newDeclaration(
            'background-position',
            [
                [null, newDimension(layoutItem.x * -1 * xScale)],
                [null, newDimension(layoutItem.y * -1 * yScale)],
            ]
        ));

        rulesetItem.newRules = newRules;
    });

    // Default to indenting with spaces
    var indentChars = '    ';
    if (this.data[rulesets[0].declaration.range.range[0] - 1] === '\t') {
        indentChars = '\t';
    }

    // Iterate each affected ruleset in reverse and inject the sprite
    // declarations into the end of the ruleset.
    var processedOutput = this.data;
    var index;
    var rulesetData;
    for (var i = rulesets.length - 1; i >= 0; i--) {
        // Build the string of CSS to inject
        rulesetData = generateRulesetSpriteData(rulesets[i], indentChars);

        // Inject the new CSS declarations into the ruleset
        index = rulesets[i].declaration.range.range[1] + 1;
        // If the declaration has a semicolon after it,
        if (processedOutput[index] === ';') {
            index += 1;
        }
        processedOutput = processedOutput.substr(0, index) + rulesetData + processedOutput.substr(index);
    }

    fs.writeFileSync(this.path, processedOutput);

};

function generateRulesetSpriteData(ruleset, indentChars) {
    // Build the opening shalam comment.
    // NOTE: The extra semicolon is to account for weirdly-formed `sprite`
    // declarations. It is intentional.
    var rulesetData = '\n' + indentChars + '/* shalam! */;\n';

    // Pretty print each declaration that we're adding
    rulesetData += ruleset.newRules.map(function(decl) {
        // Semicolons must be added manually.
        return indentChars + decl.pretty() + ';\n';
    }).join('');

    // Add the ending shalam comment.
    rulesetData += indentChars + '/* end shalam */';

    return rulesetData;
}

function newDeclaration(name, expression) {
    return new crass.objects.Declaration(
        name,
        new crass.objects.Expression(expression)
    );
}

function newDimension(value, unit) {
    return new crass.objects.Dimension(
        new crass.objects.Number(value),
        unit || 'px'
    );
}

module.exports = Processor;
