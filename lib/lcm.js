/**
 * @fileoverview Code to find least common multiple
 * @author basta
 */

'use strict';


//------------------------------------------------------------------------------
// Public
//------------------------------------------------------------------------------


/**
 * Finds least common multiple of a set of numbers
 *
 * Adapted from resettacode
 *
 * @param {int[]} arr Array of integers to find the LCM of
 * @returns {int}
 */
exports.lcm = function lcm(arr) {
    var n = arr.length;
    var a = Math.abs(arr[0]);

    var b;
    var c;
    for (var i = 1; i < n; i++) {
        b = Math.abs(arr[i]);
        c = a;
        while (a && b) {
            if (a > b) {
                a %= b;
            } else {
                b %= a;
            }
        }
        a = Math.abs(c * arr[i]) / (a + b);
    }
    return a;
};
