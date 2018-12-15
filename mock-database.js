const sinon = require('sinon');
const mongoose = require('mongoose');

const MockQuery = require('./mock-query');

/**
 * A class to mock a small set of calls to Mongoose models and easily resets to a known state
 * The supported model functions and parameters are:
 *   - findOne({_id: <specified by user> })
 *   - create(record)
 *   - find()
 * The supported record functions are:
 *   - save()
 *   - remove()
 */
class Database {

    /**
     * A special record id that can be passed to the getRecord function to get any (unspecified) record
     * Importantly, this can be used in tests that are constructed before the database and records are initialised.
     */
    static get A_VALID_RECORD_ID() {
        return 'A_VALID_RECORD_ID';
    };

    /**
     * A special record id that can be passed to the getRecord function to trigger an error (which is how Mongoose
     * responds to malformed record ids) instead of returning null (for invalid, but well-formed ids)
     */
    static get A_MALFORMED_RECORD_ID() {
        return 'A_MALFORMED_RECORD_ID'
    }

    /**
     * Initialise the database and stub the mongoose.connect function
     */
    constructor() {
        this.data = {};
        sinon.stub(mongoose, 'connect').returns(Promise.resolve(true));
    }

    /**
     * Remove the spies
     */
    disconnect() {
        sinon.restore();
    }

    /**
     * Create a callback that can be passed to a Record constructor, so that the 'save' method updates the databases local state.
     * @param dbModel the Mongoose model to associate with the record
     * @returns {function(*)} a function that adds the record to the model's 'updated' property ( or replaces the existing value at that id )
     */
    static getRecordUpdateFn(dbModel) {
        return (record) => {
            if (record.id in dbModel.removed) {
                throw new Error(`Cannot update ${name} record ${record.id} because it is already removed`);
            }
            dbModel.updated[record.id] = record;
        }
    }

    /**
     * Create a callback that can be passed to a Record constructor, so that the 'remove' method updates the databases local state.
     * @param dbModel the Mongoose model to associate with the record
     * @returns {function(*)} a function that adds the record to the model's 'removed' property ( or replaces the existing value at that id )
     */
    static getRemoveFn(dbModel) {
        return (record) => {
            dbModel.removed[record.id] = record;
        }
    }

    /**
     * Produces a new database record
     * @param dbModel the record model
     * @param data the data in the record
     */
    static newRecord(dbModel, data) {
        return Object.assign(
            new dbModel.recordType(Database.getRecordUpdateFn(dbModel), Database.getRemoveFn(dbModel)),
            {id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString()},
            deepClone(data)
        );
    }

    /**
     * Adds a model and the associated records to the mock database.
     * The records are never changed ( in fact they are frozen to prevent accidental changes that could contaminate other tests)
     * Instead, any updates are recorded separately and forgotten when 'reset' is called, restoring the model to its original state.
     * @param mongooseModel the Mongoose model to mock.
     * @param name the name of the model in the database
     * @param records the records associated with the model (note: there is no validation)
     * @param recordType (default Record) a class to simulate the behaviour of a Mongoose record associated with this models
     */
    addModel(mongooseModel, name, records, recordType = Record) {
        const dbModel = {
            name: name, records: {}, updated: {}, removed: {},
            mongoose: mongooseModel, recordType: recordType
        };
        records.map(item => {
            const record = Database.newRecord(dbModel, item);
            dbModel.records[record.id] = record;
        });
        deepFreeze(dbModel.records);
        this.data[name] = dbModel;
    }

    /**
     * Retrieves the specified record from the database
     * @param modelName the model to search
     * @param id the id of the record
     * @param inSpy whether this is being called from the spy.
     *   If so, it will be processed by the system under test and may need to use the mock update/remove functions
     *   If its being called from the test itself, it should remove the mock artifacts since it may need to be compared
     *   to a value returned from the server. It is cleaner and more correct without them anyway.
     * @returns
     *   - a successful promise with the record if it is available
     *   - an unsuccessful promise if the record was removed or cannot be found
     *   - throws an error if the model does not exist in the database
     */
    getRecord(modelName, id, inSpy = false) {
        const dbModel = this.data[modelName];

        if (!dbModel)
            throw new Error(`${modelName} is not a model in the mocked database`);

        if (id === Database.A_VALID_RECORD_ID) {
            id = Object.getOwnPropertyNames(dbModel.records)
                .filter(id => dbModel.removed[id] === undefined)
                .filter(id => dbModel.updated[id] === undefined)[0];
        }

        if (id === Database.A_MALFORMED_RECORD_ID)
            return Promise.reject(`Cast to ObjectId failed for value "{id}"`);

        if (dbModel.removed[id])
            return Promise.resolve(null);

        if (dbModel.updated[id])
            return Promise.resolve(dbModel.updated[id].clone(inSpy));

        if (dbModel.records[id])
            return Promise.resolve(dbModel.records[id].clone(inSpy));

        return Promise.resolve(null);
    }

    /**
     * Retrieves all records in the database in the specified model.
     * @param modelName the name of the model
     * @param inSpy whether this is being called from the spy (see explanation for getRecord)
     * @returns {Array<Promise<record>>} all records (that have not been removed) in the specified mock model.
     */
    getAllRecords(modelName, inSpy = false) {
        const dbModel = this.data[modelName];

        if (!dbModel)
            throw new Error(`${modelName} is not a model in the mocked database`);

        const allRecords = Object.assign({}, dbModel.records, dbModel.updated);

        Object.getOwnPropertyNames(dbModel.removed)
            .map(id => {
                delete allRecords[id];
            });

        return Object.getOwnPropertyNames(allRecords)
            .map(id => this.getRecord(modelName, id, inSpy));
    }

    /**
     * Forget any changes to the database so each model is returned to its initial ( not empty ) state
     * and resets the Mongoose model stubs.
     */
    reset() {
        sinon.restore();
        Object.getOwnPropertyNames(this.data)
            .map(modelName => {
                const model = this.data[modelName];
                model.updated = {};
                model.removed = {};
                sinon.stub(model.mongoose, 'findOne').callsFake(param => this.getRecord(modelName, param._id, true));
                sinon.stub(model.mongoose, 'create').callsFake(param => {
                    const record = Database.newRecord(model, param);
                    model.updated[record.id] = record;
                    return this.getRecord(modelName, record.id, true);
                });
                sinon.stub(model.mongoose, 'find').callsFake(() => {
                    const records = this.getAllRecords(modelName, true);
                    records.sort((a, b) => a.id < b.id);
                    return new MockQuery(records);
                })
            });
    }
}

/**
 * A class to mock a Mongoose record when using the mock database
 */
class Record {

    /**
     * @param updateRecordFn the function to run whenever a record is saved
     *   ( it is up to the caller to decide how to simulate the save )
     * @param removeRecordFn the function to run whenever a record is removed
     *  ( it is up to the caller to decide how to simulate the remove )
     */
    constructor(updateRecordFn, removeRecordFn) {
        this.updateRecordFn = updateRecordFn;
        this.removeRecordFn = removeRecordFn;
    }

    /**
     * In a live environment, Mongoose records are removed by setting them to undefined before saving
     * We need to simulate this behaviour. This function searches for any 'undefined' properties and removes them
     * @param property the property to search
     */
    static removeUndefined(property) {
        if (typeof property === 'object') {
            Object.getOwnPropertyNames(property)
                .map(key => {
                    if (typeof property[key] === 'undefined')
                        delete property[key];
                    else
                        Record.removeUndefined(property[key])
                })
        }
    }

    /**
     * Simulate a Mongoose record.save() call by removing any undefined values and executing the saved callback
     */
    save() {
        Record.removeUndefined(this);
        this.updateRecordFn(this);
    }

    /**
     * Simulate a Mongoose record.remove() by executing the saved callback
     */
    remove() {
        this.removeRecordFn(this);
    }

    /**
     * Create a clone of this record.
     * For efficiency reasons, the Mock database stores a frozen copy of the records to be shared between tests
     * If any of those records need to be modified during a test, pass a copy instead
     * @param retainMockFns whether the returned value should maintain the Mock artifact functions
     */
    clone(retainMockFns) {
        const clone = Object.create(Object.getPrototypeOf(this));
        Object.assign(clone, deepClone(this));
        if (!retainMockFns) {
            delete clone.updateRecordFn;
            delete clone.removeRecordFn;
        }
        return clone;
    }
}


/**
 * A utility function to recursively freeze an object
 */
const deepFreeze = (object) => {
    Object.getOwnPropertyNames(object)
        .filter(prop => typeof object[prop] === 'object')
        .map(prop => deepFreeze(object[prop]));
    Object.freeze(object);
};

/**
 * A utility function to recursively clone an object
 */
const deepClone = (object) => {
    if (Array.isArray(object)) {
        return object.map(element => deepClone(element));
    }

    if (typeof (object) === 'object') {
        const clone = Object.assign({}, object);
        Object.getOwnPropertyNames(clone)
            .filter(name => {
                clone[name] = deepClone(clone[name])
            });
        return clone;
    }

    return object;
};

module.exports = {
    db: Database,
    record: Record
};