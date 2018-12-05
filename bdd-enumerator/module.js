const Enumerate = require('./enumerate');
const Presence = require('./predefined-scenarios/presence');
const NonEmptyString = require('./predefined-scenarios/nonEmptyString');
const FinitePositiveNumber = require('./predefined-scenarios/finitePositiveNumber');
const BoundedInteger = require('./predefined-scenarios/boundedInteger');
const NonEmptyArray = require('./predefined-scenarios/nonEmptyArray');
const GenericObject = require('./predefined-scenarios/genericObject');
const Property = require('./predefined-scenarios/property');
const MutexProperties = require('./predefined-scenarios/mutexProperties');
const Scenario = require('./scenario');
const SimpleScenario = require('./simpleScenario');
const Dependent = require('./dependent');

module.exports = {
    enumerate: Enumerate,
    scenario: {
        presence: Presence,
        nonEmptyString: NonEmptyString,
        finitePositiveNumber: FinitePositiveNumber,
        boundedInteger: BoundedInteger,
        nonEmptyArray: NonEmptyArray,
        object: GenericObject,
        property: Property,
        mutexProperties: MutexProperties,
    },
    custom: {
        scenario: Scenario,
        simple: SimpleScenario,
        dependent: Dependent
    }
};