/**
 * A class to encapsulate the possible scenarios of a dependent (to another scenario) property
 */
class Dependent {
    /**
     * @param desc a description of the dependent property
     * @param scenarios all possible values for the property
     */
    constructor(desc, scenarios) {
        this.desc = desc;
        this.scenarios = scenarios;
    }
}

module.exports = Dependent;