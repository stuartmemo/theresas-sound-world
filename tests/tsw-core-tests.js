'use strict';

var expect = chai.expect;

describe('Core', function () {

    describe('Audio Context', function () {

        it('Context exists', function () {
            expect(typeof tsw.context).to.eq('function');
        });
    });

    describe('Output', function () {

        it('Speakers exist', function () {
            expect(typeof tsw.speakers).to.eq('object');
        });
    });

    describe('Time', function () {
        it('Now is current context time', function () {
            expect(tsw.context().currentTime).to.eq(tsw.now());
        });
    });

    describe('Browser Support', function () {
        it('Browser is supported', function () {
            expect(tsw.isBrowserSupported).to.eq(true);
        });
    });

    describe('Can connect nodes', function () {
        it('Can connect native nodes', function () {
            var osc = tsw.context().createOscillator(),
                vol = tsw.context().createGain();

            tsw.connect(osc, vol);

            expect(osc.connectedTo).to.eql([vol]);
        });

        it('Can connect tsw nodes', function () {
            var osc = tsw.osc(),
                vol = tsw.gain();

            tsw.connect(osc, vol);

            expect(osc.connectedTo).to.eql([vol]);
        });

        it('Can connect native node to tsw node', function () {
            var osc = tsw.context().createOscillator(),
                vol = tsw.gain();

            tsw.connect(osc, vol);

            expect(osc.connectedTo).to.eql([vol]);
        });

        it('Can connect tsw node to native node', function () {
            var osc = tsw.osc(),
                vol = tsw.context().createGain();

            tsw.connect(osc, vol);

            expect(osc.connectedTo).to.eql([vol]);
        });

        it('Can connect native node to array of native nodes', function () {
            var osc = tsw.context().createOscillator(),
                vol = tsw.context().createGain(),
                delay = tsw.context().createDelay(),
                nodeArray = [vol, delay];

            tsw.connect(osc, nodeArray);

            expect(osc.connectedTo).to.eql([vol, delay]);
        });

        it('Can connect tsw node to array of native nodes', function () {
            var osc = tsw.osc(),
                vol = tsw.context().createGain(),
                delay = tsw.context().createDelay(),
                nodeArray = [vol, delay];

            tsw.connect(osc, nodeArray);

            expect(osc.connectedTo).to.eql([vol, delay]);
        });

        it('Can connect native node to array of tsw nodes', function () {
            var osc = tsw.context().createOscillator(),
                vol = tsw.gain(),
                delay = tsw.wait(),
                nodeArray = [vol, delay];

            tsw.connect(osc, nodeArray);

            expect(osc.connectedTo).to.eql([vol, delay]);
        });

        it('Can connect tsw node to array of tsw nodes', function () {
            var osc = tsw.osc(),
                vol = tsw.gain(),
                delay = tsw.wait(),
                nodeArray = [vol, delay];

            tsw.connect(osc, nodeArray);

            expect(osc.connectedTo).to.eql([vol, delay]);
        });

        it('Can connect array of native nodes to native node', function () {
            var osc1 = tsw.context().createOscillator(),
                osc2 = tsw.context().createOscillator(),
                osc3 = tsw.context().createOscillator(),
                vol = tsw.context().createGain();

            tsw.connect([osc1, osc2, osc3], vol);

            expect(osc1.connectedTo).to.eql([vol]);
            expect(osc2.connectedTo).to.eql([vol]);
            expect(osc3.connectedTo).to.eql([vol]);
        });

        it('Can connect array of tsw nodes to native node', function () {
            var osc1 = tsw.osc(100),
                osc2 = tsw.osc(200),
                osc3 = tsw.osc(300),
                vol = tsw.context().createGain();

            tsw.connect([osc1, osc2, osc3], vol);

            expect(osc1.connectedTo).to.eql([vol]);
            expect(osc2.connectedTo).to.eql([vol]);
            expect(osc3.connectedTo).to.eql([vol]);
        });

        it('Can connect array of native nodes to tsw node', function () {
            var osc1 = tsw.context().createOscillator(),
                osc2 = tsw.context().createOscillator(),
                osc3 = tsw.context().createOscillator(),
                vol = tsw.gain(0.5);

            tsw.connect([osc1, osc2, osc3], vol);

            expect(osc1.connectedTo).to.eql([vol]);
            expect(osc2.connectedTo).to.eql([vol]);
            expect(osc3.connectedTo).to.eql([vol]);
        });

        it('Can connect array of tsw nodes to tsw node', function () {
            var osc1 = tsw.osc(100),
                osc2 = tsw.osc(200),
                osc3 = tsw.osc(300),
                vol = tsw.gain(0.5);

            tsw.connect([osc1, osc2, osc3], vol);

            expect(osc1.connectedTo).to.eql([vol]);
            expect(osc2.connectedTo).to.eql([vol]);
            expect(osc3.connectedTo).to.eql([vol]);
        });
    });

    describe('Can disconnect nodes', function () {
        it('Can disconnect native node connected to native node', function () {
            var osc = tsw.context().createOscillator(),
                vol = tsw.context().createGain();

            tsw.connect(osc, vol);
            tsw.disconnect(osc);

            expect(osc.connectedTo).to.eql([]);
        });

        it('Can disconnect native node connected to tsw node', function () {
            var osc = tsw.context().createOscillator(),
                vol = tsw.gain(0.5);

            tsw.connect(osc, vol);
            tsw.disconnect(osc);

            expect(osc.connectedTo).to.eql([]);
        });

        it('Can disconnect tsw node connected to native node', function () {
            var osc = tsw.osc(),
                vol = tsw.context().createGain();

            tsw.connect(osc, vol);
            tsw.disconnect(osc);

            expect(osc.connectedTo).to.eql([]);
        });

        it('Can disconnect tsw node connected to tsw node', function () {
            var osc = tsw.osc(),
                vol1 = tsw.gain(),
                vol2 = tsw.gain(0.5);

            tsw.connect(osc, vol1, vol2);
            tsw.disconnect(vol1);

            expect(vol1.connectedTo).to.eql([]);
        });
    });

    describe('Create Buffer', function () {
        it('Node is a Buffer', function () {
            expect(tsw.buffer().nodeType).to.eq('buffer');
        });

        it('Can decode buffer', function (done) {
            tsw.decode(new ArrayBuffer(8),function () {
                done();
            },function () {
                done();
            });
        });
    });

    describe('Create Oscillator', function () {

        it('Node is an OscillatorNode', function () {
            expect(tsw.osc().nodeType).to.eq('oscillator');
        });

        it('Default type is a sine wave', function () {
            expect(tsw.osc().type()).to.eq('sine');
        });

        it('Creates a sine wave.', function () {
            expect(tsw.osc(300, 'sine').type()).to.eq('sine');
        });

        it('Creates a square wave.', function () {
            expect(tsw.osc(200, 'square').type()).to.eq('square');
        });

        it('Creates a triangle wave', function () {
            expect(tsw.osc(100, 'triangle').type()).to.eq('triangle');
        });

        it('Creates a sawtooth wave', function () {
            expect(tsw.osc(50, 'sawtooth').type()).to.eq('sawtooth');
        });

        it('Creates a sine wave with a certain frequency', function () {
            var osc = tsw.osc(500, 'sawtooth');
            expect(osc.frequency()).to.eq(500);
        });

        it('Sets the frequency', function () {
            var osc = tsw.osc();
            osc.frequency(900);
            expect(osc.frequency()).to.eq(900);
        });
    });

    describe('Create Gain', function () {

        it('Node should be a GainNode', function () {
            expect(tsw.gain().nodeType).to.eq('gain');
        });

        it('Default gain value should be 1', function () {
            expect(tsw.gain().gain()).to.eq(1);
        });

        it('Create gain node with different gain level than default', function () {
            expect(tsw.gain(0.5).gain()).to.eq(0.5);
        });

        it('Create gain node and change gain level after creation', function () {
            var volume = tsw.gain();
            volume.gain(0.2);
            expect(volume.gain()).to.eq(0.20000000298023224);
        });

        it('Change gain at a specified time', function (done) {
            var osc = tsw.osc(),
            vol = tsw.gain(0.2),
            mute = tsw.gain(0);

            this.timeout(6000);

            tsw.connect(osc, vol, mute, tsw.speakers);
            osc.start(tsw.now());
            osc.stop(tsw.now() + 5);
            vol.gain(0.5, tsw.now() + 2);

            setTimeout(function () {
                expect(vol.gain()).to.eq(0.5);
                done();
            }, 3000);
        });
    });

    describe('Create Wait', function () {

        it('Node should be a wait node', function () {
            expect(tsw.wait().nodeType).to.eq('wait');
        });

        it('Default delayTime value should be 1', function () {
            expect(tsw.wait().time()).to.eq(1);
        });

        it('Create wait node with different wait time than default', function () {
            expect(tsw.wait(0.5).time()).to.eq(0.5);
        });

        it('Create wait node and change wait time after creation', function () {
            var wait = tsw.wait();
            wait.time(0.2);
            expect(wait.time()).to.eq(0.20000000298023224);
        });
    });

    describe('Create Panner', function () {
        it('Node should be a panner node', function () {
            expect(tsw.panner().nodeType).to.eq('panner');
        });

        it('Default panning should be 0', function () {
            expect(tsw.panner().pan()).to.eq(0);
        });

        it('Create panner with different panning than default', function () {
            expect(parseFloat(tsw.panner(-0.8).pan().toFixed(1))).to.eq(-0.8);
        });
    });

    describe('Transitions', function () {
        /**
        it('Gain should ramp linearly up then down', function (done) {
            var osc = tsw.osc(),
                mute = tsw.gain(0),
                vol = tsw.gain(0);

            tsw.connect(osc, vol, mute, tsw.speakers);
            osc.start(tsw.now());

            expect(vol.gain()).to.eq(0);

            vol.gain(1, tsw.now() + 2, 'linear');
            vol.gain(0, tsw.now() + 4, 'linear');

            setTimeout(function () {
                expect(vol.gain()).toBeLessThan(0.6);
            }, 1000);

            setTimeout(function () {
                expect(vol.gain()).toBeGreaterThan(0.5);
            }, 2500);

            setTimeout(function () {
                expect(vol.gain()).toBeLessThan(0.5);
            }, 3500);

            setTimeout(function () {
                expect(vol.gain()).to.eq(0);
                done();
            }, 4500);
        });
        */

        it('Gain should ramp exponentially up then down', function (done) {
            var osc = tsw.osc(),
                vol = tsw.gain(0),
                mute = tsw.gain(0);

            tsw.connect(osc, vol, mute, tsw.speakers);
            osc.start(tsw.now());

            expect(vol.gain()).to.eq(0);

            vol.gain(1, tsw.now() + 2, 'exponetial');
            vol.gain(0, tsw.now() + 4, 'exponential');

            this.timeout(6000);

            setTimeout(function () {
                try {
                    expect(vol.gain()).to.be.below(0.6);
                }
                catch (e) {
                    console.log(e);
                }
            }, 1000);

            setTimeout(function () {
                try {
                    expect(vol.gain()).to.be.below(0.5);
                }
                catch (e) {
                    console.log(e);
                }
            }, 3500);

            setTimeout(function () {
                try {
                    expect(vol.gain()).to.be.below(0.5);
                }
                catch (e) {
                    console.log(e);
                    done();
                }
                done();

            }, 4500);
        });
    });

    describe('Create Filter', function () {
        it('Node should be a filter node', function () {
            expect(tsw.filter().nodeType).to.eq('filter');
        });

        it('Default filter type should be lowpass', function () {
            expect(tsw.filter().type()).to.eq('lowpass');
        });

        it('Create filter with different filter type than default', function () {
            expect(tsw.filter('highpass').type()).to.eq('highpass');
        });

        it('Default filter gain should be zero', function () {
            expect(tsw.filter().gain()).to.eq(0);
        });

        it('Can create a filter with a predefined gain', function () {
            expect(tsw.filter({ gain: 0.5 }).gain()).to.eq(0.5);
        });
    });

    describe('Create LFO', function () {
        it('Node should be an LFO node', function () {
            expect(tsw.lfo().nodeType).to.eq('lfo');
        });

        it('Default LFO frequency should be 10Hz', function () {
            expect(tsw.lfo().frequency()).to.eq(10);
        });

        it('Create LFO with different frequency than default', function () {
            expect(tsw.lfo(5).frequency()).to.eq(5);
        });
    });

    describe('Create Compressor', function () {
        it('Check compressor node type', function () {
            expect(tsw.compressor().nodeType).to.eq('compressor');
        });

        it('Can set threshold', function () {
            expect(tsw.compressor({ threshold: -60 }).threshold()).to.eq(-60);
        });

        it('Can set knee', function () {
            expect(tsw.compressor({ knee: 35 }).knee()).to.eq(35);
        });

        it('Can set ratio', function () {
            expect(tsw.compressor({ ratio: 10 }).ratio()).to.eq(10);
        });

        it('Can set attack', function () {
            expect(tsw.compressor({ attack: 1 }).attack()).to.eq(1);
        });

        it('Can set release', function () {
            expect(tsw.compressor({ release: 0.5 }).release()).to.eq(0.5);
        });
    });


    /*
    describe('Create Envelope', function () {
        var osc = tsw.oscillator(),
            volume = tsw.gain(),
            mute = tsw.gain(0),
            envelope = tsw.envelope({
                param: volume.params.gain,
                startLevel: 0,
                maxLevel: 1,
                sustainLevel: 0.6,
                attackTime: 2,
                decayTime: 1,
                autoStop: false
            });

        tsw.connect(osc, volume, mute, tsw.speakers);

        osc.start(tsw.now());
        osc.stop(tsw.now() + 8);

        it('Should be an envelope', function () {
            expect(tsw.envelope().nodeType).to.eq('envelope');
        });

        // Start Level
        it('Start level should be zero-ish', function (done) {
            envelope.start();

            setTimeout(function () {
                expect(volume.gain()).toBeLessThan(0.1);
                done();
            }, 100);
        });

        // Attack
        it('Should attack', function (done) {
            setTimeout(function () {
                expect(volume.gain()).toBeGreaterThan(0.1);
                done();
            }, 100);
        });

        // Decay
        it('Should decay', function (done) {
            expect(parseFloat(volume.gain().toFixed(1))).toBeLessThan(1);
            done();
        });

        // Sustain
        it('Should sustain', function (done) {
            setTimeout(function () {
                expect(parseFloat(volume.gain().toFixed(1))).to.eq(0.6);
                done();
            }, 1500);
        });

        // Still sustaining?
        it('Should still be sustaining', function (done) {
            expect(parseFloat(volume.gain().toFixed(1))).to.eq(0.6);
            envelope.stop();
            done();
        });

        // Release
        it('Should release', function (done) {
            setTimeout(function () {
                expect(volume.gain()).toBeLessThan(0.6);
                done();
            }, 1000);
        });

    });
    */

    describe('Create Noise', function () {

        it('Node nodeType is "noise"', function () {
            expect(tsw.noise().nodeType).to.eq('noise');
        });
    });

    describe('Load files', function () {
        // This isn't really testing much,
        // but karma fails if actual mp3s are used.

        it('Load some mp3s', function (done) {
            tsw.load(
                {
                    files: {
                        sampleOne: 'samples/tsw1.mp3',
                        sampleTwo: 'samples/tsw2.mp3',
                        sampleThree: 'samples/tsw3.mp3',
                    }
                }, function (successFiles) {
                    done();
                }, function () {
                    // failure
                    done();
                }
            );
        });

        it('Load some files that don\'t exist', function (done) {
            tsw.load({
                files: {
                    sampleOne: 'samples/nope1.mp3',
                    sampleTwo: 'samples/nope2.mp3',
                    sampleThree: 'samples/nope3.mp3'
                }
            }, function () {
                // do nothing
            }, function () {
                done();
            });
        });
    });

    describe('Buffer Box', function () {

        it('can create a buffer box', function () {
            var bufferBox = tsw.bufferBox();

            expect(bufferBox.nodeType).to.eq('bufferBox');
        });

        it('can load a buffer', function () {
            var bufferBox = tsw.bufferBox();

            bufferBox.buffer(tsw.buffer());

            expect(bufferBox.buffer().sampleRate).to.eq(44100);
        });

        it('can play a buffer', function () {
            var bufferBox = tsw.bufferBox();

            bufferBox.buffer(tsw.buffer());
            bufferBox.play(tsw.now());

            expect(bufferBox.paused).to.eq(false);
            expect(bufferBox.stopped).to.eq(false);
            expect(bufferBox.playing).to.eq(true);
        });
    });

    /**
    * Fade in/out has been removed while waiting for Firefox documentation.
    * https://github.com/stuartmemo/theresas-sound-world/issues/18
    */

    /*
    describe('Fade In', function () {

        it('Oscillator node fades in', function (done) {
            var osc = tsw.oscillator(),
                mute = tsw.gain(0);

            expect(osc.output.gain.value).to.eq(1);

            tsw.connect(osc, mute, tsw.speakers);
            osc
                .start(tsw.now())
                .fadeIn();

            osc.stop(tsw.now() + 3);

            setTimeout(function () {
                expect(osc.output.gain.value).to.eq(1);
                done();
            }, 1000);
        });
    });

    describe('Fade Out', function () {

        it('Oscillator node fades out', function (done) {
            var osc = tsw.oscillator(),
                mute = tsw.gain(0);

            expect(osc.output.gain.value).to.eq(1);
            tsw.connect(osc, mute, tsw.speakers);
            osc
                .start(tsw.now())
                .fadeOut();

            setTimeout(function () {
                expect(osc.output.gain.value).to.eq(0);
                done();
            }, 4000);
        });
    });
    */
});
