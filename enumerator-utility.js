const Enumerator = require('./bdd-enumerator/module');

/**
 * Mongoose automatically casts numbers to match the String type
 * This function modifies the scenarios to consider numbers valid ( it only affects SimpleScenario objects )
 * @param scenarios the scenarios to modify
 */
const allowNumbers = (scenarios) => scenarios.map(scenario => {
    const valid = (typeof scenario.value === 'number') ? true : scenario.valid;
    return new Enumerator.custom.scenario(scenario.desc, scenario.dependents, scenario.value, valid, scenario.set);
});

/**
 * Mongoose automatically casts strings to match the Number type
 * This function modifies the scenarios to consider strings valid if they can be converted to numbers
 * ( it only affects SimpleScenario objects )
 * @param scenarios the scenarios to modify
 */
const allowNumericStrings = (scenarios) => scenarios.map(scenario => {
    const valid = ((typeof scenario.value === 'string') && !Number.isNaN(Number(scenario.value))) ? true : scenario.valid;
    return new Enumerator.custom.scenario(scenario.desc, scenario.dependents, scenario.value, valid, scenario.set);
});

/**
 * The nonEmpty scenario with two different elements is prohibitively expensive to run for a complex object.
 * This version simply removes that scenario.
 * @param scenarios
 */
const simplifiedNonEmptyArray = (scenarios) => Enumerator.scenario.nonEmptyArray(scenarios)
    .filter(scenario => scenario.dependents.length < 2);

module.exports = {allowNumbers, allowNumericStrings, simplifiedNonEmptyArray};