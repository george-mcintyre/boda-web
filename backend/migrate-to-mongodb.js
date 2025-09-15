// Migration script to move data from JSON files to MongoDB Atlas
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const models = require('./models');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://admin:EWEWQZwECrY2JgI0@bodadb.zyb782r.mongodb.net/?retryWrites=true&w=majority&appName=BodaDB';

async function migrateData() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'boda-web'
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('🗑️ Clearing existing collections...');
    await Promise.all([
      models.Guest.deleteMany({}),
      models.Admin.deleteMany({}),
      models.Event.deleteMany({}),
      models.Gift.deleteMany({}),
      models.Message.deleteMany({}),
      models.Comment.deleteMany({}),
      models.Menu.deleteMany({}),
      models.CashGiftCard.deleteMany({}),
      models.CashGift.deleteMany({}),
      models.Config.deleteMany({})
    ]);
    console.log('✅ Collections cleared');

    // Migrate guests
    console.log('👥 Migrating guests...');
    const guestsPath = path.join(__dirname, 'data', 'invitados.json');
    if (fs.existsSync(guestsPath)) {
      const guests = JSON.parse(fs.readFileSync(guestsPath, 'utf-8'));
      await models.Guest.insertMany(guests);
      console.log(`✅ Migrated ${guests.length} guests`);
    }

    // Migrate admins
    console.log('👨‍💼 Migrating admins...');
    const adminPath = path.join(__dirname, 'data', 'admin.json');
    if (fs.existsSync(adminPath)) {
      const admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
      await models.Admin.insertMany(admins);
      console.log(`✅ Migrated ${admins.length} admins`);
    }

    // Migrate events (agenda)
    console.log('📅 Migrating events...');
    const agendaPath = path.join(__dirname, 'data', 'agenda.json');
    if (fs.existsSync(agendaPath)) {
      const events = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
      await models.Event.insertMany(events);
      console.log(`✅ Migrated ${events.length} events`);
    }

    // Migrate gifts
    console.log('🎁 Migrating gifts...');
    const giftsPath = path.join(__dirname, 'data', 'regalos.json');
    if (fs.existsSync(giftsPath)) {
      const gifts = JSON.parse(fs.readFileSync(giftsPath, 'utf-8'));
      await models.Gift.insertMany(gifts);
      console.log(`✅ Migrated ${gifts.length} gifts`);
    }

    // Migrate messages
    console.log('💬 Migrating messages...');
    const messagesPath = path.join(__dirname, 'data', 'mensajes.json');
    if (fs.existsSync(messagesPath)) {
      const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
      await models.Message.insertMany(messages);
      console.log(`✅ Migrated ${messages.length} messages`);
    }

    // Migrate comments
    console.log('💭 Migrating comments...');
    const commentsPath = path.join(__dirname, 'data', 'comentarios.json');
    if (fs.existsSync(commentsPath)) {
      const comments = JSON.parse(fs.readFileSync(commentsPath, 'utf-8'));
      await models.Comment.insertMany(comments);
      console.log(`✅ Migrated ${comments.length} comments`);
    }

    // Migrate menu
    console.log('🍽️ Migrating menu...');
    const menuPath = path.join(__dirname, 'data', 'menu.json');
    if (fs.existsSync(menuPath)) {
      const menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
      await models.Menu.create(menu);
      console.log('✅ Migrated menu');
    }

    // Migrate cash gift cards
    console.log('💳 Migrating cash gift cards...');
    const cardsPath = path.join(__dirname, 'data', 'cash-gift-cards.json');
    if (fs.existsSync(cardsPath)) {
      const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
      await models.CashGiftCard.insertMany(cards);
      console.log(`✅ Migrated ${cards.length} cash gift cards`);
    }

    // Migrate cash gifts
    console.log('💰 Migrating cash gifts...');
    const cashGiftsPath = path.join(__dirname, 'data', 'regalos-efectivo.json');
    if (fs.existsSync(cashGiftsPath)) {
      const cashGifts = JSON.parse(fs.readFileSync(cashGiftsPath, 'utf-8'));
      await models.CashGift.insertMany(cashGifts);
      console.log(`✅ Migrated ${cashGifts.length} cash gifts`);
    }

    // Migrate config
    console.log('⚙️ Migrating config...');
    const configPath = path.join(__dirname, 'data', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      await models.Config.create(config);
      console.log('✅ Migrated config');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Guests: ${await models.Guest.countDocuments()}`);
    console.log(`   - Admins: ${await models.Admin.countDocuments()}`);
    console.log(`   - Events: ${await models.Event.countDocuments()}`);
    console.log(`   - Gifts: ${await models.Gift.countDocuments()}`);
    console.log(`   - Messages: ${await models.Message.countDocuments()}`);
    console.log(`   - Comments: ${await models.Comment.countDocuments()}`);
    console.log(`   - Cash Gift Cards: ${await models.CashGiftCard.countDocuments()}`);
    console.log(`   - Cash Gifts: ${await models.CashGift.countDocuments()}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateData();
