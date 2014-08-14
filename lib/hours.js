'use strict';

var oneMinute = 60 * 1000
  , oneHour = 60 * oneMinute
  ;

/**
 * Converts milliseconds to hours, rounding to 2 digits behind decimal
 * separator.
 */
exports.roundMillisToHours = function(millis) {
  var hours = millis / oneHour;
  return Math.round(hours * 100) / 100;
};

exports.roundHoursToHours = function(hours) {
  return Math.round(hours * 100) / 100;
};
