/*********************************
 * Theresas's Sound World - Music
 * tsw-music.js
 * Dependencies: tsw-core.js
 * Copyright 2013 Stuart Memo
 ********************************/

(function (window, undefined) {
    'use strict';

    var tsw = tsw || {};

    var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    // append list of notes to itself to avoid worrying about writing wraparound code
    notes.push.apply(notes, notes);

    var intervals = ['unison', 'flat 2nd', '2nd', 'minor 3rd', 'major 3rd', 'perfect 4th',
                    'flat 5th', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th',
                    'major 7th', 'octave', 'flat 9th', '9th', 'sharp 9th', 'major 10th',
                    '11th', 'augmented 11th', 'perfect 12th', 'flat 13th', '13th'];

    /*
     * Get position of note in note array.
     *
     * @method getNotePosition
     * @param {string} note Note to get position of.
     * @return {number} Position of note in note array.
     */
    var getNotePosition = function (note) {
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
            positionOnScale = getNotePosition(rootNote);
        
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
            positionOnScale = getNotePosition(rootNote);
        
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
     * Parses a chord name into a detailed object.
     *
     * @method parseChord 
     * @param {string} chord Name of chord to turn into object.
     * return {object} Detailed chord object.
     */
    tsw.parseChord = function (chord) {
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

        if (!chordObj.isMajor && !chordObj.isMinor) {
            // Hey! This aint no chord that I've ever seen!
            return false;
        }

        rootNotePosition = getNotePosition(chordObj.rootNote);
        notePositions.push(rootNotePosition);

        if (chord.isMinor) {
            notePositions.push(rootNotePosition + tsw.getSemitoneDifference('minor 3rd'));
        } else {
            notePositions.push(rootNotePosition + tsw.getSemitoneDifference('major 3rd'));
        }

        notePositions.push(rootNotePosition + tsw.getSemitoneDifference('perfect 5th'));
        notePositions.push(rootNotePosition + tsw.getSemitoneDifference('octave'));

        notePositions.forEach(function (position) {
            chordObj.notes.push(notes[position]);
        });

        return chordObj.notes;
    };

    /*
     * Returns a list of notes in a given scale.
     * 
     * @method getScale
     * @param {string} rootNote Root note to base scale on.
     * @param {string} scaleType Type of scale to return.
     * @return {array} List of notes in scale.
     */
    tsw.getScale = function (rootNote, scaleType) {
        if (scaleType === 'minor') {
            return getMinorScale(rootNote);
        } else {
            return getMajorScale(rootNote);
        }
    };

    /*
     * Returns the number of semitones an interval is from a base note.
     *
     * @method getSemitoneDifference
     * @param {string} interval The name of the interval
     * @return {number} Number of semitones of interval from a base note.
     */
    tsw.getSemitoneDifference = function (interval) {
        var numberOfIntervals = intervals.length;

        for (var i = 0; i < numberOfIntervals; i++) {
            if (interval === intervals[i]) {
                return i;
            }
        }
    };

    tsw.isChord = function (str) {
        return this.parseChord(str);
    };

    /*
     * Returns a list of notes in a given chord.
     *
     * @method chordToNotes
     * @param {string} chord Name of chord to turn into string.
     * @return {array} List of notes in chord.
     */
    tsw.chordToNotes = function (chord) {
        chord = this.parseChord(chord);

        return chord.notes;
    };

    /*
     * Calculates the frequency of a given note
     *
     * @method noteToFrequency
     * @param {string} note Note to convert to frequency
     * @return {number} Frequency of note
     */
    tsw.noteToFrequency = function (note) {
        var octave,
            keyNumber;

        if (note.length === 3) {
            octave = note.charAt(2);
        } else {
            octave = note.charAt(1);
        }
     
        keyNumber = notes.indexOf(note.slice(0, -1));
     
        if (keyNumber < 3) {
            keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1;
        } else {
            keyNumber = keyNumber + ((octave - 1) * 12) + 1;
        }
     
        // Return frequency of note
        return Math.round(440 * Math.pow(2, (keyNumber- 49) / 12));
    };

 })(window);
