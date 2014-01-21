/*******************************
 * Theresas's Sound World - MIDI
 * tsw-midi.js
 * Dependencies: tsw-core.js
 * Copyright 2013 Stuart Memo
 *******************************/

 (function (window, undefined) {
    'use strict';

    tsw = tsw || {};
    var midi = {};

    midi.isSupported = function () {
        return typeof navigator.requestMIDIAccess === 'function';
    }

    /*
     * Initiate MIDI input/output if available.
     *
     * @method startMIDI
     * @param {function} success
     * @param {function} failure
     */
    midi.getUserMIDI = function (success, failure) {
        navigator.requestMIDIAccess().then(success, failure);
    };

    midi.getNote = function (number) {
        var noteOnScale = number % 12,
            octave = Math.floor(number / 12),
            notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        notes.push.apply(notes, notes);

        return notes[noteOnScale] + octave;
    };

    midi.getNoteNumber = function (note) {
        
    };

    tsw.midi = midi;
})(window);
