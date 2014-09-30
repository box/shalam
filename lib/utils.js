var fs = require('fs');
var path = require('path');


var globEach = module.exports.globEach = function(path_, ext, callback, doneCallback) {
    var wildcard = ext === '*';
    if (!doneCallback) {
        doneCallback = function() {};
    }

    fs.readdir(path_, function(err, list) {
        if (err) return doneCallback(err);
        var pending = list.length;
        if (!pending) return doneCallback(null);
        list.forEach(function(file) {
            file = path.resolve(path_, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    module.exports.globEach(file, ext, callback, function(err) {
                        if (!--pending) doneCallback(err);
                    });
                } else {
                    // If it's got the right extension, add it to the list.
                    if(wildcard || file.substr(file.length - ext.length) === ext)
                        callback(path.normalize(file));
                    if (!--pending) doneCallback(null);
                }
            });
        });
    });
};
