/*****************
* Sequencer      *
* by Stuart Memo *
*****************/

(function (window, undefined) {

    var Sequencer = (function () {

        var Sequencer = function (context) {
            this.context = context;
            this.version = '0.0.1';
            this.output = context.destination;
            this.song = {};
            this.song.bpm = 120;
            this.song.beatsPerBar = 4;
            this.schedule = [];
        };

        var createPlayFunction = function (bufferName, buffer, that) {
            that[bufferName] = function (time) {
                var source = context.createBufferSource();
                    source.buffer = buffer;
                    source.connect(context.destination);
                    source.start(time);
            }
        };

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

        var beatToTime = function (bar, beat, steps, bpm, beatsPerBar) {
            var beatsPerSecond = bpm / 60,
                secondsPerBeat = 1 / beatsPerSecond,
                secondsPerBar = beatsPerBar * secondsPerBeat,
                secondsPerStep = secondsPerBar / steps,
                timeToPlay = (bar * secondsPerBar) + (beat * secondsPerStep);

            return timeToPlay;
        };


        var calculateNote = function (note) {

            if (note === '*') {
                // repeat last played note
                note = previousNote;    
            }
            previousNote = note;
            return note;
        }

        var playPatterns = function () {
            var beatLength = 60 / this.song.settings.bpm,
                instrument,
                bars = [],
                intervals = [],
                steps,
                previousNote;

            var calculateTimeToPlay = function (bar, interval, steps, note) {
                var timeToPlay = beatToTime(bar,
                                            interval,
                                            steps,
                                            this.song.settings.bpm,
                                            this.song.settings.beatsPerBar);

                if (typeof note === 'object') {
                    note = calculateNote(note);
                    note.forEach(function (nestedNote) {
                        note = calculateNote(nestedNote);
                    });
                } else {
                    note = calculateNote(note);
                }

                instrument[note](timeToPlay);
            };

            for (track in this.song.tracks) {

                instrument = this.song.tracks[track].instrument;

                for (pattern in this.song.tracks[track].sequence) {

                    bars = this.song.tracks[track].sequence[pattern];

                    for (sound in this.song.patterns[pattern].sequence) {
                        intervals = this.song.patterns[pattern].sequence[sound];

                        steps = this.song.patterns[pattern].steps;

                        bars.forEach(function (bar) {
                            var lastNotePlayed;

                            intervals.forEach(function (note, interval) {

                                calculateTimeToPlay(bar, interval, steps, note);
                            });
                        })

                    }
                }
            }
        };

        // Set default values for things that haven't been set
        var setDefaults = function () {

        };

        // Load song into sequencer object
        Sequencer.prototype.loadSong = function (song, callback) {
            this.song = song;
            this.callback = callback;
            setDefaults.call(this);
            this.callback();
        };

        Sequencer.prototype.playSong = function () {
            playPatterns.call(this);
        };

        return function (context) {
            return new Sequencer(context);
        };
    })();

    window.Sequencer = Sequencer;

})(window);