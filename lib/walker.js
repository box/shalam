var crassObjects = require('crass').objects;


/**
 * Walks a CSS parse tree and calls a callback when any ruleset-like
 * node is encountered.
 * @param {Stylesheet} stylesheet A CSS stylesheet object to traverse
 * @param {function} cb A callback to fire when a ruleset is encountered.
 * @returns {void}
 */
exports.walk = function walk(stylesheet, cb) {

    function walkObject(obj) {
        if (obj instanceof crassObjects.Media) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.Page) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.FontFace) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.Keyframes) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.Supports) {
            obj.blocks.forEach(walkObject);
        } else if (obj instanceof crassObjects.Ruleset ||
                   obj instanceof crassObjects.PageMargin ||
                   obj instanceof crassObjects.Keyframe) {
            cb(obj);
        }
    }

    stylesheet.content.forEach(walkObject);

};
