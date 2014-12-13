var fs = require('fs');
var os = require('os');
var path = require('path');

var gitteh = require('gitteh');


exports.isGitURI = function isGitURI(uri) {
    return !!/^\w+@[\w\.]+:.*/.exec(uri) ||
        !!/ssh:\/\/.*/.exec(uri) ||
        !!/https:\/\/.*\.git/.exec(uri);
};

var gitURICache = {};
exports.cloneGitURI = function cloneGitURI(gitURI, cb) {
    if (gitURICache[gitURI]) {
        cb(null, gitURICache[gitURI]);
        return;
    }

    var tmpDir = os.tmpdir();
    var uniqName = 'shalam' + (Math.random() * 1000000 | 0);
    var newTmpDir = path.resolve(tmpDir, uniqName);

    fs.mkdirSync(newTmpDir);
    gitURICache[gitURI] = newTmpDir;

    var clone = gitteh.clone(gitURI, newTmpDir);
    clone.on('complete', function() {
        cb(null, newTmpDir);
    });
    clone.on('error', function(err) {
        cb(err);
    });
};
