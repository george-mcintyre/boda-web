#!/usr/bin/env node
/**
 * Update Menu Allergen Flags
 * 
 * Replaces vague "containsAllergens" with specific allergen flags
 * for all menu items based on typical ingredients.
 */

const mongoose = require('../server/node_modules/mongoose');
const { MONGODB_URI, MONGODB_DB } = require('../server/config/env');
const { CourseOption } = require('../server/models');

// Allergen mappings for each dish (English name)
const allergenData = {
  'Iberian Charcuterie Board': {
    containsGluten: false,
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: true, // Cured meats often contain soy
    containsSesame: false,
    containsLactose: false,
    containsNuts: false
  },
  'Cheese Board with Nuts and Red Berries': {
    containsGluten: false,
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: true,
    containsNuts: true
  },
  'Strawberry and Raspberry Gazpacho': {
    // Vegan - no allergens
    containsGluten: false,
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: false,
    containsNuts: false
  },
  'Mushroom Croquettes with Aioli': {
    containsGluten: true, // Breading
    containsEggs: true, // Aioli contains eggs
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: false,
    containsNuts: false
  },
  'Ajoblanco with Moscatel Wine Reduction and Raisins': {
    containsGluten: false,
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: false,
    containsNuts: true // Almonds are the base
  },
  'Patatas Bravas with Oyana Sauce': {
    containsGluten: false,
    containsEggs: true, // Sauce may contain eggs
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: false,
    containsNuts: false
  },
  'Sea Bream Ceviche with Roasted Sweet Potato': {
    containsGluten: false,
    containsEggs: false,
    containsFish: true,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: false,
    containsNuts: false
  },
  'Chicken Karaage with Seaweed Emulsion': {
    containsGluten: true, // Flour coating
    containsEggs: true, // Typical in batter
    containsFish: false,
    containsShellfish: false,
    containsSoy: true, // Soy sauce marinade
    containsSesame: false,
    containsLactose: false,
    containsNuts: false
  },
  'Watermelon and Pistachio Salad with Thyme and Lemon Ice Cream': {
    containsGluten: false,
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: true, // Feta cheese
    containsNuts: true // Pistachios
  },
  'Fried Eggplant with Cane Honey': {
    containsGluten: true, // Breading/coating
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: false,
    containsNuts: false
  },
  'Grilled Beef Tenderloin': {
    // Pure meat - no allergens
    containsGluten: false,
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: false,
    containsNuts: false
  },
  'Teriyaki Sea Bass': {
    containsGluten: true, // Soy sauce contains wheat
    containsEggs: false,
    containsFish: true,
    containsShellfish: false,
    containsSoy: true, // Teriyaki sauce
    containsSesame: true, // Often in teriyaki
    containsLactose: false,
    containsNuts: false
  },
  'Cauliflower Steak with Romesco Sauce': {
    // Vegan - romesco has nuts
    containsGluten: false,
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: false,
    containsNuts: true // Romesco contains almonds/hazelnuts
  },
  'Creamy Rice with Roasted Vegetables and Mushrooms': {
    // Vegan
    containsGluten: false,
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: false,
    containsNuts: false
  },
  'Cheesecake': {
    containsGluten: true, // Crust
    containsEggs: true,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: true,
    containsNuts: false
  },
  'Brownie': {
    containsGluten: true,
    containsEggs: true,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: true, // Butter
    containsNuts: false
  },
  'Lime Cake': {
    containsGluten: true,
    containsEggs: true,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: true, // Butter
    containsNuts: false
  },
  'Carrot Cake with Cream Cheese Frosting': {
    containsGluten: true,
    containsEggs: true,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: false,
    containsLactose: true, // Cream cheese
    containsNuts: true // Often contains walnuts
  },
  'Mini Burger': {
    containsGluten: true, // Bun
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: false,
    containsSesame: true, // Sesame seeds on bun
    containsLactose: true, // Cheese
    containsNuts: false
  },
  'Vegan Mini Burger': {
    containsGluten: true, // Bun
    containsEggs: false,
    containsFish: false,
    containsShellfish: false,
    containsSoy: true, // Vegan patty likely soy-based
    containsSesame: true, // Sesame seeds on bun
    containsLactose: false,
    containsNuts: false
  }
};

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
    console.log('✓ Connected.\n');

    let updated = 0;
    let notFound = 0;

    for (const [dishName, allergens] of Object.entries(allergenData)) {
      const option = await CourseOption.findOne({ 'label.en': dishName });
      
      if (!option) {
        console.log(`❌ Not found: ${dishName}`);
        notFound++;
        continue;
      }

      // Update with specific allergen flags and set containsAllergens to false
      await CourseOption.updateOne(
        { _id: option._id },
        { $set: { ...allergens, containsAllergens: false } }
      );

      const allergenList = Object.entries(allergens)
        .filter(([key, value]) => value === true)
        .map(([key]) => key.replace('contains', ''))
        .join(', ');

      console.log(`✓ ${dishName}`);
      if (allergenList) {
        console.log(`  Allergens: ${allergenList}`);
      } else {
        console.log(`  No allergens`);
      }

      updated++;
    }

    console.log(`\n✅ Complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Not found: ${notFound}`);

  } catch (e) {
    console.error('\n❌ Error:', e.message);
    console.error(e.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

main();
