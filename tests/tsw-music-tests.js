'use strict';

var expect = chai.expect;

describe('Music', function () {
    it('Turns sharp note into equivalent flat note', function () {
        expect(tsw.flat('A#')).to.eq('Bb');
        expect(tsw.flat('G#')).to.eq('Ab');
    });

    it('Turns flat note into equivalent sharp note', function () {
        expect(tsw.sharp('Db')).to.eq('C#');
        expect(tsw.sharp('Ab')).to.eq('G#');
    });

    it('Returns the frequency of a given note', function () {
        expect(tsw.frequency('A4')).to.eq(440.00);
        expect(tsw.frequency('a6')).to.eq(1760.00);
        expect(tsw.frequency('B2')).to.eq(123.47082531403103);
        expect(tsw.frequency('C#3')).to.eq(138.59131548843604);
        expect(tsw.frequency('d#3')).to.eq(155.56349186104046);
        expect(tsw.frequency('eb3')).to.eq(155.56349186104046);
        expect(tsw.frequency('C')).to.eq(261.6255653005986);
        expect(tsw.frequency('D#').toFixed(2)).to.eq((311.12698372208087).toFixed(2));
        expect(tsw.frequency('eb').toFixed(2)).to.eq((311.12698372208087).toFixed(2));
        expect(tsw.frequency('Not a note')).to.eq(false);
        expect(tsw.frequency(123)).to.eq(false);
    });

    it('Get notes from given chord', function () {
        expect(tsw.chord('C', 'major')).to.eql(['C', 'E', 'G', 'C']);
        expect(tsw.chord('c')).to.eql(['C', 'E', 'G', 'C']);
    });

    it('Get scale from given note', function () {
        expect(tsw.scale ('C', 'major')).to.eql([ 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C' ]);
        expect(tsw.scale('D', 'minor')).to.eql([ 'D', 'E', 'F', 'G', 'A', 'A#', 'C', 'D']);
    });
});
