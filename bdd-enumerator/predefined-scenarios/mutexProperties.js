const Scenario = require('../scenario');

/**
 * Attaches two properties to a base object and ensures that they are mutually exclusive
 * ( the scenario is invalid if either property is invalid or both are defined )
 * @param baseObjFn a function that returns the object to be modified
 * @param propertyA the Dependent object associated with the first property
 * @param propertyB the Dependent object associated with the second property
 */
const MutexProperties = (baseObjFn, propertyA, propertyB) =>
    new Scenario(
        null,
        [ propertyA, propertyB],
        A => B => undefined,
        A => B => (A.value === undefined && B.valid) || (B.value === undefined && A.valid),
        A => B => () => {
            const baseObj = baseObjFn();
            if (A.value !== undefined)
                baseObj[propertyA.desc] = A.value;
            if (B.value !== undefined)
                baseObj[propertyB.desc] = B.value;
        }
    );

module.exports = MutexProperties;