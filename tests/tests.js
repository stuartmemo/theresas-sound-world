'use strict';
/*global describe:true*/
/*global expect:true*/
/*global it:true*/
/*global runs:true*/
/*global tsw:true*/
/*global waits:true*/

describe('Theresa\'s Sound World', function () {
	describe('Core', function () {

		describe('Audio Context', function () {

			it('Context exists', function () {
				expect(typeof tsw.context).toEqual('function');
			});
		});

		describe('Output', function () {
			it('Speakers exist', function () {
				expect(typeof tsw.speakers).toEqual('object');
			});
		});

		describe('Time', function () {

			it('Now is current context time', function () {
				expect(tsw.context().currentTime).toEqual(tsw.now());
			});
		});

		describe('Nodes', function () {
			it('Can create node', function () {
				expect(tsw.createNode().nodeType()).toEqual('default');
			});
		});

        describe('Browser Support', function () {
            it('Browser is supported', function () {
                expect(tsw.isBrowserSupported).toEqual(true);
            });
        });

        describe('Create Buffer', function () {
            it('Node is a Buffer', function () {
                expect(tsw.buffer().nodeType()).toEqual('buffer');
            });
        });

		describe('Create Oscillator', function () {

			it('Node is an OscillatorNode', function () {
				expect(tsw.oscillator().nodeType()).toEqual('oscillator');
			});

			it('Default type is a sine wave', function () {
				expect(tsw.oscillator().type()).toEqual('sine');
			});

			it('Creates a sine wave.', function () {
				expect(tsw.oscillator('sine').type()).toEqual('sine');
			});

			it('Creates a square wave.', function () {
				expect(tsw.oscillator('square').type()).toEqual('square');
			});

			it('Creates a triangle wave', function () {
				expect(tsw.oscillator('triangle').type()).toEqual('triangle');
			});

			it('Creates a sawtooth wave', function () {
				expect(tsw.oscillator('sawtooth').type()).toEqual('sawtooth');
			});

			it('Creates a sine wave with a certain frequency', function () {
				var osc = tsw.oscillator('sawtooth', 500);
				expect(osc.frequency()).toEqual(500);
			});

			it('Sets the frequency', function () {
				var osc = tsw.oscillator('sine');
				osc.frequency.value = 900;
				expect(osc.frequency.value).toEqual(900);
			});
		});

		describe('Create Gain', function () {

			it('Node should be a GainNode', function () {
				expect(tsw.gain().nodeType()).toEqual('gain');
			});

			it('Default gain value should be 1', function () {
				expect(tsw.gain().gain()).toEqual(1);
			});

			it('Create gain node with different gain level than default', function () {
				expect(tsw.gain(0.5).gain()).toEqual(0.5);
			});

			it('Create gain node and change gain level after creation', function () {
				var volume = tsw.gain();
				volume.gain(0.2);
				expect(volume.gain()).toEqual(0.20000000298023224);
			});
		});

		describe('Create Delay', function () {

			it('Node should be a delay node', function () {
				expect(tsw.wait().nodeType()).toEqual('delay');
			});

			it('Default delayTime value should be 1', function () {
				expect(tsw.wait().delayTime()).toEqual(1);
			});

			it('Create delay node with different delayTime than default', function () {
				expect(tsw.wait(0.5).delayTime()).toEqual(0.5);
			});

			it('Create delay node and change delayTime after creation', function () {
				var delay = tsw.wait();
				delay.delayTime(0.2);
				expect(delay.delayTime()).toEqual(0.20000000298023224);
			});
		});

        describe('Create Filter', function () {

        });

        describe('Create Compressor', function () {
            it('Check compressor node type', function () {
                expect(tsw.compressor().nodeType()).toEqual('compressor');
            });
        });

        describe('Create Envelope', function () {
            it('Envelope behaves correctly', function () {
                var osc = tsw.oscillator(),
                    volume = tsw.gain(),
                    envelope = tsw.envelope({
                        param: volume.params.gain,
                        startLevel: 0,
                        maxLevel: 1,
                        sustainLevel: 0.6,
                        attackTime: 1.1,
                        decayTime: 1,
                        autoStop: false
                    });

                tsw.connect(osc, volume, tsw.speakers);

                osc.start(tsw.now());
                osc.stop(tsw.now() + 8);

                // Start Level
                expect(volume.gain()).toEqual(0);

                beforeEach(function(done) {
                    setTimeout(function () {
                        envelope.start();
                        done();
                    }, 1000);
                });
=======
            var osc = tsw.oscillator(),
                volume = tsw.gain(),
                envelope = tsw.envelope({
                    param: volume.params.gain,
                    startLevel: 0,
                    maxLevel: 1,
                    sustainLevel: 0.6,
                    attackTime: 1.1,
                    decayTime: 1,
                    autoStop: false
                });

            tsw.connect(osc, volume, tsw.speakers);

            osc.start(tsw.now());
            osc.stop(tsw.now() + 8);

            // Start Level
            envelope.start();

            waits(1000);

            // Attack
            runs(function () {
                expect(volume.gain()).toBeGreaterThan(0);
            });
>>>>>>> b1f9da4d2adf0e0091efb0b6e1e1cf58dfcf5ad6

                // Attack
                it('Should attack', function () {
                    expect(volume.gain()).toBeGreaterThan(0);
                    done();
                });

                // Decay
                runs(function () {
                    expect(parseFloat(volume.gain().toFixed(1))).toBeLessThan(1);
                });


                // Sustain
                runs(function () {
                    expect(parseFloat(volume.gain().toFixed(1))).toEqual(0.6);
                });


                // Still sustaining?
                runs(function () {
                    expect(parseFloat(volume.gain().toFixed(1))).toEqual(0.6);
                    envelope.startRelease();
                    console.log('Starting release',tsw.now());
                });


                // Release
                runs(function () {
                    expect(volume.gain()).toBeLessThan(0.6);
                });

                expect(tsw.envelope().nodeType()).toEqual('envelope');

            });
        });

		describe('Create Noise', function () {

			it('Node nodeType is "noise"', function () {
				expect(tsw.noise().nodeType()).toEqual('noise');
			});

			it('Default colour is "white"', function () {
				expect(tsw.noise().color()).toEqual('white');
			});
		});

		describe('Load files', function () {

			it('Load some mp3s', function () {
<<<<<<< HEAD
                runs(function () {
                    tsw.load({
                        files: {
                            sample_one: 'samples/tsw1.mp3',
                            sample_two: 'samples/tsw2.mp3',
                            sample_three: 'samples/tsw3.mp3',
                        }
                    }, function (success) {
                        expect(Object.keys(success).length).toEqual(3);
                    });
                });
=======
				tsw.load({
					files: {
						sampleOne: 'samples/tsw1.mp3',
						sampleTwo: 'samples/tsw2.mp3',
						sampleThree: 'samples/tsw3.mp3',
					}
				}, function (success) {
					expect(Object.keys(success).length === 3);
				});
>>>>>>> b1f9da4d2adf0e0091efb0b6e1e1cf58dfcf5ad6
			});

			it('Load some files that don\'t exist', function () {
				tsw.load({
                    files: {
                        sampleOne: 'samples/nope1.mp3',
                        sampleTwo: 'samples/nope2.mp3',
                        sampleThree: 'samples/nope3.mp3',
                    }
				}, function () {
                    // do nothing
				}, function () {
                    //expect(true).toEqual(true);
                });
			});
		});

		describe('Fade In', function () {

			it('Oscillator node fades in', function () {
				var osc = tsw.oscillator(),
					mute = tsw.gain(0);

				expect(osc.output.gain.value).toEqual(1);
				tsw.connect(osc, mute, tsw.speakers);
				osc
					.start(tsw.now())
					.fadeIn();

				osc.stop(tsw.now() + 3);

				waits(3000);

				runs(function () {
					expect(osc.output.gain.value).toEqual(1);
				});
			});
		});

		describe('Fade Out', function () {

			it('Oscillator node fades out', function () {
				var osc = tsw.oscillator(),
					mute = tsw.gain(0);

				expect(osc.output.gain.value).toEqual(1);
				tsw.connect(osc, mute, tsw.speakers);
				osc
					.start(tsw.now())
					.fadeOut();

				waits(3000);

				runs(function () {
					expect(osc.output.gain.value).toEqual(0);
				});
			});
		});
	});

	describe('Effects', function () {

        it('Create delay effect', function () {
            // tsw.delay();
        });

        it('Create phaser effect', function () {
            // tsw.phaser();
        });

        it('Create tremolo effect', function () {
            // tsw.tremolo();
        });
	});

	describe('Music', function () {
		it('Turns sharp note into equivalent flat note', function () {
			expect(tsw.flat('A#')).toEqual('Bb');
			expect(tsw.flat('G#')).toEqual('Ab');
		});

		it('Turns flat note into equivalent sharp note', function () {
			expect(tsw.sharp('Db')).toEqual('C#');
			expect(tsw.sharp('Ab')).toEqual('G#');
		});

		it('Returns the frequency of a given note', function () {
			expect(tsw.frequency('A4')).toEqual(440.00);
			expect(tsw.frequency('a6')).toEqual(1760.00);
			expect(tsw.frequency('B2')).toEqual(123.47082531403103);
			expect(tsw.frequency('C#3')).toEqual(138.59131548843604);
			expect(tsw.frequency('d#3')).toEqual(155.56349186104046);
			expect(tsw.frequency('eb3')).toEqual(155.56349186104046);
			expect(tsw.frequency('C')).toEqual(261.6255653005986);
			expect(tsw.frequency('D#')).toEqual(311.12698372208087);
			expect(tsw.frequency('eb')).toEqual(311.12698372208087);
			expect(tsw.frequency('Not a note')).toEqual(false);
			expect(tsw.frequency(123)).toEqual(false);
		});

        it('Get notes from given chord', function () {
            expect(tsw.chord('C', 'major')).toEqual(['C', 'E', 'G', 'C']);
            expect(tsw.chord('c')).toEqual(['C', 'E', 'G', 'C']);
        });

        it('Get scale from given note', function () {
            expect(tsw.scale ('C', 'major')).toEqual([ 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'C' ]);
            expect(tsw.scale('D', 'minor')).toEqual([ 'D', 'E', 'F', 'G', 'A', 'A#', 'C', 'D']);
        });
	});

	describe('Midi', function () {
		it('Gets note name from given number', function () {
	        expect(tsw.midiNote(0)).toEqual('C0');
	        expect(tsw.midiNote(48)).toEqual('C4');
	        expect(tsw.midiNote(30)).toEqual('F#2');
		});
	});
});
