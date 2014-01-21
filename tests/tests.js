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

		describe('Nodes', function () {
			it('Can create node', function () {
				expect(tsw.createNode().nodeType).toEqual('default');
			});
		});

        describe('Browser Support', function () {
            it('Browser is supported', function () {
                expect(tsw.isBrowserSupported).toEqual(true);
            });
        });

        describe('Create Buffer', function () {
            it('Node is a Buffer', function () {
                expect(tsw.createBuffer().nodeType).toEqual('buffer');
            });
        });

		describe('Create Oscillator', function () {

			it('Node is an OscillatorNode', function () {
				expect(tsw.createOscillator().nodeType).toEqual('oscillator');
			});

			it('Default type is a sine wave', function () {
				expect(tsw.createOscillator().waveType).toEqual('sine');
			});

			it('Creates a sine wave.', function () {
				expect(tsw.createOscillator('sine').waveType).toEqual('sine');
			});

			it('Creates a square wave.', function () {
				expect(tsw.createOscillator('square').waveType).toEqual('square');
			});

			it('Creates a triangle wave', function () {
				expect(tsw.createOscillator('triangle').waveType).toEqual('triangle');
			});

			it('Creates a sawtooth wave', function () {
				expect(tsw.createOscillator('sawtooth').waveType).toEqual('sawtooth');
			});

			it('Creates a sine wave with a certain frequency', function () {
				var osc = tsw.createOscillator('sawtooth', 500);
				expect(osc.frequency()).toEqual(500);
			});

			it('Sets the frequency', function () {
				var osc = tsw.createOscillator('sine');
				osc.frequency.value = 900;
				expect(osc.frequency.value).toEqual(900);
			});
		});

		describe('Create Gain', function () {

			it('Node should be a GainNode', function () {
				expect(tsw.createGain().nodeType).toEqual('gain');
			});

			it('Default gain value should be 1', function () {
				expect(tsw.createGain().gain()).toEqual(1);
			});

			it('Create gain node with different gain level than default', function () {
				expect(tsw.createGain(0.5).gain()).toEqual(0.5);
			});

			it('Create gain node with different gain level than default using object syntax', function () {
				var volume = tsw.createGain();
				volume.gain(0.2);
				expect(volume.gain()).toEqual(0.2);
			});
		});

        describe('Create Filter', function () {
            it('Node should be a Filter', function () {
                expect(tsw.createFilter().nodeType).toEqual('filter');
            });

            it('Creates a lowpass filter by default', function () {
                expect(tsw.createFilter().type()).toEqual('lowpass');
            });

            it('Create a highpass filter by passing string', function () {
                expect(tsw.createFilter('highpass').type()).toEqual('highpass');
            });

            it('Create a highpass filter by changing filter type', function () {
                var filter = tsw.createFilter();
                filter.type('highpass');
                expect(filter.type()).toEqual('highpass');
            });

            it('Filter cut-off frequency should default to 1000', function () {
                expect(tsw.createFilter().frequency()).toEqual(1000);
            });

            it('Sets filter frequency', function () {
                var filter = tsw.createFilter();
                filter.frequency(500);
                expect(filter.frequency()).toEqual(500);
            });

            it('Filter Q should default to 0', function () {
                expect(tsw.createFilter().Q()).toEqual(0);
            });

            it('Sets Q', function () {
                var filter = tsw.createFilter();
                filter.Q(5);
                expect(filter.Q()).toEqual(5);
            });

            it('Create filter with options object', function () {
                var filter = tsw.createFilter(
                    {
                        frequency: 500,
                        type: 'notch',
                        Q: 10
                    }
                );
                expect(filter.frequency()).toEqual(500);
                expect(filter.type()).toEqual('notch');
                expect(filter.Q()).toEqual(10);
            });
        });

        describe('Create Compressor', function () {
            expect(tsw.createCompressor().nodeType).toEqual('compressor');
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
			expect(tsw.music.getFlat('A#')).toEqual('Bb');
			expect(tsw.music.getFlat('G#')).toEqual('Ab');
		});

		it('Turns flat note into equivalent sharp note', function () {
			expect(tsw.music.getSharp('Db')).toEqual('C#');
			expect(tsw.music.getSharp('Ab')).toEqual('G#');
		});

		it('Returns the frequency of a given note', function () {
			expect(tsw.music.getFrequency('A4')).toEqual(440.00);
			expect(tsw.music.getFrequency('a6')).toEqual(1760.00);
			expect(tsw.music.getFrequency('B2')).toEqual(123.47082531403103);
			expect(tsw.music.getFrequency('C#3')).toEqual(138.59131548843604);
			expect(tsw.music.getFrequency('d#3')).toEqual(155.56349186104046);
			expect(tsw.music.getFrequency('eb3')).toEqual(155.56349186104046);
			expect(tsw.music.getFrequency('C')).toEqual(261.6255653005986);
			expect(tsw.music.getFrequency('D#')).toEqual(311.12698372208087);
			expect(tsw.music.getFrequency('eb')).toEqual(311.12698372208087);
			expect(tsw.music.getFrequency('Not a note')).toEqual(false);
			expect(tsw.music.getFrequency(123)).toEqual(false);
		});

        it('Get notes from given chord', function () {
            expect(tsw.music.getChord('C', 'major')).toEqual(['C', 'E', 'G', 'C']);
            expect(tsw.music.getChord('c')).toEqual(['C', 'E', 'G', 'C']);
        });

        it('Get scale from given note', function () {
            expect(tsw.music.getScale('C', 'major')).toEqual([ 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C' ]);
            expect(tsw.music.getScale('D', 'minor')).toEqual([ 'D', 'E', 'F', 'G', 'A', 'A#', 'C', 'D']);
        });
	});

	describe('MIDI', function () {
        expect(tsw.midi.getNote(48)).toEqual('C3'); 
	});
});
