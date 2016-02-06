'use strict';

var expect = chai.expect;

describe('Midi', function () {
    it('Gets note name from given number', function () {
        expect(tsw.midiNote(0)).to.eq('C0');
        expect(tsw.midiNote(48)).to.eq('C4');
        expect(tsw.midiNote(30)).to.eq('F#2');
        expect(tsw.midiNote(111)).to.eq('D#9');
    });

    it('Gets midi number from given note name', function () {
        expect(tsw.midiNote('C0')).to.eq(0);
        expect(tsw.midiNote('C4')).to.eq(48);
        expect(tsw.midiNote('F#2')).to.eq(30);
        expect(tsw.midiNote('d#9')).to.eq(111);
    });
});
