/**
 * @fileoverview Generic utilities
 * @author basta
 */

'use strict';

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var fs = require('fs');
var path = require('path');


//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------

/**
 * Walks a directory and fires a callback on each file with a matching extension.
 * @param {string} path_ The starting path to traverse
 * @param {string} ext The file extension to search for (or `*`)
 * @param {function} callback A callback fired on each match
 * @param {function} doneCallback A callback to fire when traversal is complete
 * @returns {void}
 */
exports.globEach = function globEach(path_, ext, callback, doneCallback) {
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
                    exports.globEach(file, ext, callback, function(err) {
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
