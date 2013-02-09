/**********************************
 * Theresas's Sound World - Effects
 * tsw-effects.js
 * Dependencies: tsw-core.js
 * Copyright 2013 Stuart Memo
 **********************************/

 (function (window, undefined) {

   var Effects = (function () {
        /*
         * Creates an instance of Effects
         *
         * @param {AudioContext} Current audio context
         */
        var Effects = function (context) {
            this.context = context;
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
             *
             */

            var delay = context.createDelay(),
                feedback = context.createGain(),
                effectLevel = context.createGain(),
                mmNode = {},
                defaults = {
                    delayTime: 0.5,
                    feedback: 0.5,
                    effectLevel: 0.5,
                };

            // Set values
            settings = settings || {};
            delay.delayTime.value =  settings.delayTime || defaults.delayTime;
            feedback.gain.value = settings.feedback || defaults.feedback;
            effectLevel.gain.value = settings.effectLevel || defaults.effectLevel;

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
                delay.delayTime.value =  settings.delayTime || defaults.delayTime;
                feedback.gain.value = settings.feedback || defaults.feedback;
                effectLevel.gain.value = settings.effectLevel || defaults.effectLevel;
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
         * @param {object} settings Distortion settings.
         * @return Created distortion node.
         */
        SoundWorld.prototype.createDistortion = function (settings) {

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
            var distortion = context.createWaveShaper(),
                lowpass = context.createBiquadFilter(),
                highpass = context.createBiquadFilter(),
                mmNode = {};

            var defaults = {
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

        /*
         * Creates flange effect. Y'know, like in Come As You Are.
         *
         * @method createFlanger
         * @param {object} settings Flanger settings.
         * @return
         */
        SoundWorld.prototype.createFlanger = function (settings) {

            /*
             *  Flanger 
             *  =======
             *  +----------+
             *  |  Input   |
             *  | (Source) |
             *  +----------+
             *
             */

            var mmNode = {};

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

            var mmNode = {},
                allPassFilters = [],
                feedback = this.context.createGain(),
                defaults  = {
                    rate: 8,
                    depth: 0.5,
                    feedback: 0.8
                };

            // Set values
            settings = settings || {};

            feedback.gain.value = settings.gain || defaults.gain;

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

            var defaults = {
                effectLevel: 0.5,
                reverbTime: 0.5,
                reverbType: 'spring',
                reverbPath: ''
            };

            // Set values
            settings = settings || {};
            effectLevel.gain.value = settings.effectLevel || defaults.effectLevel;

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
            return new Effects(context);
        };
    })();

    window.Effects = Effects;

 })(window);
