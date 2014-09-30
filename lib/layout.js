var path = require('path');

var image = require('./image');


var MIN_WIDTH = 250; // px


exports.createSpriteLayout = function createSpriteLayout(processors, imageSource) {
    var images = [];
    processors.forEach(function(proc) {
        proc.foundSprites.forEach(function(value) {
            if (images.indexOf(value) === -1) {
                images.push(value);
            }
        });
    });

    var renderedImages = images.map(function(img) {
        var absPath = path.resolve(imageSource, img);
        var fetched = image.fetch(absPath);
        fetched.relPath = img;
        return fetched;
    });
    renderedImages.sort(function(a, b) {
        return a.width - b.width;
    });

    return exports.performLayout(renderedImages);
};

exports.performLayout = function performLayout(images) {
    var currentX = 0;
    var currentY = 0;
    var nextY = 0;

    var i;

    // The the max width of the sprite (MIN_WIDTH or the width of the widest image)
    var max_width = Math.max(
        MIN_WIDTH,
        Math.max.apply(Math, images.map(function(img) {return img.width;}))
    );

    var layout = [];
    for (i = 0; i < images.length; i++) {
        var img = images[i];

        if (currentX + img.width > max_width) {
            currentX = 0;
            currentY = nextY;
        }

        img.x = currentX;
        img.y = currentY;

        nextY = Math.max(nextY, currentY + img.height);
        currentX += img.width;

        layout.push(img);
    }

    // Build a path-to-layout item mapping
    var mapping = {};
    for (i = 0; i < layout.length; i++) {
        mapping[layout[i].relPath] = layout[i];
    }

    return {
        height: nextY,
        images: layout,
        mapping: mapping,
        width: max_width,
    }
}
