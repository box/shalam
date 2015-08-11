var assert = require('assert');

var mockery = require('mockery');
var sinon = require('sinon');


describe('Layout', function() {

    function fakeImage(width, height, id) {
        return {
            imageResource: {id: id},
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
                computedLayout.images.map(function(img) {
                    return img.imageResource.id;
                }),
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
            assert.equal(images[0].imageResource, computedLayout.mapping.first.imageResource);
            assert.equal(images[1].imageResource, computedLayout.mapping.second.imageResource);
            assert.equal(images[2].imageResource, computedLayout.mapping.third.imageResource);

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
            assert.equal(computedLayout.height, 22);

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
            assert.equal(computedLayout.height, 42);

        });

        it('should allow images to line up on a single line', function() {
            var images = [
                fakeImage(300, 10, 'first'),
                fakeImage(250, 10, 'second'),
                fakeImage(50, 10, 'third'),
            ];

            var computedLayout = layout.performLayout(images);
            assert.equal(computedLayout.width, 300);
            assert.equal(computedLayout.height, 42);

        });

        it('should not cascade decimal sizes to subsequent images on the x-axis', function() {
            var images = [
                {
                    imageResource: {id: 'weirdSize'},
                    path: 'weird/size',
                    usedSizes: [
                        {width: 15, height: 15},
                    ],
                    maxSize: {width: 15, height: 15},
                    minSpritedSize: {width: 12.345, height: 12.345},
                },
                {
                    imageResource: {id: 'normalSize'},
                    path: 'normal/size',
                    usedSizes: [
                        {width: 15, height: 15},
                    ],
                    maxSize: {width: 15, height: 15},
                    minSpritedSize: {width: 15, height: 15},
                },
            ];

            var computedLayout = layout.performLayout(images);
            assert.equal(computedLayout.images[1].x, 17);

        });

        it('should not cascade decimal sizes to subsequent images on the y-axis', function() {
            var images = [
                {
                    imageResource: {id: 'weirdSize'},
                    path: 'weird/size',
                    usedSizes: [
                        {width: 1500, height: 15},
                    ],
                    maxSize: {width: 15, height: 15},
                    minSpritedSize: {width: 1200, height: 12.345},
                },
                {
                    imageResource: {id: 'normalSize'},
                    path: 'normal/size',
                    usedSizes: [
                        {width: 15, height: 15},
                    ],
                    maxSize: {width: 15, height: 15},
                    minSpritedSize: {width: 15, height: 15},
                },
            ];

            var computedLayout = layout.performLayout(images);
            assert.equal(computedLayout.images[1].y, 17);

        });

    });

    describe('performLayoutCompat()', function() {

        var layout = require('../lib/layout');

        it('should order the images from widest to narrowest', function() {
            var images = [
                fakeImage(120, 120, 'first'),
                fakeImage(250, 100, 'second'),
                fakeImage(200, 10, 'third'),
            ];

            var computedLayout = layout.performLayoutCompat(images);
            assert.deepEqual(
                computedLayout.images.map(function(img) {
                    return img.imageResource.id;
                }),
                ['second', 'third', 'first']
            );

        });

        it('should make the layout a minumum of 256px wide', function() {
            var images = [
                fakeImage(10, 10, 'first'),
            ];

            var computedLayout = layout.performLayoutCompat(images);
            assert.equal(computedLayout.width, 256);

        });

        it('should make the layout width equal to the widest element if it exceeds 256px', function() {
            var images = [
                fakeImage(300, 10, 'first'),
                fakeImage(260, 200, 'second'),
                fakeImage(10, 10, 'third'),
            ];

            var computedLayout = layout.performLayoutCompat(images);
            assert.equal(computedLayout.width, 300);

        });

        it('should generate a mapping', function() {
            var images = [
                fakeImage(300, 10, 'first'),
                fakeImage(260, 200, 'second'),
                fakeImage(10, 10, 'third'),
            ];

            var computedLayout = layout.performLayoutCompat(images);
            assert.equal(images[0].imageResource, computedLayout.mapping.first.imageResource);
            assert.equal(images[1].imageResource, computedLayout.mapping.second.imageResource);
            assert.equal(images[2].imageResource, computedLayout.mapping.third.imageResource);

        });

        it('should properly calculate the height of the layout', function() {

            // Since these images do not meet the minimum width, they should
            // never stack. Thus, the height should be 10.
            var images = [
                fakeImage(10, 10, 'first'),
                fakeImage(10, 10, 'second'),
                fakeImage(10, 10, 'third'),
            ];

            var computedLayout = layout.performLayoutCompat(images);
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

            var computedLayout = layout.performLayoutCompat(images);
            assert.equal(computedLayout.width, 300);
            assert.equal(computedLayout.height, 30);

        });

        it('should allow images to line up on a single line', function() {
            var images = [
                fakeImage(300, 10, 'first'),
                fakeImage(250, 10, 'second'),
                fakeImage(50, 10, 'third'),
            ];

            var computedLayout = layout.performLayoutCompat(images);
            assert.equal(computedLayout.width, 300);
            assert.equal(computedLayout.height, 20);

        });

        it('should not cascade decimal sizes to subsequent images on the x-axis', function() {
            var images = [
                {
                    imageResource: {id: 'weirdSize'},
                    path: 'weird/size',
                    usedSizes: [
                        {width: 15.5, height: 15},
                    ],
                    maxSize: {width: 15, height: 15},
                    minSpritedSize: {width: 12.345, height: 12.345},
                },
                {
                    imageResource: {id: 'normalSize'},
                    path: 'normal/size',
                    usedSizes: [
                        {width: 15, height: 15},
                    ],
                    maxSize: {width: 15, height: 15},
                    minSpritedSize: {width: 15, height: 15},
                },
            ];

            var computedLayout = layout.performLayoutCompat(images);
            assert.equal(computedLayout.images[1].x, 16);

        });

        it('should not cascade decimal sizes to subsequent images on the y-axis', function() {
            var images = [
                {
                    imageResource: {id: 'weirdSize'},
                    path: 'weird/size',
                    usedSizes: [
                        {width: 1500, height: 15.5},
                    ],
                    maxSize: {width: 15, height: 15},
                    minSpritedSize: {width: 1200, height: 12.345},
                },
                {
                    imageResource: {id: 'normalSize'},
                    path: 'normal/size',
                    usedSizes: [
                        {width: 15, height: 15},
                    ],
                    maxSize: {width: 15, height: 15},
                    minSpritedSize: {width: 15, height: 15},
                },
            ];

            var computedLayout = layout.performLayoutCompat(images);
            assert.equal(computedLayout.images[1].y, 16);

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
                foundSprites: images,
                rulesets: images.map(function(img) {
                    return {
                        spriteData: {
                            destHeight: 0,
                            destWidth: 0,
                        }
                    };
                }),
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

            var results = layout.getImageDirectory(procs, 'source');
            assert.deepEqual(results.map(function(res) {
                return res.imageResource.id;
            }), ['aimage1', 'aimage2', 'aimage3', 'aimage4']);

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

            var results = layout.getImageDirectory(procs, 'source');
            assert.equal(results.length, 2);

        });

        function testAtSize(sourceWidth, sourceHeight, destWidth, destHeight) {
            var procs = [
                {
                    foundSprites: ['img/foo.png'],
                    rulesets: [
                        {spriteData: {destWidth: destWidth, destHeight: destHeight}},
                    ],
                },
            ];

            var pathMock = sandbox.mock(path);
            pathMock.expects('resolve').withArgs('source', 'img/foo.png').once().returns('rimage1');

            var imgMock = sandbox.mock(image);
            imgMock.expects('fetch').withArgs('rimage1').once().returns({height: sourceHeight, width: sourceWidth});

            return layout.getImageDirectory(procs, 'source');
        }

        it('should not produce warnings for proper usage', function() {
            var result = testAtSize(40, 40, 20, 20);
            assert.ok(!result[0].warnings.length, 'There should be no warnings');
        });

        it('should warn about images being used at a larger size than the source', function() {
            var result = testAtSize(40, 40, 80, 80);
            assert.equal(result[0].warnings.length, 1, 'There should be one warning');
        });

        it('should warn about images being used at an uneven dimension', function() {
            var result = testAtSize(40, 40, 15, 15);
            assert.equal(result[0].warnings.length, 1, 'There should be one warning');
        });

        it('should output a single image with the max resolution when duplicate sprite is defined', function() {

            var procs = [
                {
                    foundSprites: ['img/foo.png'],
                    rulesets: [
                        {spriteData: {destWidth: 20, destHeight: 20}},
                    ],
                },
                {
                    foundSprites: ['img/foo.png'],
                    rulesets: [
                        {spriteData: {destWidth: 160, destHeight: 160}},
                    ],
                },
                {
                    foundSprites: ['img/foo.png'],
                    rulesets: [
                        {spriteData: {destWidth: 40, destHeight: 40}},
                    ],
                },
                {
                    foundSprites: ['img/foo.png'],
                    rulesets: [
                        {spriteData: {destWidth: 320, destHeight: 320}},
                    ],
                },
            ];

            var pathMock = sandbox.mock(path);
            pathMock.expects('resolve').withArgs('source', 'img/foo.png').once().returns('rimage1');

            var imgMock = sandbox.mock(image);
            imgMock.expects('fetch').withArgs('rimage1').once().returns({height: 640, width: 640});

            result = layout.getImageDirectory(procs, 'source');

            assert.ok(result.length === 1, 'There should be a single sprite image');
        });

    });

});
