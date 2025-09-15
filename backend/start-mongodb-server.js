// Servidor base Express para la web de la boda con MongoDB Atlas
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51S3mEM1VZvSGk6xqXEVy537524nXBqzArijKFhiKHcfjWWpx774QfInVvUglbnP10rwzG1wpAIkLkKYHBtawI5V100vONks99y');

// Import database configuration and models
const { connectDB } = require('./config/database');
const models = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB Atlas
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Environment detection middleware
app.use((req, res, next) => {
  req.isProduction = process.env.NODE_ENV === 'production';
  req.isVercel = process.env.VERCEL === '1';
  next();
});

// Serve static files from frontend
app.use(express.static('../frontend/public'));

// Root route
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '../frontend/public' });
});

// Environment info endpoint
app.get('/api/environment', (req, res) => {
  res.json({
    environment: req.isVercel ? 'Vercel' : req.isProduction ? 'Production' : 'Local',
    database: 'MongoDB Atlas',
    isVercel: req.isVercel,
    isProduction: req.isProduction
  });
});

// ===== AUTHENTICATION ROUTES =====

// Login route (supports both guests and admins)
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔍 Login - Body recibido:', req.body);
    
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requerido.' });
    }

    // Search in guests first
    const guest = await models.Guest.findOne({ email });
    
    if (guest) {
      if (password) {
        return res.status(400).json({ error: 'Los invitados no requieren contraseña.' });
      }
      
      // Generate session token for guest
      const token = uuidv4();
      guest.token = token;
      await guest.save();

      res.json({ 
        mensaje: 'Acceso exitoso', 
        token, 
        tipo: 'invitado',
        nombre: guest.nombre, 
        email: guest.email 
      });
      return;
    }

    // Search in admins
    const admin = await models.Admin.findOne({ email });
    
    if (admin) {
      if (!password) {
        return res.status(400).json({ 
          error: 'Este email requiere contraseña de administrador.',
          requierePassword: true,
          email: email
        });
      }
      
      if (admin.password !== password) {
        return res.status(401).json({ error: 'Contraseña incorrecta.' });
      }
      
      // Generate session token for admin
      const token = uuidv4();
      admin.token = token;
      await admin.save();
      
      res.json({ 
        mensaje: 'Login de admin exitoso', 
        token, 
        tipo: 'admin',
        email: admin.email 
      });
      return;
    }

    // Not found
    return res.status(401).json({ error: 'Email no encontrado en la lista de invitados o administradores.' });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Email verification route
app.post('/api/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requerido.' });
    }

    // Search in guests
    const guest = await models.Guest.findOne({ email });
    if (guest) {
      return res.json({ 
        tipo: 'invitado',
        email: email,
        nombre: guest.nombre
      });
    }

    // Search in admins
    const admin = await models.Admin.findOne({ email });
    if (admin) {
      return res.json({ 
        tipo: 'admin',
        email: email,
        requierePassword: true
      });
    }

    return res.status(404).json({ error: 'Email no encontrado.' });
    
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== GUEST ROUTES =====

// Get guest data
app.get('/api/invitado', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado.' });
    }

    const guest = await models.Guest.findOne({ token });
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    res.json({
      nombre: guest.nombre,
      email: guest.email,
      seleccionMenu: guest.seleccionMenu || null,
      confirmacionesAgenda: guest.confirmacionesAgenda || {},
    });
    
  } catch (error) {
    console.error('Get guest error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== MENU ROUTES =====

// Get menu
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await models.Menu.findOne();
    if (!menu) {
      return res.status(404).json({ error: 'Menú no disponible.' });
    }
    res.json(menu);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Save menu selection
app.post('/api/menu/seleccion', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado.' });
    }
    
    const { entrante, principal, postre, opcion, alergias } = req.body;
    if (!entrante || !principal || !postre) {
      return res.status(400).json({ error: 'Faltan datos de selección.' });
    }
    
    const guest = await models.Guest.findOne({ token });
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    guest.seleccionMenu = {
      entrante,
      principal,
      postre,
      opcion,
      alergias
    };
    
    await guest.save();
    res.json({ mensaje: 'Selección de menú guardada correctamente.' });
    
  } catch (error) {
    console.error('Save menu selection error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== AGENDA ROUTES =====

// Get agenda
app.get('/api/agenda', async (req, res) => {
  try {
    console.log('GET /api/agenda - Solicitando agenda...');
    
    const events = await models.Event.find().sort({ fecha: 1, hora: 1 });
    console.log('GET /api/agenda - Eventos encontrados:', events.length);
    
    res.json(events);
  } catch (error) {
    console.error('GET /api/agenda - Error:', error);
    res.status(500).json({ error: 'Error interno del servidor al cargar la agenda.' });
  }
});

// ===== GIFT ROUTES =====

// Get gifts
app.get('/api/regalos', async (req, res) => {
  try {
    const gifts = await models.Gift.find();
    console.log('GET /api/regalos - Regalos cargados:', gifts.length);
    res.json(gifts);
  } catch (error) {
    console.error('Get gifts error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Reserve gift
app.post('/api/regalos/reservar', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    const { id } = req.body;
    
    if (!token || !id) {
      return res.status(400).json({ error: 'Token o id de regalo no proporcionado.' });
    }
    
    const guest = await models.Guest.findOne({ token });
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    const gift = await models.Gift.findOne({ id: parseInt(id) });
    if (!gift) {
      return res.status(404).json({ error: 'Regalo no encontrado.' });
    }
    
    if (gift.reservadoPor) {
      return res.status(409).json({ error: 'Este regalo ya ha sido reservado.' });
    }
    
    gift.reservadoPor = guest.email;
    await gift.save();
    
    res.json({ mensaje: 'Regalo reservado correctamente.' });
    
  } catch (error) {
    console.error('Reserve gift error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cancel gift reservation
app.post('/api/regalos/cancelar', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    const { id } = req.body;
    
    if (!token || !id) {
      return res.status(400).json({ error: 'Token o id de regalo no proporcionado.' });
    }
    
    const guest = await models.Guest.findOne({ token });
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    const gift = await models.Gift.findOne({ id: parseInt(id) });
    if (!gift) {
      return res.status(404).json({ error: 'Regalo no encontrado.' });
    }
    
    if (!gift.reservadoPor) {
      return res.status(409).json({ error: 'Este regalo no está reservado.' });
    }
    
    if (gift.reservadoPor !== guest.email) {
      return res.status(403).json({ error: 'Solo puedes cancelar tus propias reservas.' });
    }
    
    gift.reservadoPor = null;
    await gift.save();
    
    res.json({ mensaje: 'Reserva de regalo cancelada correctamente.' });
    
  } catch (error) {
    console.error('Cancel gift reservation error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== MESSAGE ROUTES =====

// Send message
app.post('/api/mensajes', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    const { mensaje } = req.body;
    
    if (!token || !mensaje) {
      return res.status(400).json({ error: 'Token o mensaje no proporcionado.' });
    }
    
    const guest = await models.Guest.findOne({ token });
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    const newMessage = new models.Message({
      nombre: guest.nombre,
      email: guest.email,
      mensaje
    });
    
    await newMessage.save();
    res.json({ mensaje: 'Mensaje enviado correctamente.' });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get all messages
app.get('/api/mensajes', async (req, res) => {
  try {
    const messages = await models.Message.find().sort({ fecha: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== COMMENT ROUTES =====

// Send comment
app.post('/api/comentarios', async (req, res) => {
  try {
    const token = req.headers['authorization'];
    const { comentario } = req.body;
    
    if (!token || !comentario) {
      return res.status(400).json({ error: 'Token o comentario no proporcionado.' });
    }
    
    const guest = await models.Guest.findOne({ token });
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    const newComment = new models.Comment({
      id: 'comment_' + Date.now(),
      nombre: guest.nombre,
      email: guest.email,
      comentario,
      reacciones: {}
    });
    
    await newComment.save();
    res.json({ mensaje: 'Comentario publicado correctamente.' });
    
  } catch (error) {
    console.error('Send comment error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get all comments
app.get('/api/comentarios', async (req, res) => {
  try {
    const comments = await models.Comment.find().sort({ fecha: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== ADMIN MIDDLEWARE =====

async function verificarAdmin(req, res, next) {
  try {
    const token = req.headers['authorization'];
    
    // For testing, allow access with test token
    if (token === 'test-token') {
      return next();
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Token de admin no proporcionado.' });
    }
    
    const admin = await models.Admin.findOne({ token });
    if (!admin) {
      return res.status(401).json({ error: 'Token de admin inválido.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ===== ADMIN ROUTES =====

// Get all guests (admin)
app.get('/api/admin/invitados', verificarAdmin, async (req, res) => {
  try {
    console.log('🔄 GET /api/admin/invitados - Petición recibida');
    
    const guests = await models.Guest.find();
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    console.log('🔄 Enviando respuesta con', guests.length, 'invitados');
    res.json(guests);
    
  } catch (error) {
    console.error('Get guests admin error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Add new guest (admin)
app.post('/api/admin/invitados', verificarAdmin, async (req, res) => {
  try {
    const { nombre, email, telefono, asistencia, acompañantes, notas } = req.body;
    
    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }
    
    // Check if email already exists
    const existingGuest = await models.Guest.findOne({ email });
    if (existingGuest) {
      return res.status(409).json({ error: 'Ya existe un invitado con ese email' });
    }
    
    // Generate new ID
    const lastGuest = await models.Guest.findOne().sort({ id: -1 });
    const newId = lastGuest ? lastGuest.id + 1 : 1;
    
    const newGuest = new models.Guest({
      id: newId,
      nombre,
      email,
      telefono: telefono || '',
      asistencia: asistencia || 'pendiente',
      acompañantes: parseInt(acompañantes) || 0,
      notas: notas || '',
      token: uuidv4()
    });
    
    await newGuest.save();
    
    res.json({ 
      mensaje: 'Invitado añadido correctamente',
      invitado: {
        id: newGuest.id,
        nombre: newGuest.nombre,
        email: newGuest.email,
        telefono: newGuest.telefono,
        asistencia: newGuest.asistencia,
        acompañantes: newGuest.acompañantes,
        notas: newGuest.notas
      }
    });
    
  } catch (error) {
    console.error('Add guest error:', error);
    res.status(500).json({ error: 'Error al guardar el invitado' });
  }
});

// ===== CASH GIFT CARD ROUTES =====

// Get cash gift cards
app.get('/api/cash-gift-cards', async (req, res) => {
  try {
    const cards = await models.CashGiftCard.find({ isActive: true });
    res.json(cards);
  } catch (error) {
    console.error('Get cash gift cards error:', error);
    res.status(500).json({ error: 'Error al cargar las tarjetas de pago' });
  }
});

// ===== DATA MIGRATION UTILITIES =====

// Migrate data from JSON files to MongoDB Atlas
app.post('/api/admin/migrate-data', verificarAdmin, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    console.log('🔄 Starting data migration to MongoDB Atlas...');
    
    // Clear existing data
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
    
    // Migrate guests
    const guestsPath = path.join(__dirname, 'data', 'invitados.json');
    if (fs.existsSync(guestsPath)) {
      const guests = JSON.parse(fs.readFileSync(guestsPath, 'utf-8'));
      await models.Guest.insertMany(guests);
      console.log(`✅ Migrated ${guests.length} guests`);
    }
    
    // Migrate admins
    const adminPath = path.join(__dirname, 'data', 'admin.json');
    if (fs.existsSync(adminPath)) {
      const admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
      await models.Admin.insertMany(admins);
      console.log(`✅ Migrated ${admins.length} admins`);
    }
    
    // Migrate events
    const agendaPath = path.join(__dirname, 'data', 'agenda.json');
    if (fs.existsSync(agendaPath)) {
      const events = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
      await models.Event.insertMany(events);
      console.log(`✅ Migrated ${events.length} events`);
    }
    
    // Migrate gifts
    const giftsPath = path.join(__dirname, 'data', 'regalos.json');
    if (fs.existsSync(giftsPath)) {
      const gifts = JSON.parse(fs.readFileSync(giftsPath, 'utf-8'));
      await models.Gift.insertMany(gifts);
      console.log(`✅ Migrated ${gifts.length} gifts`);
    }
    
    // Migrate cash gift cards
    const cardsPath = path.join(__dirname, 'data', 'cash-gift-cards.json');
    if (fs.existsSync(cardsPath)) {
      const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
      await models.CashGiftCard.insertMany(cards);
      console.log(`✅ Migrated ${cards.length} cash gift cards`);
    }
    
    res.json({ mensaje: 'Migración completada exitosamente' });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Error durante la migración' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`☁️ Vercel: ${process.env.VERCEL === '1' ? 'Yes' : 'No'}`);
  console.log(`🗄️ Database: MongoDB Atlas (BodaDB)`);
});
