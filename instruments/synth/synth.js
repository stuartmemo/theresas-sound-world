/*****************************
 * Synth
 * synth.js
 * Synth for TSW
 * Copyright 2013 Stuart Memo
 *****************************/

(function (window, undefined) {

    /*
     * High-level Guide
     * ================
     * To create synth:
     *     var synth = new Synth();
     * And to play:
     *     synth.playNote('C3');
     * And to stop it:
     *     synth.stopNote('C3');
     *
     * Notes
     * -------------------------
     * Each note has its own set of 3 oscillators.
     * Oscillators are created when playNote() is called. 
     * This is because they are "use once and destroy" nodes. 
     *
     * Layout
     * ------
     * +-----+     +------+
     * | Osc |-->--| Gain |-->--+
     * +-----+     +------+     |
     *                          |     +---------+
     * +-----+     +------+     |     | Lowpass |     +----------+     +------+     +----------+
     * | Osc |-->--| Gain |-->--+-->--| Filter  |-->--| Envelope |-->--| Gain |-->--| Speakers |
     * +-----+     +------+     |     +---------+     +----------+     +------+     +----------+
     *                          |
     * +-----+     +------+     |
     * | Osc |-->--| Gain |-->--+
     * +-----+     +------+
     */

    var Synth = (function () {

        /*
         * Creates an instance of the synth.
         *
         * @constructor
         * @this {Synth}
         */
        var Synth = function () {
            this.version = '0.0.1';
            init.call(this);
        };

        /*
         * Initialise the synth.
         *
         * @method init
         */
        var init = function () {
            this.activeOscillators = [];
            this.activeVolumeEnvelopes = [];
            this.activeFilterEnvelopes = [];
            this.keysDown = [];
            this.allNodes = [],
            that = this;

            // Settings for the 3 oscillators.
            this.oscillators = {
                osc1: {
                    range: 8,
                    waveform: 'square',
                    detune: 0
                },
                osc2: {
                    range: 4,
                    waveform: 'sawtooth',
                    detune: 0
                },
                osc3: {
                    range: 16,
                    waveform: 'square',
                    detune: 0
                }
            };

            // Mixer settings.
            // Nodes are created here too as they don't need to be destroyed.
            this.mixer = {
                osc1: {
                    node: tsw.createGain(),
                    volume: 0.5,
                    active: true
                },
                osc2: {
                    node: tsw.createGain(),
                    volume: 0.5,
                    active: true
                },
                osc3: {
                    node: tsw.createGain(),
                    volume: 0.5,
                    active: true
                },
                noise: {
                    node: tsw.createNoise(),
                    type: 'white',
                    volume: 0.5,
                    active: false
                }
            };

            // Filter Envelope Settings
            this.filterEnvelopeSettings = {
                attackTime: 0.1,
                decayTime: 0.5,
                sustainLevel: 5000,
                Q: 5,
                releaseTime: 1,
                maxLevel: 10000,
                autoStop: false
            };

            // Volume Envelope settings.
            this.volumeEnvelopeSettings = {
                attackTime: 1.0,
                decayTime: 0.5,
                sustainLevel: 0.4,
                releaseTime: 2,
                startLevel: 0,
                autoStop: false
            };

            // Output settings.
            this.gainForLFOSettings= {
                volume: 0.5,
                node: tsw.createGain()
            };

            // LFO settings.
            this.lfoSettings = {
                frequency: 1,
                depth: 10,
                waveType: 'triangle',
                target: that.gainForLFOSettings.node.gain,
                autoStart: true,
                node: null
            };

            this.masterVolume = tsw.createGain();

            var limiter = tsw.createCompressor();

            this.lfoSettings.node = tsw.createLFO(this.lfoSettings);

            // Start garbage collector for nodes no longer needed.
            this.garbageCollection(this);

            // Connect mixer to output.
            tsw.connect([this.mixer.osc1.node, this.mixer.osc2.node, this.mixer.osc3.node],
                        this.gainForLFOSettings.node,
                        this.masterVolume,
                        limiter,
                        tsw.speakers);
        };

        var rangeToFrequency = function (baseFrequency, range) {
            var frequency = baseFrequency;

            switch (range) {
                case '2':
                    frequency = baseFrequency * 4;
                    break;
                case '4':
                    frequency = baseFrequency * 2;
                    break;
                case '16':
                    frequency = baseFrequency / 2;
                    break;
                case '32':
                    frequency = baseFrequency / 4;
                    break;
                case '64':
                    frequency = baseFrequency / 8;
                    break;
                default:
                    break;
            };
             
             return frequency;
        };

        /*
         * Create the oscillators that generate basic sounds.
         *
         * @method createOscillators
         */
        var createOscillators = function (frequency) {
            var noteOscillators = [];

            for (var i = 1; i < 4; i++) {
                var oscillator = tsw.createOscillator(this.oscillators['osc' + i].waveform),
                    range = this.oscillators['osc' + i].range,
                    detune = this.oscillators['osc' + i].detune;

                oscillator.frequency.value = rangeToFrequency(frequency, range);
                oscillator.detune.value = detune;
                noteOscillators.push(oscillator);
            }

            return noteOscillators;
        };

        /*
         * Play given note on synth.
         *
         * @method playNote
         * @param {note} string Musical note to play
         * @param {startTime} number Context time to play note (in seconds)
         *
         * @param {endTime} number Context time to end note (in seconds)
         */
        Synth.prototype.playNote = function (note) {
            var noteOscillators = createOscillators.call(this, tsw.music.noteToFrequency(note)),
                that = this;

            this.keysDown.push(note);

            noteOscillators.forEach(function (oscillator, index) {
                var gainForEnvelope = tsw.createGain(),
                    filter = tsw.createFilter('lowpass'),
                    volEnvelope,
                    filterEnvelope;

                index++;

                that.volumeEnvelopeSettings.param = gainForEnvelope.gain;
                that.filterEnvelopeSettings.param = filter.frequency;

                volEnvelope = tsw.createEnvelope(that.volumeEnvelopeSettings);
                filterEnvelope = tsw.createEnvelope(that.filterEnvelopeSettings);

                tsw.connect(oscillator, gainForEnvelope, filter, that.mixer['osc' + index].node);

                oscillator.start(tsw.now());
                volEnvelope.start();
                filterEnvelope.start();

                that.activeOscillators.push(oscillator);
                that.activeVolumeEnvelopes.push(volEnvelope);
                that.activeFilterEnvelopes.push(filterEnvelope);

                that.allNodes.push(oscillator);
            });
        };

        /*
         * Stop given note from playing.
         *
         * @method stopNote
         * @param {note} string Musical note to stop playing.
         */
        Synth.prototype.stopNote = function (note) {
            var frequency = Math.round(tsw.music.noteToFrequency(note)),
                match = false;

            for (var i = 0; i < this.activeOscillators.length; i++) {
                for (oscillator in this.oscillators) {
                    if (this.oscillators[oscillator].waveform === this.activeOscillators[i].type) {
                        if (Math.round(rangeToFrequency(frequency, this.oscillators[oscillator].range)) === Math.round(this.activeOscillators[i].frequency.value)) {
                            match = true;
                        }
                    }
                }

                if (match) {
                    this.activeOscillators[i].stop(tsw.now() + this.volumeEnvelopeSettings.releaseTime)
                    this.activeOscillators.splice(i,1);

                    this.activeVolumeEnvelopes[i].stop();
                    this.activeVolumeEnvelopes.splice(i,1);

                    this.activeFilterEnvelopes[i].stop();
                    this.activeFilterEnvelopes.splice(i,1);
                    i--;
                }

                match = false;
            }
        };

        /*
         * Disconnect oscillators no longer in use.
         *
         * @method garbageCollection
         * @param {synth} Current instance of the synth
         */
        Synth.prototype.garbageCollection = function (synth) {

            // Remove the ghosts of dead oscillators
            for (var i = 0; i < synth.allNodes.length; i++) {
                if (synth.allNodes[i].playbackState === 3) {
                    synth.allNodes[i].disconnect();
                }
                synth.allNodes.splice(i, 1);
                i--;

            }

            setTimeout(function () { synth.garbageCollection(synth) }, 1000);
        };


        return function (tsw) {
            return new Synth(tsw);
        };
    })();

    window.Synth = Synth;

})(window);
