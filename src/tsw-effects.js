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
