const Scenario = require('../scenario');
const Dependent = require('../dependent');

/**
 * Attaches a property to a base object before executing the tests
 * @param name the name of the property to add
 * @param baseObjectFn a function that returns the object to be modified
 * @param scenarios the list of possible values for the property
 */
const Property = (name, baseObjectFn, scenarios) =>
    new Scenario(
        null,
        [new Dependent(name, scenarios)],
        dependent => undefined,
        dependent => dependent.valid,
        dependent => () => {
            if (dependent.value !== undefined) {
                const baseObj = baseObjectFn();
                baseObj[name] = dependent.value;
            }
        },
    );

module.exports = Property;