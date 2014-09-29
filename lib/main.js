var path = require('path');

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
        proc.search();
        if (proc.hasMatches()) {
            activeProcs.push(proc);
        }
    }, function() {
        var temp = layout.createSpriteLayout(activeProcs, imageSource);
        console.log(temp);
    });

};
