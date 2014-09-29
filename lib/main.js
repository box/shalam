var path = require('path');

var composite = require('./composite');
var layout = require('./layout');
var Processor = require('./processor');
var utils = require('./utils');


exports.run = function(directory, imageSource, spriteDestination) {
    var cwd = process.cwd();
    directory = path.resolve(cwd, directory);
    imageSource = path.resolve(cwd, imageSource);
    spriteDestination = path.resolve(cwd, spriteDestination);

    var activeProcs = [];

    utils.globEach(directory, '.css', function(file) {
        var proc = new Processor(file);
        if (proc.hasMatches()) {
            activeProcs.push(proc);
        }
    }, layoutAndComposite);

    function layoutAndComposite() {
        var temp = layout.createSpriteLayout(activeProcs, imageSource);
        composite.composite(temp, spriteDestination, writeStylesheets);
    }

    function writeStylesheets() {
        //
    }
};

