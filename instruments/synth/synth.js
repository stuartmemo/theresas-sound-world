/*****************
* Basic Synth    *
* by Stuart Memo *
*****************/

(function (window, undefined) {

    var Synth = (function () {

        var Synth = function (context, outputNode) {
            this.context = context;
            this.version = '0.0.1';
            this.output = outputNode || context.destination;
        };

        return function (context, outputNode) {
            return new Synth(context, outputNode);
        };
    })();

    window.Synth = Synth;

})(window);