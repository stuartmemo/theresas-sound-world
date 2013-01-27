/*****************************************
 * Theresa's Sound World - Sequencer
 * tsw-sequencer.js
 * Dependencies: tsw-core.js, tsw-music.js
 * Copyright 2013 Stuart Memo
 *****************************************/

(function (window, undefined) {

    var Sequencer = (function () {

        /*
         * Creates instance of sequncer
         *
         * @constructor
         * @param {AudioContext} Current audio context
         */
        var Sequencer = function (context) {
            this.context = context;
            this.version = '0.0.1';
            this.output = context.destination;
            this.song = {};
            this.song.bpm = 120;
            this.song.beatsPerBar = 4;
            this.schedule = [];
            this.music = new Music(context);
        };

        /*
         * Create a play function with given name.
         *
         * @method createPlayFunction
         * @param {string} bufferName Name of buffer.
         * @param {AudioBuffer} buffer Buffer to play in function.
         * @para {object} that Keep binding to original Sequenece.
         */
        var createPlayFunction = function (bufferName, buffer, that) {
            that[bufferName] = function (time) {
                var source = context.createBufferSource();
                    source.buffer = buffer;
                    source.connect(context.destination);
                    source.start(time);
            }
        };

        /*
         * Load files into audio buffers.
         *
         * @method loadFiles
         * @param {kit}
         * @callback {function} Function to call once all files are loaded.
         */
        Sequencer.prototype.loadFiles = function (kit, callback) {
            var returnObj = {},
                filesLoaded = 0,
                numberOfFiles = Object.keys(kit).length,
                path = kit.path || '',
                that = this;

            var loadFile = function (fileKey, filePath, returnObj, callback) {
                var request = new XMLHttpRequest();

                request.open('GET', path + filePath, true);
                request.responseType = 'arraybuffer';

                request.onload = function () {
                    that.context.decodeAudioData(request.response, function (decodedBuffer) {
                        filesLoaded++;
                        returnObj[fileKey] = decodedBuffer;

                        createPlayFunction(fileKey, returnObj[fileKey], that);

                        if (filesLoaded === numberOfFiles) {
                            callback(returnObj);
                        }
                    });
                };

                request.send();
            };

            for (var sample in kit.samples) {
                loadFile(sample, kit.samples[sample], returnObj, callback);
            }
        };

        /*
         * Turns beat position into seconds.
         *
         * @method beatToTime
         * @param {number} bar
         * @param {number} beat
         * @param {number} steps
         * @param {number} bpm Number of beats per minute in current song.
         * @param {number} beatsPerBar
         * @return {number} Time to play in seconds.
         */
        var beatToTime = function (bar, beat, steps, bpm, beatsPerBar) {
            var beatsPerSecond = bpm / 60,
                secondsPerBeat = 1 / beatsPerSecond,
                secondsPerBar = beatsPerBar * secondsPerBeat,
                secondsPerStep = secondsPerBar / steps,
                timeToPlay = (bar * secondsPerBar) + (beat * secondsPerStep);

            return timeToPlay;
        };

        /*
         * Replaces '*' in patterns with previous note in array.
         *
         * @method replaceStars
         * @param {array} pattern
         * @param {string} prevNote
         * @return New pattern without '*'s.
         */
        var replaceStars = function (pattern, prevNote) {
            prevNote = prevNote || pattern[0];

            pattern.forEach(function (steps, index) {
                if (typeof steps === 'object') {
                    replaceStars(steps, prevNote);
                } else if (steps === '*') {
                    pattern[index] = prevNote;
                }
            });

            return pattern;
        }

        /*
         * Play note on an instrument at a certain time.
         *
         * @method play
         * @param {object} instrument Instrument to play note on.
         * @param {string} note Note to play.
         * @param {number} startTime Time to start note.
         * @param {number} stopTime Time to stop note.
         */
        var play = function (instrument, note, startTime, stopTime) {
            if (note instanceof Array) {
                note.forEach(function (n) {
                    instrument.playNote(n, startTime, stopTime);
                })
            } else {
                instrument.playNote(note, startTime, stopTime);
            }

            if (this.music.isChord(note)) {
                var chord = this.music.parseChord(note);
                chord.notes.forEach(function (n) {
                    instrument.playNote(n + chord.octave, startTime, stopTime);
                });
            }
        }

        /*
         * Figure out what time a note should start playing.
         *
         * @method calculateStartTime
         * @param {number} bar
         * @param {number} interval
         * @param {number} steps
         * @param {string} note
         * @return Time to start playing note.
         */
        var calculateStartTime = function (bar, interval, steps, note) {
            var timeToPlay = beatToTime(bar,
                                        interval,
                                        steps,
                                        this.song.settings.bpm,
                                        this.song.settings.beatsPerBar);
            return timeToPlay;
        };

        /*
         * Figure out what time a note should stop playing.
         *
         * @method calculateStopTime
         * @param {string || array} sequence
         * @param {number} step
         * @param {array} steps
         * @param {number} startTime
         * @param {number} noteLength
         */
        var calculateStopTime = function (sequence, step, steps, startTime, noteLength) {
            noteLength = noteLength || 1;

            if (sequence instanceof Array) {
                  sequence.forEach(function (sq, index) {
                    if (sequence[index + 1] === '-') {
                        noteLength++; 
                    }
                    calculateStopTime(sq, step, steps, startTime, noteLength)
                });
            } else {
                stopTime = startTime + (noteLength)
            }

            return startTime + 1;
        };

        /*
         * Schedule the patterns in a song.
         *
         * @method playPatterns
         */
        var playPatterns = function () {
            var beatLength = 60 / this.song.settings.bpm,
                instrument,
                bars = [],
                intervals = [],
                steps,
                previousNote,
                that = this;
                
            for (var track in this.song.tracks) {

                // Get instrument that should be used for track
                instrument = this.song.tracks[track].instrument;

                for (var patternName in this.song.tracks[track].sequence) {

                    // Get what bars on this track should play this pattern
                    bars = this.song.tracks[track].sequence[patternName];

                    // Get the number of steps in a pattern
                    steps = this.song.patterns[patternName].steps;

                    this.song.patterns[patternName].sequence.forEach(function (sequence) {
                        bars.forEach(function (bar) {
                            sequence = replaceStars(sequence)

                            sequence.forEach(function (note, step) {
                                if (note.length > 1) {
                                    var startTime = calculateStartTime(bar, step, steps, note),
                                        stopTime = calculateStopTime(sequence, step, steps, startTime);
 
                                    // Start and stop instrument at specified time
                                    play.call(that, instrument, note, startTime, stopTime);
                                }
                            });
                        })
                    });
                }
            }
        };

        /*
         * Loads a song into sequencer object.
         *
         * @method loadSong
         * @param {object} song Song to play.
         * @param {function} callback Function to call to once song is loaded.
         */
        Sequencer.prototype.loadSong = function (song, callback) {
            this.song = song;
            this.callback = callback;
            this.callback();
        };

        /*
         * Plays song currently loaded into sequencer.
         *
         * @method playSong
         */
        Sequencer.prototype.playSong = function () {
            playPatterns.call(this);
        };

        return function (context) {
            return new Sequencer(context);
        };
    })();

    window.Sequencer = Sequencer;

})(window);
