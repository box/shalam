/**
 * @fileoverview Simple way of reading and decoding images from disk
 * @author basta
 */

'use strict';


//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

/**
 * Fetchs an Image object from a path on the disk.
 * @param {string} imgPath The path to the image to fetch.
 * @returns {Image} The fetched image.
 */
exports.fetch = function fetch(imgPath) {
    // Require calls are inline to facilitate mocking.
    var fs = require('fs');
    var path = require('path');

    var Image = require('canvas').Image;
    var img = new Image();

    img.src = fs.readFileSync(path.resolve(process.cwd(), imgPath));
    return img;
};

/**
 * Returns a hash for an image based on its size
 * @param  {number} height
 * @param  {number} width
 * @return {string}
 */
exports.getSizeHash = function getSizeHash(height, width) {
	return height + 'x' + width;
}
