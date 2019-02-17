#!/usr/bin/env python3

from random import randint

NUM_UNIT_TYPES = 13 # Manually set based on the food/unitTypes.js file
FOOD_PAGE_SIZE = 30 # Manually set based on the food/food.sample.js file
NUM_RECIPES = 26 # Arbitrary

def createIngredient():
  ing = {}
  ing['ingredientType'] = randint(0,1)
  if ing['ingredientType'] == 0: # Quantified
    ing['amount'] = randint(3,10)
    ing['unitIds'] = [randint(0, NUM_UNIT_TYPES - 1) for i in range(randint(1,2))]
    ing['foodId'] = randint(0, FOOD_PAGE_SIZE - 1)  # Should be replaced by the ID of the corresponding food database record
    if randint(0,1) == 0:
      ing['additionalDesc'] = 'additional description'
  else: # FreeText
    ing['description'] = 'Free text description'
  return ing

def createSection(idx):
  section = {}
  if randint(0,1) == 0:
    section['heading'] = 'Section #{}'.format(idx)
  numIngredients = randint(5,10)
  section['ingredients'] = list(map(lambda idx: createIngredient(), range(numIngredients)))
  return section

def createRecipe(idx):
  recipe = {}
  recipe['title'] = 'Sample Recipe #{}'.format(idx);
  recipe['serves' if randint(0,1) == 0 else 'makes'] = randint(3, 10)
  recipe['prepTime'] = randint(10,30)
  recipe['cookTime'] = randint(5, 40)
  numSections = randint(2,3)
  recipe['ingredientSections'] = list(map(lambda idx: createSection(idx), range(numSections)))
  recipe['method'] = ['Do the first thing', 'Then the second', 'The third usually follows']
  recipe['referenceUrl'] = 'https://example_reference.com'
  recipe['imageUrl'] = 'https://example_server.com/example_image.jpg'
  return recipe


recipes = list(map(lambda idx: createRecipe(idx), range(NUM_RECIPES)))

# write the results to file
f = open('./recipe.sample.js', 'w')
f.write("""
// This file was created with the ./create_recipes.py script

// note: foodId values should be the server-generated ID corresponding to the food record
// since we can't know the value beforehand (and these are randomly generated recipes)
// foodId is set to the index of the food when all foods are retrieved from the database

""")

f.write('module.exports = {};'.format(recipes))
