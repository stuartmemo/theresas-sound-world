/******************************
 * Theresa's Sound World - Core
 * tsw-core.js
 * Core library
 * Copyright 2013 Stuart Memo
 ******************************/

(function (window, undefined) {

    var SoundWorld = (function () {
        /*
         * Creates a Sound World.
         *
         * @constructor
         * @this {SoundWorld}
         * @param {context} context The audio context to work with.
         */
        var SoundWorld = function (context) {
            this.context = context || new webkitAudioContext();
            this.version = '0.0.1';
            this.speakers = this.context.destination;

            // ScriptProcessor nodes need to be added to global object to avoid garbage collection.
            this.processors = [];

            try {
                this.context.createGain();
            } catch (e) {
                throw new Error('Sorry, your browser doesn\'t support the Web Audio API.');
            };

            if (hasEffectsLibLoaded()) {
                this.fx = new tswEffects(this);
            }

            if (hasMusicLibLoaded()) {
                this.music = new tswMusic(this);
            }
        };

        /*
         * Gets the current time of the audio context
         *
         * @method now
         * @return {number} Time since audio began.
         */
        SoundWorld.prototype.now = function () {
            return this.context.currentTime;
        };

        /*
         * Checks if tsw effects library is loaded.
         *
         * @method hasEffectsLibLoaded
         * @return {boolean} Has effects library been loaded.
         */
        var hasEffectsLibLoaded = function () {
            return window.tswEffects ? true : false;
        }
        
        /*
         * Checks if tsw music library is loaded.
         *
         * @method hasMusicLibLoaded
         * @return {boolean} Has music library been loaded.
         */
        var hasMusicLibLoaded = function () {
            return window.tswMusic ? true : false;
        }

        /*
         * Applies the attributes of one objet to another.
         *
         * @method applyObject
         * @return {object} A newly merged object.
         */
        var applyObject = function (obj1, obj2) {
            for (attr in obj2) {
                obj1[attr] = obj2[attr];
            }

            return obj1;
        };

        /*
         * Applies the settings object ot a node.
         *
         * @method applySettings
         * @return {AudioNode} Node with settings applied.
         */
        SoundWorld.prototype.applySettings = function (node, settings) {
            for (setting in settings) {
                node[setting].value = settings[setting];
            }
        };

        /*
         * Connects multiple nodes together.
         *
         * @method connect
         * @param {AudioNodes} arguments Nodes to connect in order.
         */
        SoundWorld.prototype.connect = function () {
            for (var i = 0; i < arguments.length - 1; i++) {
                if (Array.isArray(arguments[i])) {
                    for (var j = 0; j < arguments[i].length; j++) {
                        this.connect(arguments[i][j], arguments[i + 1]); 
                    }
                } else if (arguments[i].hasOwnProperty('output')) {
                    if (arguments[i + 1].hasOwnProperty('input')) {
                        arguments[i].output.connect(arguments[i + 1].input);
                    } else {
                        arguments[i].output.connect(arguments[i + 1]);
                    }
                } else {
                    if (arguments[i + 1].hasOwnProperty('input')) {
                        arguments[i].connect(arguments[i + 1].input);
                    } else {
                        arguments[i].connect(arguments[i + 1]);
                    }
                }
            }
        };

        /*
         * Disconnects a node from everything it's connected to.
         *
         * @method disconnect
         */
        SoundWorld.prototype.disconnect = function (node) {
            node.disconnect();
        };

        /*
        * @method load
        * @param files
        * @param callback
        */ 
        SoundWorld.prototype.load = function (files, callback) {
            var returnObj = {},
                filesLoaded = 0,
                numberOfFiles = 0,
                that = this;

            // Load a single file
            var loadFile = function (fileKey, filePath, returnObj, callback) {
                var request = new XMLHttpRequest();

                request.open('GET', filePath, true);
                request.responseType = 'arraybuffer';

                request.onload = function () {
                    filesLoaded++;

                    that.context.decodeAudioData(request.response, function (decodedBuffer) {

                        returnObj[fileKey] = that.context.createBufferSource();
                        returnObj[fileKey].buffer = decodedBuffer;

                        returnObj[fileKey].play = function () {
                            that.play(this);
                        };

                        returnObj[fileKey].stop = function () {
                            that.stop(this);
                        };

                        returnObj[fileKey].isPlaying = function () {
                            return this.playbackState;
                        };

                        if (filesLoaded === numberOfFiles) {
                            callback(returnObj);
                        }
                    });
                };

                request.send();
            };
 
            if (typeof files === 'object') {
                for (var file in files) {
                    numberOfFiles++;
                    loadFile(file, files[file], returnObj, callback);
                }
            } else if (typeof files === 'string') {
                numberOfFiles = 1;
                loadFile(file, files[file], returnObj, callback);
            } else {
                throw new Error('Files must be an array or a valid string.');
            }
        };

        /*
        * Play preloaded buffer.
        *
        * @method play
        * @param {buffer} AudioBuffer Preloaded audio buffer of sound to play.
        */
        SoundWorld.prototype.play = function (buffer) {
            buffer.start(0);
        };

        /*
         * Stop buffer if it's currently playing.
         * 
         * @method stop
         * @param {AudioBuffer} buffer
         */
        SoundWorld.prototype.stop = function (buffer) {
            buffer.stop(0);
        };

        /*
         * Reverse a buffer
         *
         * @method reverse
         * @param {AudioBuffer} buffer
         */
        SoundWorld.prototype.reverse = function (buffer) {

        };

        /*
         * Create oscillator node.
         *
         * @method createOscillator
         * @param {string} waveType The type of wave form.
         * @param {number} frequency The starting frequency of the oscillator.
         * @return Oscillator node of specified type.
         */
        SoundWorld.prototype.createOscillator = function (waveType, frequency) {
            var osc = this.context.createOscillator();

            waveType = waveType || 'SINE';
            waveType = waveType.toUpperCase();

            osc.type = osc[waveType];
            osc.frequency.value = frequency || 440;

            return osc;
        };

        /*
         * Create Sine Wave node.
         *
         * @method createSineWave
         * @param {number} frequency The starting frequency of the sine wave.
         * @return Sine wave node.
         */
        SoundWorld.prototype.createSineWave = function (frequency) {
            return this.createOscillator('SINE', frequency);
        };

        /*
         * Create square wave node.
         *
         * @method createSquareWave
         * @param {number} frequency The starting frequency of the square wave.
         * @return Square wave node.
         */
        SoundWorld.prototype.createSquareWave = function (frequency) {
            return this.createOscillator('SQUARE', frequency);
        };

        /*
         * Create sawtooth wave node.
         *
         * @method createSawtoothWave
         * @param {number} frequency The starting frequency of the sawtooth wave.
         * @return Square wave node.
         */
        SoundWorld.prototype.createSawtoothWave = function (frequency) {
            return this.createOscillator('SAWTOOTH', frequency);
        };

        /*
         * Create triangle wave node.
         *
         * @method createTriangleWave
         * @param {number} frequency The starting frequency of the sawtooth wave.
         * @return Triangle wave node.
         */
        SoundWorld.prototype.createTriangleWave = function (triangle) {
            return this.createOscillator('TRIANGLE', frequency);
        };

        /*
         * Create gain node.
         *
         * @method createGainNode
         * @return Gain node.
         */
        SoundWorld.prototype.createGain = function (volume) {
            var gainNode = this.context.createGain();

            gainNode.gain.value = volume || 1;

            return gainNode;
        };

        /*
         * Create filter node.
         *
         * @method createFilter
         * @param {string} filterType Type of filter.
         * @return Filter node.
         */
        SoundWorld.prototype.createFilter = function (filterType) {
            var fType = filterType || 'lowpass';

            var filter = this.context.createBiquadFilter();
            filter.type = fType;

            return filter;
        };

        /*
         * Create analyser node.
         *
         * @method createAnalyser
         * @return Analyser node.
         */
        SoundWorld.prototype.createAnalyser = function () {
            return this.context.createAnalyser();
        };

        /*
         * Create compressor node.
         *
         * @method createCompressor
         * @return Compressor node.
         */
        SoundWorld.prototype.createCompressor = function (settings) {
            var compressor = this.context.createDynamicsCompressor(),
                defaults = {
                    threshold: -24,     // dbs (min: -100, max: 0)
                    knee: 30,           // dbs (min: 0, max: 40)
                    ratio: 12,          // ratio (min: 1, max: 20)
                    attack: 0.003,      // seconds (min: 0, max: 1)
                    release: 0.25       // seconds (min: 0, max: 1)
                };
   
            settings = applyObject(defaults, settings);
            this.applySettings(compressor, settings);
 
            return compressor;
        };

        /*
         * Create processor node.
         *
         * @method createProcesor
         * @return Script Processor node.
         */
        SoundWorld.prototype.createProcessor = function (bs, callback) {
            var bufferSize = bs || 1024,
                processor =  tsw.context.createScriptProcessor(bufferSize, 1, 1);

            if (typeof callback === 'function') {
                processor.onaudioprocess = function (e) {
                    callback(e); 
                };
            }

            return processor;
        };

        /*
         * Create waveshaper.
         *
         * @method createWaveShaper
         */
        SoundWorld.prototype.createWaveShaper = function () {
            var curve = new Float32Array(65536)

            for (var i = 0; i < 65536 / 2; i++) {
                if (i < 30000) {
                    curve[i] = 0.1;
                } else {
                    curve[i] = -1;
                }
            }

            var waveShaper = this.context.createWaveShaper();
            waveShaper.curve = curve;

            return waveShaper;
        };

        /*
         * Create envelope.
         *
         * @method createEnvelope
         * @param {object} envelopeParams Envelope parameters.
         * @return Envelope filter.
         */
        SoundWorld.prototype.createEnvelope = function (settings) {
            var envelope = {};

            envelope.attackTime = settings.attackTime || 0;
            envelope.decayTime = settings.decayTime || 0;
            envelope.sustainLevel = settings.sustainLevel || 0.5;
            envelope.releaseTime = settings.releaseTime || 1;
            envelope.startValue = settings.startValue || 0;
            envelope.maxValue = settings.maxValue || 1;
            envelope.param = settings.param;
            envelope.param.value = envelope.startValue;

            envelope.start = function () {
                envelope.active = true;
                envelope.param.cancelScheduledValues(tsw.now());
                envelope.param.setValueAtTime(envelope.startValue, tsw.now());
                envelope.param.linearRampToValueAtTime(envelope.maxValue, tsw.now() + envelope.attackTime);
                envelope.param.linearRampToValueAtTime(envelope.sustainLevel, tsw.now() + envelope.attackTime + envelope.decayTime);
            };

            envelope.stop = function () {
                envelope.active = false;
                envelope.param.cancelScheduledValues(tsw.now());
                envelope.param.setValueAtTime(envelope.sustainLevel, tsw.now());
                envelope.param.linearRampToValueAtTime(envelope.startValue, tsw.now() + envelope.releaseTime);
            };

            return envelope;
        };

        /*
         * Create noise.
         *
         * @method createNoise
         * @param {string} colour Type of noise.
         * @return Noise generating node.
         */
        SoundWorld.prototype.createNoise = function (colour) {
            var noiseNode = this.context.createScriptProcessor(1024, 0, 1);

            // white noise
            noiseNode.onaudioprocess = function (e) {
                for (var i = 0; i < 1024; i++) {
                    e.outputBuffer.getChannelData(0)[i] = (Math.random() * 2) - 1;
                }
            };

            // this isn't right
            if (colour === 'pink') {
                var lowpassFilter = this.context.createBiquadFilter();
                lowpassFilter.Q.value = 3;
                noiseNode.connect(lowPassFilter);
            }

            return noiseNode;
        };

        /*
         * Create LFO.
         *
         * @method createLFO
         * @param {object} settings LFO settings.
         */
        SoundWorld.prototype.createLFO = function (settings) {

            /*********************************

            LFO 
            ===
            +----------+     +--------------+
            |    LFO   |-->--|    Target    |
            | (Source) |     | (AudioParam) |
            +----------+     +--------------+

            *********************************/

            var mmNode = {},
                lfo = this.context.createOscillator(),
                depth = this.context.createGain(),
                that = this; 

            settings = settings || {};
            lfo.frequency.value = settings.frequency || 10;
            lfo.frequency.value = settings.frequency || 70;
            depth.gain.value = settings.depth || 1;
            lfo.type = lfo[settings.waveType] || lfo['TRIANGLE'];

            mmNode.input = this.context.createGain();

            mmNode.modulate = function (target) {
                lfo.connect(depth);
                depth.connect(target);
            };

            mmNode.setFrequency = function (f) {
                lfo.frequency.value = f;
            };

            mmNode.setDepth = function (d) {
                depth.gain.value = d;
            };

            mmNode.start = function () {
                lfo.start(that.now());
            };

            mmNode.stop = function () {
                lfo.stop(this.context.now());
            };

            return mmNode;
        };

        return function (context) {
            return new SoundWorld(context);
        };
    })();

    window.tsw = new SoundWorld();
})(window);
