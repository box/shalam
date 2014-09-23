var crassObjects = require('crass').objects;


// `cb` gets called with rulesets
exports.walk = function(stylesheet, cb) {

    function walkObject(obj) {
        if (obj instanceof crassObjects.Media) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.Page) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.PageMargin) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.FontFace) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.Keyframes) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.Keyframe) {
            obj.content.forEach(walkObject);
        } else if (obj instanceof crassObjects.Supports) {
            obj.blocks.forEach(walkObject);
        } else if (obj instanceof crassObjects.Ruleset) {
            cb(obj);
        }
    }

    stylesheet.content.forEach(walkObject);
};
