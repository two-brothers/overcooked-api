const SimpleScenario = require('../simpleScenario');

/**
 * A classes that augments property scenarios with the case where the property is undefined
 */
class Presence {

    /**
     * Add the scenario where the property is undefined (and valid) and return the combined array
     * @param scenarios any array of scenarios
     */
    static optional(scenarios) {
        return [
            new SimpleScenario('is undefined', undefined, true),
            ...scenarios
        ];
    }

    /**
     * Add the scenario where the property is undefined (and invalid) and return the combined array
     * @param scenarios any array of scenarios
     */
    static required(scenarios) {
        return [
            new SimpleScenario('is undefined', undefined, false),
            ...scenarios
        ];
    }
}

module.exports = Presence;