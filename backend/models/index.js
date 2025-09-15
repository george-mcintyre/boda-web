const mongoose = require('mongoose');

// Guest Schema
const guestSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telefono: { type: String, default: '' },
  asistencia: { type: String, enum: ['pendiente', 'confirmado', 'cancelado'], default: 'pendiente' },
  acompañantes: { type: Number, default: 0 },
  notas: { type: String, default: '' },
  fechaRegistro: { type: Date, default: Date.now },
  seleccionMenu: {
    entrante: String,
    principal: String,
    postre: String,
    opcion: String,
    alergias: String
  },
  confirmacionesAgenda: { type: Map, of: Boolean, default: {} },
  confirmacionesEventos: { type: Map, of: Boolean, default: {} },
  token: { type: String, unique: true, sparse: true }
}, {
  timestamps: true
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String, unique: true, sparse: true }
}, {
  timestamps: true
});

// Event Schema
const eventSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  fecha: { type: String, required: true },
  dia: { type: String, required: true },
  hora: { type: String, required: true },
  titulo: { type: String, required: true },
  descripcion: { type: String, default: '' },
  lugar: { type: String, required: true },
  direccion: { type: String, required: true }
}, {
  timestamps: true
});

// Gift Schema
const giftSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  nombre: { type: String, required: true },
  descripcion: { type: String, default: '' },
  precio: { type: String, default: '' },
  categoria: { type: String, default: 'General' },
  url: { type: String, default: '' },
  reservadoPor: { type: String, default: null }
}, {
  timestamps: true
});

// Message Schema
const messageSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  mensaje: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Comment Schema
const commentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  email: { type: String, required: true },
  comentario: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  reacciones: { type: Map, of: [String], default: {} }
}, {
  timestamps: true
});

// Menu Schema
const menuSchema = new mongoose.Schema({
  entrantes: [{
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    alergenos: [String]
  }],
  principales: [{
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    alergenos: [String]
  }],
  postres: [{
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    alergenos: [String]
  }]
}, {
  timestamps: true
});

// Cash Gift Card Schema
const cashGiftCardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  imageId: { type: String, default: null },
  imageUrl: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Cash Gift Schema
const cashGiftSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  donorName: { type: String, required: true },
  donorEmail: { type: String, required: true },
  donorMessage: { type: String, default: '' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'eur' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  sessionId: { type: String, required: true },
  paymentIntentId: { type: String, default: null },
  completedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Configuration Schema
const configSchema = new mongoose.Schema({
  agenda: {
    bloqueada: { type: Boolean, default: false },
    fechaBloqueo: { type: Date, default: null },
    motivoBloqueo: { type: String, default: null }
  },
  sistema: {
    ultimaActualizacion: { type: Date, default: Date.now },
    version: { type: String, default: '1.0.0' }
  }
}, {
  timestamps: true
});

// Create models
const models = {
  Guest: mongoose.model('Guest', guestSchema),
  Admin: mongoose.model('Admin', adminSchema),
  Event: mongoose.model('Event', eventSchema),
  Gift: mongoose.model('Gift', giftSchema),
  Message: mongoose.model('Message', messageSchema),
  Comment: mongoose.model('Comment', commentSchema),
  Menu: mongoose.model('Menu', menuSchema),
  CashGiftCard: mongoose.model('CashGiftCard', cashGiftCardSchema),
  CashGift: mongoose.model('CashGift', cashGiftSchema),
  Config: mongoose.model('Config', configSchema)
};

module.exports = models;

