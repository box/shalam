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
    var imageDirectory;
    var spriteLayout;
    var spriteLayoutCompat;

    utils.globEach(directory, '.css', function(file) {
        var proc = new Processor(file);
        if (proc.hasMatches()) {
            activeProcs.push(proc);
        }
    }, layoutAndComposite);

    function layoutAndComposite() {
        // Get the directory of images that need to be created
        imageDirectory = layout.getImageDirectory(activeProcs, imageSource);

        // Create the layout and compat layout
        spriteLayout = layout.performLayout(imageDirectory);
        spriteLayoutCompat = layout.performLayoutCompat(imageDirectory);

        // Composite the layouts into sprite files
        composite.composite(spriteLayout, spriteDestination + '.png', writeStylesheets);
        composite.composite(spriteLayoutCompat, spriteDestination + '.compat.png', writeStylesheets);
    }

    function writeStylesheets(err) {
        if (err) {
            console.error(err);
            return;
        }
        activeProcs.forEach(function(proc) {
            proc.applyLayout(spriteLayout, spriteLayoutCompat, spriteDestination);
        });
    }
};

