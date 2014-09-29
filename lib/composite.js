var fs = require('fs');

var Canvas = require('canvas');


exports.composite = function(layout, destination, cb) {
    var canvas = new Canvas(layout.width, layout.height);
    var ctx = canvas.getContext('2d');
    layout.images.forEach(function(img) {
        ctx.drawImage(img.image, img.x, img.y);
    });

    var out = fs.createWriteStream(destination);
    var stream = canvas.pngStream();
    stream.on('data', function(chunk) {
        out.write(chunk);
    });

    stream.on('end', cb);

};
