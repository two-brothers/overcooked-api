const MockRecord = require('./mock-database').record

const DatabaseModels = {
    Food: 'FOOD',
    Recipe: 'RECIPE'
}

class FoodRecord extends MockRecord {
    get exportable() {
        return this
    }
}

class RecipeRecord extends MockRecord {
    constructor(updateRecordFn, removeRecordFn) {
        super(updateRecordFn, removeRecordFn)
        // to avoid every record in a batch upload having the same timestamp,
        // pick a random time within the last 5 seconds
        this.lastUpdated = Date.now() - Math.floor(Math.random() * 5000)
    }

    save() {
        this.ingredientSections.map(section => section.ingredients.map(ingredient => {
            if ([0, 1].includes(ingredient.ingredientType)) {
                ingredient.ingredientType = ingredient.ingredientType === 0 ? 'Quantified' : 'FreeText'
            }
        }))
        this.lastUpdated = Date.now()
        return super.save();
    }

    get exportable() {
        const record = this.clone(false)
        record.ingredientSections.map(section => section.ingredients.map(ingredient => {
            ingredient.ingredientType = ingredient.ingredientType === 'Quantified' ? 0 : 1
        }))
        return record
    }

    get updatedAt() {
        return this.lastUpdated
    }
}

module.exports = {
    models: DatabaseModels,
    records: {
        Food: FoodRecord,
        Recipe: RecipeRecord
    }
}
