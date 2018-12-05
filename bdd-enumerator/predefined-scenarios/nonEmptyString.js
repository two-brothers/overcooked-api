const SimpleScenario = require('../simpleScenario');

/**
 * A list of scenarios to check for a property that is supposed to be a non-empty string
 */
const NonEmptyString = [
    new SimpleScenario('is a number', 1, false),
    new SimpleScenario('is an empty string', '', false),
    new SimpleScenario('is a non-empty string', 'Arbitrary string', true)
];

module.exports = NonEmptyString;