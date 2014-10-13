var fs = require('fs');

var Canvas = require('canvas');


exports.composite = function(layout, destination, cb) {
    var canvas = new Canvas(layout.width, layout.height);
    var ctx = canvas.getContext('2d');
    layout.images.forEach(function(img) {
        ctx.drawImage(
            img.imageResource,
            // Native image dimensions at origin
            0, 0, img.imageResource.width, img.imageResource.height,
            // Sprited image dimensions and location
            img.x, img.y, img.width, img.height
        );
    });

    // Write the composited file to disk
    var out = fs.createWriteStream(destination);
    var stream = canvas.pngStream();
    stream.on('data', function(chunk) {
        out.write(chunk);
    });

    stream.on('end', cb);

};
