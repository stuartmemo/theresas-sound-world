/*****************
* Drum Machine   *
* by Stuart Memo *
*****************/

(function (window, undefined) {

    var DrumMachine = (function () {

        var DrumMachine = function (context, outputNode) {
            this.context = context;
            this.version = '0.0.1';
            this.output = outputNode || context.destination;
            this.bpm = 120;
        };  

        var createPlayFunction = function (bufferName, buffer, that) {
            that[bufferName] = function (time) {
                var source = context.createBufferSource();
                    source.buffer = buffer;
                    source.connect(context.destination);
                    source.start(time);
            }
        };

        DrumMachine.prototype.playNote = function (note, time) {
            this[note](time);
        };

        DrumMachine.prototype.stopNote = function (note, time) {
            // do nothing
        };

        DrumMachine.prototype.loadKit = function (kit, callback) {
            var returnObj = {},
                filesLoaded = 0,
                numberOfFiles = Object.keys(kit).length,
                path = kit.path || '',
                that = this;

            var loadFile = function (fileKey, filePath, returnObj, callback) {
                var request = new XMLHttpRequest();

                request.open('GET', path + filePath, true);
                request.responseType = 'arraybuffer';

                request.onload = function () {
                    that.context.decodeAudioData(request.response, function (decodedBuffer) {
                        returnObj[fileKey] = decodedBuffer;

                        createPlayFunction(fileKey, returnObj[fileKey], that);

                        if (filesLoaded === numberOfFiles) {
                            callback(returnObj);
                        }
                        
                        filesLoaded++;
                    });
                };

                request.send();
            };

            for (var sample in kit.samples) {
                loadFile(sample, kit.samples[sample], returnObj, callback);
            }
        };

        return function (context, outputNode) {
            return new DrumMachine(context, outputNode);
        };
    })();

    window.DrumMachine = DrumMachine;

})(window);
