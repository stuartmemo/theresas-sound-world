/*******************************
 * Theresas's Sound World - Loop
 * tsw-loop.js
 * Copyright 2014 Stuart Memo
 *******************************/

'use strict';

var tsw = {};

// Build a worker from an anonymous function body.
if (typeof URL !== 'undefined' && URL.createObjectURL) {
    var blobURL = URL.createObjectURL(
            new Blob(
                [ '(',
                    function () {
                        //Long-running work here
                        self.addEventListener('message', function (e) {

                            if (e.data === 'start') {
                                setInterval(function () {
                                    self.postMessage('tick');
                                }, 25);
                            }
                        });
                    }.toString(),
                ')()' ],
                { type: 'application/javascript' }
            )
    );

    var worker = new Worker(blobURL, { type: 'module' });

    URL.revokeObjectURL(blobURL);
}

tsw.secondsPerBeat = function (bpm) {
    return 60 / bpm;
};

/*
Usage
===========
tsw.loop(function (stepTime) {
   osc.start(stepTime);
}, 120, 4);
*/
tsw.loop = function (callback, bpm, steps) {
    var nextStepTime,
        currentStep = 0,
        scheduleAheadTime = 0.1,
        stepsPerBar,
        stepsPerBarRatio;

    bpm = bpm || 120;
    steps = steps || 16;
    stepsPerBar = steps / 4;
    stepsPerBarRatio = 1 / stepsPerBar;

    nextStepTime = tsw.now();
    worker.postMessage('start');

    worker.addEventListener('message', function (e) {
        // Tick gets sent every 100ms from the worker.
        if (e.data === 'tick') {
            while (nextStepTime < tsw.now() + scheduleAheadTime) {
                callback(nextStepTime, currentStep + 1);

                // 4 steps in each beat for 16th's.
                nextStepTime += stepsPerBarRatio * tsw.secondsPerBeat(bpm);

                currentStep++;

                if (currentStep === steps) {
                    currentStep = 0;
                }
            }
        }
    });
};

module.exports = tsw;
