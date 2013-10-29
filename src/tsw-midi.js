/*******************************
 * Theresas's Sound World - MIDI
 * tsw-midi.js
 * Dependencies: tsw-core.js
 * Copyright 2013 Stuart Memo
 *******************************/

 (function (window, undefined) {
    'use strict';

   var MIDI = (function () {
        /*
         * Creates an instance of MIDI
         *
         * @param {AudioContext} Current audio context
         */
        var MIDI = function (context) {
            this.context = context;
        };

        /*
         * Initiate MIDI input/output if available.
         *
         * @method startMIDI
         * @param {function} success
         * @param {function} failure
         */
        MIDI.prototype.getUserMIDI = function (success, failure) {
            navigator.requestMIDIAccess().then(success, failure);
        };

        MIDI.prototype.MIDINumberToNote = function (number) {
            var noteOnScale = number % 12,
                octave = Math.floor(number / 12),
                notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

            return notes[noteOnScale] + octave;
        };

        return MIDI;
    })();

    window.tsw.midi = new MIDI();
})(window);