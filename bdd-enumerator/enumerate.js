const Scenario = require('./scenario');

/**
 * Create a test block for all possible values for the specified scenario and run the specified tests
 * @param scenario the scenario under test
 * @param validTestsFn the function to run if the scenario is valid
 * @param invalidTestsFn the function to run if the scenario is invalid
 * @param parents the array of parent objects that depend on the scenario under test.
 * This is specified while recursing through dependencies to instantiate the parent scenarios
 * once the current scenario (and its dependents) are fully defined. It should be ignored by the user.
 */
const enumerate = (scenario, validTestsFn, invalidTestsFn, parents = []) => {
    // the contents of this scenario expansion is wrapped in a function to because it may not require a describe block
    const wrapper = () => {
        if (scenario.dependents.length === 0) {
            beforeEach(scenario.set);

            if (parents.length > 0) {
                const parent = parents[0];
                const partialParent = new Scenario(
                    null,
                    parent.dependents.slice(1),
                    parent.value(scenario),
                    parent.valid(scenario),
                    parent.set(scenario)
                );
                enumerate(partialParent, validTestsFn, invalidTestsFn, parents.slice(1))
            } else {
                const tests = scenario.valid ? validTestsFn : invalidTestsFn;
                tests();
            }
        } else {
            const nextProperty = scenario.dependents[0];
            describe(nextProperty.desc, () => {
                nextProperty.scenarios.map(subScenario =>
                    enumerate(subScenario, validTestsFn, invalidTestsFn, [scenario, ...parents]));
            });
        }
    };

    const contents = scenario.desc ? () => describe(scenario.desc, wrapper) : wrapper;
    contents();
};

module.exports = enumerate;
