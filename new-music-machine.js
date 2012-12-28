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

        /***********************************
        * chainNodes
        * Connect an array of nodes in order
        ************************************/

        var chainNodes = function (nodes) {
            var numberOfNodes = nodes.length - 1;

            for (var i = 0; i < numberOfNodes; i++) {
                console.log('connecting: ' + nodes[i])
                console.log(' to: ' + nodes[i + 1]);
                nodes[i].connect(nodes[i + 1]);
            }
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
        * playBuffer
        * Play preloaded buffer
        **********************/

        MusicMachine.prototype.playBuffer = function (buffer) {
            var source = context.createBufferSource();

            source.buffer = buffer;
            source.connect(this.context.destination);
            source.start(this.now());
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

        /*************
        * createLFO
        * Creates LFO
        *************/

        MusicMachine.prototype.createLFO = function (settings) {

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
                that = this;

            var config = {};

            // Set values
            settings = settings || {
                frequency: 10,
                waveType: 'TRIANGLE'
            };

            lfo.frequency.value = settings.frequency || config.frequency;
            lfo.type = lfo[settings.waveType];

            mmNode.input = this.context.createGain();

            mmNode.modulate = function (target) {
                lfo.connect(target);
            };

            mmNode.setFrequency = function (f) {
                lfo.frequency.value = f;
            };

            mmNode.start = function () {
                lfo.start(that.now());
            };

            mmNode.stop = function () {
                lfo.stop(this.context.now());
            };

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

            *****************************/

            var mmNode = {},
                allPassFilters = [],
                feedback = this.context.createGain();

            var config = {
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

            //chainNodes(allPassFilters);

            mmNode.connect = function (output) {
                mmNode.input.connect(output);
                mmNode.input.connect(allPassFilters[0])
                allPassFilters[allPassFilters.length - 1].connect(feedback);
                allPassFilters[allPassFilters.length - 1].connect(output)
                feedback.connect(allPassFilters[0]);
            };

            mmNode.setCutoff = function (c) {
                for (var i = 0; i < allPassFilters.length; i++) {
//                    allPassFilters[i].frequency.value = c;
                }
            }

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

        /****************
        * createTremolo
        * Creates tremolo
        ****************/

        MusicMachine.prototype.createTremolo = function (settings) {

            /******************************

            Tremolo
            =======
            +---------+     +-------------+
            |   LFO   |-->--|   Any Node  |
            |         |     | (Amplitude) |
            +---------+     +-------------+

            ******************************/

            var mmNode = {},
                tremolo = this.context.createGain(),
                lfo = this.createLFO(),
                that = this;

            var config = {};

            // Set values
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

            return mmNode;
        };

        /*****************
        * createVibrato
        * Creates vibrato 
        *****************/

        MusicMachine.prototype.createVibrato = function (settings) {

            /******************************

            Vibrato
            =======
            +---------+     +-------------+
            |   LFO   |-->--|   Any Node  |
            |         |     | (Frequency) |
            +---------+     +-------------+

            ******************************/

            var mmNode = {};

            return mmNode;
        };

        return function (context) {
            return new MusicMachine(context);
        };
    })();

    window.MusicMachine = MusicMachine;

})(window);