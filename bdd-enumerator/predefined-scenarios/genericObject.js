const Scenario = require('../scenario');

/**
 * Accepts a list of Dependent properties and attaches them to a single object
 * that is valid only when all the properties are valid
 * @param properties the Dependent properties to add to the object
 */
const GenericObject = (properties) => [
    new Scenario(
        null,
        properties,
        combineProperties(properties.map(property => property.desc)),
        allValid(properties.length, true),
        resolveToUndefined(properties.length)
    )
];

/**
 * Produces a curried function that adds an input scenario's value to the specified object under
 * the next unused name. For example, combineProperties(['propA', 'propB', 'propC'])
 * produces the function A => B => C => { 'propA': A.value, 'propB': B.value, 'propC': C.value }
 * @param names the names of the properties in the order they will be defined
 * @param accumulator the initial object to add the properties to
 */
const combineProperties = (names, accumulator = {}) =>
    names.length === 0 ?
        accumulator :
        scenario => {
            const result = Object.assign({}, accumulator);
            if (scenario.value !== undefined)
                result[names[0]] = scenario.value;
            return combineProperties(names.slice(1), result);
        };

/**
 * Produces a curried function of N scenarios that returns a boolean indicating if all scenarios are valid
 * @param N the number of scenarios to combine
 * @param valid the accumulated value
 */
const allValid = (N, valid) =>
    N === 0 ?
        valid :
        scenario => allValid(N - 1, valid && scenario.valid);

/**
 * Produces a curried function of degree N that returns a function that returns undefined
 * (so it takes N + 1 evaluations before it returns undefined)
 * @param N
 */
const resolveToUndefined = (N) =>
    N === 0 ?
        () => undefined :
        () => resolveToUndefined(N - 1);


module.exports = GenericObject;
