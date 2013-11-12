/* Theresa's Sound World 0.0.1 (c) 2013 Stuart Memo */
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
    'use strict';

    /***********
     * Helpers *
     **********/

    /*
     * Applies the attributes of one object to another.
     * @return {object} A newly merged object.
     */
    var applyObject = function (obj1, obj2) {
        for (var attr in obj2) {
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
        for (var setting in settings) {
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
     * @parm thing Variable to check if it's a native node wat.
     */
    var isNativeNode = function (thing) {
        // Can't use hasOwnProperty because of Firefox bug.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=934309
        return (typeof thing.context !== 'undefined');
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

    var tsw = {},
        nodes_to_disconnect = [];

    tsw.version = '0.0.1';
    tsw.processors = []; // Add ScriptProcessor nodes to global object to avoid garbage collection.
    tsw.isBrowserCompatible = false;

    var initialise = function () {
        tsw.noise_buffer = tsw.createBuffer();

        for (var i = 0; i < tsw.noise_buffer.length; i++) {
            tsw.noise_buffer.getChannelData(0)[i] = (Math.random() * 2) - 1;
        }
    };

    /*
     * Check if browser has Web Audio API.
     * Also, map older API methods to new ones.
     * @param {function} success Success method execute.
     * @param {function} failure Failure method execute.
     */
    var checkBrowserSupport = function (success, failure) {
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
        tsw.browserSupported = true;
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
        };

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
                connectObjectWithNodeToObjectWithNode(first_arg, second_arg);
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
     * Disconnects a node after a certain time.
     * @param {int} Time to disconnect node.
     */
    tsw.disconnectAfterTime = function (nodeToDisconnect, timeToDisconnect) {
        nodes_to_disconnect.push({node: nodeToDisconnect, time: timeToDisconnect});
    };

    /*
    * @param {array} files
    * @param {function} callback
    */
    tsw.load = function () {
        var returnObj = {},
            files = arguments[0],
            basePath = '',
            extensions = [],        
            files_loaded = 0,
            number_of_files = 0,
            callback,
            that = this;

        // Load a single file
        var loadFile = function (basePath, fileKey, filePath, returnObj, callback) {
            var request = new XMLHttpRequest();

            request.open('GET', basePath + filePath, true);
            request.responseType = 'arraybuffer';

            request.onload = function () {
                files_loaded++;

                that.context.decodeAudioData(request.response, function (decodedBuffer) {
                    returnObj[fileKey] = decodedBuffer;

                    if (files_loaded === number_of_files) {
                        callback(returnObj);
                    }
                });
            }, function (error) {
                console.log('Error decoding audio data', error);
            };

            request.send();
        };

        // Is 2nd argument a config object or the callback?
        if (typeof arguments[1] === 'object') {
            basePath = arguments[1].path || '';
            extensions = arguments[1].extensions || [];
        } else if (typeof arguments[1] === 'function') {
            callback = arguments[1];
        }

        // Is 3rd argument is the callback?
        if (typeof arguments[2] === 'function') {
            callback = arguments[2];
        }

        // 1st argument is files object
        if (typeof files === 'object') {
            for (var file in files) {
                number_of_files++;
                loadFile(basePath, file, files[file], returnObj, callback);
            }
        } else if (typeof files === 'string') {
            number_of_files = 1;
            loadFile(basePath, file, files[file], returnObj, callback);
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
        }

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
    tsw.createBuffer = function (no_channels, buffer_size, sample_rate) {
        no_channels = no_channels || 1;
        buffer_size = buffer_size || 65536;
        sample_rate = sample_rate || 44100;

        return this.context.createBuffer(no_channels, buffer_size, sample_rate);
    };
    
    /*
     * Create buffer source node.
     * @return BufferSource node.
     */
    tsw.createBufferSource = function (buff) {
        var source = this.context.createBufferSource();
        source.buffer = buff;

        if (typeof source.start === 'undefined') {
            source.start = source.noteOn;
            source.stop = source.noteOff;
        }
        
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
        applySettings(compressor, settings);

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
        var curve = new Float32Array(65536);

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

        settings = settings || {};

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
        envelope.param = settings.param || {};
        envelope.param.value = envelope.startLevel;

        // Should the release kick-in automatically
        settings.autoStop === undefined ? envelope.autoStop = true : envelope.autoStop = settings.autoStop;

        envelope.start = function (timeToStart) {
            // Calculate levels
            this.maxLevel = this.startLevel + this.maxLevel;
            this.sustainLevel = this.startLevel + this.sustainLevel;

            // Calculate times
            var startTime = timeToStart || tsw.now(),
                attackTime = startTime + this.attackTime,
                decayTime = attackTime + this.decayTime,
                releaseTime = decayTime + this.releaseTime;

            // Initialise
            this.param.cancelScheduledValues(startTime);
            this.param.setValueAtTime(this.startLevel, startTime);

            // Attack
            this.param.linearRampToValueAtTime(this.maxLevel, attackTime);

            // Decay
            this.param.linearRampToValueAtTime(this.startLevel + this.sustainLevel, decayTime);

            // Release
            if (this.autoStop) {
                this.param.linearRampToValueAtTime(this.minLevel, releaseTime);
                this.stop(releaseTime);
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
    tsw.createNoise = function () {
        var noise_node = this.createBufferSource(tsw.noise_buffer);
        noise_node.loop = true;

        return noise_node;
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
     * Time manager
     */
    var timeManager = function () {
        (function loop () {
            nodes_to_disconnect.forEach(function (nodeToDisconnect) {
                if (nodeToDisconnect.time < tsw.now()) {
                    tsw.disconnect(nodeToDisconnect.node);
                }
            });
            setTimeout(loop, 500);
        })();
    };

    /*
     * Kick everything off.
     */
    (function () {
        checkBrowserSupport(function () {
            // Browser is compatible.
            mapToSoundWorld();
            initialise();
            timeManager();
        }, function (error) {
            // Browser is not compatible.
            console.log(error);
        });
    })();

    return tsw;
})(window);

/**********************************
 * Theresas's Sound World - Effects
 * tsw-effects.js
 * Dependencies: tsw-core.js
 * Copyright 2013 Stuart Memo
 **********************************/

(function (window, undefined) {
    'use strict';

    var tsw = tsw || {};

    /*
     * Creates delay node.
     *
     * @method createDelay
     * @param {object} settings Delay settings.
     * @return {AudioNode} Created delay node.
     */
    tsw.createDelay = function (settings) {

        /*
         *  Delay effect
         *  ============
         *  +-------+         +----------+     +----------+
         *  | Input |---->----|   Delay  |-->--| Feedback |
         *  | (Osc) |         |  (Delay) |     |  (Gain)  |
         *  +-------+         +----------+     +----------+
         *      |                |   |              |
         *      v                v   +-----<--------+
         *      |                |   
         *   +---------------+   +--------------+        
         *   |     Output    |<--| Effect Level |
         *   | (Destination) |   |    (Gain)    |
         *   +---------------+   +--------------+
         *
         *  Config
         *  ------
         *  Delay Time: Number of seconds to delay signal
         *  Feedback: Volume of signal fed back into delay node
         *  Effect Level: Volume of effect mixed back into signal
         */

        var effect = {},
            delay = tsw.context.createDelay(),
            feedback = tsw.context.createGain(),
            effectLevel = tsw.context.createGain(),
            gain = tsw.createGain();

        effect.input = tsw.createGain();
        effect.output = tsw.createGain();
        effect.settings = {
            delayTime: 0.5,
            feedback: 0.5,
            effectLevel: 0.5,
        };

        // Set values
        settings = settings || {};
        delay.delayTime.value =  settings.delayTime || effect.settings.delayTime;
        feedback.gain.value = settings.feedback || effect.settings.feedback;
        effectLevel.gain.value = settings.effectLevel || effect.settings.effectLevel;

        tsw.connect(effect.input, gain, delay, feedback, delay, effectLevel, effect.output);
        tsw.connect(gain, delay);

        return effect;
    };

    /*
     * Creates a distortion node.
     *
     * @method createDistortion
     * @param {object} settings Distortion settings.
     * @return Created distortion node.
     */
    tsw.createDistortion = function (settings) {

        /*
         *  Distortion
         *  ==========
         *  +----------+     +--------------+
         *  |  Input   |-->--|  Distortion  |
         *  | (Source) |     | (WaveShaper) |
         *  +----------+     +--------------+
         *                    |        | 
         *   +-----------------+   +-------------------+
         *   | Low-pass Filter |   |  High-pass Filter |
         *   |  (BiquadFilter) |   |   (BiquadFilter)  |
         *   +-----------------+   +-------------------+
         *                  |         |
         *               +---------------+
         *               |     Output    |
         *               | (Destination) |
         *               +---------------+
         *
         */

        var effect = {},
            distortion = tsw.context.createWaveShaper(),
            lowpass = tsw.context.createBiquadFilter(),
            highpass = tsw.context.createBiquadFilter();

        effect.settings = {
            distortionLevel: 0.5
        };

        // Set values
        settings = settings || {};

        effect.input = tsw.createGain();
        effect.output = tsw.createGain();

        tsw.connect(effect.input, distortion, [lowpass, highpass], effect.output);

        return effect;
    };

    /*
     * Creates flange effect. Y'know, like in Come As You Are.
     *
     * @method createFlanger
     * @param {object} settings Flanger settings.
     * @return
     */
    tsw.createFlanger = function (settings) {

        /*
         *  Flanger 
         *  =======
         *  +----------+
         *  |  Input   |
         *  | (Source) |
         *  +----------+
         *
         */

        var effect = {};

        return effect;
    };
    
    /*
     * Creates a phaser node.
     *
     * @method createPhaser
     * @param {object} settings Phaser settings
     * @return {AudioNode} Created phaser node.
     */
    tsw.createPhaser = function (settings) {

        /****************************
        Phaser
        ======
        +----------+     +-----------------+               +-----------------+
        |  Input   |-->--| All-pass Filter |-->--(..n)-->--| All-pass Filter |
        | (Source) |     | (BiquadFilter)  |               |  (BiquadFilter) |
        +----------+     +-----------------+               +-----------------+
              |                |      |                           |
              v                v      Ê                           v 
        +---------------+      |      |                     +----------+
        |     Output    |---<--+      +----------<----------| Feedback |
        | (Destination) |                                   |  (Gain)  |
        +---------------+                                   +----------+

        Config
        ------
        Rate: The speed at which the filter changes
        Depth: The depth of the filter change
        Resonance: Strength of the filter effect
        *****************************/

        var effect = {},
            allPassFilters = [],
            feedback = tsw.createGain(),
            defaults  = {
                rate: 8,
                depth: 0.5,
                feedback: 0.8
            };

        // Set values
        settings = settings || {};

        feedback.gain.value = settings.gain || defaults.gain;

        for (var i = 0; i < config.rate; i++) {
            allPassFilters[i] = tsw.context.createBiquadFilter();
            allPassFilters[i].type = 7;
            allPassFilters[i].frequency.value = 100 * i;
        }

        effect.input = tsw.createGain();
        effect.output = tsw.createGain();

        for (var i = 0; i < allPassFilters.length - 1; i++) {
            tsw.connect(allPassFilters[i], allPassFilters[i + 1]);
        }

        tsw.connect(effect.input, allPassFilters[0], allPassFilters[allPassFilters.length - 1], feedback, allPassFilters[0]);
        tsw.connect(allPassFilters[allPassFilters.length - 1], effect.output);

        effect.setCutoff = function (c) {
            for (var i = 0; i < allPassFilters.length; i++) {
                // allPassFilters[i].frequency.value = c;
            }
        };

        return effect;
    };

    /*
     * Create a reverb node.
     *
     * @method createReverb
     * @param {object} settings Reverb settings.
     * @return {AudioNode} The created reverb node.
     */
    tsw.createReverb = function (settings) {

        /***********************************

        Reverb
        ======
        +----------+         +-------------+
        |  Input   |---->----|   Reverb    |
        | (Source) |         | (Convolver) |
        +----------+         +-------------+
             |                      |
             v                      v
             |                      |
        +---------------+   +--------------+
        |     Output    |<--| Effect Level |
        | (Destination) |   |    (Gain)    |
        +---------------+   +--------------+

        Config
        ------
        Effect Level - Volume of effect
        Reverb Time - 
        Reverb Type - 
        Reverb Path - Path of impulse response file    

        ***********************************/

        var reverb = tsw.context.createConvolver(),
            effectLevel = tsw.createGain(),
            effectObj = {},
            defaults = {
                effectLevel: 0.5,
                reverbTime: 0.5,
                reverbType: 'spring',
                reverbPath: ''
            };

        // Set values
        settings = settings || {};
        effectLevel.gain.value = settings.effectLevel || defaults.effectLevel;

        tsw.load({
            'hall': '/effects/reverb/responses/bright-hall.wav',
            'room': '/effects/reverb/responses/medium-room.wav',
            'spring': '/effects/reverb/responses/feedback-spring.wav'
        }, function (buffers) {
            defaults.reverbPath = buffers[defaults.reverbType];
            reverb.buffer = defaults.reverbPath;

            effectObj.input = tsw.createGain();
            effectObj.output = tsw.createGain();

            tsw.connect(effectObj.input, [effectObj.output, reverb]);
            tsw.connect(reverb, effectLevel);
            tsw.connect(effectLevel, effectObj.output);

        });
        return effectObj;
    };

    /*
     * Creates tremolo node.
     *
     * @param {object} settings Tremolo settings.
     * @return {AudioNode} Created tremolo node.
     */
    tsw.createTremolo = function (settings) {

        /******************************
        
        Tremolo
        =======
        +---------+     +-------------+
        |   LFO   |-->--|   Any Node  |
        |         |     | (Amplitude) |
        +---------+     +-------------+

        ******************************/

        var mmNode = {},
            config = {},
            tremolo = tsw.createGain(),
            lfo = this.createLFO(),
            that = this;

        settings = settings || {};

        mmNode.input = tsw.createGain();

        mmNode.connect = function (output) {
            mmNode.input.connect(output);
            lfo.modulate(mmNode.input.gain);
            lfo.start(that.now());
        };

        mmNode.setRate = function (r) {
            lfo.setFrequency(r);
        };

        mmNode.setDepth = function (r) {
            lfo.setDepth(r);
        };

        return mmNode;
    };

})(window);

/*********************************
 * Theresas's Sound World - Music
 * tsw-music.js
 * Dependencies: tsw-core.js
 * Copyright 2013 Stuart Memo
 ********************************/

(function (window, undefined) {
    'use strict';

    var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    // append list of notes to itself to avoid worrying about writing wraparound code
    notes.push.apply(notes, notes);

    var intervals = ['unison', 'flat 2nd', '2nd', 'minor 3rd', 'major 3rd', 'perfect 4th',
                    'flat 5th', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th',
                    'major 7th', 'octave', 'flat 9th', '9th', 'sharp 9th', 'major 10th',
                    '11th', 'augmented 11th', 'perfect 12th', 'flat 13th', '13th'];

    /*
     * Get position of note in note array.
     *
     * @method getNotePosition
     * @param {string} note Note to get position of.
     * @return {number} Position of note in note array.
     */
    var getNotePosition = function (note) {
        var notesLength = notes.length,
            position_on_scale;

        // don't use forEach as we're breaking early
        for (var i = 0; i < notesLength; i++) {
            if (note.toUpperCase() === notes[i]) {
                position_on_scale = i;
                return i;
            }
        }

        return null;
    };

    /*
     * Returns major scale of given root note
     * 
     * @method getMajorScale
     * @param {string} rootNote Root note of the scale
     * @return {array} List of notes in scale
     */
    var getMajorScale = function (rootNote) {
        var scale = [],
            positionOnScale = getNotePosition(rootNote);
        
        scale.push(notes[positionOnScale]);
        scale.push(notes[positionOnScale + 2]);
        scale.push(notes[positionOnScale + 4]);
        scale.push(notes[positionOnScale + 5]);
        scale.push(notes[positionOnScale + 7]);
        scale.push(notes[positionOnScale + 9]);
        scale.push(notes[positionOnScale + 11]);
        scale.push(notes[positionOnScale + 12]);

        return scale;
    };

    /*
     * Returns minor scale of given root note
     * 
     * @method getMinorScale
     * @param {string} rootNote Root note of the scale
     * @return {array} List of notes in scale
     */
    var getMinorScale = function (rootNote) {
        var scale = [],
            positionOnScale = getNotePosition(rootNote);
        
        scale.push(notes[positionOnScale]);
        scale.push(notes[positionOnScale + 2]);
        scale.push(notes[positionOnScale + 3]);
        scale.push(notes[positionOnScale + 5]);
        scale.push(notes[positionOnScale + 7]);
        scale.push(notes[positionOnScale + 8]);
        scale.push(notes[positionOnScale + 10]);
        scale.push(notes[positionOnScale + 12]);

        return scale;
    };

    /*
     * Parses a chord name into a detailed object.
     *
     * @method parseChord 
     * @param {string} chord Name of chord to turn into object.
     * return {object} Detailed chord object.
     */
    tsw.parseChord = function (chord) {
        var chordObj = {},
            notePositions = [],
            rootNotePosition = 0;

        if (Array.isArray(chord)) {
            return false;
        }

        chord = chord.toLowerCase();

        chordObj.rootNote = chord[0].toUpperCase();
        chordObj.isMajor = (chord.indexOf('maj') > -1);
        chordObj.isMinor = !chordObj.isMajor && (chord.indexOf('m') > -1);
        chordObj.is7th = (chord.indexOf('7') > -1);
        chordObj.notes = [];

        if (!chordObj.is7th) {
            chordObj.octave = chord.match(/\d/g);
        }

        if (!chordObj.isMajor && !chordObj.isMinor) {
            // Hey! This aint no chord that I've ever seen!
            return false;
        }

        rootNotePosition = getNotePosition(chordObj.rootNote);
        notePositions.push(rootNotePosition);

        if (chord.isMinor) {
            notePositions.push(rootNotePosition + tsw.getSemitoneDifference('minor 3rd'));
        } else {
            notePositions.push(rootNotePosition + tsw.getSemitoneDifference('major 3rd'));
        }

        notePositions.push(rootNotePosition + tsw.getSemitoneDifference('perfect 5th'));
        notePositions.push(rootNotePosition + tsw.getSemitoneDifference('octave'));

        notePositions.forEach(function (position) {
            chordObj.notes.push(notes[position]);
        });

        return chordObj.notes;
    };

    /*
     * Returns a list of notes in a given scale.
     * 
     * @method getScale
     * @param {string} rootNote Root note to base scale on.
     * @param {string} scaleType Type of scale to return.
     * @return {array} List of notes in scale.
     */
    tsw.getScale = function (rootNote, scaleType) {
        if (scaleType === 'minor') {
            return getMinorScale(rootNote);
        } else {
            return getMajorScale(rootNote);
        }
    };

    /*
     * Returns the number of semitones an interval is from a base note.
     *
     * @method getSemitoneDifference
     * @param {string} interval The name of the interval
     * @return {number} Number of semitones of interval from a base note.
     */
    tsw.getSemitoneDifference = function (interval) {
        var numberOfIntervals = intervals.length;

        for (var i = 0; i < numberOfIntervals; i++) {
            if (interval === intervals[i]) {
                return i;
            }
        }
    };

    tsw.isChord = function (str) {
        return this.parseChord(str);
    };

    /*
     * Returns a list of notes in a given chord.
     *
     * @method chordToNotes
     * @param {string} chord Name of chord to turn into string.
     * @return {array} List of notes in chord.
     */
    tsw.chordToNotes = function (chord) {
        chord = this.parseChord(chord);

        return chord.notes;
    };

    /*
     * Calculates the frequency of a given note
     *
     * @method noteToFrequency
     * @param {string} note Note to convert to frequency
     * @return {number} Frequency of note
     */
    tsw.noteToFrequency = function (note) {
        var octave,
            keyNumber;

        if (note.length === 3) {
            octave = note.charAt(2);
        } else {
            octave = note.charAt(1);
        }
     
        keyNumber = notes.indexOf(note.slice(0, -1));
     
        if (keyNumber < 3) {
            keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1;
        } else {
            keyNumber = keyNumber + ((octave - 1) * 12) + 1;
        }
     
        // Return frequency of note
        return Math.round(440 * Math.pow(2, (keyNumber- 49) / 12));
    };

 })(window);

/*******************************
 * Theresas's Sound World - MIDI
 * tsw-midi.js
 * Dependencies: tsw-core.js
 * Copyright 2013 Stuart Memo
 *******************************/

 (function (window, undefined) {
    'use strict';

   var MIDI = (function () {
        /*
         * Creates an instance of MIDI
         *
         * @param {AudioContext} Current audio context
         */
        var MIDI = function (context) {
            this.context = context;
        };

        /*
         * Initiate MIDI input/output if available.
         *
         * @method startMIDI
         * @param {function} success
         * @param {function} failure
         */
        MIDI.prototype.getUserMIDI = function (success, failure) {
            navigator.requestMIDIAccess().then(success, failure);
        };

        MIDI.prototype.MIDINumberToNote = function (number) {
            var noteOnScale = number % 12,
                octave = Math.floor(number / 12),
                notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

            return notes[noteOnScale] + octave;
        };

        return MIDI;
    })();

    window.tsw.midi = new MIDI();
})(window);