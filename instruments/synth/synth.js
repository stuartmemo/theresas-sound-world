/*****************
* Basic Synth    *
* by Stuart Memo *
*****************/

(function (window, undefined) {

    var Synth = (function () {

        var Synth = function (context, outputNode) {
            this.context = context;
            this.version = '0.0.1';
            this.output = outputNode || context.destination;
        };

        var connectedNodes = [];

        var getFrequency = function (note) {
            var notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
                octave,
                keyNumber;
         
            if (note.length === 3) {
                octave = note.charAt(2);
            } else {
                octave = note.charAt(1);
            }
         
            keyNumber = notes.indexOf(note.slice(0, -1));
         
            if (keyNumber < 3) {
                keyNumber = keyNumber + 12 + ((octave - 1) * 12) + 1; 
            } else {
                keyNumber = keyNumber + ((octave - 1) * 12) + 1; 
            }
         
            // Return frequency of note
            return 440 * Math.pow(2, (keyNumber- 49) / 12);
        };

        Synth.prototype.playNote = function (note, startTime, endTime) {
            var gainNode = this.context.createGainNode(),
                osc1 = this.context.createOscillator(),
                osc2 = this.context.createOscillator(),
                frequency;

            frequency = getFrequency(note); 

            osc1.frequency.value = frequency;
            osc2.frequency.value = frequency;
            gainNode.gain.value = 0.5;

            osc1.type = 1;
            osc2.type= 2;

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(this.context.destination);

            connectedNodes.push(osc1, osc2);

            osc1.start(startTime);
            osc2.start(startTime);

            osc1.stop(endTime);
            osc2.stop(endTime);
        };

        return function (context, outputNode) {
            return new Synth(context, outputNode);
        };
    })();

    window.Synth = Synth;

})(window);