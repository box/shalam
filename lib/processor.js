/**
 * @fileoverview Tools responsible for reading and processing CSS
 * @author basta
 */

'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var crass = require('crass');

var walker = require('./walker');


//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

var SHALAM_COMMENT_PATTERN = '[\\s\\n\\t]*\\/\\* shalam! \\*\\/(.|\\n|\\s)*?\\/\\* end shalam \\*\\/([\\s\\n\\t]*)';
var SPRITE_DECL_NAME = '-shalam-sprite';


//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------


/**
 * The CSS file processor object.
 * @constructor
 * @param {string} path Path to the CSS file being processed.
 */
function Processor(path) {
    this.path = path;
    this.data = fs.readFileSync(path).toString();
    this.stripData();

    this.parsed = crass.parse(this.data);
    this.rulesets = [];
    this.foundSprites = [];

    this.search();
}

/**
 * Strips existing shalam comments from the CSS file.
 * @returns {void}
 */
Processor.prototype.stripData = function stripData() {
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

/**
 * Searches the CSS file for `-shalam-sprite` declarations.
 * @returns {void}
 */
Processor.prototype.search = function search() {
    walker.walk(this.parsed, function processorSearchCallback(ruleset) {
        var decl;
        var spriteDecl;
        // When a ruleset is encountered, iterate its contents.
        for (var i = 0; i < ruleset.content.length; i++) {
            decl = ruleset.content[i];
            // If the declaration doesn't have an applicable name, ignore it.
            if (decl.ident !== SPRITE_DECL_NAME) continue;
            // Keep only a single declaration around. Only the last sprite
            // declaration is used.
            spriteDecl = decl;
        }
        // If no sprite declaration was found in the ruleset, ignore the ruleset.
        if (!spriteDecl) return;

        // Get data about the sprite declaration.
        var spriteData = getSpriteDecl(spriteDecl);

        // Save references to the sprite declaration and the ruleset.
        this.foundSprites.push(spriteData.path);
        this.rulesets.push({
            declaration: spriteDecl,
            spriteData: spriteData,
            ruleset: ruleset,
            newRules: null, // Filled in after processing is complete with the new Shalam data
        });
    }.bind(this));
};

/**
 * Returns whether any rulesets in the CSS file contain sprite declarations.
 * @returns {bool}
 */
Processor.prototype.hasMatches = function hasMatches() {
    return !!this.rulesets.length;
};

/**
 * Returns an array of rulesets in the corresponding CSS file sorted by their
 * position in the file (top to bottom).
 * @return {Ruleset[]} Sorted rulesets
 */
Processor.prototype.getSortedRulesets = function getSortedRulesets() {
    var rulesets = this.rulesets;
    rulesets.sort(function(a, b) {
        return a.ruleset.range.range[1] - b.ruleset.range.range[1];
    });
    return rulesets;
};

/**
 * Returns the string used to indent lines in the file.
 * @return {string}
 */
Processor.prototype.guessFileIndentation = function guessFileIndentation() {
    // Default to indenting with four spaces
    var indentChars = '    ';
    if (this.data[this.rulesets[0].declaration.range.range[0] - 1] === '\t') {
        indentChars = '\t';
    }
    return indentChars;
};

Processor.prototype.getSpriteRelativePath = function getSpriteRelativePath(spriteDestination) {
    return path.relative(path.dirname(this.path), spriteDestination);
};

/**
 * Rewrites the CSS file to include updated sprite sheet information.
 * @param {object} layout The layout object to update the file with.
 * @param {object} layoutCompat The compatibility layout object to update the file with.
 * @param {string} spriteDestination The location to composite the sprites to.
 * @returns {void}
 */
Processor.prototype.applyLayout = function applyLayout(layout, layoutCompat, spriteDestination) {
    var spritePath = this.getSpriteRelativePath(spriteDestination);

    // Sort each of the rulesets by its position in the stylesheet
    var rulesets = this.getSortedRulesets();

    rulesets.forEach(function(rulesetItem) {
        var layoutItem = layout.mapping[rulesetItem.spriteData.path];
        var layoutCompatItem = layoutCompat.mapping[rulesetItem.spriteData.path];

        var newRules = [];

        var expressionChain = [];
        expressionChain.push([null, new crass.objects.URI(spritePath + '.png')]);

        var compatExpressionChain = [];
        compatExpressionChain.push([null, new crass.objects.URI(spritePath + '.compat.png')]);

        var shouldScale = !!rulesetItem.spriteData.destWidth;
        var xScale = 1;
        var yScale = 1;

        // If we have destination size information, use that.
        if (shouldScale) {
            // Update the scale factor for the sprite. This is necessary
            // because background-position uses units relative to the scaled
            // background size rather than the source background size.
            xScale = rulesetItem.spriteData.destWidth / layoutItem.width;
            yScale = rulesetItem.spriteData.destHeight / layoutItem.height;
        }

        // Write the background position declaration with scaling.
        expressionChain.push([null, newDimension(layoutItem.x * -1 * xScale)]);
        expressionChain.push([null, newDimension(layoutItem.y * -1 * yScale)]);

        compatExpressionChain.push([null, newDimension(layoutCompatItem.x * -1)]);
        compatExpressionChain.push([null, newDimension(layoutCompatItem.y * -1)]);

        if (shouldScale) {
            expressionChain.push(['/', newDimension(layout.width * xScale)]);
            expressionChain.push([null, newDimension(layout.height * yScale)]);
        }

        newRules.push(newDeclaration('background', compatExpressionChain));
        newRules.push(newDeclaration('background', expressionChain));

        rulesetItem.newRules = newRules;
    });

    this.rewriteCSS(rulesets);
    this.saveUpdatedCSS(this.data);

};

/**
 * Rewrites the CSS using changes triggered by prior processing on a set of
 * rulesets.
 * @param  {Ruleset[]} rulesetsToProcess
 * @return {void}
 */
Processor.prototype.rewriteCSS = function(rulesetsToProcess) {
    var indentChars = this.guessFileIndentation();

    // Iterate each affected ruleset in reverse and inject the sprite
    // declarations into the end of the ruleset.
    var processedOutput = this.data;
    var index;
    var rulesetData;
    for (var i = rulesetsToProcess.length - 1; i >= 0; i--) {
        // Build the string of CSS to inject
        rulesetData = this.generateRulesetSpriteData(rulesetsToProcess[i], indentChars);

        // Inject the new CSS declarations into the ruleset
        index = rulesetsToProcess[i].declaration.range.range[1] + 1;
        // If the declaration has a semicolon after it,
        if (processedOutput[index] === ';') {
            index += 1;
        }
        processedOutput = processedOutput.substr(0, index) + rulesetData + processedOutput.substr(index);
    }

    this.data = processedOutput;
};

/**
 * Saves the updated CSS back to the source file.
 * @param  {string} newCSS The updated CSS
 * @return {void}
 */
Processor.prototype.saveUpdatedCSS = function saveUpdatedCSS(newCSS) {
    fs.writeFileSync(this.path, newCSS);
};

/**
 * Creates new declarations for an updated CSS file with new shalam comments.
 * @param {Ruleset} ruleset The ruleset object to base the new declarations on
 * @param {string} indentChars The characters to indent the declarations with
 * @returns {string} The new shalam comments and declarations.
 */
Processor.prototype.generateRulesetSpriteData = function generateRulesetSpriteData(ruleset, indentChars) {
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

/**
 * Returns a sprite declaration object given a node from a CSS parse tree. It
 * will assert that the declaration is well-formed.
 * @param {Declaration} decl The Declaration object from the CSS parse tree.
 * @returns {object}
 */
function getSpriteDecl(decl) {
    var data = {
        destX: null,
        destY: null,
        destWidth: null,
        destHeight: null,
        path: null,
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

    } else {
        data.destWidth = -1;
        data.destHeight = -1;
    }

    return data;

}

/**
 * Creates a new CSS Declaration object.
 * @param {string} name The name of the CSS declaration to create
 * @param {object} expression The contents of the CSS expression to create within the declaration
 * @returns {Declaration} The new CSS declaration object.
 */
function newDeclaration(name, expression) {
    return new crass.objects.Declaration(
        name,
        new crass.objects.Expression(expression)
    );
}

/**
 * Creates a new CSS Dimension object.
 * @param {number} value The numeric half of the dimension
 * @param {string} [unit] The unit to apply to the dimension (defaults to `px`)
 * @returns {Dimension|Number} The new CSS dimension object.
 */
function newDimension(value, unit) {
    // Short-circuit 0px -> 0
    if (!value) {
        return new crass.objects.Number(value);
    }
    return new crass.objects.Dimension(
        new crass.objects.Number(value),
        unit || 'px'
    );
}

module.exports = Processor;
module.exports.getSpriteDecl = getSpriteDecl;
module.exports.newDeclaration = newDeclaration;
module.exports.newDimension = newDimension;
