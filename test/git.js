var assert = require('assert');

// var mockery = require('mockery');
// var sinon = require('sinon');


describe('isGitURI()', function() {

    var gitLib = require('../lib/git');

    it('should accept common SSH protocol URIs', function() {
        assert.ok(gitLib.isGitURI('ssh://user@server/project.git'));
        assert.ok(gitLib.isGitURI('ssh://git@github.com/mattbasta/foobar.git'));
    });

    it('should accept HTTPS protocol URIs', function() {
        assert.ok(gitLib.isGitURI('https://github.com/mattbasta/shalam.git'));
    });

    it('should accept git protocol URIs', function() {
        assert.ok(gitLib.isGitURI('user@server:project.git'));
    });

    it('should ignore non-git URIs', function() {
        assert.ok(!gitLib.isGitURI('ftp://ftp.box.com/foo.bar'));
        assert.ok(!gitLib.isGitURI('http://mattbasta.com/'));
        assert.ok(!gitLib.isGitURI('/tmp/foo/bar/temp.txt'));
        assert.ok(!gitLib.isGitURI('../path/to/file'));
        assert.ok(!gitLib.isGitURI('path/to/file'));
    });

});
