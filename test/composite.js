var assert = require('assert');

var mockery = require('mockery');
var sinon = require('sinon');


describe('Compositor', function() {
    var composite;
    var sandbox;

    before(function() {
        mockery.enable({
            warnOnUnregistered: false
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

    describe('composite()', function() {

        it('should composite to a new canvas with the given data', function() {
            mockery.registerMock('canvas', function(width, height) {
                assert.equal(width, 123);
                assert.equal(height, 456);

                return {
                    getContext: sandbox.mock().once().withArgs('2d').returns({
                        drawImage: sandbox.mock().withArgs('image', 12, 34),
                    }),
                    pngStream: sandbox.mock().once().returns({
                        on: sandbox.mock().twice()
                    })
                };
            });

            mockery.registerMock('fs', {
                createWriteStream: sandbox.mock().once().withArgs('destination')
            });


            composite = require('../lib/composite');

            composite.composite(
                {
                    width: 123,
                    height: 456,
                    images: [{
                        image: 'image',
                        x: 12,
                        y: 34

                    }]
                },
                'destination',
                sandbox.mock().never()
            );
        });

    });

});
