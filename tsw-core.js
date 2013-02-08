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
        };

        /*
         * Gets the current time of the audio context
         *
         * @method now
         * @return {number} Time since audio began.
         */
        SoundWorld.prototype.now = function () {
            return this.context.currentTime;
        }.bind(this);

        /*
        * Connects an array of nodes together in order    
        *
        * @method chainNodes
        * @param {array} nodes The nodes to chain together.
        */ 
        var chainNodes = function (nodes) {
            var numberOfNodes = nodes.length - 1;

            for (var i = 0; i < numberOfNodes; i++) {
                nodes[i].connect(nodes[i + 1]);
            }
        };

        /*
         * Connects two nodes together.
         * @method connect
         * @param {AudioNode} nodeFrom
         * @param {AudioNode} nodeTo
         */
        SoundWorld.prototype.connect = function () {
            for (var i = 0; i < arguments.length - 1; i++) {
                arguments[i].connect(arguments[i + 1]);
            }
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

            osc.start = (function (startTime) {
                var originalStart = osc.start;

                return function () {
                    console.log(originalStart);
                    originalStart(0);
                };
            })();
            
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
         * @method createSquareWave
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

            var config = {};

            // Set values
            settings = settings || {
                frequency: 10,
                depth: 1,
                waveType: 'TRIANGLE'
            };

            lfo.frequency.value = settings.frequency || config.frequency;
            depth.gain.value = settings.depth || config.depth;
            lfo.type = lfo[settings.waveType];

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

    window.SoundWorld = SoundWorld;

})(window);
