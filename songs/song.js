var context = new webkitAudioContext(),
    drumMachine = new DrumMachine(context),
    synth = new Synth(context),
    sequencer = new Sequencer(context);

var kit808 = {
        kitName: '808',
        path: '/instruments/drum-machine/samples/808/',
        samples: {
            kick: 'kick.ogg',
            snare: 'snare.ogg',
            clap: 'clap.ogg',
            hiHat: 'chh.ogg'
        }
    };

// Song
var song = {
    meta: {
        title: 'My first song',
        author: 'Stuart Memo'
    },
    settings: {
        bpm: 120,
        beatsPerBar: 4,
        muted: false
    },
    patterns: {
        drumIntro: {
            steps: 8,
            sequence: [
                ['kick', '*', ['*', 'snare'], '*', '*', '*', ['*', 'snare'], 'kick'],
                ['hiHat', 'hiHat', '*', '*', ['hiHat', 'clap'], '*', '*', ]
            ]
        },
        drumVerse: {
            sequence: [] 
        },
        synthIntro: {
            length: 16,
            steps: 4,
            sequence: [
                ['C3', '-' ,'-' ,'-', '-' ],
                [['E3', 'C2'], '']
            ]
        }
    },
    tracks: {
        drums: {
            instrument: drumMachine,
            pan: -23,
            sequence: {
                drumIntro: [0, 1, 2],
                drumVerse: [3]
            }
        },
        synth: {
            instrument: synth,
            pan: +24,
            sequence: {
                synthIntro: [0, 1, 2]
            }
        }
    }
};

drumMachine.loadKit(kit808, function () {
    sequencer.loadSong(song, function () {
        document.getElementById()
        this.playSong();
    });
});
