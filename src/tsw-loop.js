/*******************************
 * Theresas's Sound World - Loop
 * tsw-loop.js
 * Dependencies: tsw-core.js
 * Copyright 2014 Stuart Memo
 *******************************/

(function (window, undefined) {
    'use strict';

    var currentStep = 0,
        lookAhead = 25;

    tsw = tsw || {};

    // Build a worker from an anonymous function body.
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

    var worker = new Worker(blobURL);

    URL.revokeObjectURL(blobURL);

    tsw.secondsPerBeat = function (bpm) {
        return 60 / bpm; 
    };

    /*
    Ideal usage
    ===========
    tsw.loop(function (stepTime) {
       osc.start(stepTime);
    }, 120);
    */

    tsw.loop = function (callback, bpm, steps) {
        var nextStepTime,
            currentStep = 0, 
            scheduleAheadTime = 0.1,
            lookAheadTime = 25;

        bpm = bpm || 120;
        steps = steps || 16;

        nextStepTime = tsw.now();
        worker.postMessage('start');
 
        worker.addEventListener('message', function (e) {
            // Tick gets sent every 100ms from the worker.
            if (e.data === 'tick') {
                while (nextStepTime < tsw.now() + scheduleAheadTime) {
                    callback(nextStepTime, currentStep);

                    // 4 steps in each beat for 16th's.
                    nextStepTime += 0.25 * tsw.secondsPerBeat(bpm);

                    currentStep++;

                    if (currentStep === 16) {
                        currentStep = 0;
                    }
                }
            }
        });
    };

    document.body.addEventListener('click', function () {
        tsw.loop(function (time, currentStep) {
            var osc = tsw.osc();

            osc.frequency(300);
            tsw.connect(osc, tsw.speakers);

            if (currentStep % 4 === 0) {
                osc.frequency(200);
            }

            osc.start(time);
            osc.stop(time + 0.1);

        }, 100);
    });
})();
