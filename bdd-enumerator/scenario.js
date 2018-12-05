/**
 * A class to describe a scenario under test
 */
class Scenario {

    /**
     * @param desc a description of the scenario
     * @param dependents an array of Dependent objects to be combined in a cross product
     *   (ie. enumerating over this scenario will create a test block for every possible combination of dependents )
     * @param value a Curried function of degree (dependents.length) that accepts possible scenarios
     *   for each dependent (in order) and produces the combined property value.
     * @param valid a Curried function of degree (dependents.length) that accepts possible scenarios
     *   for each dependent (in order) and produces the combined validity.
     * @param set A Curried function of degree (dependents.length) that accepts possible scenarios
     *   for each dependent (in order) and produces a function that creates the scenario under test
     */
    constructor(desc, dependents, value, valid, set) {
        this.desc = desc;
        this.dependents = dependents;
        this.value = value;
        this.valid = valid;
        this.set = set;
    }
}

module.exports = Scenario;