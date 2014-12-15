var child_process = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');


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

    var spawned = child_process.spawn('git', ['clone', gitURI, newTmpDir]);

    spawned.on('close', function(code) {
        if (code !== 0) {
            cb('Git returned non-zero exit code');
            return;
        }
        cb(null, newTmpDir);
    });

};
