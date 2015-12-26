var tswCore = require('./tsw-core');
var tswEffects = require('./tsw-effects');
var tswMusic = require('./tsw-music');
var tswLoop = require('./tsw-loop');
var tswMidi = require('./tsw-midi');

var tsw = {};

for (var attrname in tswCore) {
    tsw[attrname] = tswCore[attrname];
}

for (var attrname in tswEffects) {
    tsw[attrname] = tswEffects[attrname];
}

for (var attrname in tswMusic) {
    tsw[attrname] = tswMusic[attrname];
}

for (var attrname in tswLoop) {
    tsw[attrname] = tswLoop[attrname];
}

for (var attrname in tswMidi) {
    tsw[attrname] = tswMidi[attrname];
}

module.exports = tsw;
