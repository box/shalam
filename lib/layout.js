var path = require('path');

var image = require('./image');


var MIN_WIDTH = 256; // px
var IMAGE_MARGIN = 4; // px


/**
 * Returns an array of images encountered by each CSS processor.
 * @param {Processor[]} processors An array of processor objects to extract images from.
 * @param {string} imageSource Path to the source of the images to fetch.
 * @returns {object[]} Array of extracted images
 */
exports.getImageDirectory = function getImageDirectory(processors, imageSource) {
    var images = [];
    var seenImages = [];
    processors.forEach(function(proc) {
        proc.foundSprites.forEach(function(value, i) {
            var index = seenImages.indexOf(value);
            var size = {
                height: proc.rulesets[i].spriteData.destHeight,
                width: proc.rulesets[i].spriteData.destWidth,
            };
            var sizeHash = value.destHeight + 'x' + value.destWidth;
            if (index === -1) {
                var image = {
                    path: value,
                    usedSizes: [size],
                    usedSizesHashes: [sizeHash],
                };
                images.push(image);
                seenImages.push(value);
            } else if (images[index].usedSizesHashes.indexOf(sizeHash) === -1) {
                images[index].usedSizes.push(size);
                images[index].usedSizesHashes.push(sizeHash);
            }
        });
    });

    // Clean up the usedSizesHashes; we don't need that anymore.
    images.forEach(function(img) {
        delete img.usedSizesHashes;
    });

    return images.map(function(img) {
        var absPath = path.resolve(imageSource, img.path);
        img.absPath = absPath;
        img.imageResource = image.fetch(absPath);
        img.warnings = [];

        // Replace sizes that reference -1 with their proper values
        img.usedSizes = img.usedSizes.map(function(size) {
            if (size.width === -1) {
                size.height = img.imageResource.height;
                size.width = img.imageResource.width;
            }
            return size;
        });

        // Warn when any of the used sizes are weird.
        img.usedSizes.forEach(function(size) {
            var widthRatio = img.imageResource.width / size.width;
            var heightRatio = img.imageResource.height / size.height;
            var tmp;
            if (size.width > img.imageResource.width || size.height > img.imageResource.height) {
                img.warnings.push('"' + img.path + '" used at dest-size larger than source image');
            } else if (widthRatio !== heightRatio) {
                img.warnings.push('"' + img.path + '" used at stretched size (' + widthRatio + '/' + heightRatio + ')');
            } else if (widthRatio % 1 || heightRatio % 1) {
                img.warnings.push('"' + img.path + '" used at uneven size (not a multiple of original image size): (' + widthRatio + '/' + heightRatio + ')');
            }
        });

        // Figure out the maximum used size for each image.
        img.maxSize = img.usedSizes.reduce(function(a, b) {
            return a.width > b.width ? a : b;
        });

        // Figure out the maximum size that the image should be when it is
        // composited into the sprite. It should be a maximum of two times the
        // destination sizes or capped at the size of the image.
        img.minSpritedSize = {
            width: Math.min(img.maxSize.width * 2, img.imageResource.width),
            height: Math.min(img.maxSize.height * 2, img.imageResource.height),
        };

        return img;
    });
};

/**
 * This method generates a layout object from the images that were passed.
 * @param {object[]} images Array of extracted image objects.
 * @returns {object} Object describing images arranged into a layout.
 */
exports.performLayout = function performLayout(images) {
    var currentX = 0;
    var currentY = 0;
    var nextY = 0;

    var i;

    var max_width = getMaxImageWidth(images);

    sortImagesByWidth(images);

    var layout = [];
    for (i = 0; i < images.length; i++) {
        var img = images[i];

        if (currentX + img.minSpritedSize.width > max_width) {
            currentX = 0;
            currentY = Math.ceil(nextY);
        }

        var result = {
            imageResource: img.imageResource,
            path: img.path,
            x: currentX,
            y: currentY,
            width: img.minSpritedSize.width,
            height: img.minSpritedSize.height,
        };

        nextY = Math.max(nextY, currentY + result.height) + IMAGE_MARGIN;
        currentX += result.width + IMAGE_MARGIN;
        currentX = Math.ceil(currentX);

        layout.push(result);
    }

    return {
        images: layout,
        mapping: getMapping(layout),
        width: max_width,
        height: nextY,
    };

};

/**
 * This method generates a compatibility layout object from the images that were passed.
 * @param {object[]} images Array of extracted image objects.
 * @returns {object} Object describing images arranged into a compatibility layout.
 */
exports.performLayoutCompat = function performLayoutCompat(images) {
    // This method generates a compatibility layout object from the images that were passed.

    var currentX = 0;
    var currentY = 0;
    var nextY = 0;

    var i;
    var j;

    var max_width = getMaxImageWidth(images);

    sortImagesByWidth(images);

    var layout = [];
    for (i = 0; i < images.length; i++) {
        var imageRef = images[i];

        for (j = 0; j < imageRef.usedSizes.length; j++) {
            var img = imageRef.usedSizes[j];
            if (currentX + img.width > max_width) {
                currentX = 0;
                currentY = Math.ceil(nextY);
            }

            var result = {
                imageResource: imageRef.imageResource,
                path: imageRef.path,
                x: currentX,
                y: currentY,
                width: img.width,
                height: img.height,
            };

            nextY = Math.max(nextY, currentY + result.height);
            currentX += result.width;
            currentX = Math.ceil(currentX);

            layout.push(result);
        }

    }

    return {
        images: layout,
        mapping: getMapping(layout),
        width: max_width,
        height: nextY,
    };

};

/**
 * Returns the maximum width of a sprite given an array of image objects
 * that will be included in it.
 * @param {object[]} images Array of image objects.
 * @returns {number}
 */
function getMaxImageWidth(images) {
    // The the max width of the sprite (MIN_WIDTH or the width of the widest image)
    return Math.max(
        MIN_WIDTH,
        Math.max.apply(Math, images.map(function(img) {return img.minSpritedSize.width;}))
    );
}

/**
 * Sorts an array of image objects by width.
 * @param {object[]} images Array of extracted image objects to be sorted.
 * @returns {void}
 */
function sortImagesByWidth(images) {
    // Sort the images by width, descending
    images.sort(function(a, b) {
        return b.maxSize.width - a.maxSize.width;
    });
}

/**
 * Returns a mapping of image paths to images from a layout object.
 * @param {object} object The layout object to map
 * @returns {object} The resulting mapping
 */
function getMapping(layout) {
    // Build a path-to-layout item mapping
    var mapping = {};
    for (var i = 0; i < layout.length; i++) {
        mapping[layout[i].path] = layout[i];
    }
    return mapping;
}
