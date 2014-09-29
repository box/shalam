var fs = require('fs');
var path = require('path');

var canvas = require('canvas');
var Image = canvas.Image;


exports.fetch = function(imgPath) {
    var img = new Image();
    imgPath = path.resolve(process.cwd(), imgPath);
    img.src = fs.readFileSync(imgPath);
    return {
        image: img,
        height: img.height,
        path: imgPath,
        width: img.width,
    };
};
