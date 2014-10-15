/*********************************
 * Theresas's Sound World - Music
 * tsw.js
 * Dependencies: tsw-core.js
 * Copyright 2014 Stuart Memo
 ********************************/

(function (window, undefined) {
    'use strict';

    var music = {},
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        natural_notes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    // append list of notes to itself to avoid worrying about writing wraparound code

    notes.push.apply(notes, notes);

    var intervals = ['unison', 'flat 2nd', '2nd', 'minor 3rd', 'major 3rd', 'perfect 4th',
                    'flat 5th', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th',
                    'major 7th', 'octave', 'flat 9th', '9th', 'sharp 9th', 'major 10th',
                    '11th', 'augmented 11th', 'perfect 12th', 'flat 13th', '13th'];

    /*
     * Get position of note in note array.
     *
     * @function getNotePosition
     * @param {string} note Note to get position of.
     * @return {number} Position of note in note array.
     */
    tsw.helper.getNotePosition = function (note) {
        var notesLength = notes.length,
            position_on_scale;

        // don't use forEach as we're breaking early
        for (var i = 0; i < notesLength; i++) {
            if (note.toUpperCase() === notes[i]) {
                position_on_scale = i;
                return i;
            }
        }

        return null;
    };

    /*
     * Returns major scale of given root note
     * 
     * @method getMajorScale
     * @param {string} rootNote Root note of the scale
     * @return {array} List of notes in scale
     */
    var getMajorScale = function (rootNote) {
        var scale = [],
            positionOnScale = tsw.helper.getNotePosition(rootNote);

        scale.push(notes[positionOnScale]);
        scale.push(notes[positionOnScale + 2]);
        scale.push(notes[positionOnScale + 4]);
        scale.push(notes[positionOnScale + 5]);
        scale.push(notes[positionOnScale + 7]);
        scale.push(notes[positionOnScale + 9]);
        scale.push(notes[positionOnScale + 11]);
        scale.push(notes[positionOnScale + 12]);

        return scale;
    };

    /*
     * Returns minor scale of given root note
     * 
     * @method getMinorScale
     * @param {string} rootNote Root note of the scale
     * @return {array} List of notes in scale
     */
    var getMinorScale = function (rootNote) {
        var scale = [],
            positionOnScale = tsw.helper.getNotePosition(rootNote);
        
        scale.push(notes[positionOnScale]);
        scale.push(notes[positionOnScale + 2]);
        scale.push(notes[positionOnScale + 3]);
        scale.push(notes[positionOnScale + 5]);
        scale.push(notes[positionOnScale + 7]);
        scale.push(notes[positionOnScale + 8]);
        scale.push(notes[positionOnScale + 10]);
        scale.push(notes[positionOnScale + 12]);

        return scale;
    };

    /*
     * Decides whether a string looks like a valid note.
     *
     * @method isValidNote
     * @param {string} Name of note to test.
     * return {boolean} If note is valid.
     */
    var isValidNote = function (note) {
        if ((typeof note !== 'string') || (note.length > 3)) {
            return false;
        }
        return true;
    };

    /*
     * Parses a chord name into a detailed object.
     *
     * @method getChord
     * @param {string} chord Name of chord to turn into object.
     * return {object} Detailed chord object.
     */
    tsw.chord = function (chord) {
        var chordObj = {},
            notePositions = [],
            rootNotePosition = 0;

        if (Array.isArray(chord)) {
            return false;
        }

        chord = chord.toLowerCase();

        chordObj.rootNote = chord[0].toUpperCase();
        chordObj.isMajor = (chord.indexOf('maj') > -1);
        chordObj.isMinor = !chordObj.isMajor && (chord.indexOf('m') > -1);
        chordObj.is7th = (chord.indexOf('7') > -1);
        chordObj.notes = [];

        if (!chordObj.is7th) {
            chordObj.octave = chord.match(/\d/g);
        }

        if (!chordObj.isMajor && !chordObj.isMinor && !chord.is7th) {
            // Hey! This aint no chord that I've ever seen! Default to major.
            chordObj.isMajor = true;
        }

        rootNotePosition = tsw.helper.getNotePosition(chordObj.rootNote);
        notePositions.push(rootNotePosition);

        if (chord.isMinor) {
            notePositions.push(rootNotePosition + tsw.semitoneDifference('minor 3rd'));
        } else {
            notePositions.push(rootNotePosition + tsw.semitoneDifference('major 3rd'));
        }

        notePositions.push(rootNotePosition + tsw.semitoneDifference('perfect 5th'));
        notePositions.push(rootNotePosition + tsw.semitoneDifference('octave'));

        notePositions.forEach(function (position) {
            chordObj.notes.push(notes[position]);
        });

        return chordObj.notes;
    };

    /*
     * Returns a list of notes in a given scale.
     * 
     * @method scale 
     * @param {string} rootNote Root note to base scale on.
     * @param {string} scaleType Type of scale to return.
     * @return {array} List of notes in scale.
     */
    tsw.scale = function (rootNote, scaleType) {
        if (scaleType === 'minor') {
            return getMinorScale(rootNote);
        } else {
            return getMajorScale(rootNote);
        }
    };

    /*
     * Returns the number of semitones an interval is from a base note.
     *
     * @method semitoneDifference
     * @param {string} interval The name of the interval
     * @return {number} Number of semitones of interval from a base note.
     */
    tsw.semitoneDifference = function (interval) {
        var numberOfIntervals = intervals.length;

        for (var i = 0; i < numberOfIntervals; i++) {
            if (interval === intervals[i]) {
                return i;
            }
        }
    };

    /*
     * Returns the flat equivalent of a given note.
     *
     * @method flat 
     * @param {string} note Note to convert.
     * @return {string} New flat note.
     */
    tsw.flat = function (note) {
        var new_note;

        note = note.replace('#', 'b');
        new_note = String.fromCharCode(note[0].toUpperCase().charCodeAt(0) + 1);

        if (new_note === 'H') {
            new_note = 'A';
        }

        new_note += note.substr(1);

        return new_note;
    };

    /*
     * Returns the sharp equivalent of a given note.
     *
     * @method sharp 
     * @param {string} note Note to convert.
     * @return {string} New sharp note.
     */
    tsw.sharp = function (note) {
        var new_note,
            num_index = 0;

        // Note isn't flat to begin with
        if (note.indexOf('b') === -1) {
            return note;
        }

        note = note.replace('b', '#');

        // Get previous letter in alphabet.
        new_note = String.fromCharCode(note[0].toUpperCase().charCodeAt(0) - 1);

        if (new_note === '@') {
            new_note = 'G';
        }

        // If new note is B, decrease the octave by 1.
        if (new_note === 'B') {
            num_index = note.search(/\d/);
            if (num_index > -1) {
                note = note.substring(0, num_index) + (note[num_index] - 1) + note.substring(num_index + 1);
            } 
        }

        new_note += note.substr(1);

        return new_note;
    };

    /*
     * Calculates the frequency of a given note.
     *
     * @method frequency
     * @param {string} note Note to convert to frequency
     * @return {number} Frequency of note
     */
    tsw.frequency = function (note) {
        var octave,
            keyNumber,
            note_index,
            note_without_octave;

        if (isValidNote(note) === false) {
            return false;
        }

        note_index = note.search(/\d/);
        octave = parseInt(note.slice(-1));

        if (isNaN(octave)) {
            octave = 4;
        } 

        note = this.sharp(note);
        note_without_octave = note;

        if (note_index > -1) {
            note_without_octave = note.substr(0, note_index);
        }

        keyNumber = notes.indexOf(note_without_octave.toUpperCase());
        keyNumber = keyNumber + (octave * 12);

        // Return frequency of note
        return parseFloat((440 * Math.pow(2, (keyNumber - 57) / 12)), 10);
    };
})(window);
