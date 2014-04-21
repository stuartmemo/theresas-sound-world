/*******************************
 * Theresas's Sound World - MIDI
 * tsw-midi.js
 * Dependencies: tsw-core.js
 * Copyright 2014 Stuart Memo
 *******************************/

 (function (window, undefined) {
    'use strict';

    tsw = tsw || {};

    tsw.isMidiSupported = function () {
        return typeof navigator.requestMIDIAccess === 'function';
    };

    /*
     * Initiate MIDI input/output if available.
     *
     * @method getUserMidi 
     * @param {function} success Callback if MIDI has been initiated.
     * @param {function} failure Callback if MIDI hasn't been initialed.
     */
    tsw.getUserMidi = function (success, failure) {
        if (this.isMidiSupported()) {
            navigator.requestMIDIAccess().then(success, failure);
        }
    };

    var noteToMidi = function (note_letter) {
        var note = note_letter.match(/^[A-g#]+/)[0],
            octave = parseInt(note_letter.match(/\d+/g), 10),
            note_position = tsw.helper.getNotePosition(note);

        return note_position + (octave * 12);
    };

    var midiToNote = function (midi_number) {
        var noteOnScale = midi_number % 12,
            octave = Math.floor(midi_number / 12),
            notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        notes.push.apply(notes, notes);

        return notes[noteOnScale] + octave;
    };

    tsw.midiNote = function (thing_to_convert) {
        if (tsw.helper.isString(thing_to_convert)) {
            return noteToMidi(thing_to_convert);
        }

        if (tsw.helper.isNumber(thing_to_convert)) {
            return midiToNote(thing_to_convert);
        }
    };
})(window);
