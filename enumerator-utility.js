const Enumerator = require('bdd-enumerator')

/**
 * This function modifies the scenarios to consider numbers valid ( it only affects SimpleScenario objects )
 * One use case is for adding numbers to Mongoose String properties
 * ( Mongoose automatically casts numbers to match the String type )
 * @param scenarios the scenarios to modify
 */
const allowNumbers = (scenarios) => scenarios.map(scenario => {
    const valid = (typeof scenario.value === 'number') ? true : scenario.valid
    return new Enumerator.custom.scenario(scenario.desc, scenario.dependents, scenario.value, valid, scenario.set)
})

/**
 * This function modifies the scenarios to consider strings valid if they can be converted to numbers
 * One use case is for adding strings to Mongoose Number properties
 * ( Mongoose automatically casts strings to match the Number type if possible )
 * @param scenarios the scenarios to modify
 */
const allowNumericStrings = (scenarios) => scenarios.map(scenario => {
    const valid = ((typeof scenario.value === 'string') && !Number.isNaN(Number(scenario.value))) ? true : scenario.valid
    return new Enumerator.custom.scenario(scenario.desc, scenario.dependents, scenario.value, valid, scenario.set)
})

/**
 * This function modifies the scenarios to consider strings valid ( it only affects SimpleScenario objects )
 * One use case is for adding string to Mongoose [String] properties
 * ( Mongoose automatically casts non-array items to a one-element array of that item to match the Array type )
 * @param scenarios the scenarios to modify
 */
const allowStrings = (scenarios) => scenarios.map(scenario => {
    const valid = (typeof scenario.value === 'string') ? true : scenario.valid
    return new Enumerator.custom.scenario(scenario.desc, scenario.dependents, scenario.value, valid, scenario.set)
})

/**
 * The nonEmpty scenario with two different elements is prohibitively expensive to run for a complex object.
 * This version simply removes that scenario.
 * @param scenarios
 */
const simplifiedNonEmptyArray = (scenarios) => Enumerator.scenario.nonEmptyArray(scenarios)
    .filter(scenario => scenario.dependents.length < 2)

module.exports = { allowNumbers, allowNumericStrings, allowStrings, simplifiedNonEmptyArray }
