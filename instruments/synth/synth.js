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

            // Settings for the 3 oscillators.
            this.oscillators = {
                osc1: {
                    range: 8,
                    waveform: 'square',
                    tuning: 0
                },
                osc2: {
                    range: 4,
                    waveform: 'sawtooth',
                    tuning: 0
                },
                osc3: {
                    range: 16,
                    waveform: 'square',
                    tuning: 0
                }
            }

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

            // Filter settings.
            // Node is created here too as it doesn't need to be destroyed.
            this.filter = {
                cutoffFrequency: 400,
                emphasis: 1,
                node: tsw.createFilter('lowpass'),
            };

            // ADSR settings.
            this.adsr = {
                attack: 0,
                decay: 0,
                sustain: 0,
                release: 1,
                node: tsw.createEnvelope()
            };

            // Output settings.
            this.output = {
                volume: 0.5,
                node: tsw.createGain()
            };

            wireUp.call(this);
        };

        /*
         * Wire up all the connections need for the synth.
         *
         * @method wireUp
         */
        var wireUp = function () {
            // Connect mixer to filter.
            tsw.connect(this.mixer.osc1.node, this.filter.node);
            tsw.connect(this.mixer.osc2.node, this.filter.node);
            tsw.connect(this.mixer.osc3.node, this.filter.node);

            // Connect filter to ADSR envelope.
            tsw.connect(this.filter.node, this.adsr.node);

            // Connect ADSR envelope to volume.
            tsw.connect(this.adsr.node, this.output.node);

            // Connect volume to speakers.
            tsw.connect(this.output.node, tsw.speakers);
        };

        /*
         * Apply settings to the synth.
         *
         * @method update
         */
        Synth.prototype.update = function () {
            this.mixer.osc1.node.gain.value = this.mixer.osc1.volume;
            this.mixer.osc2.node.gain.value = this.mixer.osc2.volume;
            this.mixer.osc3.node.gain.value = this.mixer.osc3.volume;
            
            this.filter.node.frequency.value = parseInt(this.filter.cutoffFrequency, 10);
            this.filter.node.Q.value = parseInt(this.filter.emphasis, 10);
            
            this.output.node.gain.value = this.output.volume;
        };

        /*
         * Create the oscillators that generate basic sounds.
         *
         * @method createOscillators
         */
        var createOscillators = function (frequency) {

            var baseFrequency = frequency;

            for (var i = 1; i < 4; i++) {
                var oscillator = tsw.createOscillator(this.oscillators['osc' + i].waveform),
                    range = this.oscillators['osc' + i].range;

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

                oscillator.frequency.value = frequency;

                tsw.connect(oscillator, this.mixer['osc' + i].node);
                this.activeOscillators.push(oscillator);
            }
        };

        /*
         * Disconnect all oscillators.
         *
         * @method disconnectOscillators
         */
        var stopOscillators = function (frequency) {

            frequency = Math.round(frequency);

            for (var i = 0; i < this.activeOscillators.length; i++) {
                if (frequency === Math.round(this.activeOscillators[i].frequency.value) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value * 2) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value * 4) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value / 2) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value / 4) 
                ) {
                    this.adsr.node.startRelease();
                    this.activeOscillators[i].stop(tsw.now() + this.adsr.release);
                    this.activeOscillators.splice(i,1);
                    i--;
                }
            }
        };

        /*
         * Play given note on synth.
         *
         * @method playNote
         * @param {note} string Musical note to play
         * @param {startTime} number Context time to play note (in seconds)
         * @param {endTime} number Context time to end note (in seconds)
         */
        Synth.prototype.playNote = function (note) {
            createOscillators.call(this, tsw.music.noteToFrequency(note));

            this.activeOscillators.forEach(function (oscillator) {
                oscillator.start(0);
            });
        }

        /*
         * Stop given note from playing.
         *
         * @method stopNote
         * @param {note} string Musical note to stop playing.
         */
        Synth.prototype.stopNote = function (note) {
            stopOscillators.call(this, tsw.music.noteToFrequency(note));

        };

        return function (tsw) {
            return new Synth(tsw);
        };
    })();

    window.Synth = Synth;

})(window);
