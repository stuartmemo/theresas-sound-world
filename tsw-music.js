/*********************************
 * Theresas's Sound World - Music
 * tsw-music.js
 * Dependencies: tsw-core.js
 * Copyright 2013 Stuart Memo
 ********************************/

 (function (window, undefined) {

   var Music = (function () {

        /*
         * Creates an instance of Music
         *
         * @param {AudioContext} Current audio context
         */
        var Music = function (context) {
            this.context = context;
        };
        
        var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
        // append list of notes to itself to avoid worrying about writing wraparound code
        notes.push.apply(notes, notes);

        var intervals = ['unison', 'flat 2nd', '2nd', 'minor 3rd', 'major 3rd', 'perfect 4th',
                        'flat 5th', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th',
                        'major 7th', 'octave', 'flat 9th', '9th', 'sharp 9th', 'major 10th',
                        '11th', 'augmented 11th', 'perfect 12th', 'flat 13th', '13th'];

        /*
         * Returns major scale of given root note
         * 
         * @method getMajorScale
         * @param {string} rootNote Root note of the scale
         * @return {array} List of notes in scale
         */
        var getMajorScale = function (rootNote) {
            var scale = [];
            
            // don't use forEach as we're breaking early
            for (var i = 0; i < notesLength; i++) {
                if (rootNote.toUpperCase() === notes[i]) {
                    positionOnScale = i;
                    break;
                }
            }

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
         * Checks if given chord name is minor
         *
         * @method isMinor
         * @param {string} chord Chord to check
         * @return {boolean} Is the chord is minor
         */
        var isMinor = function (chord) {
            note.match('m') ? return true : return false;
        };

        var getTriadNotes = function (rootNote) {
            var triadNotes = [];

            triadNotes.push(

            return triadNotes;
        };

        /*
         * Returns a list of notes in a given scale.
         * 
         * @method getScale
         * @param {string} rootNote Root note to base scale on.
         * @return {array} List of notes in scale.
         */
        Music.prototype.getScale = function (rootNote) {
            var scale = [],
                positionOnScale = 0,
                notesLength = notes.length;
            
            scale = getMajorScale(rootNote);

            return scale;
        };

        /*
         * Returns a list of notes in a given chord.
         *
         * @method chordToNotes
         * @param {string} chord Name of chord to turn into string.
         * @return {array} List of notes in chord.
         */
        Music.prototype.chordToNotes = function (chord) {
            var rootNote = chord[0]; 
        };

        /*
         * Calculates the frequency of a given note
         *
         * @method noteToFrequency
         * @param {string} note Note to convert to frequency
         * @return {number} Frequency of note
         */
        Music.prototype.noteToFrequency = function (note) {
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
            return 440 * Math.pow(2, (keyNumber- 49) / 12);
        };

        return function (context) {
            return new Music(context);
        };
    })();

    window.Music = Music;

 })(window);
