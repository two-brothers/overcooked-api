const MockRecord = require('./mock-database').record
const Food = require('./food/module').model
const FoodSample = require('./food/module').sample
const Recipe = require('./recipes/module').model
const RecipesSample = require('./recipes/module').sample

const models = {
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

const QUANTIFIED_ING_TYPE = 0
const init = (db) => {
    db.addModel(Food, models.Food, FoodSample, FoodRecord)
    // the sample recipes have Food ID indices instead of Food IDs. Substitute them.
    const recipeSamples = JSON.parse(JSON.stringify(RecipesSample))
    return Promise.all(db.getAllRecords(models.Food))
        .then(foodRecords =>
            recipeSamples.map(recipe => recipe.ingredientSections.map(sections => sections.ingredients.map(ingredient => {
                if(ingredient.ingredientType === QUANTIFIED_ING_TYPE) {
                    ingredient.foodId = foodRecords[ingredient.foodId].id
                }
            })))
        )
        .then(() => db.addModel(Recipe, models.Recipe, recipeSamples, RecipeRecord))
}

module.exports = {
    models,
    init
}
