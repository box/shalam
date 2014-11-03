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
        var proc;
        try {
            proc = new Processor(file);
        } catch (e) {
            console.error('Could not parse CSS file: ' + file);
            return;
        }
        if (proc.hasMatches()) {
            activeProcs.push(proc);
        }
    }, layoutAndComposite);


    var activeCompositeOperations = 0;
    function layoutAndComposite() {
        // Get the directory of images that need to be created
        imageDirectory = layout.getImageDirectory(activeProcs, imageSource);

        // Create the layout and compat layout
        spriteLayout = layout.performLayout(imageDirectory);
        spriteLayoutCompat = layout.performLayoutCompat(imageDirectory);

        // Composite the layouts into sprite files
        activeCompositeOperations = 2;
        composite.composite(spriteLayout, spriteDestination + '.png', writeStylesheets);
        composite.composite(spriteLayoutCompat, spriteDestination + '.compat.png', writeStylesheets);
    }

    function writeStylesheets(err) {
        activeCompositeOperations--;
        if (err) {
            console.error(err);
            return;
        }
        if (activeCompositeOperations) {
            return;
        }

        // Output any warnings
        imageDirectory.forEach(function(img) {
            if (!img.warnings.lenght) return;
            img.warnings.forEach(function(warning) {
                console.warn(warning);
            });
        });

        activeProcs.forEach(function(proc) {
            proc.applyLayout(spriteLayout, spriteLayoutCompat, spriteDestination);
        });
    }
};

