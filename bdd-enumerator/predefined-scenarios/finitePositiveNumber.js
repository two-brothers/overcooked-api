const SimpleScenario = require('../simpleScenario');

/**
 * A list of scenarios to check for a property that is supposed to be a positive number
 */
const FinitePositiveNumber = [
    new SimpleScenario('is a string', 'Arbitrary string', false),
    new SimpleScenario('is a negative number', -1, false),
    new SimpleScenario('is zero', 0, false),
    new SimpleScenario('is one', 1, true),
    new SimpleScenario('is another positive integer', 2, true),
    new SimpleScenario('is a positive fraction', 2.6, true),
    new SimpleScenario('is MAX_VALUE', Number.MAX_VALUE, true)
];

module.exports = FinitePositiveNumber;