var assert = require('assert');

var mockery = require('mockery');
var sinon = require('sinon');


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
        assert.ok(gitLib.isGitURI('git@github.com:mattbasta/test.git'));
        assert.ok(gitLib.isGitURI('git@github-other.com:mattbasta/test.git'));
    });

    it('should ignore non-git URIs', function() {
        assert.ok(!gitLib.isGitURI('ftp://ftp.box.com/foo.bar'));
        assert.ok(!gitLib.isGitURI('http://mattbasta.com/'));
        assert.ok(!gitLib.isGitURI('/tmp/foo/bar/temp.txt'));
        assert.ok(!gitLib.isGitURI('../path/to/file'));
        assert.ok(!gitLib.isGitURI('path/to/file'));
    });

});


describe('cloneGitURI()', function() {
    var gitLib;
    var sandbox;

    before(function() {
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache: true,
        });
    });

    beforeEach(function() {
        sandbox = sinon.sandbox.create();

        mockery.registerMock('fs', {
            mkdirSync: sandbox.mock().once().withArgs('resolved path'),
        });

        mockery.registerMock('os', {
            tmpdir: sandbox.mock().once().returns('/tmp'),
        });

        mockery.registerMock('path', {
            resolve: sandbox.mock().once().withArgs('/tmp').returns('resolved path'),
        });

    });

    afterEach(function() {
        mockery.resetCache();

        sandbox.verifyAndRestore();

        mockery.deregisterAll();
    });

    after(function() {
        mockery.disable();
    });

    it('should set up clone URLs properly', function() {
        var cloneObj = {
            on: function() {},
        };

        mockery.registerMock('child_process', {
            spawn: sandbox.mock().once().withArgs('git', ['clone', 'git uri', 'resolved path']).returns(cloneObj),
        });


        gitLib = require('../lib/git');
        gitLib.cloneGitURI('git uri', function() {});
    });

    it('should call the completion callback appropriately', function() {
        var registeredCallbacks = {};
        var cloneObj = {
            on: function(name, cb) {
                registeredCallbacks[name] = cb;
            },
        };

        mockery.registerMock('child_process', {
            spawn: sandbox.mock().once().withArgs('git', ['clone', 'git uri', 'resolved path']).returns(cloneObj),
        });

        gitLib = require('../lib/git');
        gitLib.cloneGitURI('git uri', sandbox.mock().once().withArgs(null, 'resolved path'));

        registeredCallbacks.close(0);
    });

    it('should fail on error', function() {
        var registeredCallbacks = {};
        var cloneObj = {
            on: function(name, cb) {
                registeredCallbacks[name] = cb;
            },
        };

        mockery.registerMock('child_process', {
            spawn: sandbox.mock().once().withArgs('git', ['clone', 'git uri', 'resolved path']).returns(cloneObj),
        });

        gitLib = require('../lib/git');
        gitLib.cloneGitURI('git uri', sandbox.mock().once().withArgs('Git returned non-zero exit code'));

        registeredCallbacks.close(1);
    });

});
