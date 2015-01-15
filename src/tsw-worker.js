/*****************************************
 * Theresas's Sound World - Web Worker
 * tsw-worker.js
 * Dependencies: tsw-core.js, tsw-loop.js
 * Copyright 2014 Stuart Memo
 ****************************************/

self.addEventListener('message', function (e) {
    'use strict';

    (function looper () {
        self.postMessage('go');
        setTimeout(looper, 25);
    })();
}, false);
