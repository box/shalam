exports.fetch = function(imgPath) {
    var fs = require('fs');
    var path = require('path');

    var Image = require('canvas').Image;
    var img = new Image();

    img.src = fs.readFileSync(path.resolve(process.cwd(), imgPath));
    return img;
};
