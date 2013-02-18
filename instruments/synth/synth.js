/*****************
* Basic Synth    *
* by Stuart Memo *
*****************/

(function (window, undefined) {

    var Synth = (function () {
        var Synth = function (tsw) {
            this.version = '0.0.1';
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

            this.filter = {
                cutoffFrequency: 400,
                emphasis: 1,
                node: tsw.createFilter('lowpass'),
            };

            this.output = {
                volume: 0.5,
                node: tsw.createGainNode()
            };

            tsw.connect(this.mixer.osc1.node, this.filter.node);
            tsw.connect(this.mixer.osc2.node, this.filter.node);
            tsw.connect(this.mixer.osc3.node, this.filter.node);

            tsw.connect(this.filter.node, this.output.node);
            tsw.connect(this.output.node, tsw.speakers);
        };

        Synth.prototype.updateMixer = function () {
            this.mixer.osc1.node.gain.value = this.mixer.osc1.volume;
            this.mixer.osc2.node.gain.value = this.mixer.osc2.volume;
            this.mixer.osc3.node.gain.value = this.mixer.osc3.volume;
        };

        Synth.prototype.updateFilter = function () {
            this.filter.node.frequency.value = parseInt(this.filter.cutoffFrequency, 10);;
            this.filter.node.Q.value = parseInt(this.filter.emphasis, 10);;
        };

        Synth.prototype.updateOutput = function () {
            this.output.node.gain.value = this.output.volume;
        };
        
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

        var disconnectOscillators = function (frequency) {
            frequency = Math.round(frequency);
            for (var i = 0; i < this.activeOscillators.length; i++) {
                if (frequency === Math.round(this.activeOscillators[i].frequency.value) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value * 2) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value * 4) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value / 2) ||
                    frequency === Math.round(this.activeOscillators[i].frequency.value / 4) 
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

        return function (tsw) {
            return new Synth(tsw);
        };
    })();

    window.Synth = Synth;

})(window);
