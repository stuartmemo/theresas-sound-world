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
        var Effects = function (tsw) {
            this.context = tsw.context;
            this.tsw = tsw;
        };

        /*
         * Creates compressor node.
         *
         * @method createCompressor
         * @param {object} settings Compressor settings.
         * @return Created compressor node.
         */
        Effects.prototype.createCompressor = function (settings) {

            /*
             *  Compressor 
             *  ==========
             *  +----------+     +----------------------+     +---------------+
             *  |  Input   |-->--|       Compressor     |-->--|     Output    |
             *  | (Source) |     | (DynamicsCompressor) |     | (Destination) |
             *  +----------+     +----------------------+     +---------------+
             */ 

            var effectObj = {},
                compressor = this.context.createDynamicsCompressor();

            effectObj.input = this.context.createGain(),
            effectObj.output = this.context.createGain(),
            effectObj.settings = settings || {};

            this.tsw.connect(effectObj.input, compressor, effectObj.output);

           return effectObj;
        };

        /*
         * Creates delay node.
         *
         * @method createDelay
         * @param {object} settings Delay settings.
         * @return {AudioNode} Created delay node.
         */
        Effects.prototype.createDelay = function (settings) {

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

            var effect = {},
                delay = this.context.createDelay(),
                feedback = this.context.createGain(),
                effectLevel = this.context.createGain(),
                gain = this.context.createGain();

            effect.input = this.context.createGain();
            effect.output = this.context.createGain();
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

            this.tsw.connect(effect.input, gain, delay, feedback, delay, effectLevel, effect.output);
            this.tsw.connect(gain, delay)

            return effect;
        };

        /*
         * Creates a distortion node.
         *
         * @method createDistortion
         * @param {object} settings Distortion settings.
         * @return Created distortion node.
         */
        Effects.prototype.createDistortion = function (settings) {

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
                distortion = context.createWaveShaper(),
                lowpass = context.createBiquadFilter(),
                highpass = context.createBiquadFilter();

            effect.settings = {
                distortionLevel: 0.5
            };

            // Set values
            settings = settings || {};

            effect.input = this.context.createGain();
            effect.output = this.context.createGain();

            this.tsw.connect(effect.input, distortion, [lowpass, highpass], effect.output);

            return effect;
        };

        /*
         * Creates flange effect. Y'know, like in Come As You Are.
         *
         * @method createFlanger
         * @param {object} settings Flanger settings.
         * @return
         */
        Effects.prototype.createFlanger = function (settings) {

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
        Effects.prototype.createPhaser = function (settings) {

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

            effect.input = this.context.createGain();
            effect.output = this.context.createGain();

            for (var i = 0; i < allPassFilters.length - 1; i++) {
                this.tsw.connect(allPassFilters[i], allPassFilters[i + 1]);
            }

            this.tsw.connect(effect.input, allPassFilters[0], allPassFilters[allPassFilters.length - 1], feedback, allPassFilters[0]);
            this.tsw.connect(allPassFilters[allPassFilters.length - 1], effect.output);

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
        Effects.prototype.createReverb = function (settings) {

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
        Effects.prototype.createTremolo = function (settings) {

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

    window.tswEffects = Effects;

 })(window);
