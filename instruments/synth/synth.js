/*****************
* Basic Synth    *
* by Stuart Memo *
*****************/

(function (window, undefined) {

    var Synth = (function () {

        var Synth = function (outputNode) {
            this.version = '0.0.1';
            this.output = outputNode;
            init.call(this);
        };

        var init = function () {
            this.activeOscillators = [];

            this.oscillators = {
                osc1: {
                    range: 8,
                    waveform: 'triangle',
                    tuning: 0
                },
                osc2: {
                    range: 4,
                    waveform: 'triangle',
                    tuning: 0
                },
                osc3: {
                    range: 16,
                    waveform: 'triangle',
                    tuning: 0
                }
            }

            this.mixer = {
                osc1: {
                    node: tsw.createGainNode(),
                    volume: 0.5,
                    active: true
                },
                osc2: {
                    node: tsw.createGainNode(),
                    volume: 0.5,
                    active: true
                },
                osc3: {
                    node: tsw.createGainNode(),
                    volume: 0.5,
                    active: true
                },
                noise: {
                    node: tsw.createNoise(),
                    type: 'white',
                    volume: 0.5,
                    active: false
                }
            }


            this.volume = tsw.createGainNode();

            this.mixer.osc2.node.gain = 0.2;
            this.mixer.osc3.node.gain = 0.1;
            this.volume.gain.value = 0.5;

            tsw.connect(this.mixer.osc1.node, this.volume);
            tsw.connect(this.mixer.osc2.node, this.volume);
            tsw.connect(this.mixer.osc3.node, this.volume);

            tsw.connect(this.volume, tsw.speakers);
        };

        var createOscillators = function (frequency) {
            for (var i = 1; i < 4; i++) {
                var oscillator = tsw.createOscillator('triangle');

                var range = this.oscillators['osc' + i].range;

                switch (range) {
                    case 4:
                        frequency = frequency * 2;
                        break;
                    case 16:
                        frequency = frequency / 2;
                        break;
                    default:
                        break;
                };
                oscillator.frequency.value = frequency;
                tsw.connect(oscillator, this.mixer['osc' + i].node);
                this.activeOscillators.push(oscillator);
            }
        };

        var disconnectOscillators = function (frequency) {
            frequency = Math.round(frequency);
            for (var i = 0; i < this.activeOscillators.length; i++) {
                if (frequency === Math.round(this.activeOscillators[i].frequency.value) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value * 2) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value / 2) 
                ) {
                    tsw.disconnect(this.activeOscillators[i]);
                    this.activeOscillators.splice(i,1);
                    i--;
                }
            }
        };

        /*
         * Play given note on synth
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

        Synth.prototype.stopNote = function (note) {
            disconnectOscillators.call(this, tsw.music.noteToFrequency(note));
        };

        return function (context, outputNode) {
            return new Synth(context, outputNode);
        };
    })();

    window.Synth = Synth;

})(window);
