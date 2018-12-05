const Scenario = require('./scenario');

/**
 * A class to describe a BDD scenario with no dependencies
 */
class SimpleScenario extends Scenario {

    /**
     * @param desc a description of the scenario
     * @param value the scenario value
     * @param valid a boolean indicating whether the scenario is valid or invalid
     * ( which affects which set of tests should be run )
     */
    constructor(desc, value, valid) {
        super(desc, [], value, valid, () => undefined);
    }
}

module.exports = SimpleScenario;