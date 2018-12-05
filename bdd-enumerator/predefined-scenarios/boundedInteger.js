const SimpleScenario = require('../simpleScenario');

/**
 * A list of scenarios to check for a property that is supposed to be an
 * integer between the two specified bounds (inclusive)
 * Precondition: lower < upper and both are integers
 */
const BoundedInteger = (lower, upper) => [
    new SimpleScenario('is a string', 'Arbitrary string', false),
    new SimpleScenario(`is less than the lower bound (${lower})`, lower - 1, false),
    new SimpleScenario(`is equal to the lower bound (${lower})`, lower, true),
    new SimpleScenario(`is an integer (${Math.floor((upper + lower) / 2)}) in the middle of the range [${lower}, ${upper}]`, Math.floor((upper + lower) / 2), true),
    new SimpleScenario(`is equal to the upper bound (${upper})`, upper, true),
    new SimpleScenario(`is higher than the upper bound (${upper})`, upper + 1, false),
    new SimpleScenario(`is a fraction`, lower + 0.5, false)
];

module.exports = BoundedInteger;