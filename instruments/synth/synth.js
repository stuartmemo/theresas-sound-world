/*****************
* Basic Synth    *
* by Stuart Memo *
*****************/

(function (window, undefined) {

    var Synth = (function (tsw) {

        var Synth = function (outputNode) {
            this.version = '0.0.1';
            this.output = outputNode;
        };

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

        /*
         * Play given note on synth
         * @param {note} string Musical note to play
         * @param {startTime} number Context time to play note (in seconds)
         * @param {endTime} number Context time to end note (in seconds)
         */
        Synth.prototype.playNote = function (noteObj) {
            var gainNode = tsw.createGainNode(0.5),
                osc1 = tsw.createOscillator('triangle'),
                osc2 = tsw.createOscillator('sawtooth'),
                frequency = getFrequency(noteObj.note); 

            osc1.frequency.value = frequency;
            osc2.frequency.value = frequency;
            gainNode.gain.value = noteObj.volume;

            tsw.connect([osc1, osc2], gainNode, tsw.speakers);
            tsw.play([osc1, osc2], noteObj.startTime, noteObj.stopTime);
        };

        return function (context, outputNode) {
            return new Synth(context, outputNode);
        };
    })();

    window.Synth = Synth;

})(window);
