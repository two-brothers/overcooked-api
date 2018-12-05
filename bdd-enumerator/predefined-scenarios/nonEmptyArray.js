const SimpleScenario = require('../simpleScenario');
const Scenario = require('../scenario');
const Dependent = require('../dependent');

/**
 * A list of scenarios to check for an object that is supposed to be a non-empty array
 * with elements that match the specified scenarios
 * @param elementScenarios possible values for items in the array
 */
const NonEmptyArray = (elementScenarios) => [
    new SimpleScenario('is a string', 'Arbitrary string', false),
    new SimpleScenario('is a number', 1, false),
    new SimpleScenario('is an empty array', [], false),
    new Scenario(
        'has a single element',
        [new Dependent('element', elementScenarios)],
        element => [element.value],
        element => element.valid,
        () => () => undefined
    ),
    new Scenario(
        'has two elements',
        [new Dependent('first element', elementScenarios), new Dependent('second element', elementScenarios)],
        first => second => [first.value, second.value],
        first => second => first.valid && second.valid,
        () => () => () => undefined
    )
];

module.exports = NonEmptyArray;