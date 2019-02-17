const Food = require('./food.model');
const MaxUnitType = require('./unitTypes').length - 1;
const FoodSample = require('./food.sample');
const Enumerator = require('../bdd-enumerator/module');
const EnumeratorUtil = require('../enumerator-utility');
const {property, object, nonEmptyString, boundedInteger, finitePositiveNumber, presence} = Enumerator.scenario;
const dependent = Enumerator.custom.dependent;
const {allowNumbers, allowNumericStrings, simplifiedNonEmptyArray} = EnumeratorUtil;

describe('Food Model', () => {
    let specification;

    beforeEach(() => {
        // base the modifications off a valid Food object
        specification = JSON.parse(JSON.stringify(FoodSample[0]));
    });

    const expectValid = () =>
        it('should validate successfully', () => (new Food(specification)).validate());

    const RecordIncorrectlyValidated = new Error('An invalid record passed validation');
    const expectInvalid = () =>
        it('should fail to validate', () =>
            (new Food(specification)).validate()
                .then(() => {
                    throw RecordIncorrectlyValidated;
                })
                .catch(err => {
                    if (err === RecordIncorrectlyValidated) {
                        throw err;
                    } // otherwise suppress the expected error
                })
        );

    // the property under test is added directly to the specification object
    const baseObjFn = () => specification;

    const name = property('name', baseObjFn,
        presence.required(object([
            new dependent('singular', presence.required(allowNumbers(nonEmptyString))),
            new dependent('plural', presence.required(allowNumbers(nonEmptyString)))
        ]))
    );

    const conversions = property('conversions', baseObjFn,
        presence.required(simplifiedNonEmptyArray(
            Enumerator.scenario.object([
                new dependent('unitId', presence.required(allowNumericStrings(boundedInteger(0, MaxUnitType)))),
                new dependent('ratio', presence.required(allowNumericStrings(finitePositiveNumber)))
            ])
        ))
    );

    [name, conversions].map(propertyScenario => Enumerator.enumerate(propertyScenario, expectValid, expectInvalid));
});
