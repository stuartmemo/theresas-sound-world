/*****************************
 * Drum Machine
 * drum-machine.js
 * Drum Machine for TSW
 * Copyright 2013 Stuart Memo
 *****************************/
(function (window, undefined) {

    var DrumMachine = (function () {

        /*
         * Creates an instance of the drum machine.
         *
         * @constructor
         * @this {DrumMachine}
         */
        var DrumMachine = function () {
            this.version = '0.0.1';
            this.drums = {};
            this.settings = {};

            init.call(this);
        };

        var init = function () {
            var kickSettings = {
                name: 'kick',
                volume: 1,
                tuning: 0
            };
            
            var snareSettings = {
                name: 'snare',
                volume: 0.5,
                tuning: 0
            };

            var hiHatOpenSettings = {
                name: 'hihat-open',
                volume: 0.5,
                tuning: 0
            };

            var hiHatClosedSettings = {
                name: 'hihat-closed',
                volume: 0.5,
                tuning: 0
            };

            var cowbellSettings = {
                name: 'cowbell',
                volume: 0.5,
                tuning: 0
            };
            
            var tomSettings = {
                name: 'tom',
                volume: 0.5,
                tuning: 0
            };

            var clapSettings = {
                name: 'clap',
                volume: 0.5,
                tuning: 0
            };
            this.drums.kick = new Drum(kickSettings);
            this.drums.snare = new Drum(snareSettings);
            this.drums.hihatClosed= new Drum(hiHatClosedSettings);
            this.drums.hihatOpen = new Drum(hiHatOpenSettings);
            this.drums.clap = new Drum(clapSettings);
            this.drums.cowbell = new Drum(cowbellSettings);
            this.drums.tom = new Drum(tomSettings);

            this.output = {
                volume: 0.5,
                node: tsw.createGain()
            };
        };

        var Drum = function (settings) {
            this.settings = settings;
        };

        var createKick = function () {
            var kick = tsw.createOscillator(),
                lowpass = tsw.createFilter(),
                gainForEnvelope = tsw.createGain(),
                volumeEnvelopeSettings = {
                    decayTime: 0.1,
                    releaseTime: 0.2,
                    maxLevel: 0.8,
                    param: gainForEnvelope.gain
                },
                pitchEnvelopeSettings = {
                    attackTime: 0,
                    decayTime: 0.05,
                    sustainLevel: 0,
                    param: kick.detune
                };

            volEnvelope = tsw.createEnvelope(volumeEnvelopeSettings);
            pitchEnvelope = tsw.createEnvelope(pitchEnvelopeSettings);
            tsw.connect(kick, gainForEnvelope, tsw.speakers);

            kick.frequency.value = 52;
            kick.start(0);

            volEnvelope.start();
            pitchEnvelope.start();

            kick.stop(tsw.now() + 6);
        };

        var createSnare = function () {
            var drum = tsw.createOscillator('triangle'),
                drum2 = tsw.createOscillator('triangle'),
                noise = tsw.createNoise(),
                lowpass = tsw.createFilter(),
                highpass = tsw.createFilter('highpass'),
                gainForDrumEnvelope = tsw.createGain(),
                gainForDrum2Envelope = tsw.createGain(),
                gainForNoiseEnvelope = tsw.createGain(),
                drumEnvelopeSettings = {
                    attackTime: 0.0005,
                    decayTime: 0.025,
                    releaseTime: 0.02,
                    startLevel: 0,
                    maxLevel: 0.1,
                    param: gainForDrumEnvelope.gain,
                    autoStop: true
                },
                drum2EnvelopeSettings = {
                    attackTime: 0.0005,
                    decayTime: 0.075,
                    releaseTime: 0.0,
                    startLevel: 0,
                    maxLevel: 0.1,
                    param: gainForDrum2Envelope.gain,
                    autoStop: true
                },
                noiseEnvelopeSettings = {
                    attackTime: 0.005,
                    decayTime: 0.20,
                    releaseTime: 0.05,
                    startLevel: 7000,
                    maxLevel: 10000,
                    param: lowpass.frequency,
                    autoStop: true
                },
                noiseGainEnvelopeSettings = {
                    attackTime: 0.005,
                    decayTime: 0.10,
                    releaseTime: 0.02,
                    maxLevel: 0.2,
                    param: gainForNoiseEnvelope.gain,
                    autoStop: true
                },
                pitchEnvelopeSettings = {
                    attackTime: 0,
                    decayTime: 0.05,
                    sustainLevel: 0,
                    releaseLevel: 0.1,
                    minLevel: -4800,
                    maxLevel: 100,
                    param: drum.detune,
                    autoStop: true
                };

            drumEnvelope = tsw.createEnvelope(drumEnvelopeSettings);
            drum2Envelope = tsw.createEnvelope(drum2EnvelopeSettings);
            noiseEnvelope = tsw.createEnvelope(noiseEnvelopeSettings);
            noiseGainEnvelope = tsw.createEnvelope(noiseGainEnvelopeSettings);
            pitchEnvelope = tsw.createEnvelope(pitchEnvelopeSettings);

            tsw.connect(drum, gainForDrumEnvelope, tsw.speakers);
            tsw.connect(drum2, gainForDrum2Envelope, tsw.speakers);
            tsw.connect(noise, lowpass, highpass, gainForNoiseEnvelope, tsw.speakers);

            drum.frequency.value = 180;
            drum2.frequency.value = 125;
            lowpass.frequency.value = 7000;
            highpass.frequency.value = 520;

            drum.start(tsw.now());
            drum2.start(tsw.now());
            drumEnvelope.start();
            drum2Envelope.start();
            noiseEnvelope.start();
            pitchEnvelope.start();
            noiseGainEnvelope.start();
            drum.stop(tsw.now() + 6);
        };

        var createHiHatClosed = function () {
            var hihatClosed = tsw.createNoise(),
                highpass = tsw.createFilter('highpass'),
                gainForEnvelope = tsw.createGain(),
                volumeEnvelopeSettings = {
                    decayTime: 0.08,
                    releaseTime: 0.02,
                    maxLevel: 0.5,
                    param: gainForEnvelope.gain
                };

            highpass.frequency.value = 11200;

            volEnvelope = tsw.createEnvelope(volumeEnvelopeSettings);
            tsw.connect(hihatClosed, gainForEnvelope, highpass, tsw.speakers);

            // Noise doesn't have start and stop yet
            volEnvelope.start();
        };

        var createHiHatOpen = function () {
            var hihatOpen = tsw.createNoise(),
                highpass = tsw.createFilter('highpass'),
                gainForEnvelope = tsw.createGain(),
                volumeEnvelopeSettings = {
                    decayTime: 0.22,
                    releaseTime: 0.2,
                    maxLevel: 0.5,
                    param: gainForEnvelope.gain
                };

            highpass.frequency.value = 11200;

            volEnvelope = tsw.createEnvelope(volumeEnvelopeSettings);
            tsw.connect(hihatOpen, gainForEnvelope, highpass, tsw.speakers);

            // Noise doesn't have start and stop yet
            volEnvelope.start();
        };

        var createTom = function () {
            var tom = tsw.createOscillator(),
                lowpass = tsw.createFilter(),
                gainForEnvelope = tsw.createGain(),
                volumeEnvelopeSettings = {
                    decayTime: 0.1,
                    releaseTime: 0.2,
                    maxLevel: 0.8,
                    param: gainForEnvelope.gain
                },
                pitchEnvelopeSettings = {
                    attackTime: 0,
                    decayTime: 1,
                    releaseTime: 0,
                    sustainLevel: 0,
                    maxLevel: 1000,
                    param: tom.detune
                };

            volEnvelope = tsw.createEnvelope(volumeEnvelopeSettings);
            pitchEnvelope = tsw.createEnvelope(pitchEnvelopeSettings);
            tsw.connect(tom, gainForEnvelope, tsw.speakers);

            tom.frequency.value = 100;
            tom.start(0);

            volEnvelope.start();
            pitchEnvelope.start();

            tom.stop(tsw.now() + 6);
        };
        
        var createClap = function () {
            var clap1 = tsw.createNoise(),
                clap2 = tsw.createNoise(),
                bandpass1 = tsw.createFilter('bandpass'),
                bandpass2 = tsw.createFilter('bandpass'),
                gainForEnvelope = tsw.createGain(),
                volumeEnvelopeSettings = {
                    decayTime: 0.02,
                    releaseTime: 0.1,
                    maxValue: 0.5,
                    param: gainForEnvelope.gain
                };

            bandpass1.frequency.value = 1200;
            bandpass2.frequency.value = 5200;

            volEnvelope = tsw.createEnvelope(volumeEnvelopeSettings);
            tsw.connect(clap1, gainForEnvelope, bandpass1, tsw.speakers);
            tsw.connect(clap2, gainForEnvelope, bandpass2, tsw.speakers);

            // Noise doesn't have start and stop yet
            volEnvelope.start();
        };

        var createCowbell = function () {
            var sqWave1 = tsw.createOscillator('square'),
                sqWave2 = tsw.createOscillator('square'),
                lowPassFilter= tsw.createFilter(),
                gainForEnvelope = tsw.createGain(),
                volumeEnvelopeSettings = {
                    decayTime: 0.122,
                    releaseTime: 0.02,
                    maxLevel: 0.2,
                    param: gainForEnvelope.gain
                };
 
            sqWave1.frequency.value = 870;
            sqWave2.frequency.value = 520;
            lowPassFilter.frequency.value = 2000;

            volEnvelope = tsw.createEnvelope(volumeEnvelopeSettings);

            tsw.connect([sqWave1, sqWave2], gainForEnvelope, lowPassFilter, tsw.speakers);
            sqWave1.start(tsw.now());
            sqWave2.start(tsw.now());
            volEnvelope.start(); 
        };

        Drum.prototype.play = function () {
            switch (this.settings.name) {
                case 'kick':
                    createKick();
                    break;
                case 'snare':
                    createSnare();
                    break;
                case 'hihat-closed':
                    createHiHatClosed();
                    break;
                case 'hihat-open':
                    createHiHatOpen();
                    break;
                case 'tom':
                    createTom();
                    break;
                case 'clap':
                    createClap();
                    break;
                case 'cowbell':
                    createCowbell();
                    break;
                default:
                    break;
            };
        };


        return function (tsw) {
            return new DrumMachine(tsw);
        };
    })();

    window.DrumMachine = DrumMachine;

})(window);
