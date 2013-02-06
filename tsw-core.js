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
            this.context = context;
            this.version = '0.0.1';
            this.speakers = context.destination;
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
        SoundWorld.prototype.connect = function (nodeFrom, nodeTo) {
            nodeFrom.connect(noteTo);
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
         * @return Oscillator node of specified type.
         */
        SoundWorld.prototype.createOscillator = function (waveType) {
            var osc = this.context.createOscillator();

            waveType = waveType || 'SINE';
            waveType = waveType.toUpperCase();

            osc.type = osc[waveType];
            
            return osc;
        };

        /*
         * Create Sine Wave node.
         *
         * @method createSineWave
         * @return Sine wave node.
         */
        SoundWorld.prototype.createSineWave = function () {
            return this.createOscillator('SINE');
        };

        /*
         * Create square wave node.
         *
         * @method createSquareWave
         * @return Square wave node.
         */
        SoundWorld.prototype.createSquareWave = function () {
            return this.createOscillator('SQUARE');
        };

        /*
         * Create sawtooth wave node.
         *
         * @method createSquareWave
         * @return Square wave node.
         */
        SoundWorld.prototype.createSawtoothWave = function () {
            return this.createOscillator('SAWTOOTH');
        };

        /*
         * Create triangle wave node.
         *
         * @method createTriangleWave
         * @return Triangle wave node.
         */
        SoundWorld.prototype.createTriangleWave = function () {
            return this.createOscillator('TRIANGLE');
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
