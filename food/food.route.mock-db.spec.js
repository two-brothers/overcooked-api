const MockRecord = require('../mock-database').record;

const DatabaseModels = {
    Food: 'FOOD'
};

class FoodRecord extends MockRecord {
    get exportable() {
        return this;
    }
}

module.exports = {
    models: DatabaseModels,
    records: {
        Food: FoodRecord,
    }
};
