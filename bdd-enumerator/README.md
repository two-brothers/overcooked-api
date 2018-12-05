# BDD Enumerator

## Overview

Often, my BDD (mocha or jasmine) unit tests involve running similar tests with minor tweaks.

Depending on the complexity, this can either involve manually duplicating and tweaking individual tests,
or enumerating over ever-increasing-in-complexity-and-recursion functions to generate the tests.

This project is intended to simplify the second method, and increase code clarity, by abstracting and reusing
the enumeration logic.

## Usage

Clone this repo into your project
```
git submodule add https://github.com/nikeshnazareth/bdd-enumerator
```
  
  
Add the enumerator module to your test file
```javascript
const Enumerator = require ('bdd-enumerator/module');
```
  
Choose a set of scenarios to enumerate over.

For example,
```javascript
const myScenarios = Enumerator.scenario.finitePositiveNumber
```

The mechanism to apply a scenario to a test can be customised, but typically you would specify a property
on an object that should be set to the scenario's value. 

Note that the base object is identified through a function, because it may not be defined before the test begins.
```javascript
let baseObj; // the object to be modified. Each test block will set baseObj.myProp to the scenario value
const myProp = Enumerator.scenario.property('myProp', () => baseObj, myScenarios);
```
  
Enumerate over the scenarios
```javascript
// create BDD test blocks in place
const validTestsFn = () => { ... }; // any tests to be run in valid scenarios
const invalidTestsFn = () => { ... }; // any tests to be run in invalid scenarios
Enumerator.enumerate(myProp, validTestsFn, invalidTestsFn); 
```

### Available scenarios

#### Predefined

##### `scenario.nonEmptyString`

An array of scenarios to confirm that a property is valid if and only if it is a non-empty string
```javascript
let baseObj;
const scenarios = Enumerator.scenario.nonEmptyString;
Enumerator.enumerate(Enumerator.scenario.property('myString', () => baseObj, scenarios ), validTestsFn, invalidTestFn);
```

##### `scenario.finitePositiveNumber`

An array of scenarios to confirm that a property is valid if and only if it is a finite positive number
```javascript
let baseObj;
const scenarios = Enumerator.scenario.finitePositiveNumber;
Enumerator.enumerate(Enumerator.scenario.property('myNumber', () => baseObj, scenarios ), validTestsFn, invalidTestFn);
```

##### `scenario.boundedInteger`

An array of scenarios to confirm that a property is valid if and only if it is an integer within the specified
bounds (inclusive).
```javascript
let baseObj;
const scenarios = Enumerator.scenario.boundedInteger(3, 8);
Enumerator.enumerate(Enumerator.scenario.property('myInteger', () => baseObj, scenarios ), validTestsFn, invalidTestFn);
```

##### `scenario.presence.required`

A wrapper around an array of scenarios to add a new scenario for when the property is undefined (and invalid)
```javascript
let baseObj;
const scenarios = Enumerator.scenario.presence.required(Enumerator.scenario.nonEmptyString);
Enumerator.enumerate(Enumerator.scenario.property('myRequiredString', () => baseObj, scenarios ), validTestsFn, invalidTestFn);
```

##### `scenario.presence.optional`

A wrapper around an array of scenarios to add a new scenario for when the property is undefined (and valid)
```javascript
let baseObj;
const scenarios = Enumerator.scenario.presence.optional(Enumerator.scenario.nonEmptyString);
Enumerator.enumerate(Enumerator.scenario.property('myOptionalString', () => baseObj, scenarios ), validTestsFn, invalidTestFn);
```

##### `scenario.property`

A function that applies specified scenarios to an object. This is the simplest mechanism to use a scenario value within a test.
Simply ensure that the test function has access to the modified object.
```javascript
let baseObj;
const scenarios = Enumerator.scenario.nonEmptyString;
Enumerator.enumerate(Enumerator.scenario.property('myString', () => baseObj, scenarios ), validTestsFn, invalidTestFn);
```

##### `scenario.nonEmptyArray`
A function that embeds specified scenarios as items within an array to confirm that a property is valid
if and only if it is a non-empty array and the items conform to the scenarios.
```javascript
let baseObj;
// confirm myArray is valid if and only if it is a non-empty array of finite positive numbers
const scenarios = Enumerator.scenario.nonEmptyArray(Enumerator.scenario.finitePositiveNumber);
Enumerator.enumerate(Enumerator.scenario.property('myArray', () => baseObj, scenarios ), validTestsFn, invalidTestFn);
```

##### `scenario.object`
A function that accepts a list of `Dependent` properties and produces an array of scenarios that are valid when
the properties are added to a single object and they are all valid individually.

```javascript
let baseObj;
// confirm myObject is valid if and only if:
//   - propA is a finite positive number
//   - propB is a required (cannot be undefined) non-empty string
//   - propC is a non-empty array of non-empty strings
const scenarios = Enumerator.scenario.object([
    Enumerator.custom.dependent('propA', Enumerator.scenario.finitePositiveNumber),
    Enumerator.custom.dependent('propB', Enumerator.scenario.presence.required(Enumerator.scenario.nonEmptyString)),
    Enumerator.custom.dependent('propC', Enumerator.scenario.nonEmptyArray(Enumerator.scenario.nonEmptyString)),
]);
Enumerator.enumerate(Enumerator.scenario.property('myObject', () => baseObj, scenarios ), validTestsFn, invalidTestFn);
```

##### `scenario.mutexProperties`
A function that creates two properties on an object based on the specified scenarios, and produces an array of scenarios
that are valid when the properties are mutually exclusive (ie. the scenario is invalid if either property is invalid 
or both are defined )
```javascript
let baseObj;
const mutexScenario = Enumerator.scenario.mutexProperties(
    () => baseObj,
    Enumerator.custom.dependent('propA', Enumerator.scenario.finitePositiveNumber),
    Enumerator.custom.dependent('propB', Enumerator.scenario.nonEmptyString)
);
Enumerator.enumerate(mutexScenario, validTestsFn, invalidTestFn);
```

#### Custom

##### `custom.dependent`

A simple container for a name and a set of scenarios. Whenever a `scenario` contains a `dependent`, 
all possible scenarios for the dependent property (and all possible combinations between multiple dependent properties)
are included in the original `scenario`. 

`dependent` objects offer a way to produce generic scenarios that can be instantiated by the user. 
Refer to `scenario.nonEmptyArray` or `scenario.object` for an example usage.

##### `custom.scenario`

This object can be used to create a custom scenario. It is instantiated with the parameters:
1. `desc`: a description of the scenario (the value to be written in the `describe` block title)
1. `dependents`: any children or other dependent properties to be included in the scenario. Note that calling 
`enumerate` on a scenario will create a test block for all possible combinations of properties,
which may be overwhelming for a scenario with a large number of dependents and sub-dependents
1. `value`: a curried function of degree `dependents.length` that accepts possible scenarios for each dependent
(in order) and produces the combined property value (see the examples below).
1. `valid`: a curried function of degree `dependents.length` that accepts possible scenarios for each dependent
(in order) and produces the combined validity (see the examples below).
1. `set`: a curried function of degree `dependents.length` that accepts possible scenarios for each dependent
(in order) and produces *a function that creates* the scenario under test (see the examples below).

```javascript
// The implementation of `scenario.mutexProperties`
const MutexProperties = (baseObjFn, propertyA, propertyB) => 
  new Scenario(
      // the name of the scenario. Set it to null since we don't want the description of this scenario to appear in any describe block 
      // (the dependent properties will be enumerated and described individually - we are simply modifying the validity conditions)
      null, 
      // the dependent properties
      [ propertyA, propertyB ],
      // the mutex doesn't require a value since it is not read by other scenarios
      // Nevertheless, it is a second-degree curried function that will be instantiated once per dependency
      A => B => undefined,
      // the heart of the scenario is the validity function which produces the mutually exclusive behaviour
      // note that the second-degree curried function is instantiated with the property A scenario under test,
      // followed by the property B scenario under test
      A => B => (A.value === undefined && B.valid) || (B.value === undefined && A.valid),
      // the set function produces the situation under test. In this case, add the scenario values to the base object
      // under the specified property names
      A => B => () => {
        const baseObj = baseObjFn();
        if (A.value !== undefined)
            baseObj[propertyA.desc] = A.value;
        if (B.value !== undefined)
            baseObj[propertyB.desc] = B.value;
      }
  );
```


```javascript
// The implementation of `scenario.nonEmptyArray`
const NonEmptyArray = (elementScenarios) => [
    // ... a list of simple scenarios (eg. an empty array) to test, followed by ...
    new Scenario(
        // we are testing how the array behaves if it has a single element
        // this description will be written to the describe block that encapsulates this scenario
        'has a single element',
        // to keep this scenario generic, we allow the user to specify the scenarios for the array element,
        // which is achieved by adding it as a dependency
        [new Dependent('element', elementScenarios)],
        // the value of this scenario as read by other scenarios (for example, if it is added to an object)
        // is simply an array with one element defined by the dependent scenario
        element => [element.value],
        // the array scenario is valid if the underlying element scenario is valid
        element => element.valid,
        // we do not need to do anything to instantiate the scenario
        // note that the setter takes a single parameter (the dependent scenario) and produces a function
        // (to be executed in a beforeEach block)
        () => () => undefined
    ),
    new Scenario(
        // we are testing how the array behaves if it has two elements. 
        // As above, this will be written in the describe block for this scenario
        'has two elements',
        // to keep this scenario generic, we allow the user to specify the scenarios for the array element,
        // which is achieved by adding it as a dependency. There are two dependencies because we will let
        // the two elements vary independently across the available scenarios
        [new Dependent('first element', elementScenarios), new Dependent('second element', elementScenarios)],
        // the value of this scenario as read by other scenarios (for example, if it is added to an object)
        // is an array with the two elements. Note that this is a second-degree (one per dependency) curried function
        // that gets instantiated as each element is defined
        first => second => [first.value, second.value],
        // the array scenario is valid if both of the element scenarios are valid
        // once again, it is a second-degree (one per dependency) curried function
        first => second => first.valid && second.valid,
        // we do not need to do anything to instantiate the scenario
        // note that the setter takes two (curried) parameters (the dependent scenarios) and produces a function
        // (to be executed in a beforeEach block)
        () => () => () => undefined
    )
];
```

##### `custom.simple`

A convenience object for scenarios that do not have any `dependent` values and do not require a set function.

It is instantiated with:
1. `desc`: a description of the scenario (the value to be written in the `describe` block title)
1. `value`: the value of the scenario
1. `valid`: whether or not the scenario is valid

```javascript
const FinitePositiveNumber = [
    new SimpleScenario('is a string', 'Arbitrary string', false),
    new SimpleScenario('is a negative number', -1, false),
    new SimpleScenario('is zero', 0, false),
    new SimpleScenario('is one', 1, true),
    new SimpleScenario('is another positive integer', 2, true),
    new SimpleScenario('is a positive fraction', 2.6, true),
    new SimpleScenario('is a negative fraction', -3.6, true),
    new SimpleScenario('is NaN', Number.NaN, false),
    new SimpleScenario('is MAX_VALUE', Number.MAX_VALUE, true),
    new SimpleScenario('is NEGATIVE_INFINITY', Number.NEGATIVE_INFINITY, false),
    new SimpleScenario('is POSITIVE_INFINITY', Number.POSITIVE_INFINITY, false),
];
```