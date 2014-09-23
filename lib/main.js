var Processor = require('./processor');
var utils = require('./utils');


exports.run = function(directory, spriteSource) {

    var activeProcs = [];

    utils.globEach(directory, '.css', function(file) {
        var proc = new Processor(file);
        proc.search();
        activeProcs.push(proc);
    }, function() {
        //
    });

};
