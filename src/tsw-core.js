/*****************************
 * Theresa's Sound World
 * tsw.js
 * An audio library.
 * Copyright 2013 Stuart Memo
 *****************************/

/*
 * Creates a Sound World.
 *
 * @constructor
 * @this {SoundWorld}
 */
window.tsw = (function (window, undefined) {

    /***********
     * Helpers *
     **********/

    /*
     * Applies the attributes of one objet to another.
     * @return {object} A newly merged object.
     */
    var applyObject = function (obj1, obj2) {
        for (attr in obj2) {
            obj1[attr] = obj2[attr];
        }

        return obj1;
    };

    /*
     * Applies the settings object to a node.
     * @method applySettings
     * @return {AudioNode} Node with settings applied.
     */
    var applySettings = function (node, settings) {
        for (setting in settings) {
            node[setting].value = settings[setting];
        }
    };

    /*
     * Is a variable an array?
     * @param thing Variable to check if it's an array.
     */
     var isArray = function (thing) {
        return Array.isArray(thing);
     };

    /*
     * Is a variable an object?
     * @param thing Variable to check if it's an object.
     */
     var isObjectWithNode = function (thing) {
        var is_object_with_node = false;

        if (Object(thing)) {
            if ('node' in thing) {
                is_object_with_node = true;
            }
        }

        return is_object_with_node;
     };

    /*
     * Is variable a native node?
     * @parm thing Variable to check if it's a native node.
     */
    var isNativeNode = function (thing) {
        return (thing.hasOwnProperty('context'));
    };

    /*
     * Is variable a tsw node?
     * @parm thing Variable to check if it's a tsw node.
     */
    var isTswNode = function (thing) {
        return (thing.hasOwnProperty('input') || thing.hasOwnProperty('output'));
    };

    /***************
     * Sound World *
     **************/

    var tsw = {};

    tsw.version = '0.0.1';
    tsw.processors = []; // Add ScriptProcessor nodes to global object to avoid garbage collection.
    tsw.isBrowserCompatible = false;

    /*
     * Check if browser has Web Audio API.
     * Also, map older API methods to new ones.
     * @param {function} success Success method execute.
     * @param {function} failure Failure method execute.
     */
    var checkCompatibility = function (success, failure) {
        // Check if the Web Audio API is supported.
        if (typeof webkitAudioContext === 'undefined' && typeof AudioContext === 'undefined') {
            if (typeof webkitAudioContext.prototype.createGainNode === 'undefined') {
                failure('Sorry, your browser doesn\'t support a recent enough version of the Web Audio API.');
            } else {
                // Using older version of API.
                var ctx = webkitAudioContext.prototype;

                ctx.createGain  = ctx.createGainNode;
                ctx.createDelay  = ctx.createDelayNode;
                ctx.createScriptProcessor = ctx.createJavaScriptNode;
            }
        } else {
            if (typeof AudioContext === 'function') {
                tsw.context = new AudioContext();
            } else {
                tsw.context = new webkitAudioContext();
            }
        }

        // All is good, continue;
        tsw.isBrowserCompatible = true;
        success();
    };

    /*
     * Map WAAPI methods to tsw.
     */
    var mapToSoundWorld = function () {
        tsw.speakers = tsw.context.destination;
    };

    /*
     * Get the current time of the audio context.
     * @return {number} Time since audio began (in seconds).
     */
    tsw.now = function () {
        return this.context.currentTime;
    };

    tsw.createChannelMerger = function (channels) {
        return tsw.context.createChannelMerger(channels);
    };

    /*
     * Connects multiple nodes together.
     * @param {AudioNodes} arguments Nodes to connect in order.
     */
    tsw.connect = function () {

        var connectNativeNodeToNativeNode = function () {
            arguments[0].connect(arguments[1]);
        };

        var connectNativeNodeToTswNode = function () {
            arguments[0].connect(arguments[1].input);   
        };

        var connectNativeNodeToArray = function () {
            for (var j = 0; j < arguments[1].length; j++) {
                tsw.connect(arguments[0], arguments[1][j]);
            }
        };

        var connectArrayToNativeNode = function () {
            for (var j = 0; j < arguments[0].length; j++) {
                tsw.connect(arguments[0][j], arguments[1]);
            }
        };

        var connectTswNodeToTswNode = function () {
            arguments[0].output.connect(arguments[1].input);
        };

        var connectTswNodeToNativeNode = function () {
            arguments[0].output.connect(arguments[1]);
        };

        var connectArrayToTswNode = function () {
            for (var j = 0; j < arguments[0].length; j++) {
                this.connect(arguments[0][j], arguments[1]); 
            }
        };

        var connectArrayToArray = function () {
            for (var j = 0; j < arguments[0].length; j++) {
                this.connect(arguments[0][j], arguments[1]); 
            }
        };

        var connectObjectWithNodeToObjectWithNode = function () {
            arguments[0].node.connect(arguments[1].node, arguments[0].channel, arguments[1].channel);
        }

        // Iterate over each argument.
        for (var i = 0; i < arguments.length - 1; i++) {
            var first_arg = arguments[i],
                second_arg = arguments[i + 1];

            // First arg is native node, second is tsw node.
            if (isNativeNode(first_arg) && isTswNode(second_arg)) {
                connectNativeNodeToTswNode(first_arg, second_arg);
                continue;
            }

            // First arg is tsw node, second is native node.
            if (isTswNode(first_arg) && isNativeNode(second_arg)) {
                connectTswNodeToNativeNode(first_arg, second_arg);
                continue;
            }

            if (isNativeNode(first_arg) && isArray(second_arg)) {
                connectNativeNodeToArray(first_arg, second_arg);
                continue;
            }

            if (isArray(first_arg) && isNativeNode(second_arg)) {
                connectArrayToNativeNode(first_arg, second_arg);
                continue;
            }

            // Both arguments are native nodes.
            if (isNativeNode(first_arg) && isNativeNode(second_arg)) {
                connectNativeNodeToNativeNode(first_arg, second_arg);
                continue;
            }

            // Both arguments are tsw nodes.
            if (isTswNode(first_arg) && isTswNode(second_arg)) {
                connectTswNode(first_arg, second_arg);
                continue;
            }

            // First arg is tsw node, second is array.
            if (isTswNode(first_arg) && isArray(second_arg)) {
                connectTswNodeToArray(first_arg, second_arg);
                continue;
            }

            // First arg is array, second is tsw node.
            if (isArray(first_arg) && isTswNode(second_arg)) {
                connectArrayToTswNode(first_arg, second_arg);
                continue;
            }

            // Both arguments are arrays.
            if (isArray(first_arg) && isArray(second_arg)) {
                connectArrayToArray(first_arg, second_arg);
                continue;
            }

            // First arg is object containing nodes, second is arrat.
            if (isObjectWithNode(first_arg) && isArray(second_arg)) {
                connectObjectWithNodeToArray(first_arg, second_arg);
                continue;
            }

            // First arg is array, second is object containing node.
            if (isArray(first_arg) && isObjectWithNode(second_arg)) {
                connectArrayToObjectWithNode(first_arg, second_arg);
                continue;
            }

            // Both arguments are objects containing nodes.
            if (isObjectWithNode(first_arg) && isObjectWithNode(second_arg)) {
                connectObjectWithNodeToObjectWithNode(first_arg, second_arg)
                continue;
            }
        }
    };

    /*
     * Disconnects a node from everything it's connected to.
     * @param {AudioNode} node
     */
    tsw.disconnect = function () {
        var argumentsLength = arguments.length;

        for (var i = 0; i < argumentsLength; i++) {
            arguments[i].disconnect();
        } 
    };

    /*
    * @param {array} files
    * @param {function} callback
    */ 
    tsw.load = function (baseU, files, callback) {
        var returnObj = {},
            files_loaded = 0,
            number_of_files = 0,
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
     * Create a delay node.
     */
    tsw.createDelay = function (delayTime) {
        var delayNode = this.context.createDelay();

        delayNode.delayTime.value = delayTime || 0;

        return delayNode;
    };

    /*
     * Make an incoming stream mono.
     */
    tsw.createMonoMaker = function () {
        var effect = {};

        effect.input = tsw.createGain();
        effect.output = tsw.createGain();

        tsw.connect(effect.input, effect.output);

        return effect;
    };

    /*
     * Pan incoming sound.
     * Range from -1 to 1.
     * -1 is fully left. 1 is fully right.
     * @param {number} pan
     */
    tsw.createPanner = function (pan) {
        var panner = {},
            left_gain = tsw.createGain(1),
            right_gain = tsw.createGain(0),
            left_percentage = 50,
            merger = tsw.createChannelMerger(2);

        panner.input = tsw.createGain();
        panner.output = tsw.createGain();
        panner.value = pan;

        // Force max panning values.
        if (panner.value > 1) {
            panner.value = 1;
        } else if (panner.value < -1) {
            panner.value = -1;
        }

        // 100% === 2
        // Example value = -0.56
        // (0.44 / 2) * 100 = 22% -> 78%
        // Left gain = (1 / 100) * 78 = 0.78 
        // Right gain = 1 - 0.78 =  0.22

        // Example value = 0.2
        // (1.2 / 2) * 100 = 60% -> 40%
        // Left gain = (1 / 100) * 40 = 0.4
        // Right gain = 1 - 0.4 = 0.6

        left_gain.gain.value = 1 - (0.01 * ((1 + panner.value) / 2) * 100);
        right_gain.gain.value = 1 - left_gain.gain.value;

        tsw.connect(panner.input, [left_gain, right_gain]);

        tsw.connect(
            {
                node: left_gain,
                channel: 0
            }, 
            {
                node:  merger,
                channel: 0
            }
        );

        tsw.connect(
            {
                node: right_gain,
                channel: 0
            }, 
            {
                node:  merger,
                channel: 1
            }
        );

        tsw.connect(merger, panner.output);

        return panner;
    };

    /*
     * Play preloaded buffer.
     * @param {buffer} AudioBuffer Preloaded audio buffer of sound to play.
     * @param {number} when
     */
    tsw.play = function (buffer, when) {
        when = when || 0;
        buffer.start(when);
    };

    /*
     * Stop buffer if it's currently playing.
     * @param {AudioBuffer} buffer
     * @param {number} when 
     */
    tsw.stop = function (buffer, when) {
        when = when || 0;
        buffer.stop(when);
    };

    /*
     * Reverse a buffer
     * @param {AudioBuffer} buffer
     */
    tsw.reverse = function (sourceNode) {
        // Reverse the array of each channel
        for (var i = 0; i < sourceNode.buffer.numberOfChannels; i++) {
            Array.prototype.reverse.call(sourceNode.buffer.getChannelData(i));
        }
        return sourceNode;
    };

    /*
     * Create oscillator node.
     * @param {string} waveType The type of wave form.
     * @param {number} frequency The starting frequency of the oscillator.
     * @return Oscillator node of specified type.
     */
    tsw.createOscillator = function (waveType, frequency) {
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
     * @return Gain node.
     */
    tsw.createGain = function (volume) {
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
     * @return Buffer node.
     */
    tsw.createBuffer = function () {
        var bufferNode = this.context.createBuffer(1, 65536, 44100);
        return bufferNode;
    };
    
    /*
     * Create buffer source node.
     * @return BufferSource node.
     */
    tsw.createBufferSource = function (buff) {
        var source = this.context.createBufferSource();
        source.buffer = buff;
        return source;
    };

    /*
     * Create filter node.
     * @param {string} filterType Type of filter.
     * @return Filter node.
     */
    tsw.createFilter = function (filterType, frequency, Q) {
        var fType = filterType || 'lowpass';

        var filter = this.context.createBiquadFilter();
        filter.type = fType;
        filter.frequency.value = frequency || 0;
        filter.Q.value = Q || 0;

        return filter;
    };

    /*
     * Create analyser node.
     *
     * @method createAnalyser
     * @return Analyser node.
     */
    tsw.createAnalyser = function () {
        return this.context.createAnalyser();
    };

    /*
     * Creates compressor node.
     * @param {object} settings Compressor settings.
     * @return Created compressor node.
     */
    tsw.createCompressor = function (settings) {
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
     * @return Script Processor node.
     */
    tsw.createProcessor = function (bs, callback) {
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
     */
    tsw.createWaveShaper = function () {
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
     * @param {object} envelopeParams Envelope parameters.
     * @return Envelope filter.
     */
    tsw.createEnvelope = function (settings) {
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
        settings.autoStop === undefined ? envelope.autoStop = true : envelope.autoStop = settings.autoStop;

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
            if (this.autoStop) {
                this.param.linearRampToValueAtTime(this.minLevel, this.releaseTime); 
                this.stop(this.releaseTime);
            }
        };

        envelope.stop = function (timeToStop) {
            timeToStop = timeToStop || tsw.now();
            timeToStop += this.releaseTime;

            // Release
            if (!this.autoStop) {
                this.param.linearRampToValueAtTime(this.minLevel, this.releaseTime);
            }
        };

        return envelope;
    };

    /*
     * Create noise.
     * @param {string} colour Type of noise.
     * @return Noise generating node.
     */
    tsw.createNoise = function (colour) {
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
     * @param {object} settings LFO settings.
     */
    tsw.createLFO = function (settings) {

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

    /*
     * Get user's audio input.
     * @param {function} Callback function with streaming node passed as param;
     */
    tsw.getUserAudio = function (callback) {
        var audioStream = function (stream) {
            var streamNode = tsw.context.createMediaStreamSource(stream);

            callback(streamNode);
        };

        navigator.webkitGetUserMedia({audio: true}, audioStream);
    };

    /*
     * Kick everything off.
     */
    (function () {
        checkCompatibility(function () {
            // Browser is compatible.
            mapToSoundWorld();
        }, function (error) {
            // Browser is not compatible.
            console.log(error);
        });
    })();

    return tsw;
})(window);
