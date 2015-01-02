var child_process = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');

/**
 * Returns whether the passed URI is probably for a Git repository.
 * @param {string} uri The URI to test.
 * @returns {bool}
 */
exports.isGitURI = function isGitURI(uri) {
    return !!/^\w+@[\w\.]+:.*/.exec(uri) ||
        !!/ssh:\/\/.*/.exec(uri) ||
        !!/https:\/\/.*\.git/.exec(uri);
};

var gitURICache = {};
/**
 * Clones a Git URI to a temporary directory. Calls the callback
 * function with the temporary directory's path if the clone is
 * successful.
 * @param {string} gitURI The URI of the Git repo.
 * @param {function} cb The callback to fire on completion or error.
 * @returns {void}
 */
exports.cloneGitURI = function cloneGitURI(gitURI, cb) {
    // If the URI has already been cloned, return the path.
    if (gitURICache[gitURI]) {
        cb(null, gitURICache[gitURI]);
        return;
    }

    // Get a temporary directory name.
    var tmpDir = os.tmpdir();
    var uniqName = 'shalam' + (Math.random() * 1000000 | 0);
    var newTmpDir = path.resolve(tmpDir, uniqName);

    // Create the temporary directory and add it to the cache.
    fs.mkdirSync(newTmpDir);
    gitURICache[gitURI] = newTmpDir;

    // Spawn a `git clone` process and perform the clone operation.
    var spawned = child_process.spawn('git', ['clone', gitURI, newTmpDir]);

    spawned.on('close', function(code) {
        // Handle non-zero exit codes from `git clone`
        if (code !== 0) {
            cb('Git returned non-zero exit code');
            return;
        }
        // Fire the success callback with the temporary directory path.
        cb(null, newTmpDir);
    });

};
