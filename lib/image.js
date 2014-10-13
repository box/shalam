exports.fetch = function(imgPath) {
    var fs = require('fs');
    var path = require('path');

    var Image = require('canvas').Image;
    var img = new Image();

    imgPath = path.resolve(process.cwd(), imgPath);
    img.src = fs.readFileSync(imgPath);
    return img;
};
