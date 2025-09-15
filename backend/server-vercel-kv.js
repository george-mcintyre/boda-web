// Servidor base Express para la web de la boda con Vercel KV
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51S3mEM1VZvSGk6xqXEVy537524nXBqzArijKFhiKHcfjWWpx774QfInVvUglbnP10rwzG1wpAIkLkKYHBtawI5V100vONks99y');

// Import Vercel KV configuration
const { dataStore } = require('./config/vercel-kv');

const app = express();
const PORT = process.env.PORT || 3000;

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
  res.json(dataStore.getEnvironmentInfo());
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
    const guests = await dataStore.get('invitados') || [];
    const guest = guests.find(g => g.email === email);
    
    if (guest) {
      if (password) {
        return res.status(400).json({ error: 'Los invitados no requieren contraseña.' });
      }
      
      // Generate session token for guest
      const token = uuidv4();
      guest.token = token;
      
      // Update guest in array
      const guestIndex = guests.findIndex(g => g.email === email);
      guests[guestIndex] = guest;
      await dataStore.set('invitados', guests);

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
    const admins = await dataStore.get('admin') || [];
    const admin = admins.find(a => a.email === email);
    
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
      
      // Update admin in array
      const adminIndex = admins.findIndex(a => a.email === email);
      admins[adminIndex] = admin;
      await dataStore.set('admin', admins);
      
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
    const guests = await dataStore.get('invitados') || [];
    const guest = guests.find(g => g.email === email);
    if (guest) {
      return res.json({ 
        tipo: 'invitado',
        email: email,
        nombre: guest.nombre
      });
    }

    // Search in admins
    const admins = await dataStore.get('admin') || [];
    const admin = admins.find(a => a.email === email);
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

    const guests = await dataStore.get('invitados') || [];
    const guest = guests.find(g => g.token === token);
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
    const menu = await dataStore.get('menu');
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
    
    const guests = await dataStore.get('invitados') || [];
    const guestIndex = guests.findIndex(g => g.token === token);
    if (guestIndex === -1) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    guests[guestIndex].seleccionMenu = {
      entrante,
      principal,
      postre,
      opcion,
      alergias
    };
    
    await dataStore.set('invitados', guests);
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
    
    const agenda = await dataStore.get('agenda') || [];
    console.log('GET /api/agenda - Eventos encontrados:', agenda.length);
    
    res.json(agenda);
  } catch (error) {
    console.error('GET /api/agenda - Error:', error);
    res.status(500).json({ error: 'Error interno del servidor al cargar la agenda.' });
  }
});

// ===== GIFT ROUTES =====

// Get gifts
app.get('/api/regalos', async (req, res) => {
  try {
    const regalos = await dataStore.get('regalos') || [];
    console.log('GET /api/regalos - Regalos cargados:', regalos.length);
    res.json(regalos);
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
    
    const guests = await dataStore.get('invitados') || [];
    const guest = guests.find(g => g.token === token);
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    const regalos = await dataStore.get('regalos') || [];
    const regaloIndex = regalos.findIndex(r => r.id === parseInt(id));
    if (regaloIndex === -1) {
      return res.status(404).json({ error: 'Regalo no encontrado.' });
    }
    
    if (regalos[regaloIndex].reservadoPor) {
      return res.status(409).json({ error: 'Este regalo ya ha sido reservado.' });
    }
    
    regalos[regaloIndex].reservadoPor = guest.email;
    await dataStore.set('regalos', regalos);
    
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
    
    const guests = await dataStore.get('invitados') || [];
    const guest = guests.find(g => g.token === token);
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    const regalos = await dataStore.get('regalos') || [];
    const regaloIndex = regalos.findIndex(r => r.id === parseInt(id));
    if (regaloIndex === -1) {
      return res.status(404).json({ error: 'Regalo no encontrado.' });
    }
    
    if (!regalos[regaloIndex].reservadoPor) {
      return res.status(409).json({ error: 'Este regalo no está reservado.' });
    }
    
    if (regalos[regaloIndex].reservadoPor !== guest.email) {
      return res.status(403).json({ error: 'Solo puedes cancelar tus propias reservas.' });
    }
    
    regalos[regaloIndex].reservadoPor = null;
    await dataStore.set('regalos', regalos);
    
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
    
    const guests = await dataStore.get('invitados') || [];
    const guest = guests.find(g => g.token === token);
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    const mensajes = await dataStore.get('mensajes') || [];
    mensajes.push({
      nombre: guest.nombre,
      email: guest.email,
      mensaje,
      fecha: new Date().toISOString()
    });
    
    await dataStore.set('mensajes', mensajes);
    res.json({ mensaje: 'Mensaje enviado correctamente.' });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get all messages
app.get('/api/mensajes', async (req, res) => {
  try {
    const mensajes = await dataStore.get('mensajes') || [];
    res.json(mensajes);
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
    
    const guests = await dataStore.get('invitados') || [];
    const guest = guests.find(g => g.token === token);
    if (!guest) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    const comentarios = await dataStore.get('comentarios') || [];
    comentarios.unshift({
      id: 'comment_' + Date.now(),
      nombre: guest.nombre,
      email: guest.email,
      comentario,
      fecha: new Date().toISOString(),
      reacciones: {}
    });
    
    await dataStore.set('comentarios', comentarios);
    res.json({ mensaje: 'Comentario publicado correctamente.' });
    
  } catch (error) {
    console.error('Send comment error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get all comments
app.get('/api/comentarios', async (req, res) => {
  try {
    const comentarios = await dataStore.get('comentarios') || [];
    res.json(comentarios);
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
    
    const admins = await dataStore.get('admin') || [];
    const admin = admins.find(a => a.token === token);
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
    
    const invitados = await dataStore.get('invitados') || [];
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    console.log('🔄 Enviando respuesta con', invitados.length, 'invitados');
    res.json(invitados);
    
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
    
    const invitados = await dataStore.get('invitados') || [];
    
    // Check if email already exists
    if (invitados.find(inv => inv.email === email)) {
      return res.status(409).json({ error: 'Ya existe un invitado con ese email' });
    }
    
    // Generate new ID
    const newId = Math.max(...invitados.map(inv => inv.id || 0), 0) + 1;
    
    const nuevoInvitado = {
      id: newId,
      nombre,
      email,
      telefono: telefono || '',
      asistencia: asistencia || 'pendiente',
      acompañantes: parseInt(acompañantes) || 0,
      notas: notas || '',
      fechaRegistro: new Date().toISOString(),
      seleccionMenu: null,
      confirmacionesAgenda: {},
      token: uuidv4()
    };
    
    invitados.push(nuevoInvitado);
    await dataStore.set('invitados', invitados);
    
    res.json({ 
      mensaje: 'Invitado añadido correctamente',
      invitado: {
        id: nuevoInvitado.id,
        nombre: nuevoInvitado.nombre,
        email: nuevoInvitado.email,
        telefono: nuevoInvitado.telefono,
        asistencia: nuevoInvitado.asistencia,
        acompañantes: nuevoInvitado.acompañantes,
        notas: nuevoInvitado.notas
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
    const cards = await dataStore.get('cash-gift-cards') || [];
    const activeCards = cards.filter(card => card.isActive);
    res.json(activeCards);
  } catch (error) {
    console.error('Get cash gift cards error:', error);
    res.status(500).json({ error: 'Error al cargar las tarjetas de pago' });
  }
});

// ===== DATA MIGRATION UTILITIES =====

// Migrate data from JSON files to Vercel KV
app.post('/api/admin/migrate-data', verificarAdmin, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    console.log('🔄 Starting data migration to Vercel KV...');
    
    // List of data files to migrate
    const dataFiles = [
      'invitados', 'admin', 'agenda', 'regalos', 'mensajes', 
      'comentarios', 'menu', 'cash-gift-cards', 'config'
    ];
    
    let migratedCount = 0;
    
    for (const fileName of dataFiles) {
      const filePath = path.join(__dirname, 'data', `${fileName}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          await dataStore.set(fileName, data);
          console.log(`✅ Migrated ${fileName}: ${Array.isArray(data) ? data.length : 'object'} items`);
          migratedCount++;
        } catch (error) {
          console.error(`❌ Error migrating ${fileName}:`, error);
        }
      }
    }
    
    res.json({ 
      mensaje: `Migración completada exitosamente. ${migratedCount} archivos migrados.`,
      migratedFiles: migratedCount
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Error durante la migración' });
  }
});

// Get storage info
app.get('/api/admin/storage-info', verificarAdmin, async (req, res) => {
  try {
    const info = dataStore.getEnvironmentInfo();
    const keys = await dataStore.listKeys();
    
    res.json({
      ...info,
      keys: keys,
      keyCount: keys.length
    });
  } catch (error) {
    console.error('Storage info error:', error);
    res.status(500).json({ error: 'Error obteniendo información de almacenamiento' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`☁️ Vercel: ${process.env.VERCEL === '1' ? 'Yes' : 'No'}`);
  console.log(`💾 Storage: ${dataStore.getEnvironmentInfo().storage}`);
});
