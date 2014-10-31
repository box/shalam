var path = require('path');

var image = require('./image');


var MIN_WIDTH = 256; // px


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

        // Replace sizes that reference -1 with their proper values
        img.usedSizes = img.usedSizes.map(function(size) {
            if (size.width === -1) {
                size.height = fetched.height;
                size.width = fetched.width;
            }
            return size;
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

exports.performLayout = function performLayout(images) {
    // This method generates a layout object from the images that were passed.

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

        nextY = Math.max(nextY, currentY + result.height);
        currentX += result.width;
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

function getMaxImageWidth(images) {
    // The the max width of the sprite (MIN_WIDTH or the width of the widest image)
    return Math.max(
        MIN_WIDTH,
        Math.max.apply(Math, images.map(function(img) {return img.minSpritedSize.width;}))
    );
}

function sortImagesByWidth(images) {
    // Sort the images by width, descending
    images.sort(function(a, b) {
        return b.maxSize.width - a.maxSize.width;
    });
}

function getMapping(layout) {
    // Build a path-to-layout item mapping
    var mapping = {};
    for (i = 0; i < layout.length; i++) {
        mapping[layout[i].path] = layout[i];
    }
    return mapping;
}
