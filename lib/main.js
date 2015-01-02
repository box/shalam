var path = require('path');

var composite = require('./composite');
var layout = require('./layout');
var Processor = require('./processor');
var utils = require('./utils');

/**
 * Runs Shalam against a CSS, image, and sprite path and calls a callback upon completion.
 * @param {string} cssDirectory The path to the CSS sources
 * @param {string} imageSource The path to the image sources
 * @param {string} spriteDestination The location that sprite images should be generated at
 * @param {function} [callback]
 * @returns {void}
 */
exports.run = function(cssDirectory, imageSource, spriteDestination, callback) {
    var cwd = process.cwd();
    // Normalize all of the paths
    cssDirectory = path.resolve(cwd, cssDirectory);
    imageSource = path.resolve(cwd, imageSource);
    spriteDestination = path.resolve(cwd, spriteDestination);

    var activeProcs = [];
    var imageDirectory;
    var spriteLayout;
    var spriteLayoutCompat;

    utils.globEach(cssDirectory, '.css', function(file) {
        var proc;
        // Try to parse each CSS file
        try {
            proc = new Processor(file);
        } catch (e) {
            // If it failed, print the error and continue.
            console.error('Could not parse CSS file: ' + file);
            return;
        }
        if (proc.hasMatches()) {
            activeProcs.push(proc);
        }
    }, layoutAndComposite);

    var activeCompositeOperations = 0;
    
    /**
     * Runs the layout engine and compositor against an array of processed CSS files.
     */
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

    /**
     * Rewrites the files which include images that were included in the sprite.
     */
    function writeStylesheets(err) {
        activeCompositeOperations--;
        // If there was an error, print it and exit.
        if (err) {
            console.error(err);
            return;
        }
        // If there are still active composite operations, return and wait until they finish.
        if (activeCompositeOperations) {
            return;
        }

        // Output any warnings that were generated in the previous step.
        imageDirectory.forEach(function(img) {
            if (!img.warnings.lenght) return;
            img.warnings.forEach(function(warning) {
                console.warn(warning);
            });
        });

        // Perform the CSS file rewrites.
        activeProcs.forEach(function(proc) {
            proc.applyLayout(spriteLayout, spriteLayoutCompat, spriteDestination);
        });

        // If there's a callback, call it.
        if (callback) callback();
    }

};
