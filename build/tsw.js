/****************************************************
 * Theresa's Sound World
 * tsw.js
 * An audio library.
 * http://theresassoundworld.com/
 * https://github.com/stuartmemo/theresas-sound-world 
 * Copyright 2014 Stuart Memo
 ****************************************************/


(function (window, undefined) {
    'use strict';

    var tsw,
        version = '0.1.0';

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
         * @param thing Argument to check if it's a string.
         */
        var isString = function (thing) {
            return typeof thing === 'string';
        };

        /*
         * Is an argument a number?
         * @param thing Argument to check if it's a number.
         */
        var isNumber = function (thing) {
            return typeof thing === 'number';
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

            arrayOfParams.forEach(function (param) {
                node[param] = function (val, targetTime, transition) {

                    if (typeof val === 'undefined') {
                        if (typeof that[param].value === 'undefined') {
                            return that[param];
                        } else {
                            return that[param].value;
                        }
                    } else {
                        if (typeof that[param].value !== 'undefined') {
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
                };
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
        tsw.fadeIn = function (thingToFadeIn) {
            thingToFadeIn.output.gain.cancelScheduledValues(tsw.now());
            thingToFadeIn.output.gain.setValueAtTime(0, tsw.now());
            thingToFadeIn.output.gain.exponentialRampToValueAtTime(1, tsw.now() + 2);
        };

        /*
         * Fade out an audio source.
         * @param thingToFadeOut Audio source to fade out.
         */
        tsw.fadeOut = function (thingToFadeOut) {
            thingToFadeOut.output.gain.cancelScheduledValues(tsw.now());
            thingToFadeOut.output.gain.setValueAtTime(1, tsw.now());
            thingToFadeOut.output.gain.exponentialRampToValueAtTime(0.000001, tsw.now() + 2);
            thingToFadeOut.output.gain.setValueAtTime(0, tsw.now() + 2.0001);
        };

        /*
         * Get the current time of the audio context().
         * @return {number} Time since audio began (in seconds).
         */
        tsw.now = function () {
            return this.context().currentTime;
        };

        tsw.channelMerger = function (channels) {
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

                // First argument is a native node, second is a tsw node.
                if (isNativeNode(first_arg) && isTswNode(second_arg)) {
                    connectNativeNodeToTswNode(first_arg, second_arg);
                    continue;
                }

                // First argument is a tsw node, second is a native node.
                if (isTswNode(first_arg) && isNativeNode(second_arg)) {
                    connectTswNodeToNativeNode(first_arg, second_arg);
                    continue;
                }

                // First arggument is native node, second is an array.
                if (isNativeNode(first_arg) && isArray(second_arg)) {
                    connectNativeNodeToArray(first_arg, second_arg);
                    continue;
                }

                // First argument is an array, second is a native node.
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

                // First argument is a tsw node, second is an array.
                if (isTswNode(first_arg) && isArray(second_arg)) {
                    connectTswNodeToArray(first_arg, second_arg);
                    continue;
                }

                // First argument is array, second is a tsw node.
                if (isArray(first_arg) && isTswNode(second_arg)) {
                    connectArrayToTswNode(first_arg, second_arg);
                    continue;
                }

                // Both arguments are arrays.
                if (isArray(first_arg) && isArray(second_arg)) {
                    connectArrayToArray(first_arg, second_arg);
                    continue;
                }

                // First argument is an object containing nodes, second is an array.
                if (isObjectWithNode(first_arg) && isArray(second_arg)) {
                    connectObjectWithNodeToArray(first_arg, second_arg);
                    continue;
                }

                // First argument is an array, second is an object containing nodes.
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
         * @param {AudioNode} node First audio node
         * @param {AudioNode} node Second audio node
         * @param {AudioNode} node Third....etc.
         */
        tsw.disconnect = function () {
            var argumentsLength = arguments.length;

            for (var i = 0; i < argumentsLength; i++) {
                if (arguments[i].hasOwnProperty('disconnect')) {
                    arguments[i].disconnect();
                }
                if (arguments[i].hasOwnProperty('input')) {
                    tsw.disconnect(arguments[i].input);
                }
                if (arguments[i].hasOwnProperty('ouput')) {
                    tsw.disconnect(arguments[i].output);
                }
            }
        };

        /*
         * Disconnects a node after a certain time.
         * @param {number} Time to disconnect node in seconds.
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
                files = arguments[0].files,
                basePath = arguments[0].path || '',
                extensions = [],
                files_loaded = 0,
                files_failed= 0,
                number_of_files = 0,
                successCallback,
                failCallback,
                that = this;

            // Load a single file
            var loadFile = function (basePath, fileKey, filePath, returnObj, successCallback, failCallback) {
                var request = new XMLHttpRequest();

                request.open('GET', basePath + filePath, true);
                request.responseType = 'arraybuffer';

                var success = function () {
                    files_loaded++;

                    that.context().decodeAudioData(request.response, function (decodedBuffer) {
                        returnObj[fileKey] = decodedBuffer;

                        if (Object.keys(returnObj).length === number_of_files) {
                            successCallback(returnObj);
                        }
                    });
                };

                var fail = function () {
                    files_failed++;

                    if (isFunction(failCallback)) {
                        failCallback();
                    } else {
                        console.log('There was an error loading your file(s)', request.status);
                    }
                };

                request.onreadystatechange = function () {
                    if (request.readyState === 4) {
                        request.status === 200 ? success() : fail();
                    }
                };

                request.send();
            };

            // Is 2nd argument a config object or the callback?
            if (typeof arguments[1] === 'object') {
                basePath = arguments[1].path || '';
                extensions = arguments[1].extensions || [];
            } else if (typeof arguments[1] === 'function') {
                successCallback = arguments[1];
            }

            // Is 3rd argument is the failure callback?
            if (typeof arguments[2] === 'function') {
                failCallback = arguments[2];
            }

            // 1st argument is files object
            if (typeof files === 'object') {
                number_of_files = Object.keys(files).length;
                for (var file in files) {
                    loadFile(basePath, file, files[file], returnObj, successCallback, failCallback);
                }
            } else if (typeof files === 'string') {
                number_of_files = 1;
                /** THIS WONT WORK - NO FILE AT THIS POINT **/
                loadFile(basePath, file, files[file], returnObj, successCallback);
            } else {
                throw new Error('Files must be an array or a valid string.');
            }
        };

        /*
         * Create a wait/delay node.
         * @param {number} delayTime Time to delay input in seconds.
         * @return {node} delay node.
         */
        tsw.wait = function (delayTime) {
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
        tsw.panner = function (pan) {
            var panner = {},
                left_gain = tsw.createGain(1),
                right_gain = tsw.createGain(0),
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
        tsw.play = function (buffers, when) {
            when = when || 0;

            if (isArray(buffers)) {
                buffers.forEach(function (buffer) {
                    buffer.start(when);
                });
            } else {
                buffers.start(when);
            }
        };

        /*
         * Stop buffer if it's currently playing.
         * @param {AudioBuffer} buffer
         * @param {number} when Time to stop in seconds.
         */
        tsw.stop = function (buffer, when) {
            when = when || 0;
            buffer.stop(when);
        };

        /*
         * Reverse a buffer
         * @param {AudioBuffer} buffer
         * @return {node} Return node containing reversed buffer.
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
            this.start = function (time_to_start) {
                if (typeof options.sourceNode.start === 'undefined') {
                    options.sourceNode.noteOn(time_to_start || tsw.now());
                } else {
                    options.sourceNode.start(time_to_start || tsw.now());
                }

                return this;
            };

            this.stop = function (timeToStop) {
                if (typeof options.sourceNode.stop === 'undefined') {
                    options.sourceNode.noteOff(timeToStop || tsw.now());
                } else {
                    options.sourceNode.stop(timeToStop || tsw.now());
                }

                return this;
            };
        };

        tsw.createNode = function (options) {
            var node = {};

            options = options || {};

            node.input = tsw.context().createGain();
            node.output = tsw.context().createGain();

            node.nodeType = function () {
                return options.nodeType || 'default';
            };

            node.attributes = options.attributes;

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
         * @return {node} Oscillator node of specified type.
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
                tsw.fadeIn(this);
                return this;
            };

            node.fadeOut = function () {
                tsw.fadeOut(this);
                return this;
            };

            node.detune = function (amount) {
                osc.detune.value = amount;
                return this;
            };

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
            };

            tsw.connect(osc, node.output);

            return node;
        };

        /*
         * Create gain node.
         * @return {node} Gain node.
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

            node.params = {
                gain: gainNode.gain
            };

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
         * @return {node} Buffer node.
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
                var channel_data;

                if (typeof val === 'undefined') {
                    channel_data = [];

                    for (var i = 0; i < no_channels; i++) {
                        channel_data.push(buffer.getChannelData(i));
                    }

                    return channel_data;
                }
            };

            node.buffer = function () {
                return buffer;
            };

            return node;
        };
        
        /*
         * Create buffer source node.
         * @return BufferSource node.
         */
        tsw.bufferPlayer = function (buff) {
            var source = this.context().createBufferSource();

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
         * @return {node} Filter node.
         */
        tsw.filter = function () {
            var node = tsw.createNode({
                    nodeType: 'filter'
                }),
                options = {},
                filter = tsw.context().createBiquadFilter();

            if (isObject(arguments[0])) {
                options.type = arguments[0].type;
                options.frequency = arguments[0].frequency || 1000;
                options.Q = arguments[0].Q;
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

            tsw.connect(node.input, compressor, node.output);

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
            var waveShaper = this.context().createWaveShaper(),
                curve = new Float32Array(65536);

            for (var i = 0; i < 65536 / 2; i++) {
                if (i < 30000) {
                    curve[i] = 0.1;
                } else {
                    curve[i] = -1;
                }
            }

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
            envelope.param = settings.param || null;
            envelope.nodeType = function () {
                return 'envelope';
            };

            // Envelope values
            envelope.attackTime = settings.attackTime || 0;
            envelope.decayTime = settings.decayTime || 1;
            envelope.sustainLevel = settings.sustainLevel || 1;
            envelope.releaseTime = settings.releaseTime || 1;

            // Automation parameters 
            if (isAudioParam(settings.param)) {
                envelope.param = settings.param;
            }

            // Should the release kick-in automatically
            settings.autoStop === undefined ? envelope.autoStop = true : envelope.autoStop = settings.autoStop;

            envelope.start = function (time_to_start) {
                var decay_time = this.attackTime + this.decayTime,
                    release_time = decay_time + this.releaseTime;

                // Calculate levels
                this.maxLevel = this.startLevel + this.maxLevel;
                this.sustainLevel = this.startLevel + this.sustainLevel;

                // Param is actual AudioParam
                if (isAudioParam(this.param)) {
                    time_to_start = time_to_start || tsw.now();

                    // Set start level
                    this.param.setValueAtTime(this.startLevel, time_to_start);

                    // Attack
                    this.param.linearRampToValueAtTime(this.maxLevel, time_to_start + this.attackTime);

                    // Decay
                    this.param.setTargetAtTime(this.sustainLevel, time_to_start + decay_time, 0.05);
                }
            };

            envelope.stop = function (timeToStop) {
                timeToStop = timeToStop || tsw.now();
                timeToStop += this.releaseTime;

                // Release
                if (!this.autoStop && isAudioParam(this.param)) {
                    this.param.setTargetAtTime(this.minLevel, tsw.now(), this.releaseTime / 10);
                }
            };

            return envelope;
        };

        /*
         * Create noise.
         * @param {string} colour Type of noise.
         * @return Noise generating node.
         */
        tsw.noise = function () {
            var node,
                noise_source = this.bufferPlayer(tsw.noise_buffer.buffer());

            node = tsw.createNode({
                nodeType: 'noise',
                sourceNode: noise_source,
                attributes: {
                    color: 'white'
                }
            });

            noise_source.loop = true;

            createGetSetter.call(noise_source, node, ['buffer']);

            node.color = node.colour = function (color) {
                if (typeof color === 'undefined') {
                    return node.attributes.color;
                } else {
                    node.attributes.color = color;
                }
            };

            node.nodeType = function () {
                return 'noise';
            };

            node.play = function (time_to_start) {
                noise_source.start(time_to_start);
            };

            return node;
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

            var node,
                lfo = tsw.oscillator(),
                depth = this.gain(),
                noise_source = this.bufferPlayer(tsw.noise_buffer.buffer()),
                defaults = {
                    frequency: 0,
                    waveType: 'triangle',
                    depth: 1,
                    target: null,
                    autoStart: false
                };

            node = tsw.createNode({
                nodeType: 'noise',
                sourceNode: noise_source
            });

            // Merge passed settings with defaults
            settings = applyObject(defaults, settings);

            lfo.type(settings.waveType || 'triangle');
            depth.gain(settings.depth);
            lfo.frequency(settings.frequency);

            if (settings.autoStart) {
                lfo.start(tsw.now());
            }

            lfo.modulate = function (target) {
                tsw.connect(depth, target);
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

            lfo.depth = function (d) {
                if (typeof d === 'undefined') {
                    return depth.gain.value; 
                } else {
                    depth.gain.value = d;
                }
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

        // Expose helper functions.
        tsw.isString = isString;
        tsw.isNumber = isNumber;

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

/**********************************
 * Theresas's Sound World - Effects
 * tsw-effects.js
 * Dependencies: tsw-core.js
 * Copyright 2014 Stuart Memo
 **********************************/

(function (window, undefined) {
    'use strict';

    window.tsw = tsw || {};

    /*
     * Creates delay node.
     *
     * @method createDelay
     * @param {object} settings Delay settings.
     * @return {AudioNode} Created delay node.
     */
    tsw.delay = function (settings) {

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

        var node = tsw.createNode(),
            delay = tsw.wait(),
            feedback = tsw.gain(),
            effectLevel = tsw.gain(),
            gain = tsw.gain();

        node.settings = {
            delayTime: 0.5,
            feedback: 0.5,
            level: 0.5,
        };

        // Set values
        settings = settings || {};
        delay.delayTime.value =  settings.delayTime || node.settings.delayTime;
        feedback.gain.value = settings.feedback || node.settings.feedback;
        effectLevel.gain.value = settings.level || node.settings.level;

        tsw.connect(node.input, gain, delay, feedback, delay, effectLevel, node.output);
        tsw.connect(gain, delay);

        return node;
    };

    /*
     * Creates a distortion node.
     *
     * @method createDistortion
     * @param {object} settings Distortion settings.
     * @return Created distortion node.
     */
    tsw.distortion = function (settings) {

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

        var node = tsw.createNode(),
            distortion = tsw.context().createWaveShaper(),
            lowpass = tsw.context().createBiquadFilter(),
            highpass = tsw.context().createBiquadFilter();

        node.settings = {
            distortionLevel: 0.5
        };

        // Set values
        settings = settings || {};

        tsw.connect(node.input, distortion, [lowpass, highpass], node.output);

        return node;
    };

    /*
     * Creates a phaser node.
     *
     * @method createPhaser
     * @param {object} settings Phaser settings
     * @return {AudioNode} Created phaser node.
     */
    tsw.phaser = function (settings) {

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

        var node = tsw.createNode(),
            allPassFilters = [],
            feedback = tsw.gain(),
            i = 0;

        node.settings = {
            rate: 8,
            depth: 0.5,
            feedback: 0.8
        };

        // Set values
        settings = settings || {};

        feedback.gain.value = settings.feedback || node.settings.feedback;

        for (i = 0; i < settings.rate; i++) {
            allPassFilters[i] = tsw.context().createBiquadFilter();
            allPassFilters[i].type = 7;
            allPassFilters[i].frequency.value = 100 * i;
        }

        node.input = tsw.gain();
        node.output = tsw.gain();

        for (i = 0; i < allPassFilters.length - 1; i++) {
            tsw.connect(allPassFilters[i], allPassFilters[i + 1]);
        }

        tsw.connect(node.input, allPassFilters[0], allPassFilters[allPassFilters.length - 1], feedback, allPassFilters[0]);
        tsw.connect(allPassFilters[allPassFilters.length - 1], node.output);

        node.setCutoff = function (c) {
            for (var i = 0; i < allPassFilters.length; i++) {
                // allPassFilters[i].frequency.value = c;
            }
        };

        return node;
    };

    /*
     * Create a reverb node.
     *
     * @method createReverb
     * @param {object} settings Reverb settings.
     * @return {AudioNode} The created reverb node.
     */
    tsw.reverb = function (settings) {

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

        var reverb = tsw.context().createConvolver(),
            effectLevel = tsw.gain(),
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

            effectObj.input = tsw.gain();
            effectObj.output = tsw.gain();

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
    tsw.tremolo = function (settings) {

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
            tremolo = tsw.gain(),
            lfo = this.lfo(),
            that = this;

        settings = settings || {};

        mmNode.input = tsw.gain();

        mmNode.connect = function (output) {
            mmNode.input.connect(output);
            lfo.modulate(mmNode.input.gain);
            lfo.start(that.now());
        };

        mmNode.setRate = function (r) {
            lfo.frequency(r);
        };

        mmNode.setDepth = function (r) {
            lfo.depth(r);
        };

        return mmNode;
    };
})(window);

/*********************************
 * Theresas's Sound World - Music
 * tsw.js
 * Dependencies: tsw-core.js
 * Copyright 2014 Stuart Memo
 ********************************/

(function (window, undefined) {
    'use strict';

    var music = {},
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
        natural_notes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
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
     * Decides whether a string looks like a valid note.
     *
     * @method isValidNote
     * @param {string} Name of note to test.
     * return {boolean} If note is valid.
     */
    var isValidNote = function (note) {
        if ((typeof note !== 'string') || (note.length > 3)) {
            return false;
        }
        return true;
    }

    /*
     * Parses a chord name into a detailed object.
     *
     * @method getChord
     * @param {string} chord Name of chord to turn into object.
     * return {object} Detailed chord object.
     */
    tsw.chord = function (chord) {
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

        if (!chordObj.isMajor && !chordObj.isMinor && !chord.is7th) {
            // Hey! This aint no chord that I've ever seen! Default to major.
            chordObj.isMajor = true;
        }

        rootNotePosition = getNotePosition(chordObj.rootNote);
        notePositions.push(rootNotePosition);

        if (chord.isMinor) {
            notePositions.push(rootNotePosition + tsw.semitoneDifference('minor 3rd'));
        } else {
            notePositions.push(rootNotePosition + tsw.semitoneDifference('major 3rd'));
        }

        notePositions.push(rootNotePosition + tsw.semitoneDifference('perfect 5th'));
        notePositions.push(rootNotePosition + tsw.semitoneDifference('octave'));

        notePositions.forEach(function (position) {
            chordObj.notes.push(notes[position]);
        });

        return chordObj.notes;
    };

    /*
     * Returns a list of notes in a given scale.
     * 
     * @method scale 
     * @param {string} rootNote Root note to base scale on.
     * @param {string} scaleType Type of scale to return.
     * @return {array} List of notes in scale.
     */
    tsw.scale = function (rootNote, scaleType) {
        if (scaleType === 'minor') {
            return getMinorScale(rootNote);
        } else {
            return getMajorScale(rootNote);
        }
    };

    /*
     * Returns the number of semitones an interval is from a base note.
     *
     * @method semitoneDifference
     * @param {string} interval The name of the interval
     * @return {number} Number of semitones of interval from a base note.
     */
    tsw.semitoneDifference = function (interval) {
        var numberOfIntervals = intervals.length;

        for (var i = 0; i < numberOfIntervals; i++) {
            if (interval === intervals[i]) {
                return i;
            }
        }
    };

    /*
     * Returns the flat equivalent of a given note.
     *
     * @method flat 
     * @param {string} note Note to convert.
     * @return {string} New flat note.
     */
    tsw.flat = function (note) {
        var new_note;

        note = note.replace('#', 'b');
        new_note = String.fromCharCode(note[0].toUpperCase().charCodeAt(0) + 1);

        if (new_note === 'H') {
            new_note = 'A';
        }

        new_note += note.substr(1);

        return new_note;
    };

    /*
     * Returns the sharp equivalent of a given note.
     *
     * @method sharp 
     * @param {string} note Note to convert.
     * @return {string} New sharp note.
     */
    tsw.sharp = function (note) {
        var new_note,
            num_index = 0;

        // Note isn't flat to begin with
        if (note.indexOf('b') === -1) {
            return note;
        }

        note = note.replace('b', '#');

        // Get previous letter in alphabet.
        new_note = String.fromCharCode(note[0].toUpperCase().charCodeAt(0) - 1);

        if (new_note === '@') {
            new_note = 'G';
        }

        // If new note is B, decrease the octave by 1.
        if (new_note === 'B') {
            num_index = note.search(/\d/);
            if (num_index > -1) {
                note = note.substring(0, num_index) + (note[num_index] - 1) + note.substring(num_index + 1);
            } 
        }

        new_note += note.substr(1);

        return new_note;
    };

    /*
     * Calculates the frequency of a given note.
     *
     * @method frequency
     * @param {string} note Note to convert to frequency
     * @return {number} Frequency of note
     */
    tsw.frequency = function (note) {
        var octave,
            keyNumber,
            note_index,
            note_without_octave;

        if (isValidNote(note) === false) {
            return false;
        }

        note_index = note.search(/\d/),
        octave = parseInt(note.slice(-1));

        if (isNaN(octave)) {
            octave = 4;
        } 

        note = this.sharp(note);
        note_without_octave = note;

        if (note_index > -1) {
            note_without_octave = note.substr(0, note_index);
        }

        keyNumber = notes.indexOf(note_without_octave.toUpperCase());
        keyNumber = keyNumber + (octave * 12);

        // Return frequency of note
        return parseFloat((440 * Math.pow(2, (keyNumber - 57) / 12)), 10);
    };
})(window);

/*******************************
 * Theresas's Sound World - MIDI
 * tsw-midi.js
 * Dependencies: tsw-core.js
 * Copyright 2014 Stuart Memo
 *******************************/

 (function (window, undefined) {
    'use strict';

    tsw = tsw || {};

    tsw.isMidiSupported = function () {
        return typeof navigator.requestMIDIAccess === 'function';
    };

    /*
     * Initiate MIDI input/output if available.
     *
     * @method startMIDI
     * @param {function} success Callback if MIDI has been initiated.
     * @param {function} failure Callback if MIDI hasn't been initialed.
     */

    tsw.getUserMidi = function (success, failure) {
        if (this.isMidiSupported()) {
            navigator.requestMIDIAccess().then(success, failure);
        }
    };

    var noteToMidi = function (noteLetter) {
        return noteLetter;
    };

    var midiToNote = function (midi_number) {
        var noteOnScale = midi_number % 12,
            octave = Math.floor(midi_number / 12),
            notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

        notes.push.apply(notes, notes);

        return notes[noteOnScale] + octave;
    }

    tsw.midiNote = function (thing_to_convert) {
        if (tsw.isString(thing_to_convert)) {
            return noteToMidi(thing_to_convert);
        }

        if (tsw.isNumber(thing_to_convert)) {
            return midiToNote(thing_to_convert);
        }
    };
})(window);
