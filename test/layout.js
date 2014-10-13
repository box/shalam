var assert = require('assert');

var mockery = require('mockery');
var sinon = require('sinon');


describe('Layout', function() {

    function fakeImage(width, height, id) {
        return {
            id: id,
            path: id,
            usedSizes: [
                {width: width, height: height},
            ],
            maxSize: {width: width, height: height},
            minSpritedSize: {width: width, height: height},
        };
    }

    describe('performLayout()', function() {

        var layout = require('../lib/layout');

        it('should order the images from widest to narrowest', function() {
            var images = [
                fakeImage(120, 120, 'first'),
                fakeImage(250, 100, 'second'),
                fakeImage(200, 10, 'third'),
            ];

            var computedLayout = layout.performLayout(images);
            assert.deepEqual(
                computedLayout.images.map(function(img) {return img.image.id;}),
                ['second', 'third', 'first']
            );

        });

        it('should make the layout a minumum of 256px wide', function() {
            var images = [
                fakeImage(10, 10, 'first'),
            ];

            var computedLayout = layout.performLayout(images);
            assert.equal(computedLayout.width, 256);

        });

        it('should make the layout width equal to the widest element if it exceeds 256px', function() {
            var images = [
                fakeImage(300, 10, 'first'),
                fakeImage(260, 200, 'second'),
                fakeImage(10, 10, 'third'),
            ];

            var computedLayout = layout.performLayout(images);
            assert.equal(computedLayout.width, 300);

        });

        it('should generate a mapping', function() {
            var images = [
                fakeImage(300, 10, 'first'),
                fakeImage(260, 200, 'second'),
                fakeImage(10, 10, 'third'),
            ];

            var computedLayout = layout.performLayout(images);
            assert.equal(images[0], computedLayout.mapping.first);
            assert.equal(images[1], computedLayout.mapping.second);
            assert.equal(images[2], computedLayout.mapping.third);

        });

        it('should properly calculate the height of the layout', function() {

            // Since these images do not meet the minimum width, they should
            // never stack. Thus, the height should be 10.
            var images = [
                fakeImage(10, 10, 'first'),
                fakeImage(10, 10, 'second'),
                fakeImage(10, 10, 'third'),
            ];

            var computedLayout = layout.performLayout(images);
            assert.equal(computedLayout.height, 10);

        });

        it('should properly calculate the height of the layout if it wraps', function() {

            // Since these images exceed the width of the widest element, so
            // it should wrap at each line.
            var images = [
                fakeImage(300, 10, 'first'),
                fakeImage(250, 10, 'second'),
                fakeImage(200, 10, 'third'),
            ];

            var computedLayout = layout.performLayout(images);
            assert.equal(computedLayout.width, 300);
            assert.equal(computedLayout.height, 30);

        });

        it('should allow images to line up on a single line', function() {
            var images = [
                fakeImage(300, 10, 'first'),
                fakeImage(250, 10, 'second'),
                fakeImage(50, 10, 'third'),
            ];

            var computedLayout = layout.performLayout(images);
            assert.equal(computedLayout.width, 300);
            assert.equal(computedLayout.height, 20);

        });


    });

    describe('getImageDirectory()', function() {

        var layout;
        var sandbox;

        var path = {
            resolve: function() {}
        };
        var image = {
            fetch: function() {}
        };

        function fakeProcessor(images) {
            return {
                foundSprites: images
            };
        }

        before(function() {
            mockery.enable({
                warnOnUnregistered: false,
                useCleanCache: true
            });
        });

        beforeEach(function() {
            mockery.registerMock('path', path);
            mockery.registerMock('./image', image);

            layout = require('../lib/layout');
            sandbox = sinon.sandbox.create();
        });

        afterEach(function() {
            mockery.resetCache();
            mockery.deregisterAll();

            sandbox.verifyAndRestore();
        });

        after(function() {
            mockery.disable();
        });

        it('should aggregate each passed processor\'s images into a single array', function() {

            var procs = [
                fakeProcessor(['image1', 'image2']),
                fakeProcessor(['image3', 'image4']),
            ];

            var pathMock = sandbox.mock(path);
            pathMock.expects('resolve').withArgs('source', 'image1').once().returns('rimage1');
            pathMock.expects('resolve').withArgs('source', 'image2').once().returns('rimage2');
            pathMock.expects('resolve').withArgs('source', 'image3').once().returns('rimage3');
            pathMock.expects('resolve').withArgs('source', 'image4').once().returns('rimage4');

            var imgMock = sandbox.mock(image);
            imgMock.expects('fetch').withArgs('rimage1').once().returns({id: 'aimage1'});
            imgMock.expects('fetch').withArgs('rimage2').once().returns({id: 'aimage2'});
            imgMock.expects('fetch').withArgs('rimage3').once().returns({id: 'aimage3'});
            imgMock.expects('fetch').withArgs('rimage4').once().returns({id: 'aimage4'});

            sandbox.mock(layout).expects('performLayout').withArgs([
                {id: 'aimage1', relPath: 'image1'},
                {id: 'aimage2', relPath: 'image2'},
                {id: 'aimage3', relPath: 'image3'},
                {id: 'aimage4', relPath: 'image4'},
            ]);

            layout.getImageDirectory(procs, 'source');

        });

        it('should dedupe each processor\'s images', function() {

            var procs = [
                fakeProcessor(['image1', 'image2']),
                fakeProcessor(['image2']),
            ];

            var pathMock = sandbox.mock(path);
            pathMock.expects('resolve').withArgs('source', 'image1').once().returns('rimage1');
            pathMock.expects('resolve').withArgs('source', 'image2').once().returns('rimage2');

            var imgMock = sandbox.mock(image);
            imgMock.expects('fetch').withArgs('rimage1').once().returns({id: 'aimage1'});
            imgMock.expects('fetch').withArgs('rimage2').once().returns({id: 'aimage2'});

            sandbox.mock(layout).expects('performLayout').withArgs([
                {id: 'aimage1', relPath: 'image1'},
                {id: 'aimage2', relPath: 'image2'},
            ]);

            layout.getImageDirectory(procs, 'source');

        });

    });

});
