/*****************************
 * Theresa's Sound World
 * tsw.js
 * An audio library.
 * Copyright 2014 Stuart Memo
 *****************************/

(function (window, undefined) {
    'use strict';

    var tsw,
        version = '1.0.0';

    tsw = (function () {

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
         * Is an argument an array?
         * @param thing Argument to check if it's an array.
         */
         var isArray = function (thing) {
            return Array.isArray(thing);
         };

        /*
         * Is an argument a function?
         * @param thing Argument to check if it's a function.
         */
         var isFunction = function (thing) {
            return typeof thing === 'function';
         };

        /*
         * Is an argument an object?
         * @param thing Argument to check if it's an object.
         */
        var isObject = function (thing) {
            return typeof thing === 'object';
        };

        /*
         * Is an argument a string?
         * @param thing Argument to check if it's an string.
         */
        var isString = function (thing) {
            return typeof thing === 'string';
        };

        /*
         * Is an argument defined?
         * @param thing Argument to check if it's defined.
         */
        var isDefined = function (thing) {
            return typeof thing !== 'undefined';
        };

        /*
         * Is an argument an object with an audio node?
         * @param thing Argument to check if it's an object with an audio node.
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
         * Is an argument a native node?
         * @parm thing Argument to check if it's a native node wat.
         */
        var isNativeNode = function (thing) {
            return typeof thing.context !== 'undefined';
        };

        /*
         * Is an argument a tsw node?
         * @parm thing Argument to check if it's a tsw node.
         */
        var isTswNode = function (thing) {
            return (thing.hasOwnProperty('input') || thing.hasOwnProperty('output'));
        };

        /*
         * Is property of an object an audio parameter?
         * @param thing Argument to check if is an audio paramter.
         */
        var isAudioParam = function (thing) {
            if (isObject(thing)) {
                return ('setValueAtTime' in thing);
            } else {
                return false;
            }
        };

        /*
         * Enable jQuery style getters & setters.
         * @param paramToGetSet
         */

        var createGetSetter = function (node, arrayOfParams) {
            var that = this;

            arrayOfParams.forEach(function (param, index) {
                node[param] = function (val, targetTime, transition) {

                    if (typeof val === 'undefined') {
                        if (that[param].hasOwnProperty('value')) {
                            return that[param].value;
                        } else {
                            return that[param];
                        }
                    } else {
                        if (that[param].hasOwnProperty('value')) {
                            if (isDefined(targetTime)) {
                                // Set current value first so we have a schedule.
                                transition = transition || 0;
                                that[param].setTargetAtTime(that[param].value, tsw.now(), transition);
                                that[param].setTargetAtTime(val, targetTime, transition);
                            }
                            that[param].value = val;
                        } else {
                            that[param] = val;
                        }
                    }
                }
            });
        };

        /***************
         * Sound World *
         **************/

        var tsw = {},
            nodes_to_disconnect = [];

        tsw.version = version;
        tsw.isBrowserSupported = false;
        tsw.processors = []; // Add ScriptProcessor nodes to global object to avoid garbage collection.

        var initialise = function () {
            tsw.noise_buffer = tsw.buffer();

            for (var i = 0; i < tsw.noise_buffer.buffer().length; i++) {
                tsw.noise_buffer.buffer().getChannelData(0)[i] = (Math.random() * 2) - 1;
            }
            tsw.noise_buffer
        };

        /*
         * Check if browser has Web Audio API.
         * Also, map older API methods to new ones.
         * @param {function} success Success method execute.
         * @param {function} failure Failure method execute.
         */
        var checkBrowserSupport = function (success, failure) {
            var context;
            // Check if the Web Audio API is supported.
            if (typeof webkitAudioContext === 'undefined' && typeof AudioContext === 'undefined') {
                if (typeof webkitAudiocontext().prototype.createGainNode === 'undefined') {
                    failure('Sorry, your browser doesn\'t support a recent enough version of the Web Audio API.');
                } else {
                    // Using older version of API.
                    var ctx = webkitAudiocontext().prototype;

                    ctx.createGain  = ctx.createGainNode;
                    ctx.createDelay  = ctx.createDelayNode;
                    ctx.createScriptProcessor = ctx.createJavaScriptNode;
                }
            } else {
                if (typeof AudioContext === 'function') {
                    context = new AudioContext();
                    tsw.context = function () {
                        return context;
                    };
                } else {
                    context = new webkitAudioContext();
                    tsw.context = function () {
                        return context;
                    };
                }
            }

            // All is good, continue;
            tsw.isBrowserSupported = true;
            success();
        };

        /*
         * Map WAAPI methods to tsw.
         */
        var mapToSoundWorld = function () {
            tsw.speakers = tsw.context().destination;
        };

        /*
         * Fade in an audio source.
         * @param thingToFadeOut Audio source to fade out.
         */
        var fadeIn = function (thingToFadeIn) {
            thingToFadeIn.output.gain.cancelScheduledValues(tsw.now());
            thingToFadeIn.output.gain.setValueAtTime(0, tsw.now());
            thingToFadeIn.output.gain.linearRampToValueAtTime(1, tsw.now() + 2);
        };

        /*
         * Fade out an audio source.
         * @param thingToFadeOut Audio source to fade out.
         */
        var fadeOut = function (thingToFadeOut) {
            thingToFadeOut.output.gain.cancelScheduledValues(tsw.now());
            thingToFadeOut.output.gain.setValueAtTime(1, tsw.now());
            thingToFadeOut.output.gain.linearRampToValueAtTime(0, tsw.now() + 2);
        };

        /*
         * Get the current time of the audio context().
         * @return {number} Time since audio began (in seconds).
         */
        tsw.now = function () {
            return this.context().currentTime;
        };

        tsw.createChannelMerger = function (channels) {
            return tsw.context().createChannelMerger(channels);
        };

        /*
         * Connects multiple nodes together.
         * @param {AudioNodes} arguments Nodes to connect in order.
         */
        tsw.connect = function () {

            var updateConnectedToArray = function (node1, node2) {
                node1.connectedTo.push(node2);
                node2.connectedTo.push(node1);
            };

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
                    tsw.connect(arguments[0][j], arguments[1]);
                }
            };

            var connectArrayToArray = function () {
                for (var j = 0; j < arguments[0].length; j++) {
                    tsw.connect(arguments[0][j], arguments[1]);
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
                    connectTswNodeToTswNode(first_arg, second_arg);
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

                    that.context().decodeAudioData(request.response, function (decodedBuffer) {
                        returnObj[fileKey] = decodedBuffer;

                        if (Object.keys(returnObj).length === number_of_files) {
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
                number_of_files = Object.keys(files).length;
                for (var file in files) {
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
            var node,
                delayNode = this.context().createDelay();

            delayTime = delayTime || 1;

            node = tsw.createNode({
                nodeType: 'delay'
            });

            createGetSetter.call(delayNode, node, ['delayTime']);

            node.delayTime(delayTime);

            tsw.connect(node.input, delayNode, node.output);

            return node;
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
         * Update old WAA methods to more recent names.
         *
         * @param {object} Additional options.
         */
        var updateMethods = function (options) {
            this.start = function (timeToStart) {
                if (options.sourceNode.hasOwnProperty('start')) {
                    options.sourceNode.start(timeToStart);  
                } else {
                    options.sourceNode.noteOn(timeToStart);
                }

                return this;
            }

            this.stop = function (timeToStop) {
                if (options.sourceNode.hasOwnProperty('stop')) {
                    options.sourceNode.stop(timeToStop);  
                } else {
                    options.sourceNode.noteOff(timeToStop);
                }

                return this;
            }
        };

        tsw.createNode = function (options) {
            var node = {};

            options = options || {};

            node.input = tsw.context().createGain();
            node.output = tsw.context().createGain();

            node.nodeType = function () {
                return options.nodeType || 'default';
            };

            // Keep a list of nodes this node is connected to.
            node.connectedTo = [];

            if (options.hasOwnProperty('sourceNode')) {
                updateMethods.call(node, options);
            } else {
                options.sourceNode = false;
            }

            return node;
        };

        /*
         * Create oscillator node.
         * @param {string} waveType The type of wave form.
         * @param {number} frequency The starting frequency of the oscillator.
         * @return Oscillator node of specified type.
         */
        tsw.oscillator = function (waveType, frequency) {
            var node,
                osc = tsw.context().createOscillator();

            node = tsw.createNode({
                sourceNode: osc,
                nodeType: 'oscillator'
            });

            createGetSetter.call(osc, node, ['type', 'frequency', 'waveType']);
            node.type(waveType || 'sine');
            node.frequency(frequency || 440);

            node.waveType = waveType || 'sine';

            node.nodeType = function () {
                return 'oscillator';
            };

            node.fadeIn = function () {
                fadeIn(this);
                return this;
            };

            node.fadeOut = function () {
                fadeOut(this);
                return this;
            };

            /*
            node.type = function (wt) {
                if (typeof wt === 'undefined') {
                    return osc.type;
                } else {
                    osc.type = wt.toLowerCase();
                }
            };
            */

            node.type(node.waveType.toLowerCase());

            node.isPlaying = function () {
                if (osc.playbackState === 2) {
                    return true;
                } else {
                    return false;
                }
            };

            node.returnNode = function () {
                return osc;
            }

            tsw.connect(osc, node.output);

            return node;
        };

        /*
         * Create gain node.
         * @return Gain node.
         */
        tsw.gain = function (volume) {
            var node,
                gainNode;

            if (typeof this.context().createGain === 'function') {
                gainNode = this.context().createGain();
            } else {
                gainNode = this.context().createGainNode();
            }

            node = tsw.createNode({
                nodeType: 'gain'
            });

            createGetSetter.call(gainNode, node, ['gain']);

            if (isObject(volume)) {
                if (volume.hasOwnProperty('gain')) {
                    volume = volume.gain.value;                
                }
            }

            if (volume <= 0) {
                volume = 0;
            }

            if (typeof volume === 'undefined') {
                volume = 1; 
            }

            node.gain(volume);

            tsw.connect(node.input, gainNode, node.output);

            return node;
        };

        /*
         * Create buffer node.
         * @return Buffer node.
         */
        tsw.buffer = function (no_channels, buffer_size, sample_rate) {
            var node = tsw.createNode({
                nodeType: 'buffer'
            });

            no_channels = no_channels || 1;
            buffer_size = buffer_size || 65536;
            sample_rate = sample_rate || 44100;

            var buffer = this.context().createBuffer(no_channels, buffer_size, sample_rate);

            createGetSetter.call(buffer, node, ['numberOfChannels', 'bufferSize', 'sampleRate']);

            node.data = function (val) {
                if (typeof val === 'undefined') {
                    var channel_data = [];      

                    for (var i = 0; i < no_channels; i++) {
                        channel_data.push(buffer.getChannelData(i));
                    }

                    return channel_data;
                }
            }

            node.buffer = function () {
                return buffer;
            };            

            return node;
        };
        
        /*
         * Create buffer source node.
         * @return BufferSource node.
         */
        tsw.createBufferSource = function (buff) {
            var source = this.context().createBufferSource();

            source.buffer = buff.buffer();

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
        tsw.filter = function () {
            var node = tsw.createNode({
                    nodeType: 'filter'        
                }),
                options = {},
                filter = tsw.context().createBiquadFilter();

            if (isObject(arguments[0])) {
                options.type = arguments[0].type || 'lowpass';
                options.frequency = arguments[0].frequency || 1000;
                options.Q = arguments[0].Q || 0;
            } else if (isString(arguments[0])) {
                options.type = arguments[0]; 
            }

            options.type = options.type || 'lowpass';
            options.Q = options.Q || 0;

            createGetSetter.call(filter, node, ['type', 'frequency', 'Q']);

            node.type(options.type);
            node.frequency(options.frequency || 1000);
            node.Q(options.Q || 0);

            tsw.connect(node.input, filter, node.output);

            return node;
        };

        /*
         * Create analyser node.
         *
         * @method createAnalyser
         * @return Analyser node.
         */
        tsw.analyser = function () {
            return this.context().createAnalyser();
        };

        /*
         * Creates compressor node.
         * @param {object} settings Compressor settings.
         * @return Created compressor node.
         */
        tsw.compressor = function (settings) {
            /*
             *  Compressor 
             *  ==========
             *  +----------+     +----------------------+     +---------------+
             *  |  Input   |-->--|       Compressor     |-->--|     Output    |
             *  | (Source) |     | (DynamicsCompressor) |     | (Destination) |
             *  +----------+     +----------------------+     +---------------+
             */
            var node = tsw.createNode({nodeType: 'compressor'}),
                compressor = this.context().createDynamicsCompressor(),
                defaults = {
                    threshold: -24,     // dbs (min: -100, max: 0)
                    knee: 30,           // dbs (min: 0, max: 40)
                    ratio: 12,          // ratio (min: 1, max: 20)
                    attack: 0.003,      // seconds (min: 0, max: 1)
                    release: 0.25       // seconds (min: 0, max: 1)
                };

            settings = applyObject(defaults, settings);
            applySettings(compressor, settings);

            return node;
        };

        /*
         * Create processor node.
         * @return Script Processor node.
         */
        tsw.processor = function (bs, callback) {
            var bufferSize = bs || 1024,
                processor =  tsw.context().createScriptProcessor(bufferSize, 1, 1);

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
        tsw.waveShaper = function () {
            var curve = new Float32Array(65536);

            for (var i = 0; i < 65536 / 2; i++) {
                if (i < 30000) {
                    curve[i] = 0.1;
                } else {
                    curve[i] = -1;
                }
            }

            var waveShaper = this.context().createWaveShaper();
            waveShaper.curve = curve;

            return waveShaper;
        };

        /*
         * Create envelope.
         * @param {object} envelopeParams Envelope parameters.
         * @return Envelope filter.
         */
        tsw.envelope = function (settings) {
            var envelope = {};

            settings = settings || {};

            // Initial levels
            envelope.name = settings.name|| '';
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
                // Calculate times
                var startTime = timeToStart || tsw.now(),
                    attackTime = startTime + this.attackTime,
                    decayTime = attackTime + this.decayTime,
                    releaseTime = decayTime + this.releaseTime;

                // Calculate levels
                this.maxLevel = this.startLevel + this.maxLevel;
                this.sustainLevel = this.startLevel + this.sustainLevel;

                // Param is actual AudioParam
                if ('setValueAtTime' in this.param) {
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
                }
            };

            envelope.stop = function (timeToStop) {
                timeToStop = timeToStop || tsw.now();
                timeToStop += this.releaseTime;

                // Release
                if (!this.autoStop && isAudioParam(this.param)) {
                    this.param.linearRampToValueAtTime(this.minLevel, timeToStop);
                }
            };

            return envelope;
        };

        /*
         * Create noise.
         * @param {string} colour Type of noise.
         * @return Noise generating node.
         */
        tsw.noise = function (colour) {
            var node,
                noise_source = this.createBufferSource(tsw.noise_buffer);

            node = tsw.createNode({
                nodeType: 'noise',
                sourceNode: noise_source
            });

            noise_source.buffer = tsw.noise_buffer.buffer();

            node.color = colour || 'white';
            noise_source.loop = true;

            noise_source.nodeType = function () {
                return 'noise';
            }

            noise_source.color = function (val) {
                if (typeof val === 'undefined') {
                    return node.color; 
                } else {
                    if (typeof val === 'string') {
                        node.color = val;
                    }
                }
            };

            noise_source.play = function (timeToStart) {
                noise_source.start(timeToStart);
            };

            return noise_source;
        };

        /*
         * Create LFO.
         * @param {object} settings LFO settings.
         */
        tsw.lfo = function (settings) {

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

            lfo.frequency = function (f) {
                if (typeof f === 'undefined') {
                    return lfo.frequency.value; 
                } else {
                    lfo.frequency.value = f;
                }
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
                var streamNode = tsw.context().createMediaStreamSource(stream);

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
        tsw.init = function () {
            checkBrowserSupport(function () {
                // Browser is compatible.
                mapToSoundWorld();
                initialise();
                timeManager();
            }, function (error) {
                // Browser is not compatible.
                console.log(error);
            });
        };

        return (window.tsw = tsw) ;
    })();

    tsw.init();

})(window);
