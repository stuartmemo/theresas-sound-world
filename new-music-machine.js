/*******************
* New Music Machine
* by Stuart Memo
********************/

(function (window, undefined) {

    var MusicMachine = (function () {

        var MusicMachine = function (context) {
            this.context = context;
            this.version = '0.0.1';
        };

        MusicMachine.prototype.now = function () {
            return context.currentTime;
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
        * createReverb
        * Creates reverb effect
        ***********************/

        MusicMachine.prototype.createReverb = function (settings) {

            /***********************************

            Reverb effect
            =============

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