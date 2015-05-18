/**
 * @fileoverview Method for compositing layouts into an image
 * @author basta
 */

'use strict';


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var fs = require('fs');

var Canvas = require('canvas');

var utils = require('./utils');


//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

/**
 * Composites a layout into a sprite image.
 * @param {Layout} layout The layout object to composite.
 * @param {string} destination The final location of the sprite file.
 * @param {function} cb A callback to execute on completion or error.
 * @returns void
 */
exports.composite = function composite(layout, destination, cb) {
    // Create a new canvas object
    var canvas = new Canvas(layout.width, layout.height);
    var ctx = canvas.getContext('2d');

    // Iterate each image and draw it at the appropraite location.
    layout.images.forEach(function(img) {
        ctx.drawImage(
            img.imageResource,
            // Native image dimensions at origin
            0, 0, img.imageResource.width, img.imageResource.height,
            // Sprited image dimensions and location
            img.x, img.y, img.width, img.height
        );

        if (utils.isDebug()) {
            console.log('Compositing "' + img.path + '":');
            console.log('  orig => ' + img.imageResource.width + 'x' + img.imageResource.height);
            console.log('  dest => ' + img.width + 'x' + img.height + ' @ ' + img.x + ',' + img.y);
        }
    });

    // Write the composited file to disk.
    var out = fs.createWriteStream(destination);
    var stream = canvas.pngStream();
    stream.on('data', function(chunk) {
        out.write(chunk);
    });

    stream.on('end', cb);
};
