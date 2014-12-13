var assert = require('assert');

var mockery = require('mockery');
var sinon = require('sinon');


describe('Image', function() {
    var image;
    var sandbox;

    before(function() {
        mockery.enable({
            warnOnUnregistered: false,
        });
    });

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
        mockery.resetCache();

        sandbox.verifyAndRestore();
    });

    after(function() {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('fetch()', function() {

        it('should fetch an image at the given path', function() {
            var mockImg = {
                height: 123,
                width: 456
            };
            mockery.registerMock('canvas', {
                Image: sandbox.mock().once().returns(mockImg),
            });

            mockery.registerMock('fs', {
                readFileSync: sandbox.mock().once().withArgs('resolved').returns('read'),
            });

            mockery.registerMock('path', {
                resolve: sandbox.mock().once().withArgs(process.cwd(), 'path').returns('resolved'),
            });


            image = require('../lib/image');

            var output = image.fetch('path');

            assert.equal(mockImg.src, 'read');

            assert.equal(output.height, 123);
            assert.equal(output.width, 456);
        });

    });

});
