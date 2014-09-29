var path = require('path');

var composite = require('./composite');
var layout = require('./layout');
var Processor = require('./processor');
var utils = require('./utils');


exports.run = function(directory, imageSource, spriteDestination) {
    var cwd = process.cwd();
    // Normalize all of the paths
    directory = path.resolve(cwd, directory);
    imageSource = path.resolve(cwd, imageSource);
    spriteDestination = path.resolve(cwd, spriteDestination);

    var activeProcs = [];
    var spriteLayout;

    utils.globEach(directory, '.css', function(file) {
        var proc = new Processor(file);
        if (proc.hasMatches()) {
            activeProcs.push(proc);
        }
    }, layoutAndComposite);

    function layoutAndComposite() {
        spriteLayout = layout.createSpriteLayout(activeProcs, imageSource);
        composite.composite(spriteLayout, spriteDestination, writeStylesheets);
    }

    function writeStylesheets(err) {
        if (err) {
            console.error(err);
            return;
        }
        activeProcs.forEach(function(proc) {
            proc.applyLayout(spriteLayout, spriteDestination);
        });
    }
};

