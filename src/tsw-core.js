/*****************************
 * Theresa's Sound World
 * tsw.js
 * An audio library.
 * Copyright 2013 Stuart Memo
 *****************************/

(function (window, undefined) {

    /*
     * Creates a Sound World.
     *
     * @constructor
     * @this {SoundWorld}
     */
    var SoundWorld = (function () {

        var SoundWorld = function () {
            // Check if the Web Audio API is supported.
            if (typeof webkitAudioContext.prototype.createGain === 'undefined') {
                if (typeof webkitAudioContext.prototype.createGainNode === 'undefined') {
                    throw new Error('Sorry, your browser doesn\'t support a recent enough version of the Web Audio API.');
                } else {
                    // Using older version of API.
                    webkitAudioContext.prototype.createGain  = webkitAudioContext.prototype.createGainNode;
                    webkitAudioContext.prototype.createScriptProcessor = webkitAudioContext.prototype.createJavaScriptNode;
                }
            }

            this.context = new webkitAudioContext();
            this.version = '0.0.1';
            this.speakers = this.context.destination;

            // ScriptProcessor nodes need to be added to global object to avoid garbage collection.
            this.processors = [];
        };

        /*
         * Gets the current time of the audio context.
         *
         * @method now
         * @return {number} Time since audio began.
         */
        SoundWorld.prototype.now = function () {
            return this.context.currentTime;
        };

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
        SoundWorld.prototype.reverse = function (sourceNode) {
            // Reverse the array of each channel
            for (var i = 0; i < sourceNode.buffer.numberOfChannels; i++) {
                Array.prototype.reverse.call(sourceNode.buffer.getChannelData(i));
            }
            return sourceNode;
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

            if (typeof osc.start === 'undefined') {
                osc.start = osc.noteOn;
                osc.stop = osc.noteOff;
            };

            waveType = waveType || 'SINE';
            waveType = waveType.toUpperCase();

            osc.type = osc[waveType];
            osc.safariType = waveType.toLowerCase();
            osc.frequency.value = frequency || 440;

            return osc;
        };

        /*
         * Create gain node.
         *
         * @method createGainNode
         * @return Gain node.
         */
        SoundWorld.prototype.createGain = function (volume) {
            var gainNode;

            if (typeof this.context.createGain === 'function') {
                gainNode = this.context.createGain();
            } else {
                gainNode = this.context.createGainNode();
            }

            gainNode.gain.value = volume || 1;

            return gainNode;
        };

        /*
         * Create buffer node.
         *
         * @method createBuffer
         * @return Buffer node.
         */
        SoundWorld.prototype.createBuffer = function () {
            var bufferNode = this.context.createBuffer(1, 65536, 44100);
            return bufferNode;
        };
        
        /*
         * Create buffer source node.
         *
         * @method createBufferSource
         * @return BufferSource node.
         */
        SoundWorld.prototype.createBufferSource = function (buff) {
            var source = this.context.createBufferSource();
            source.buffer = buff;
            return source;
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
         * Creates compressor node.
         *
         * @method createCompressor
         * @param {object} settings Compressor settings.
         * @return Created compressor node.
         */
        SoundWorld.prototype.createCompressor = function (settings) {
            /*
             *  Compressor 
             *  ==========
             *  +----------+     +----------------------+     +---------------+
             *  |  Input   |-->--|       Compressor     |-->--|     Output    |
             *  | (Source) |     | (DynamicsCompressor) |     | (Destination) |
             *  +----------+     +----------------------+     +---------------+
             */ 
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

            // Initial levels
            envelope.startLevel = settings.startLevel || 0;
            envelope.maxLevel = settings.maxLevel || 1;
            envelope.minLevel = settings.minLevel || 0;

            // Envelope values
            envelope.attackTime = settings.attackTime || 0;
            envelope.decayTime = settings.decayTime || 0;
            envelope.sustainLevel = settings.sustainLevel || 0;
            envelope.releaseTime = settings.releaseTime || 0;
            
            // Automation parameters 
            envelope.param = settings.param;
            envelope.param.value = envelope.startLevel;

            // Should the release kick-in automatically
            settings.autoRelease === undefined ? envelope.autoRelease = true : envelope.autoRelease = settings.autoRelease;

            envelope.start = function (timeToStart) {
                // Calculate levels
                this.maxLevel = this.startLevel + this.maxLevel;
                this.sustainLevel = this.startLevel + this.sustainLevel;

                // Calculate times
                this.startTime = timeToStart || tsw.now();
                this.attackTime = this.startTime + this.attackTime;
                this.decayTime = this.attackTime + this.decayTime;
                this.releaseTime = this.decayTime + this.releaseTime;

                // Initialise
                this.param.cancelScheduledValues(this.startTime);
                this.param.setValueAtTime(this.startLevel, this.startTime);

                // Attack
                this.param.linearRampToValueAtTime(this.maxLevel, this.attackTime);

                // Decay
                this.param.linearRampToValueAtTime(this.startLevel + this.sustainLevel, this.decayTime); 

                // Release
                if (this.autoRelease) {
                    this.param.linearRampToValueAtTime(this.minLevel, this.releaseTime); 
                    this.stop(this.releaseTime);
                }
            };

            envelope.stop = function (timeToStop) {
                timeToStop = timeToStop || tsw.now();
                timeToStop += this.releaseTime;

                // Release
                if (!this.autoRelease) {
                    this.param.linearRampToValueAtTime(this.startLevel, timeToStop);
                }
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
            var noiseBuffer = this.createBuffer(),
                noiseNode;

            for (var i = 0; i < 65536; i++) {
                noiseBuffer.getChannelData(0)[i] = (Math.random() * 2) - 1;
            }

            noiseNode = this.createBufferSource(noiseBuffer);
            noiseNode.loop = true;

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

            var effectObj = {},
                lfo = tsw.createOscillator(),
                depth = this.createGain(),
                defaults = {
                    frequency: 0,
                    waveType: 'triangle',
                    depth: 1,
                    target: null,
                    autoStart: false
                };

            // Merge passed settings with defaults
            settings = applyObject(defaults, settings);

            lfo.type = lfo[settings.waveType] || lfo['TRIANGLE'];

            depth.gain.value = settings.depth;
            lfo.frequency.value = settings.frequency;

            if (settings.autoStart) {
                lfo.start(tsw.now());
            }

            lfo.modulate = function (target) {
                this.connect(depth);
                depth.connect(target);
            };

            lfo.setWaveType = function (waveType) {
                lfo.type = lfo[waveType.toUpperCase()];
            };

            lfo.setFrequency = function (f) {
                lfo.frequency.value = f;
            };

            lfo.setDepth = function (d) {
                depth.gain.value = d;
            };
            
            lfo.modulate(settings.target);

            return lfo;
        };

        return SoundWorld;
    })();

    window.tsw = new SoundWorld();
})(window);
