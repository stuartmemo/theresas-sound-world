/****************************
* New Music Machine
* Audio effects library
* Copyright 2012 Stuart Memo
*****************************/

(function (window, undefined) {

    var MusicMachine = (function () {

        var MusicMachine = function (context) {
            this.context = context;
            this.version = '0.0.1';
        };

        MusicMachine.prototype.now = function () {
            return this.context.currentTime;
        };

        /**************
        * loadFiles
        * Asset manager
        ***************/

        MusicMachine.prototype.loadFiles = function (files, callback) {
            var returnObj = {},
                filesLoaded = 0,
                numberOfFiles = 0;

            var loadFile = function (fileKey, filePath, returnObj, callback) {
                var request = new XMLHttpRequest();

                request.open('GET', filePath, true);
                request.responseType = 'arraybuffer';

                request.onload = function () {
                    filesLoaded++;

                    context.decodeAudioData(request.response, function (decodedBuffer) {
                        returnObj[fileKey] = decodedBuffer;

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

        /**********************
        * createCompressor
        * Creates compressor
        ***********************/

        MusicMachine.prototype.createCompressor = function (settings) {

            /**************************************************************

            Compressor 
            ==========

            +----------+     +----------------------+     +---------------+
            |  Input   |-->--|       Compressor     |-->--|     Output    |
            | (Source) |     | (DynamicsCompressor) |     | (Destination) |
            +----------+     +----------------------+     +---------------+

            **************************************************************/

            var mmNode = {},
                compressor = context.createDynamicsCompressor();

            var config = {};     

            // Set values

            settings = settings || {};

            mmNode.input = context.createGain()

            mmNode.connect = function (output) {
                mmNode.connect(compressor);
                compressor.connect(output);
            };

            return mmNode;
        };

        /****************************
        * createDistortion 
        * Creates a distortion effect
        *****************************/

        MusicMachine.prototype.createDistortion = function (settings) {

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

            mmNode.input = context.createGain();

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

        /**********************
        * createFlanger
        * Creates flange effect
        ***********************/

        MusicMachine.prototype.createFlanger = function (settings) {

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

        /**********************
        * createPhaser
        * Creates phaser effect
        ***********************/

        MusicMachine.prototype.createPhaser = function (settings) {

            /****************************

            Phaser
            ======

            +----------+
            |  Input   |
            | (Source) |
            +----------+

            *****************************/

            var mmNode = {};

            return mmNode;

        };

        /**********************
        * createReverb
        * Creates reverb effect
        ***********************/

        MusicMachine.prototype.createReverb = function (settings) {

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

            this.loadFiles({
                'hall': 'samples/bright-hall.wav',
                'room': 'samples/medium-room.wav',
                'spring': 'samples/feedback-spring.wav'
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

        /********************
        * createDelay
        * Creates delay effect
        *********************/ 

        MusicMachine.prototype.createDelay = function (settings) {

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

            **********************************************/

            var delay = context.createDelay(),
                feedback = context.createGain(),
                effectLevel = context.createGain(),
                mmNode = {};

            var config = {
                delayTime: 0.5,
                feedback: 0.5,
                effectLevel: 0.5,
            };

            // Set values
            settings = settings || {};
            delay.delayTime.value =  settings.delayTime || config.delayTime;
            feedback.gain.value = settings.feedback || config.feedback;
            effectLevel.gain.value = settings.effectLevel || config.effectLevel;

            // Set up connectections
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(effectLevel);

            mmNode.input = context.createGain();

            mmNode.connect = function (output) {
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

        return function (context) {
            return new MusicMachine(context);
        };
    })();

    window.MusicMachine = MusicMachine;

})(window);