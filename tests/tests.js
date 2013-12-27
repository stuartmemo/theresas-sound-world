describe('Theresa\'s Sound World', function () {
	describe('Core', function () {

		describe('Audio Context', function () {

			it('Context exists', function () {
				expect(tsw.context.constructor.name).toEqual('AudioContext');
			})
		});

		describe('Output', function () {

			it('Speakers exist', function () {
				expect(tsw.speakers.constructor.name).toEqual('AudioDestinationNode');
			});
		})

		describe('Time', function () {

			it('Now is current context time', function () {
				expect(tsw.context.currentTime).toEqual(tsw.now());
			});
		});

		describe('Create Oscillator', function () {

			it('Node is an OscillatorNode', function () {
				expect(tsw.createOscillator().constructor.name).toEqual('OscillatorNode');
				expect(tsw.createOscillator().nodeType).toEqual('oscillator');
			});

			it('Default type is a sine wave', function () {
				expect(tsw.createOscillator().type).toEqual('sine');
			});

			it('Creates a sine wave.', function () {
				expect(tsw.createOscillator('sine').type).toEqual('sine');
			});

			it('Creates a square wave.', function () {
				expect(tsw.createOscillator('square').type).toEqual('square');
			});

			it('Creates a triangle wave', function () {
				expect(tsw.createOscillator('triangle').type).toEqual('triangle');
			});

			it('Creates a sawtooth wave', function () {
				expect(tsw.createOscillator('sawtooth').type).toEqual('sawtooth');
			});

			it('Creates a sine wave with a certain frequency', function () {
				expect(tsw.createOscillator('sawtooth', 500).frequency.value).toEqual(500);
			});

			it('Sets the frequency', function () {
				var osc = tsw.createOscillator('sine');
				osc.frequency.value = 900;
				expect(osc.frequency.value).toEqual(900);
			});
		});

		describe('Create Gain', function () {

			it('Node should be a GainNode', function () {
				expect(tsw.createGain().constructor.name).toEqual('GainNode');
			});

			it('Default gain value should be 1', function () {
				expect(tsw.createGain().gain.value).toEqual(1);
			});

			it('Set gain value', function () {
				expect(tsw.createGain().gain.value = 0.5).toEqual(0.5);
			});
		});

		describe('Create Noise', function () {

			it('Node nodeType is "noise"', function () {
				expect(tsw.createNoise().nodeType).toEqual('noise');
			});

			it('Default colour is "white"', function () {
				expect(tsw.createNoise().color).toEqual('white');
			});
		});
	});

	describe('Effects', function () {
	});

	describe('Music', function () {
		it('Turns sharp note into equivalent flat note', function () {
			expect(tsw.sharpToFlat('A#')).toEqual('Bb');
			expect(tsw.sharpToFlat('G#')).toEqual('Ab');
		});

		it('Turns flat note into equivalent sharp note', function () {
			expect(tsw.flatToSharp('Db')).toEqual('C#');
			expect(tsw.flatToSharp('Ab')).toEqual('G#');
		});

		it('Returns the frequency of a given note', function () {
			expect(tsw.getFrequency('A4')).toEqual(440.00);
			expect(tsw.getFrequency('a6')).toEqual(1760.00);
			expect(tsw.getFrequency('B2')).toEqual(123.47082531403103);
			expect(tsw.getFrequency('C#3')).toEqual(138.59131548843604);
			expect(tsw.getFrequency('d#3')).toEqual(155.56349186104046);
			expect(tsw.getFrequency('eb3')).toEqual(155.56349186104046);
			expect(tsw.getFrequency('C')).toEqual(261.6255653005986);
			expect(tsw.getFrequency('D#')).toEqual(311.12698372208087);
			expect(tsw.getFrequency('eb')).toEqual(311.12698372208087);
			expect(tsw.getFrequency('Not a note')).toEqual(false);
			expect(tsw.getFrequency(123)).toEqual(false);
		});
	});
});