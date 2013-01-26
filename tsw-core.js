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
                            console.log(this) 
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

            for (var file in files) {
                numberOfFiles++;
                loadFile(file, files[file], returnObj, callback);
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
         * Creates compressor node.
         *
         * @method createCompressor
         * @param {object} settings Compressor settings.
         * @return Created compressor node.
         */
        SoundWorld.prototype.createCompressor = function (settings) {

            /**************************************************************

            Compressor 
            ==========

            +----------+     +----------------------+     +---------------+
            |  Input   |-->--|       Compressor     |-->--|     Output    |
            | (Source) |     | (DynamicsCompressor) |     | (Destination) |
            +----------+     +----------------------+     +---------------+

            **************************************************************/

            var mmNode = {},
                config = {},
                compressor = this.context.createDynamicsCompressor();

            settings = settings || {};

            mmNode.input = this.context.createGain()

            mmNode.connect = function (output) {
                mmNode.connect(compressor);
                compressor.connect(output);
            };

            return mmNode;
        };

        /*
         * Creates delay node.
         *
         * @method createDelay
         * @param {object} settings Delay settings.
         * @return {AudioNode} Created delay node.
         */
        SoundWorld.prototype.createDelay = function (settings) {

            /*********************************************

            Delay effect
            ============
            +-------+         +----------+     +----------+
            | Input |---->----|   Delay  |-->--| Feedback |
            | (Osc) |         |  (Delay) |     |  (Gain)  |
            +-------+         +----------+     +----------+
                |                |   |              |
                v                v   +-----<--------+
                |                |   
            +---------------+   +--------------+        
            |     Output    |<--| Effect Level |
            | (Destination) |   |    (Gain)    |
            +---------------+   +--------------+

            Config
            ------
            Delay Time: Number of seconds to delay signal
            Feedback: Volume of signal fed back into delay node
            Effect Level: Volume of effect mixed back into signal

            **********************************************/

            var delay = context.createDelay(),
                feedback = context.createGain(),
                effectLevel = context.createGain(),
                mmNode = {},
                config = {
                    delayTime: 0.5,
                    feedback: 0.5,
                    effectLevel: 0.5,
                };

            // Set values
            settings = settings || {};
            delay.delayTime.value =  settings.delayTime || config.delayTime;
            feedback.gain.value = settings.feedback || config.feedback;
            effectLevel.gain.value = settings.effectLevel || config.effectLevel;

            mmNode.input = context.createGain();

            mmNode.connect = function (output) {
                delay.connect(feedback);
                feedback.connect(delay);
                delay.connect(effectLevel);
                mmNode.input.connect(output);
                mmNode.input.connect(delay);
                effectLevel.connect(output);
            };

            mmNode.setPreset = function (settings) {
                settings = settings || {};
                delay.delayTime.value =  settings.delayTime || config.delayTime;
                feedback.gain.value = settings.feedback || config.feedback;
                effectLevel.gain.value = settings.effectLevel || config.effectLevel;
            };

            mmNode.setDelayTime = function (dt) {
                delay.delayTime.value = dt;
            };

            mmNode.setFeedback = function (fb) {
                feedback.gain.value = fb;
            };

            mmNode.setEffectLevel = function (e) {
                effectLevel.gain.value = e;
            }

            return mmNode;
        };

        /*
         * Creates a distortion node.
         *
         * @method createDistortion
         * @param {object} settings
         * @return Created distortion node.
         */
        SoundWorld.prototype.createDistortion = function (settings) {

            /******************************************************

            Distortion
            ==========

            +----------+     +--------------+
            |  Input   |-->--|  Distortion  |
            | (Source) |     | (WaveShaper) |
            +----------+     +--------------+
                                |        | 
                 +-----------------+   +-------------------+
                 | Low-pass Filter |   |  High-pass Filter |
                 |  (BiquadFilter) |   |   (BiquadFilter)  |
                 +-----------------+   +-------------------+
                                |         |
                             +---------------+
                             |     Output    |
                             | (Destination) |
                             +---------------+

            ******************************************************/

            var distortion = context.createWaveShaper(),
                lowpass = context.createBiquadFilter(),
                highpass = context.createBiquadFilter(),
                mmNode = {};

            var config = {
                distortionLevel: 0.5
            };

            // Set values
            settings = settings || {};

            mmNode.input = this.context.createGain();

            mmNode.connect = function (output) {
                mmNode.input.connect(distortion);
                distortion.connect(lowpass);
                distortion.connect(highpass);
                lowpass.connect(output);
                highpass.connect(output);
            };

            mmNode.setDistotionLevel = function (d) {

            };

            mmNode.setTone = function (t) {

            };

            return mmNode;
        };

        /****************
        * createSineWave
        ****************/

        SoundWorld.prototype.createSineWave = function () {
            return this.context.createOscillator();
        };

        /******************
        * createSquareWave
        ******************/

        SoundWorld.prototype.createSquareWave = function () {
            var swNode = this.context.createOscillator();
            swNode.type = 1;
            return swNode;
        };

        /********************
        * createSawtoothWave
        ********************/

        SoundWorld.prototype.createSawtoothWave = function () {
            var swNode = this.context.createOscillator();
            swNode.type = 2;
            return swNode;
        };

        /********************
        * createTriangleWave
        ********************/

        SoundWorld.prototype.createSawtoothWave = function () {
            var swNode = this.context.createOscillator();
            swNode.type = 3;
            return swNode;
        };

        /******************************
        * createFlanger
        * Creates flange effect
        * Y'know, like Come As You Are
        ******************************/

        SoundWorld.prototype.createFlanger = function (settings) {

            /****************************

            Flanger 
            =======

            +----------+
            |  Input   |
            | (Source) |
            +----------+

            *****************************/

            var mmNode = {};

            return mmNode;
        };

        /*************
        * createLFO
        * Creates LFO
        *************/

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

        /*
         * Creates a phaser node.
         *
         * @method createPhaser
         * @param {object} settings Phaser settings
         * @return {AudioNode} Created phaser node.
         */
        SoundWorld.prototype.createPhaser = function (settings) {

            /****************************
            Phaser
            ======
            +----------+     +-----------------+               +-----------------+
            |  Input   |-->--| All-pass Filter |-->--(..n)-->--| All-pass Filter |
            | (Source) |     | (BiquadFilter)  |               |  (BiquadFilter) |
            +----------+     +-----------------+               +-----------------+
                  |                |      |                           |
                  v                v      ʌ                           v 
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

            var mmNode = {},
                allPassFilters = [],
                feedback = this.context.createGain(),
                config = {
                    rate: 8,
                    depth: 0.5
                };

            // Set values
            settings = settings || {};

            feedback.gain.value = 0.8;

            for (var i = 0; i < config.rate; i++) {
                allPassFilters[i] = this.context.createBiquadFilter();
                allPassFilters[i].type = 7;
                allPassFilters[i].frequency.value = 100 * i;
            }

            mmNode.input = this.context.createGain();

            for (var i = 0; i < allPassFilters.length - 1; i++) {
                allPassFilters[i].connect(allPassFilters[i + 1]);
            }

            mmNode.connect = function (output) {
                mmNode.input.connect(output);
                mmNode.input.connect(allPassFilters[0])
                allPassFilters[allPassFilters.length - 1].connect(feedback);
                allPassFilters[allPassFilters.length - 1].connect(output)
                feedback.connect(allPassFilters[0]);
            };

            mmNode.setCutoff = function (c) {
                for (var i = 0; i < allPassFilters.length; i++) {
                    // allPassFilters[i].frequency.value = c;
                }
            };

            return mmNode;
        };

        /*
         * Create a reverb node.
         *
         * @method createReverb
         * @param {object} settings Reverb settings.
         * @return {AudioNode} The created reverb node.
         */
        SoundWorld.prototype.createReverb = function (settings) {

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

            var reverb = context.createConvolver(),
                effectLevel = context.createGain(),
                mmNode = {};

            var config = {
                effectLevel: 0.5,
                reverbTime: 0.5,
                reverbType: 'spring',
                reverbPath: ''
            };

            // Set values
            settings = settings || {};
            effectLevel.gain.value = settings.effectLevel || config.effectLevel;

            this.load({
                'hall': '/effects/reverb/responses/bright-hall.wav',
                'room': '/effects/reverb/responses/medium-room.wav',
                'spring': '/effects/reverb/responses/feedback-spring.wav'
            }, function (buffers) {
                config.reverbPath = buffers[config.reverbType];
                reverb.buffer = config.reverbPath;

                mmNode.input = context.createGain();

                mmNode.connect = function (output) {
                    mmNode.input.connect(output);
                    mmNode.input.connect(reverb);
                    reverb.connect(effectLevel);
                    effectLevel.connect(output);
                };

                mmNode.setEffectLevel = function (e) {
                    effectLevel.gain.value = e;
                }
            });

            return mmNode;
        };

        /*
         * Creates tremolo node.
         *
         * @param {object} settings Tremolo settings.
         * @return {AudioNode} Created tremolo node.
         */
        SoundWorld.prototype.createTremolo = function (settings) {

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
                tremolo = this.context.createGain(),
                lfo = this.createLFO(),
                that = this;

            settings = settings || {};

            mmNode.input = this.context.createGain();

            mmNode.connect = function (output) {
                mmNode.input.connect(output);
                lfo.modulate(mmNode.input.gain);
                lfo.start(that.now())
            };

            mmNode.setRate = function (r) {
                lfo.setFrequency(r);
            };

            mmNode.setDepth = function (r) {
                lfo.setDepth(r);
            };

            return mmNode;
        };

        return function (context) {
            return new SoundWorld(context);
        };
    })();

    // Don't think this is right
    window.SoundWorld = SoundWorld;

})(window);
