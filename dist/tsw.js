/**
 * @name Theresa's Sound World
 * @description A JavaScript library for audio manipulation.
 * @version v0.9.0
 * @tutorial http://theresassoundworld.com
 * @author Stuart Memo
 * @license MIT
 */
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

module.exports = {
    /**
     * Is an argument a string?
     * @method isString
     * @param thing Argument to check if it's a string.
     */
    isString: function (thing) {
        return typeof thing === 'string';
    },

    /**
     * Is an argument a number?
     * @method isNumber
     * @param thing Argument to check if it's a number.
     */
    isNumber: function (thing) {
        return typeof thing === 'number';
    }
};

},{}],2:[function(require,module,exports){
/***********************************
 * Theresas's Sound World - Analysis
 * tsw-analysis.js
 * Copyright 2014 Stuart Memo
 **********************************/

'use strict';

var tsw = require('./tsw-core');

var getDuration = function (timeInSeconds) {
    var minutes = Math.floor(timeInSeconds / 60);

    return {
        minutes: minutes,
        seconds: timeInSeconds - (minutes * 60),
        totalSeconds: timeInSeconds
    };
};

tsw.analyser = function () {
    var analyser = tsw.context().createAnalyser();

    return analyser;
};

tsw.info = function (file) {
    return {
        duration: getDuration(file.duration),
        numberOfChannels: file.numberOfChannels,
        sampleRate: file.sampleRate
    };
};

module.exports = tsw;

},{"./tsw-core":4}],3:[function(require,module,exports){
var tsw = require('./tsw-main');

window.tsw = tsw;

},{"./tsw-main":7}],4:[function(require,module,exports){
/****************************************************
 * Theresa's Sound World
 * tsw.js
 * An audio library.
 * http://theresassoundworld.com/
 * https://github.com/stuartmemo/theresas-sound-world
 * Copyright 2014 Stuart Memo
  ****************************************************/

'use strict';

var helpers = require('./helpers');

var tsw,
    version = '0.9.0';

tsw = (function () {

    /***********
     * Helpers *
     **********/

    /*
     * Applies the attributes of one object to another.
     * @method applyObject
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
            if(isObject(node[setting]))
            {
                node[setting].value = settings[setting];
            }
        }
    };

    /*
     * Is an argument an array?
     * @method isArray
     * @param thing Argument to check if it's an array.
     * @return {boolean} Whether thing is an array.
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
     * @method isObject
     * @param thing Argument to check if it's an object.
     */
    var isObject = function (thing) {
        return typeof thing === 'object';
    };

    /*
     * Is argument defined?
     * @method isDefined
     * @param thing Argument to check if it's defined.
     */
    var isDefined = function (thing) {
        return typeof thing !== 'undefined';
    };

    var exists = function (thing) {
        var defined = isDefined(thing),
            isNull = thing === null;

        if (isDefined(thing)) {
            if (thing !== null) {
                return true;
            }
        }
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

    var scheduleTransition = function (
            node, param_to_change, param_value, targetTime, transition_type) {

        if (exists(transition_type)) {
            switch (transition_type) {
                case 'linear':
                    node[param_to_change]
                        .setValueAtTime(node[param_to_change].value, tsw.now());
                    node[param_to_change]
                        .linearRampToValueAtTime(param_value, targetTime);
                    break;
                case 'exponential':
                    node[param_to_change]
                        .setValueAtTime(node[param_to_change].value, tsw.now());
                    if (param_value === 0) {
                        // Exponential ramp can never reach zero.
                        param_value = 0.00000001;
                    }
                    node[param_to_change]
                        .exponentialRampToValueAtTime(param_value, targetTime);
                    break;
                default:
                    node[param_to_change]
                        .setValueAtTime(param_value, targetTime);
            }
        } else {
            node[param_to_change].setValueAtTime(param_value, targetTime);
        }
    };

    var getNodeValue = function (node, paramToChange) {
        if (node) {
            if (exists(node[paramToChange])) {
                if (exists(node[paramToChange].value)) {
                    return node[paramToChange].value;
                } else {
                    return node[paramToChange];
                }
            }
        }
    };

    var setNodeValue = function (node, paramToChange, paramValue, targetTime, transitionType) {
        if (exists(node[paramToChange].value)) {
            if (exists(targetTime)) {
                scheduleTransition(node, paramToChange, paramValue, targetTime, transitionType);
            } else {
                node[paramToChange].value = paramValue;
            }
        } else {
            node[paramToChange] = paramValue;
        }
    };

    /*
     * Enable jQuery style getters & setters.
     * @param {node} node - The tsw node to add get/sets to.
     * @param {string} param - The actual parameter the getset gets & sets.
     */
    var createGetSetFunction = function (node, param) {

        return function (paramValue, targetTime, transitionType) {
            if (exists(paramValue)) {
                return setNodeValue(node, param, paramValue, targetTime, transitionType);
            } else {
                return getNodeValue(node, param);
            }
        };
    };

    /***************
     * Sound World *
     **************/

    var tsw = {},
        nodes_to_disconnect = [];

    tsw.version = version;
    tsw.isBrowserSupported = false;
    tsw.processors = []; // Add ScriptProcessor nodes to global object to avoid garbage collection.

    /*
     * Check if browser has Web Audio API.
     * Also, map older API methods to new ones.
     * @function checkBrowserSupport
     * @param {function} success Success method execute.
     * @param {function} failure Failure method execute.
     */
    var checkBrowserSupport = function (success, failure) {
        var context;
        // Check if the Web Audio API is supported.
        if (typeof webkitAudioContext === 'undefined' && typeof AudioContext === 'undefined') {
            if (typeof webkitAudioContext === 'function') {
                if (typeof webkitAudiocontext().prototype.createGainNode === 'undefined') {
                    failure('Sorry, your browser doesn\'t support a recent enough version of the Web Audio API.');
                }
            } else {
                // Using older version of API.
                if (typeof webkitAudiocontext === 'function') {
                    var ctx = webkitAudiocontext().prototype;

                    ctx.createGain  = ctx.createGainNode;
                    ctx.createDelay = ctx.createDelayNode;
                    ctx.createScriptProcessor = ctx.createJavaScriptNode;
                }
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
        if (typeof tsw.context === 'function') {
            tsw.speakers = tsw.context().destination;
            tsw.osc = tsw.oscillator;
        }
    };

    /**
     * Fade in/out has been removed while waiting for Firefox documentation.
     * https://github.com/stuartmemo/theresas-sound-world/issues/18
     */

    /*
     * Fade in an audio source.
     * @param thingToFadeOut Audio source to fade out.
     */
    /*
    tsw.fadeIn = function (thingToFadeIn) {
        thingToFadeIn.output.gain.cancelScheduledValues(tsw.now());
        thingToFadeIn.output.gain.setValueAtTime(0, tsw.now());
        thingToFadeIn.output.gain.exponentialRampToValueAtTime(1, tsw.now() + 2);
    };
    */

    /*
     * Fade out an audio source.
     * @param thingToFadeOut Audio source to fade out.
     */
    /*
    tsw.fadeOut = function (thingToFadeOut) {
        thingToFadeOut.output.gain.cancelScheduledValues(tsw.now());
        thingToFadeOut.output.gain.setValueAtTime(1, tsw.now());
        thingToFadeOut.output.gain.exponentialRampToValueAtTime(0.000001, tsw.now() + 2);
        thingToFadeOut.output.gain.setValueAtTime(0, tsw.now() + 2.0001);
    };
    */

    /*
     * Get the current time of the audio context().
     * @method now
     * @return {number} Time since audio began (in seconds).
     */
    tsw.now = function () {
        return this.context().currentTime;
    };

    tsw.channelSplitter = function () {
        return tsw.context().createChannelSplitter();
    };

    tsw.channelMerger = function (channels) {
        return tsw.context().createChannelMerger(channels);
    };

    /*
     * Connects multiple nodes together.
     * @param {AudioNodes} arguments Nodes to connect in order.
     */
    tsw.connect = function () {
        var i,
            number_of_arguments = arguments.length;

        var updateConnectedToArray = function (node1, node2) {
            node1.connectedTo = node1.connectedTo || [];

            if (node1.hasOwnProperty('connectedTo')) {
                node1.connectedTo.push(node2);
            }
        };

        var connectNativeNodeToNativeNode = function () {
            arguments[0].connect(arguments[1], 0, arguments[2]);
            updateConnectedToArray(arguments[0], arguments[1]);
        };

        var connectNativeNodeToTswNode = function () {
            arguments[0].connect(arguments[1].input, 0, arguments[2]);
            updateConnectedToArray(arguments[0], arguments[1]);
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
            arguments[0].output.connect(arguments[1].input, 0, arguments[2]);
            updateConnectedToArray(arguments[0], arguments[1]);
        };

        var connectTswNodeToNativeNode = function () {
            arguments[0].output.connect(arguments[1], 0, arguments[2]);
            updateConnectedToArray(arguments[0], arguments[1]);
        };

        var connectTswNodeToArray = function () {
            for (var j = 0; j < arguments[1].length; j++) {
                tsw.connect(arguments[0], arguments[1][j]);
            }
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
            tsw.connect(arguments[0].node, arguments[1].node, arguments[1].channel);
        };

        var connectNativeNodeToAudioParam = function () {
            arguments[0].connect(arguments[1]);
        };

        var connectTswNodeToAudioParam = function () {
            arguments[0].output.connect(arguments[1]);
        };

        // Iterate over each argument.
        for (i = 0; i < number_of_arguments - 1; i++) {
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

                if (isNativeNode(first_arg.node) && isNativeNode(second_arg.node)) {
                    connectNativeNodeToNativeNode(first_arg.node, second_arg.node, second_arg.channel);
                    continue;
                }

                if (isTswNode(first_arg.node) && isNativeNode(second_arg.node)) {
                    connectTswNodeToNativeNode(first_arg.node, second_arg.node, second_arg.channel);
                    continue;
                }

                if (isNativeNode(first_arg.node) && isTswNode(second_arg.node)) {
                    connectNativeNodeToTswNode(first_arg.node, second_arg.node, second_arg.channel);
                    continue;
                }

                if (isTswNode(first_arg.node) && isTswNode(second_arg.node)) {
                    connectTswNodeToTswNode(first_arg.node, second_arg.node, second_arg.channel);
                    continue;
                }
            }

            if (isNativeNode(first_arg) && isAudioParam(second_arg)) {
                connectNativeNodeToAudioParam(first_arg, second_arg);
                continue;
            }

            if (isTswNode(first_arg) && isAudioParam(second_arg)) {
                connectTswNodeToAudioParam(first_arg, second_arg);
                continue;
            }
        }
    };

    /*
     * Disconnects a node from everything it's connected to.
     * @method disconnect
     * @param {AudioNode} node First audio node
     * @param {AudioNode} node Second audio node
     * @param {AudioNode} node Third....etc.
     */
    tsw.disconnect = function () {
        var argumentsLength = arguments.length,
            i;

        for (i = 0; i < argumentsLength; i++) {
            if (arguments[i].disconnect) {
                arguments[i].disconnect();
                arguments[i].connectedTo = [];
            }

            if (isTswNode(arguments[i])) {
                tsw.disconnect(arguments[i].output);
                arguments[i].connectedTo = [];
            }
        }
    };

    /*
     * Disconnects a node after a certain time.
     * @param {number} Time to disconnect node in seconds.
     */
    tsw.disconnectAfterTime = function (nodeToDisconnect, timeToDisconnect) {
        nodes_to_disconnect.push({ node: nodeToDisconnect, time: timeToDisconnect });
    };

    /*
    * Load a number of audio files via ajax
    * @method load
    * @param {array} files
    * @param {function} callback
    */
    tsw.load = function () {
        var returnObj = {},
            files = arguments[0],
            basePath = '',
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
                    if (request.status === 200) {
                        success();
                    } else {
                        fail();
                    }
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

        // Is 3rd argument the failure callback?
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
            //loadFile(basePath, file, files[file], returnObj, successCallback);
        } else {
            throw new Error('Files must be an array or a valid string.');
        }
    };

    /*
     * Create a wait/delay node.
     * @method wait
     * @param {number} delayTime Time to delay input in seconds.
     * @return {node} delay node.
     */
    tsw.wait = function (delayTime) {
        var node,
            delayNode = this.context().createDelay();

        node = tsw.createNode();

        node.nodeType = 'wait';
        node.time = createGetSetFunction(delayNode, 'delayTime');
        node.time(delayTime || 1);

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
        var node,
            panner_node = tsw.gain(),
            left_gain = tsw.gain(0),
            right_gain = tsw.gain(0),
            merger = tsw.channelMerger(2);

        node = tsw.createNode();
        node.nodeType = 'panner';

        // Force max panning value.
        var forceMaxPanningValue = function (pan_value) {
            if (pan_value > 1) {
                pan_value = 1;
            } else if (pan_value < -1) {
                pan_value = -1;
            }

            return pan_value;
        };

        node.pan = function (pan_value, time_to_change) {
            var left_gain_value;

            if (isDefined(pan_value)) {
                pan_value = forceMaxPanningValue(pan_value || 0);

                // 100% === 2
                // Example value = -0.56
                // (0.44 / 2) * 100 = 22% -> 78%
                // Left gain = (1 / 100) * 78 = 0.78
                // Right gain = 1 - 0.78 =  0.22

                // Example value = 0.2
                // (1.2 / 2) * 100 = 60% -> 40%
                // Left gain = (1 / 100) * 40 = 0.4
                // Right gain = 1 - 0.4 = 0.6

                left_gain_value = 1 - ((pan_value + 1) / 2);
                left_gain.gain(left_gain_value, time_to_change);
                right_gain.gain(1 - left_gain_value, time_to_change);
            } else {
                return -((left_gain.gain() - 1) * 2) - 1;
            }
        };

        node.pan(pan || 0);

        tsw.connect(node.input, [left_gain, right_gain]);

        tsw.connect(
            {
                node: left_gain
            },
            {
                node:  merger,
                channel: 0
            }
        );

        tsw.connect(
            {
                node: right_gain
            },
            {
                node:  merger,
                channel: 1
            }
        );

        tsw.connect(merger, node.output);

        return node;
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
     * @method stop
     * @param {AudioBuffer} buffer
     * @param {number} when Time to stop in seconds.
     */
    tsw.stop = function (buffer, when) {
        when = when || 0;
        buffer.stop(when);
    };

    /*
     * Reverse a buffer
     * @method reverse
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
     * @method updateMethods
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

    /*
     * Create a generic node that has input and output connections.
     * @method createNode
     * @param {object} options
     */
    tsw.createNode = function (options) {
        var node = {};

        options = options || {};

        node.input = tsw.context().createGain();
        node.output = tsw.context().createGain();

        Object.keys(options).forEach(function (key) {
            node[key] = options[key];
        });

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
     * @param {number} frequency The starting frequency of the oscillator.
     * @param {string} waveType The type of wave form.
     * @return {node} Oscillator node of specified type.
     */
    tsw.oscillator = function (frequency, waveType) {
        var node,
            osc = tsw.context().createOscillator();

        node = tsw.createNode({
            sourceNode: osc,
            nodeType: 'oscillator'
        });

        node.frequency = createGetSetFunction(osc, 'frequency');
        node.type = createGetSetFunction(osc, 'type');
        node.detune = createGetSetFunction(osc, 'detune');

        node.params = {
            frequency: osc.frequency
        };

        node.frequency(frequency || 440);
        node.type((waveType || 'sine').toLowerCase());

        node.isPlaying = function () {
            if (osc.playbackState === 2) {
                return true;
            } else {
                return false;
            }
        };

        this.connect(osc, node.output);

        return node;
    };

    /*
     * Create gain node.
     * @method gain
     * @param {number} volume Amount to multiply incoming signal by.
     * @param {number} time_to_change When to apply the volume change.
     * @return {node} Gain node.
     */
    tsw.gain = function (volume, time_to_change) {
        var node,
            gain_node;

        if (typeof this.context().createGain === 'function') {
            gain_node = this.context().createGain();
        } else {
            gain_node = this.context().createGainNode();
        }

        node = tsw.createNode({
            nodeType: 'gain'
        });

        node.params = {
            gain: gain_node.gain
        };

        node.gain = createGetSetFunction(gain_node, 'gain');
        node.gain(volume, time_to_change);

        this.connect(node.input, gain_node, node.output);

        return node;
    };

    /*
     * Create buffer node.
     * @method buffer
     * @param {number} no_channels Number of channels
     * @param {number} buffer_size Size of buffer
     * @param {number} sample_rate Sample rate
     * @return {node} Buffer node.
     */
    tsw.buffer = function (no_channels, buffer_size, sample_rate) {
        var buffer;

        no_channels = no_channels || 1;
        buffer_size = buffer_size || 65536;
        sample_rate = sample_rate || 44100;

        buffer = this.context().createBuffer(no_channels, buffer_size, sample_rate);
        buffer.nodeType = 'buffer';

        return buffer;
    };

    /*
     * Create buffer box for playing and mainpulating an audio buffer.
     * @method bufferBox
     * @param {buffer} AudioBuffer
     * @return BufferBox.
     */
    tsw.bufferBox = function (buff) {
        var node = tsw.createNode(
                {
                    nodeType: 'bufferBox',
                    paused: false,
                    stopped: true
                }
            ),
            bufferPosition = 0,
            bufferShouldLoop = false,
            bufferWaitingArea,
            sourceNode,
            startTime,
            onEndFunction;

        node.buffer = function (buffer) {
            if (buffer) {
                bufferWaitingArea = buffer;
            } else {
                return bufferWaitingArea;
            }
        };

        node.loop = function (shouldLoop) {
            bufferShouldLoop = shouldLoop;
            return this;
        };

        if (buff) {
            node.buffer(buff);
        }

        node.play = function (time, duration) {
            var that = this;

            sourceNode = tsw.context().createBufferSource();
            sourceNode.buffer = bufferWaitingArea;
            sourceNode.loop = bufferShouldLoop;

            this.paused = false;
            this.stopped = false;
            this.playing = true;

            tsw.connect(sourceNode, node.output);

            sourceNode.onended = function () {
                if (
                    !that.paused &&
                    !that.stopped &&
                    node.position() >= (node.buffer().length / tsw.context().sampleRate)
                ) {
                    bufferPosition = 0;
                    that.stopped = true;

                    if (onEndFunction) {
                        onEndFunction();
                    }
                }
            };

            startTime = time || tsw.now();
            sourceNode.start(startTime, bufferPosition, duration);
        };

        node.stop = function (time) {
            bufferPosition = 0;
            this.paused = false;
            this.stopped = true;

            if (sourceNode) {
                sourceNode.stop(time || tsw.now());
            }
        };

        node.on = function (eventName, callback) {
            if (eventName === 'end') {
                onEndFunction = callback;
            }
        }

        node.pause = function (time) {
            this.paused = true;

            if (sourceNode) {
                sourceNode.stop(time || tsw.now());
                tsw.disconnect(sourceNode);
            }

            if (!this.stopped) {
                bufferPosition = bufferPosition +
                    tsw.now() - startTime;
            }
        };

        // Get or set start position of a buffer.
        node.position = function (newPosition) {
            if (newPosition || newPosition === 0) {
                if (this.paused || this.stopped) {
                    bufferPosition = newPosition;
                } else {
                    this.pause();
                    bufferPosition = newPosition;
                    this.play();
                }
            } else {
                if (this.paused || this.stopped) {
                    return bufferPosition;
                } else {
                    return bufferPosition
                        + tsw.now() - startTime;
                }
            }

            return node;
        };

        node.start = node.play;

        return node;
    };

    /*
     * Audio decoder method.
     * @method decode
     * @param {arraybuffer}
     * @param {function} Success callback.
     * @param {function} Failure callback.
     * @return null
     */
    tsw.decode = function (arrayBuffer, success, failure) {
        this.context().decodeAudioData(arrayBuffer, success, failure);
    };

    /*
     * Create filter node.
     * @method filter
     * @param {string} filterType Type of filter.
     * @return {node} Filter node.
     */
    tsw.filter = function () {
        var node = tsw.createNode({
                type: 'filter'
            }),
            options = {},
            filter = tsw.context().createBiquadFilter();

        if (isObject(arguments[0])) {
            options.type = arguments[0].type;
            options.frequency = arguments[0].frequency || 1000;
            options.Q = arguments[0].Q;
            options.gain = arguments[0].gain;
        } else if (helpers.isString(arguments[0])) {
            options.type = arguments[0];
        }

        node.nodeType = 'filter';
        node.type = createGetSetFunction(filter, 'type');
        node.frequency = createGetSetFunction(filter, 'frequency');
        node.Q = createGetSetFunction(filter, 'Q');
        node.gain  = createGetSetFunction(filter, 'gain');

        node.type(options.type || 'lowpass');
        node.frequency(options.frequency || 1000);
        node.Q(options.Q || 0);
        node.gain(options.gain || 0);

        this.connect(node.input, filter, node.output);

        return node;
    };

    /*
     * Create analyser node.
     * @method analyser
     * @return Analyser node.
     */
    tsw.analyser = function () {
        return this.context().createAnalyser();
    };

    /*
     * Create compressor node.
     * @method compressor
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
                release: 0.25      // seconds (min: 0, max: 1)
            };

        settings = applyObject(defaults, settings);
        applySettings(compressor, settings);

        node.threshold = createGetSetFunction(compressor, 'threshold');
        node.knee = createGetSetFunction(compressor, 'knee');
        node.ratio = createGetSetFunction(compressor, 'ratio');
        node.attack = createGetSetFunction(compressor, 'attack');
        node.release = createGetSetFunction(compressor, 'release');

        this.connect(node.input, compressor, node.output);

        return node;
    };

    /*
     * Create processor node.
     * @method processor
     * @param {number} bs Buffer size.
     * @param {function} callback Callback function.
     * @return Script Processor node.
     */
    tsw.processor = function (bs, callback) {
        var buffer_size = bs || 1024,
            processor =  tsw.context().createScriptProcessor(buffer_size, 1, 1);

        if (typeof callback === 'function') {
            processor.onaudioprocess = function (e) {
                callback(e);
            };
        }

        return processor;
    };

    /*
     * Create waveshaper.
     * @method waveShaper
     */
    tsw.waveShaper = function () {
        var wave_shaper = this.context().createWaveShaper(),
            curve = new Float32Array(65536);

        for (var i = 0; i < 65536 / 2; i++) {
            if (i < 30000) {
                curve[i] = 0.1;
            } else {
                curve[i] = -1;
            }
        }

        wave_shaper.curve = curve;

        return wave_shaper;
    };

    /*
     * Create envelope.
     * @method envelope
     * @param {object} envelopeParams Envelope parameters.
     * @return Envelope filter.
     */
    tsw.envelope = function (settings) {
        var envelope = {};

        settings = settings || {};

        // Initial levels
        envelope.name = settings.name|| '';
        envelope.nodeType = 'envelope';
        envelope.startLevel = settings.startLevel || 0;
        envelope.maxLevel = settings.maxLevel || 1;
        envelope.minLevel = settings.minLevel || 0;
        envelope.param = settings.param || null;

        // Envelope values
        envelope.attackTime = settings.attack || 0;
        envelope.decayTime = settings.decay || 0;
        envelope.sustainLevel = settings.sustain || 1;
        envelope.releaseTime = settings.release || 0;

        // Automation parameters
        if (isAudioParam(settings.param)) {
            envelope.param = settings.param;
        }

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

                // Attack - ramp to max level from the start time to the duration of the attack.
                this.param.linearRampToValueAtTime(this.maxLevel, time_to_start + this.attackTime);

                // Decay - starts decaying when attack is done.
                this.param.setValueAtTime(this.maxLevel, time_to_start + this.attackTime);
                this.param.exponentialRampToValueAtTime(this.sustainLevel, time_to_start + decay_time);

                // Sustain
                this.param.setValueAtTime(this.sustainLevel, time_to_start + decay_time);
            }
        };

        envelope.release = function (timeToStop) {
            var actualMinValue = this.minLevel;

            timeToStop = timeToStop || tsw.now();

            if (this.minLevel === 0) {
                actualMinValue = 0.00000001;
            }

            // Release
            if (isAudioParam(this.param)) {
                this.param.setValueAtTime(this.sustainLevel, timeToStop);
                this.param.exponentialRampToValueAtTime(actualMinValue, timeToStop + this.releaseTime);
                this.param.exponentialRampToValueAtTime(actualMinValue, timeToStop + this.releaseTime);
                this.param.setValueAtTime(this.minLevel, timeToStop + this.releaseTime);
            }
        };

        return envelope;
    };

    /*
     * Create noise.
     * @method noise
     * @param {string} colour Type of noise.
     * @return Noise generating node.
     */
    tsw.noise = function () {
        var i,
            noiseBuffer = this.buffer(),
            noiseSource = this.bufferBox(),
            bufferSize = noiseBuffer.length;

        for (i = 0; i < bufferSize; i++) {
            noiseBuffer.getChannelData(0)[i] = (Math.random() * 2) - 1;
        }

        noiseSource.nodeType = 'noise';
        noiseSource.buffer(noiseBuffer);

        noiseSource.loop(true);

        return noiseSource;
    };

    /*
     * Create LFO.
     * @method lfo
     * @param {number} frequency Frequency of LFO
     */
    tsw.lfo = function (frequency) {
        var node,
            lfo = tsw.oscillator(frequency || 10);

        node = tsw.createNode({
            sourceNode: lfo,
            nodeType: 'lfo'
        });

        /*********************************

        LFO
        ===
        +----------+     +--------------+
        |    LFO   |-->--|    Target    |
        | (Source) |     | (AudioParam) |
        +----------+     +--------------+

        *********************************/

        node.modulate = function (target) {
            if (exists(target)) {
                tsw.connect(lfo, target);
                lfo.start();
            }
        };

        node.frequency = lfo.frequency;

        return node;
    };

    /*
     * Get user's audio input.
     * @method getUserAudio
     * @param {function} Callback function with streaming node passed as param;
     * @param {function} Error callback. Called when there's an error getting user audio.
     */
    tsw.getUserAudio = function (callback, errorCallback) {
        var audioStream = function (stream) {
            var streamNode = tsw.context().createMediaStreamSource(stream);

            callback(streamNode);
        };

        navigator.webkitGetUserMedia({audio: true}, audioStream, errorCallback);
    };

    /*
     * Kick everything off.
     * @method init
     * @return {object} tsw Main Theresa's Sound World object
     */
    tsw.init = function () {
        checkBrowserSupport(function () {
            // Browser is compatible.
            mapToSoundWorld();
        }, function (error) {
            // Browser is not compatible.
            console.log(error);
        });
    };

    return tsw;
})();

if (typeof window !== 'undefined' && window.document) {
    tsw.init();
}

module.exports = tsw;

},{"./helpers":1}],5:[function(require,module,exports){
/**********************************
 * Theresas's Sound World - Effects
 * tsw-effects.js
 * Copyright 2014 Stuart Memo
 **********************************/

'use strict';

var tsw = require('./tsw-core');

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
          v                v      ^                           v
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
    settings.rate = settings.rate || node.settings.rate;

    for (i = 0; i < settings.rate; i++) {
        allPassFilters[i] = tsw.context().createBiquadFilter();
        allPassFilters[i].type = 7;
        allPassFilters[i].frequency.value = 100 * i;
    }

    for (i = 0; i < allPassFilters.length - 1; i++) {
        tsw.connect(allPassFilters[i], allPassFilters[i + 1]);
    }

    tsw.connect(node.input, allPassFilters[allPassFilters.length - 1], feedback, allPassFilters[0]);
    tsw.connect(allPassFilters[allPassFilters.length - 1], node.output);

    node.setCutoff = function (c) {
        for (var i = 0; i < allPassFilters.length; i++) {
            allPassFilters[i].frequency.value = c;
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

module.exports = tsw;

},{"./tsw-core":4}],6:[function(require,module,exports){
/*******************************
 * Theresas's Sound World - Loop
 * tsw-loop.js
 * Copyright 2014 Stuart Memo
 *******************************/

'use strict';

var tsw = {},
    currentStep = 0,
    lookAhead = 25;

// Build a worker from an anonymous function body.
if (typeof URL !== 'undefined' && URL.createObjectURL) {
    var blobURL = URL.createObjectURL(
            new Blob(
                [ '(',
                    function () {
                        //Long-running work here
                        self.addEventListener('message', function (e) {

                            if (e.data === 'start') {
                                setInterval(function () {
                                    self.postMessage('tick');
                                }, 25);
                            }
                        });
                    }.toString(),
                ')()' ],
                { type: 'application/javascript' }
            )
    );

    var worker = new Worker(blobURL);

    URL.revokeObjectURL(blobURL);
}

tsw.secondsPerBeat = function (bpm) {
    return 60 / bpm;
};

/*
Usage
===========
tsw.loop(function (stepTime) {
   osc.start(stepTime);
}, 120, 4);
*/
tsw.loop = function (callback, bpm, steps) {
    var nextStepTime,
        currentStep = 0,
        scheduleAheadTime = 0.1,
        lookAheadTime = 25,
        stepsPerBar,
        stepsPerBarRatio;

    bpm = bpm || 120;
    steps = steps || 16;
    stepsPerBar = steps / 4;
    stepsPerBarRatio = 1 / stepsPerBar;

    nextStepTime = tsw.now();
    worker.postMessage('start');

    worker.addEventListener('message', function (e) {
        // Tick gets sent every 100ms from the worker.
        if (e.data === 'tick') {
            while (nextStepTime < tsw.now() + scheduleAheadTime) {
                callback(nextStepTime, currentStep + 1);

                // 4 steps in each beat for 16th's.
                nextStepTime += stepsPerBarRatio * tsw.secondsPerBeat(bpm);

                currentStep++;

                if (currentStep === steps) {
                    currentStep = 0;
                }
            }
        }
    });
};

module.exports = tsw;

},{}],7:[function(require,module,exports){
var tswCore = require('./tsw-core');
var tswEffects = require('./tsw-effects');
var tswMusic = require('./tsw-music');
var tswLoop = require('./tsw-loop');
var tswMidi = require('./tsw-midi');
var tswAnalysis = require('./tsw-analysis');

var tsw = {};

for (var attrname in tswCore) {
    tsw[attrname] = tswCore[attrname];
}

for (var attrname in tswEffects) {
    tsw[attrname] = tswEffects[attrname];
}

for (var attrname in tswMusic) {
    tsw[attrname] = tswMusic[attrname];
}

for (var attrname in tswLoop) {
    tsw[attrname] = tswLoop[attrname];
}

for (var attrname in tswMidi) {
    tsw[attrname] = tswMidi[attrname];
}

for (var attrname in tswAnalysis) {
    tsw[attrname] = tswAnalysis[attrname];
}

module.exports = tsw;

},{"./tsw-analysis":2,"./tsw-core":4,"./tsw-effects":5,"./tsw-loop":6,"./tsw-midi":8,"./tsw-music":9}],8:[function(require,module,exports){
/*******************************
 * Theresas's Sound World - MIDI
 * tsw-midi.js
 * Copyright 2014 Stuart Memo
 *******************************/

'use strict';

var helpers = require('./helpers');

var tsw = {},
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/*
 * Get position of note in note array.
 *
 * @function getNotePosition
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


tsw.isMidiSupported = function () {
    return typeof navigator.requestMIDIAccess === 'function';
};

/*
 * Initiate MIDI input/output if available.
 *
 * @method getUserMidi
 * @param {function} success Callback if MIDI has been initiated.
 * @param {function} failure Callback if MIDI hasn't been initialed.
 */
tsw.getUserMidi = function (success, failure) {
    if (this.isMidiSupported()) {
        navigator.requestMIDIAccess().then(success, failure);
    }
};

var noteToMidi = function (note_letter) {
    var note = note_letter.match(/^[A-g#]+/)[0],
        octave = parseInt(note_letter.match(/\d+/g), 10),
        note_position = getNotePosition(note);

    return note_position + (octave * 12);
};

var midiToNote = function (midi_number) {
    var noteOnScale = midi_number % 12,
        octave = Math.floor(midi_number / 12),
        notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    notes.push.apply(notes, notes);

    return notes[noteOnScale] + octave;
};

tsw.midiNote = function (thing_to_convert) {
    if (helpers.isString(thing_to_convert)) {
        return noteToMidi(thing_to_convert);
    }

    if (helpers.isNumber(thing_to_convert)) {
        return midiToNote(thing_to_convert);
    }
};

module.exports = tsw;

},{"./helpers":1}],9:[function(require,module,exports){
/*********************************
 * Theresas's Sound World - Music
 * tsw.js
 * Copyright 2014 Stuart Memo
 ********************************/

'use strict';

var tsw = {},
    music = {},
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
 * @function getNotePosition
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
};

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

    note_index = note.search(/\d/);
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

module.exports = tsw;

},{}]},{},[3]);
