'use strict';

exports = {
    /**
     * Is an argument a string?
     * @method isString
     * @param thing Argument to check if it's a string.
     */
    isString: function (thing) {
        return typeof thing === 'string';
    },

    /**
     * Is an argument a number?
     * @method isNumber
     * @param thing Argument to check if it's a number.
     */
    isNumber: function (thing) {
        return typeof thing === 'number';
    }
};
