var context = new webkitAudioContext(),
    drumMachine = new DrumMachine(context),
    sequencer = new Sequencer(context);

var kit808 = {
        kitName: '808',
        path: '/samples/808/',
        samples: {
            kick: 'kick.ogg',
            snare: 'snare.ogg',
            clap: 'clap.ogg'
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
            sequence: {
                kick:   [0, 1, 2, 3, 4, 5, 6, 7],
                snare: [0, 4, 8]
            }
        },
        drumVerse: {
            sequence: {}
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
        }
    }
};

drumMachine.loadKit(kit808, function () {
    sequencer.loadSong(song, function () {
        this.playSong();
    });
});
