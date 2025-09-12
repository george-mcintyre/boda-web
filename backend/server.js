// Servidor base Express para la web de la boda
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51S3mEM1VZvSGk6xqXEVy537524nXBqzArijKFhiKHcfjWWpx774QfInVvUglbnP10rwzG1wpAIkLkKYHBtawI5V100vONks99y');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Rutas de ejemplo (a completar más adelante)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ... aquí irán las rutas para RSVP, login, invitados, admin ...



// Ruta para login de invitados (solo con email)
app.post('/api/login', (req, res) => {
  console.log('🔍 Login - Body recibido:', req.body);
  console.log('🔍 Login - Headers:', req.headers);
  
  const { email, password } = req.body;
  console.log('🔍 Email extraído:', email);
  console.log('🔍 Password proporcionado:', password ? 'SÍ' : 'NO');
  
  if (!email) {
    console.log('❌ Error: Email no proporcionado');
    return res.status(400).json({ error: 'Email requerido.' });
  }

  // Buscar primero en invitados
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }

  const invitadoIndex = invitados.findIndex(inv => inv.email === email);
  
  // Si es un invitado (no requiere password)
  if (invitadoIndex !== -1) {
    if (password) {
      console.log('❌ Error: Los invitados no requieren contraseña');
      return res.status(400).json({ error: 'Los invitados no requieren contraseña.' });
    }
    
    // Generar token de sesión para invitado
    const token = uuidv4();
    invitados[invitadoIndex].token = token;

    // Guardar el token en el archivo
    fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));

    // Devolver el token y datos básicos
    res.json({ 
      mensaje: 'Acceso exitoso', 
      token, 
      tipo: 'invitado',
      nombre: invitados[invitadoIndex].nombre, 
      email: invitados[invitadoIndex].email 
    });
    return;
  }

  // Si no es invitado, buscar en administradores
  const adminPath = path.join(__dirname, 'data', 'admin.json');
  let admins = [];
  if (fs.existsSync(adminPath)) {
    admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
  }

  const adminIndex = admins.findIndex(a => a.email === email);
  
  // Si es un administrador
  if (adminIndex !== -1) {
    if (!password) {
      console.log('❌ Error: Administrador requiere contraseña');
      return res.status(400).json({ 
        error: 'Este email requiere contraseña de administrador.',
        requierePassword: true,
        email: email
      });
    }
    
    // Verificar contraseña del administrador
    if (admins[adminIndex].password !== password) {
      console.log('❌ Error: Contraseña incorrecta para administrador');
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }
    
    // Generar token de sesión para admin
    const token = uuidv4();
    admins[adminIndex].token = token;
    fs.writeFileSync(adminPath, JSON.stringify(admins, null, 2));
    
    res.json({ 
      mensaje: 'Login de admin exitoso', 
      token, 
      tipo: 'admin',
      email: admins[adminIndex].email 
    });
    return;
  }

  // Si no se encuentra en ninguno de los dos
  console.log('❌ Error: Email no encontrado');
  return res.status(401).json({ error: 'Email no encontrado en la lista de invitados o administradores.' });
});

// Nueva ruta para verificar email (primer paso)
app.post('/api/verify-email', (req, res) => {
  console.log('🔍 Verificación de email - Body recibido:', req.body);
  
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email requerido.' });
  }

  // Buscar en invitados
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }

  const invitado = invitados.find(inv => inv.email === email);
  if (invitado) {
    return res.json({ 
      tipo: 'invitado',
      email: email,
      nombre: invitado.nombre
    });
  }

  // Buscar en administradores
  const adminPath = path.join(__dirname, 'data', 'admin.json');
  let admins = [];
  if (fs.existsSync(adminPath)) {
    admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
  }

  const admin = admins.find(a => a.email === email);
  if (admin) {
    return res.json({ 
      tipo: 'admin',
      email: email,
      requierePassword: true
    });
  }

  // No encontrado
  return res.status(404).json({ error: 'Email no encontrado.' });
});

// Ruta protegida para la zona privada de invitados
app.get('/api/invitado', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }

  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }

  const invitado = invitados.find(inv => inv.token === token);
  if (!invitado) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  // Devolver datos privados
  res.json({
    nombre: invitado.nombre,
    email: invitado.email,
    seleccionMenu: invitado.seleccionMenu || null,
    confirmacionesAgenda: invitado.confirmacionesAgenda || {},
    // Aquí puedes añadir más datos según necesites
  });
});

// Ruta para obtener el menú
app.get('/api/menu', (req, res) => {
  const menuPath = path.join(__dirname, 'data', 'menu.json');
  if (!fs.existsSync(menuPath)) {
    return res.status(404).json({ error: 'Menú no disponible.' });
  }
  const menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  res.json(menu);
});

// Ruta para guardar la selección de menú y patologías/alergias del invitado
app.post('/api/menu/seleccion', (req, res) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }
  const { entrante, principal, postre, opcion, alergias } = req.body;
  if (!entrante || !principal || !postre) {
    return res.status(400).json({ error: 'Faltan datos de selección.' });
  }
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  const invitadoIndex = invitados.findIndex(inv => inv.token === token);
  if (invitadoIndex === -1) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  // Guardar la selección en el registro del invitado
  invitados[invitadoIndex].seleccionMenu = {
    entrante,
    principal,
    postre,
    opcion,
    alergias
  };
  fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
  res.json({ mensaje: 'Selección de menú guardada correctamente.' });
});

// Ruta para obtener la agenda
app.get('/api/agenda', (req, res) => {
  console.log('GET /api/agenda - Solicitando agenda...');
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  
  if (!fs.existsSync(agendaPath)) {
    console.log('GET /api/agenda - Archivo agenda.json no encontrado');
    return res.status(404).json({ error: 'Agenda no disponible.' });
  }
  
  try {
    const agendaData = fs.readFileSync(agendaPath, 'utf-8');
    console.log('GET /api/agenda - Archivo leído, tamaño:', agendaData.length, 'bytes');
    
    const agenda = JSON.parse(agendaData);
    console.log('GET /api/agenda - JSON parseado correctamente, eventos:', agenda.length);
    
    res.json(agenda);
  } catch (error) {
    console.error('GET /api/agenda - Error al procesar agenda:', error);
    res.status(500).json({ error: 'Error interno del servidor al cargar la agenda.' });
  }
});

// Ruta para obtener la lista de regalos
app.get('/api/regalos', (req, res) => {
  const regalosPath = path.join(__dirname, 'data', 'regalos.json');
  if (!fs.existsSync(regalosPath)) {
    return res.status(404).json({ error: 'Lista de regalos no disponible.' });
  }
  const regalos = JSON.parse(fs.readFileSync(regalosPath, 'utf-8'));
  console.log('GET /api/regalos - Regalos cargados:', regalos.length);
  console.log('IDs disponibles:', regalos.map(r => r.id));
  res.json(regalos);
});

// Ruta para reservar un regalo
app.post('/api/regalos/reservar', (req, res) => {
  console.log('=== RESERVAR REGALO ===');
  console.log('Body completo:', req.body);
  const token = req.headers['authorization'];
  const { id } = req.body;
  console.log('Token:', token ? 'Presente' : 'Ausente');
  console.log('ID recibido:', id, 'Tipo:', typeof id);
  if (!token || !id) {
    return res.status(400).json({ error: 'Token o id de regalo no proporcionado.' });
  }
  // Buscar invitado por token
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  const invitado = invitados.find(inv => inv.token === token);
  if (!invitado) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  // Buscar regalo por id
  const regalosPath = path.join(__dirname, 'data', 'regalos.json');
  let regalos = [];
  if (fs.existsSync(regalosPath)) {
    regalos = JSON.parse(fs.readFileSync(regalosPath, 'utf-8'));
    console.log('Regalos cargados:', regalos.length);
    console.log('IDs de regalos disponibles:', regalos.map(r => ({ id: r.id, tipo: typeof r.id, nombre: r.nombre })));
  } else {
    console.log('Archivo de regalos no encontrado');
  }
  // Convertir id a número para comparación
  const idNumero = parseInt(id);
  console.log('ID recibido:', id, 'ID convertido:', idNumero);
  console.log('Regalos disponibles:', regalos.map(r => r.id));
  
  // Buscar el regalo tanto por ID numérico como por string
  let regaloIndex = regalos.findIndex(r => r.id === idNumero);
  if (regaloIndex === -1) {
    // Si no se encuentra por número, intentar por string
    regaloIndex = regalos.findIndex(r => r.id.toString() === id.toString());
  }
  console.log('Índice encontrado:', regaloIndex);
  if (regaloIndex === -1) {
    return res.status(404).json({ error: 'Regalo no encontrado.' });
  }
  if (regalos[regaloIndex].reservadoPor) {
    return res.status(409).json({ error: 'Este regalo ya ha sido reservado.' });
  }
  // Reservar el regalo
  regalos[regaloIndex].reservadoPor = invitado.email;
  fs.writeFileSync(regalosPath, JSON.stringify(regalos, null, 2));
  res.json({ mensaje: 'Regalo reservado correctamente.' });
});

// Ruta para cancelar la reserva de un regalo
app.post('/api/regalos/cancelar', (req, res) => {
  const token = req.headers['authorization'];
  const { id } = req.body;
  
  if (!token || !id) {
    return res.status(400).json({ error: 'Token o id de regalo no proporcionado.' });
  }
  
  // Buscar invitado por token
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  const invitado = invitados.find(inv => inv.token === token);
  if (!invitado) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  
  // Buscar regalo por id
  const regalosPath = path.join(__dirname, 'data', 'regalos.json');
  let regalos = [];
  if (fs.existsSync(regalosPath)) {
    regalos = JSON.parse(fs.readFileSync(regalosPath, 'utf-8'));
  }
  
  // Convertir id a número para comparación
  const idNumero = parseInt(id);
  
  // Buscar el regalo tanto por ID numérico como por string
  let regaloIndex = regalos.findIndex(r => r.id === idNumero);
  if (regaloIndex === -1) {
    // Si no se encuentra por número, intentar por string
    regaloIndex = regalos.findIndex(r => r.id.toString() === id.toString());
  }
  
  if (regaloIndex === -1) {
    return res.status(404).json({ error: 'Regalo no encontrado.' });
  }
  
  const regalo = regalos[regaloIndex];
  
  if (!regalo.reservadoPor) {
    return res.status(409).json({ error: 'Este regalo no está reservado.' });
  }
  
  if (regalo.reservadoPor !== invitado.email) {
    return res.status(403).json({ error: 'Solo puedes cancelar tus propias reservas.' });
  }
  
  // Cancelar la reserva del regalo
  regalos[regaloIndex].reservadoPor = null;
  fs.writeFileSync(regalosPath, JSON.stringify(regalos, null, 2));
  
  res.json({ mensaje: 'Reserva de regalo cancelada correctamente.' });
});

// Ruta para enviar un mensaje
app.post('/api/mensajes', (req, res) => {
  const token = req.headers['authorization'];
  const { mensaje } = req.body;
  if (!token || !mensaje) {
    return res.status(400).json({ error: 'Token o mensaje no proporcionado.' });
  }
  // Buscar invitado por token
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  const invitado = invitados.find(inv => inv.token === token);
  if (!invitado) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  // Guardar el mensaje
  const mensajesPath = path.join(__dirname, 'data', 'mensajes.json');
  let mensajes = [];
  if (fs.existsSync(mensajesPath)) {
    mensajes = JSON.parse(fs.readFileSync(mensajesPath, 'utf-8'));
  }
  mensajes.push({
    nombre: invitado.nombre,
    email: invitado.email,
    mensaje,
    fecha: new Date().toISOString()
  });
  fs.writeFileSync(mensajesPath, JSON.stringify(mensajes, null, 2));
  res.json({ mensaje: 'Mensaje enviado correctamente.' });
});

// Ruta para obtener todos los mensajes
app.get('/api/mensajes', (req, res) => {
  const mensajesPath = path.join(__dirname, 'data', 'mensajes.json');
  if (!fs.existsSync(mensajesPath)) {
    return res.status(404).json({ error: 'No hay mensajes.' });
  }
  const mensajes = JSON.parse(fs.readFileSync(mensajesPath, 'utf-8'));
  res.json(mensajes);
});

// Ruta para enviar un comentario
app.post('/api/comentarios', (req, res) => {
  const token = req.headers['authorization'];
  const { comentario } = req.body;
  if (!token || !comentario) {
    return res.status(400).json({ error: 'Token o comentario no proporcionado.' });
  }
  // Buscar invitado por token
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  const invitado = invitados.find(inv => inv.token === token);
  if (!invitado) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  // Guardar el comentario
  const comentariosPath = path.join(__dirname, 'data', 'comentarios.json');
  let comentarios = [];
  if (fs.existsSync(comentariosPath)) {
    comentarios = JSON.parse(fs.readFileSync(comentariosPath, 'utf-8'));
  }
  // Insertar al principio del array para que aparezca primero
  comentarios.unshift({
    id: 'comment_' + Date.now(),
    nombre: invitado.nombre,
    email: invitado.email,
    comentario,
    fecha: new Date().toISOString(),
    reacciones: {} // Inicializar objeto de reacciones vacío
  });
  fs.writeFileSync(comentariosPath, JSON.stringify(comentarios, null, 2));
  res.json({ mensaje: 'Comentario publicado correctamente.' });
});

// Ruta para obtener todos los comentarios
app.get('/api/comentarios', (req, res) => {
  const comentariosPath = path.join(__dirname, 'data', 'comentarios.json');
  if (!fs.existsSync(comentariosPath)) {
    return res.status(404).json({ error: 'No hay comentarios.' });
  }
  const comentarios = JSON.parse(fs.readFileSync(comentariosPath, 'utf-8'));
  res.json(comentarios);
});

// Ruta para eliminar un comentario (solo administradores)
app.delete('/api/comentarios/:id', verificarAdmin, (req, res) => {
  const comentariosPath = path.join(__dirname, 'data', 'comentarios.json');
  if (!fs.existsSync(comentariosPath)) {
    return res.status(404).json({ error: 'No hay comentarios.' });
  }
  
  let comentarios = JSON.parse(fs.readFileSync(comentariosPath, 'utf-8'));
  const comentarioId = req.params.id;
  
  const comentarioIndex = comentarios.findIndex(c => c.id === comentarioId);
  if (comentarioIndex === -1) {
    return res.status(404).json({ error: 'Comentario no encontrado.' });
  }
  
  comentarios.splice(comentarioIndex, 1);
  fs.writeFileSync(comentariosPath, JSON.stringify(comentarios, null, 2));
  
  res.json({ mensaje: 'Comentario eliminado correctamente.' });
});

// Ruta para agregar/quitar reacción a un comentario
app.post('/api/comentarios/:id/reaccion', (req, res) => {
  const token = req.headers['authorization'];
  const { emoji } = req.body;
  const commentId = req.params.id;
  
  if (!token || !emoji) {
    return res.status(400).json({ error: 'Token y emoji son requeridos.' });
  }
  
  // Buscar invitado por token
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  const invitado = invitados.find(inv => inv.token === token);
  if (!invitado) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  
  // Buscar el comentario
  const comentariosPath = path.join(__dirname, 'data', 'comentarios.json');
  if (!fs.existsSync(comentariosPath)) {
    return res.status(404).json({ error: 'No hay comentarios.' });
  }
  
  let comentarios = JSON.parse(fs.readFileSync(comentariosPath, 'utf-8'));
  const comentarioIndex = comentarios.findIndex(c => c.id === commentId);
  
  if (comentarioIndex === -1) {
    return res.status(404).json({ error: 'Comentario no encontrado.' });
  }
  
  // Inicializar reacciones si no existen
  if (!comentarios[comentarioIndex].reacciones) {
    comentarios[comentarioIndex].reacciones = {};
  }
  
  // Inicializar el emoji si no existe
  if (!comentarios[comentarioIndex].reacciones[emoji]) {
    comentarios[comentarioIndex].reacciones[emoji] = [];
  }
  
  const userEmail = invitado.email;
  const emojiReacciones = comentarios[comentarioIndex].reacciones[emoji];
  const userIndex = emojiReacciones.indexOf(userEmail);
  
  // Si el usuario ya reaccionó con este emoji, quitarlo (toggle)
  if (userIndex !== -1) {
    emojiReacciones.splice(userIndex, 1);
    if (emojiReacciones.length === 0) {
      delete comentarios[comentarioIndex].reacciones[emoji];
    }
  } else {
    // Si no reaccionó, agregarlo
    emojiReacciones.push(userEmail);
  }
  
  // Guardar cambios
  fs.writeFileSync(comentariosPath, JSON.stringify(comentarios, null, 2));
  
  res.json({ 
    mensaje: userIndex !== -1 ? 'Reacción eliminada' : 'Reacción agregada',
    reacciones: comentarios[comentarioIndex].reacciones
  });
});



// Ruta para obtener confirmaciones de agenda del invitado
app.get('/api/agenda/confirmaciones', (req, res) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(400).json({ error: 'Token requerido.' });
  }
  
  // Buscar invitado por token
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  const invitado = invitados.find(inv => inv.token === token);
  if (!invitado) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  
  // Limpiar confirmaciones de eventos que no existen
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  let agenda = [];
  if (fs.existsSync(agendaPath)) {
    agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  }
  
  const eventosValidos = agenda.map(evento => evento.id.toString());
  const confirmacionesLimpias = {};
  
  if (invitado.confirmacionesAgenda) {
    Object.keys(invitado.confirmacionesAgenda).forEach(eventoId => {
      if (eventosValidos.includes(eventoId)) {
        confirmacionesLimpias[eventoId] = invitado.confirmacionesAgenda[eventoId];
      }
    });
    
    // Si se limpiaron datos, guardar los cambios
    if (Object.keys(confirmacionesLimpias).length !== Object.keys(invitado.confirmacionesAgenda).length) {
      const invitadoIndex = invitados.findIndex(inv => inv.token === token);
      if (invitadoIndex !== -1) {
        invitados[invitadoIndex].confirmacionesAgenda = confirmacionesLimpias;
        fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
      }
    }
  }
  
  res.json({ 
    confirmaciones: confirmacionesLimpias
  });
});

// Ruta de login de administrador
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos de acceso.' });
  }
  const adminPath = path.join(__dirname, 'data', 'admin.json');
  let admins = [];
  if (fs.existsSync(adminPath)) {
    admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
  }
  const adminIndex = admins.findIndex(a => a.email === email && a.password === password);
  if (adminIndex === -1) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
  }
  // Generar token de sesión para admin
  const token = uuidv4();
  admins[adminIndex].token = token;
  fs.writeFileSync(adminPath, JSON.stringify(admins, null, 2));
  res.json({ mensaje: 'Login de admin exitoso', token, email: admins[adminIndex].email });
});

// Middleware para verificar token de admin
function verificarAdmin(req, res, next) {
  const token = req.headers['authorization'];
  
  // Para pruebas, permitir acceso con token de prueba
  if (token === 'test-token') {
    return next();
  }
  
  if (!token) return res.status(401).json({ error: 'Token de admin no proporcionado.' });
  const adminPath = path.join(__dirname, 'data', 'admin.json');
  let admins = [];
  if (fs.existsSync(adminPath)) {
    admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
  }
  const admin = admins.find(a => a.token === token);
  if (!admin) return res.status(401).json({ error: 'Token de admin inválido.' });
  next();
}

// Rutas protegidas para el panel de administración
app.get('/api/admin/invitados', verificarAdmin, (req, res) => {
  console.log('🔄 GET /api/admin/invitados - Petición recibida');
  console.log('🔄 Headers:', req.headers);
  console.log('🔄 Query params:', req.query);
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  // Limpiar confirmaciones de eventos que no existen en todos los invitados
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  let agenda = [];
  if (fs.existsSync(agendaPath)) {
    agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  }
  
  const eventosValidos = agenda.map(evento => evento.id.toString());
  let datosLimpios = false;
  
  invitados.forEach((invitado, index) => {
    if (invitado.confirmacionesAgenda) {
      const confirmacionesLimpias = {};
      Object.keys(invitado.confirmacionesAgenda).forEach(eventoId => {
        if (eventosValidos.includes(eventoId)) {
          confirmacionesLimpias[eventoId] = invitado.confirmacionesAgenda[eventoId];
        }
      });
      
      // Si se limpiaron datos, actualizar el invitado
      if (Object.keys(confirmacionesLimpias).length !== Object.keys(invitado.confirmacionesAgenda).length) {
        invitados[index].confirmacionesAgenda = confirmacionesLimpias;
        datosLimpios = true;
      }
    }
  });
  
  // Guardar los cambios si se limpiaron datos
  if (datosLimpios) {
    fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
  }
  
  // Agregar headers anti-cache
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  console.log('🔄 Enviando respuesta con', invitados.length, 'invitados');
  res.json(invitados);
});

// Ruta para obtener un invitado específico por email
app.get('/api/admin/invitados/:email', verificarAdmin, (req, res) => {
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  const invitado = invitados.find(inv => inv.email === req.params.email);
  if (!invitado) {
    return res.status(404).json({ error: 'Invitado no encontrado.' });
  }
  
  res.json(invitado);
});

// Ruta para actualizar un invitado
app.put('/api/admin/invitados/:email', verificarAdmin, (req, res) => {
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  const { email } = req.params;
  const invitadoIndex = invitados.findIndex(inv => inv.email === email);
  
  if (invitadoIndex === -1) {
    return res.status(404).json({ error: 'Invitado no encontrado.' });
  }
  
  // Actualizar datos del invitado
  const datosActualizados = req.body;
  const nuevoEmail = datosActualizados.email || email;
  
  console.log('Email original:', email);
  console.log('Nuevo email:', nuevoEmail);
  console.log('Datos actualizados:', datosActualizados);
  
  // Verificar si el nuevo email ya existe en otro invitado
  if (nuevoEmail !== email) {
    const emailExiste = invitados.some(inv => inv.email === nuevoEmail && inv.email !== email);
    if (emailExiste) {
      return res.status(400).json({ error: 'El email ya está en uso por otro invitado.' });
    }
  }
  
  // Crear el objeto actualizado con el email al final para asegurar que no se sobrescriba
  const invitadoActualizado = {
    ...invitados[invitadoIndex],
    ...datosActualizados
  };
  invitadoActualizado.email = nuevoEmail;
  
  console.log('Invitado antes de actualizar:', invitados[invitadoIndex]);
  console.log('Invitado después de actualizar:', invitadoActualizado);
  
  // Si el email cambió, necesitamos actualizar el índice
  if (nuevoEmail !== email) {
    // Reemplazar el invitado en la posición actual
    invitados[invitadoIndex] = invitadoActualizado;
    console.log('Email cambió de', email, 'a', nuevoEmail);
  } else {
    // Si el email no cambió, simplemente actualizar
    invitados[invitadoIndex] = invitadoActualizado;
    console.log('Email no cambió');
  }
  
  fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
  res.json({ mensaje: 'Invitado actualizado correctamente.', invitado: invitados[invitadoIndex] });
});

// Ruta para eliminar un invitado
app.delete('/api/admin/invitados/:email', verificarAdmin, (req, res) => {
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  const { email } = req.params;
  const invitadoIndex = invitados.findIndex(inv => inv.email === email);
  
  if (invitadoIndex === -1) {
    return res.status(404).json({ error: 'Invitado no encontrado.' });
  }
  
  // Eliminar el invitado
  const invitadoEliminado = invitados.splice(invitadoIndex, 1)[0];
  fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
  
  res.json({ mensaje: 'Invitado eliminado correctamente.', invitado: invitadoEliminado });
});

app.get('/api/admin/regalos', verificarAdmin, (req, res) => {
  const regalosPath = path.join(__dirname, 'data', 'regalos.json');
  let regalos = [];
  if (fs.existsSync(regalosPath)) {
    regalos = JSON.parse(fs.readFileSync(regalosPath, 'utf-8'));
  }
  res.json(regalos);
});

app.get('/api/admin/mensajes', verificarAdmin, (req, res) => {
  const mensajesPath = path.join(__dirname, 'data', 'mensajes.json');
  let mensajes = [];
  if (fs.existsSync(mensajesPath)) {
    mensajes = JSON.parse(fs.readFileSync(mensajesPath, 'utf-8'));
  }
  res.json(mensajes);
});

app.get('/api/admin/comentarios', verificarAdmin, (req, res) => {
  const comentariosPath = path.join(__dirname, 'data', 'comentarios.json');
  let comentarios = [];
  if (fs.existsSync(comentariosPath)) {
    comentarios = JSON.parse(fs.readFileSync(comentariosPath, 'utf-8'));
  }
  res.json(comentarios);
});

app.get('/api/admin/agenda', verificarAdmin, (req, res) => {
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  let agenda = [];
  if (fs.existsSync(agendaPath)) {
    agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  }
  res.json(agenda);
});

// Ruta para obtener confirmaciones de agenda para admin
app.get('/api/admin/agenda/confirmaciones', verificarAdmin, (req, res) => {
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  
  let invitados = [];
  let agenda = [];
  
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  if (fs.existsSync(agendaPath)) {
    agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  }
  
  // Crear resumen de confirmaciones por evento
  const resumenConfirmaciones = agenda.map(evento => {
    const confirmados = invitados.filter(inv => 
      inv.confirmacionesAgenda && inv.confirmacionesAgenda[evento.id] === true
    ).length;
    const cancelados = invitados.filter(inv => 
      inv.confirmacionesAgenda && inv.confirmacionesAgenda[evento.id] === false
    ).length;
    const pendientes = invitados.filter(inv => 
      !inv.confirmacionesAgenda || inv.confirmacionesAgenda[evento.id] === undefined
    ).length;
    
    return {
      evento: evento,
      confirmados,
      cancelados,
      pendientes,
      total: invitados.length
    };
  });
  
  res.json(resumenConfirmaciones);
});



// Ruta para obtener menú para invitados
app.get('/api/menu', (req, res) => {
  const menuPath = path.join(__dirname, 'data', 'menu.json');
  let menu = {};
  if (fs.existsSync(menuPath)) {
    menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  }
  res.json(menu);
});

// Ruta para obtener datos de menú para admin
app.get('/api/admin/menu', verificarAdmin, (req, res) => {
  const menuPath = path.join(__dirname, 'data', 'menu.json');
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  
  let menu = {};
  let invitados = [];
  
  if (fs.existsSync(menuPath)) {
    menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  }
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  // Contar selecciones de menú
  const seleccionesMenu = invitados.filter(inv => inv.seleccionMenu).map(inv => inv.seleccionMenu);
  
  // Crear estadísticas de menú
  const estadisticasMenu = {
    totalSelecciones: seleccionesMenu.length,
    entrantes: {},
    principales: {},
    postres: {},
    alergias: []
  };
  
  // Contar opciones seleccionadas
  seleccionesMenu.forEach(sel => {
    // Contar entrantes
    if (sel.entrante) {
      estadisticasMenu.entrantes[sel.entrante] = (estadisticasMenu.entrantes[sel.entrante] || 0) + 1;
    }
    
    // Contar principales
    if (sel.principal) {
      estadisticasMenu.principales[sel.principal] = (estadisticasMenu.principales[sel.principal] || 0) + 1;
    }
    
    // Contar postres
    if (sel.postre) {
      estadisticasMenu.postres[sel.postre] = (estadisticasMenu.postres[sel.postre] || 0) + 1;
    }
    
    // Recolectar alergias
    if (sel.alergias) {
      estadisticasMenu.alergias.push({
        invitado: invitados.find(inv => inv.seleccionMenu === sel)?.nombre || 'Desconocido',
        alergias: sel.alergias
      });
    }
  });
  
  const datosMenu = {
    opcionesMenu: menu,
    estadisticas: estadisticasMenu,
    seleccionesDetalladas: seleccionesMenu
  };
  
  res.json(datosMenu);
});

// ===== RUTAS PARA GESTIÓN DE MENÚ =====

// Ruta para obtener un plato específico por ID
app.get('/api/admin/menu/plato/:id', verificarAdmin, (req, res) => {
  const menuPath = path.join(__dirname, 'data', 'menu.json');
  let menu = {};
  if (fs.existsSync(menuPath)) {
    menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  }
  
  // Buscar en todas las categorías
  let plato = null;
  for (const categoria in menu) {
    if (menu[categoria] && Array.isArray(menu[categoria])) {
      plato = menu[categoria].find(p => p.id === req.params.id);
      if (plato) break;
    }
  }
  
  if (!plato) {
    return res.status(404).json({ error: 'Plato no encontrado.' });
  }
  
  res.json(plato);
});

// Ruta para agregar un nuevo plato
app.post('/api/admin/menu/plato', verificarAdmin, (req, res) => {
  const menuPath = path.join(__dirname, 'data', 'menu.json');
  let menu = {};
  if (fs.existsSync(menuPath)) {
    menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  }
  
  const { nombre, descripcion, categoria, alergenos } = req.body;
  
  if (!nombre || !descripcion || !categoria) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben estar completos.' });
  }
  
  // Verificar que la categoría existe
  if (!menu[categoria]) {
    menu[categoria] = [];
  }
  
  const nuevoPlato = {
    id: 'plato_' + Date.now(),
    nombre,
    descripcion,
    alergenos: alergenos || []
  };
  
  menu[categoria].push(nuevoPlato);
  fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2));
  
  res.json({ mensaje: 'Plato agregado correctamente.', plato: nuevoPlato });
});

// Ruta para actualizar un plato
app.put('/api/admin/menu/plato/:id', verificarAdmin, (req, res) => {
  const menuPath = path.join(__dirname, 'data', 'menu.json');
  let menu = {};
  if (fs.existsSync(menuPath)) {
    menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  }
  
  const { id } = req.params;
  const { nombre, descripcion, categoria, alergenos } = req.body;
  
  if (!nombre || !descripcion || !categoria) {
    return res.status(400).json({ error: 'Todos los campos obligatorios deben estar completos.' });
  }
  
  // Buscar el plato en todas las categorías
  let platoIndex = -1;
  let categoriaOriginal = null;
  
  for (const cat in menu) {
    if (menu[cat] && Array.isArray(menu[cat])) {
      const index = menu[cat].findIndex(p => p.id === id);
      if (index !== -1) {
        platoIndex = index;
        categoriaOriginal = cat;
        break;
      }
    }
  }
  
  if (platoIndex === -1) {
    return res.status(404).json({ error: 'Plato no encontrado.' });
  }
  
  // Si la categoría cambió, mover el plato
  if (categoriaOriginal !== categoria) {
    const plato = menu[categoriaOriginal][platoIndex];
    menu[categoriaOriginal].splice(platoIndex, 1);
    
    if (!menu[categoria]) {
      menu[categoria] = [];
    }
    
    menu[categoria].push({
      ...plato,
      nombre,
      descripcion,
      alergenos: alergenos || []
    });
  } else {
    // Actualizar en la misma categoría
    menu[categoria][platoIndex] = {
      ...menu[categoria][platoIndex],
      nombre,
      descripcion,
      alergenos: alergenos || []
    };
  }
  
  fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2));
  res.json({ mensaje: 'Plato actualizado correctamente.' });
});

// Ruta para eliminar un plato
app.delete('/api/admin/menu/plato/:id', verificarAdmin, (req, res) => {
  const menuPath = path.join(__dirname, 'data', 'menu.json');
  let menu = {};
  if (fs.existsSync(menuPath)) {
    menu = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
  }
  
  const { id } = req.params;
  
  // Buscar el plato en todas las categorías
  let platoEliminado = null;
  let categoriaEncontrada = null;
  
  for (const categoria in menu) {
    if (menu[categoria] && Array.isArray(menu[categoria])) {
      const platoIndex = menu[categoria].findIndex(p => p.id === id);
      if (platoIndex !== -1) {
        platoEliminado = menu[categoria][platoIndex];
        menu[categoria].splice(platoIndex, 1);
        categoriaEncontrada = categoria;
        break;
      }
    }
  }
  
  if (!platoEliminado) {
    return res.status(404).json({ error: 'Plato no encontrado.' });
  }
  
  fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2));
  res.json({ mensaje: 'Plato eliminado correctamente.', plato: platoEliminado });
});

// ===== RUTAS PARA GESTIÓN DE INVITADOS =====

// Añadir nuevo invitado
app.post('/api/admin/invitados', verificarAdmin, (req, res) => {
  const { nombre, email, telefono, asistencia, acompañantes, notas } = req.body;
  
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email son requeridos' });
  }
  
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  // Verificar si el email ya existe
  if (invitados.find(inv => inv.email === email)) {
    return res.status(409).json({ error: 'Ya existe un invitado con ese email' });
  }
  
  // Crear nuevo invitado
  const nuevoInvitado = {
    id: Date.now(), // ID único basado en timestamp
    nombre: nombre,
    email: email,
    telefono: telefono || '',
    asistencia: asistencia || 'pendiente',
    acompañantes: parseInt(acompañantes) || 0,
    notas: notas || '',
    fechaRegistro: new Date().toISOString(),
    seleccionMenu: null,
    confirmacionesAgenda: {},
    token: uuidv4() // Generar token único para el invitado
  };
  
  invitados.push(nuevoInvitado);
  
  try {
    fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
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
    console.error('Error al guardar invitado:', error);
    res.status(500).json({ error: 'Error al guardar el invitado' });
  }
});

// Obtener lista completa de invitados para admin (ya definida arriba)

// Editar invitado existente
app.put('/api/admin/invitados/:id', verificarAdmin, (req, res) => {
  const { id } = req.params;
  const { nombre, email } = req.body;
  
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  const invitadoIndex = invitados.findIndex(inv => inv.id == id);
  
  if (invitadoIndex === -1) {
    return res.status(404).json({ error: 'Invitado no encontrado' });
  }
  
  // Verificar si el email ya existe en otro invitado
  if (email && email !== invitados[invitadoIndex].email) {
    const emailExiste = invitados.find(inv => inv.email === email && inv.id != id);
    if (emailExiste) {
      return res.status(400).json({ error: 'Ya existe otro invitado con ese email' });
    }
  }
  
  // Actualizar datos
  if (nombre) invitados[invitadoIndex].nombre = nombre;
  if (email) invitados[invitadoIndex].email = email;
  
  try {
    fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
    res.json({ 
      mensaje: 'Invitado actualizado correctamente',
      invitado: invitados[invitadoIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el invitado' });
  }
});

// Eliminar invitado
app.delete('/api/admin/invitados/:id', verificarAdmin, (req, res) => {
  const { id } = req.params;
  
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  const invitadoIndex = invitados.findIndex(inv => inv.id == id);
  
  if (invitadoIndex === -1) {
    return res.status(404).json({ error: 'Invitado no encontrado' });
  }
  
  const invitadoEliminado = invitados.splice(invitadoIndex, 1)[0];
  
  try {
    fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
    res.json({ 
      mensaje: 'Invitado eliminado correctamente',
      invitado: invitadoEliminado
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el invitado' });
  }
});

// ===== RUTAS PARA GESTIÓN DE REGALOS =====

// Obtener lista completa de regalos para admin (ya definida arriba)

// Añadir nuevo regalo
app.post('/api/admin/regalos', verificarAdmin, (req, res) => {
  const { nombre, descripcion, precio, categoria, url } = req.body;
  
  if (!nombre) {
    return res.status(400).json({ error: 'Nombre del regalo es requerido' });
  }
  
  const regalosPath = path.join(__dirname, 'data', 'regalos.json');
  let regalos = [];
  
  if (fs.existsSync(regalosPath)) {
    regalos = JSON.parse(fs.readFileSync(regalosPath, 'utf-8'));
  }
  
  // Generar ID único
  const nuevoId = Math.max(...regalos.map(r => r.id), 0) + 1;
  
  const nuevoRegalo = {
    id: nuevoId,
    nombre: nombre,
    descripcion: descripcion || '',
    precio: precio || '',
    categoria: categoria || 'General',
    url: url || '',
    reservadoPor: null
  };
  
  regalos.push(nuevoRegalo);
  
  try {
    fs.writeFileSync(regalosPath, JSON.stringify(regalos, null, 2));
    res.json({ 
      mensaje: 'Regalo añadido correctamente',
      regalo: nuevoRegalo
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar el regalo' });
  }
});

// Editar regalo existente
app.put('/api/admin/regalos/:id', verificarAdmin, (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, categoria, url } = req.body;
  
  const regalosPath = path.join(__dirname, 'data', 'regalos.json');
  let regalos = [];
  
  if (fs.existsSync(regalosPath)) {
    regalos = JSON.parse(fs.readFileSync(regalosPath, 'utf-8'));
  }
  
  const regaloIndex = regalos.findIndex(r => r.id == id);
  
  if (regaloIndex === -1) {
    return res.status(404).json({ error: 'Regalo no encontrado' });
  }
  
  // Actualizar datos
  if (nombre) regalos[regaloIndex].nombre = nombre;
  if (descripcion !== undefined) regalos[regaloIndex].descripcion = descripcion;
  if (precio !== undefined) regalos[regaloIndex].precio = precio;
  if (categoria) regalos[regaloIndex].categoria = categoria;
  if (url !== undefined) regalos[regaloIndex].url = url;
  
  try {
    fs.writeFileSync(regalosPath, JSON.stringify(regalos, null, 2));
    res.json({ 
      mensaje: 'Regalo actualizado correctamente',
      regalo: regalos[regaloIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el regalo' });
  }
});

// Eliminar regalo
app.delete('/api/admin/regalos/:id', verificarAdmin, (req, res) => {
  const { id } = req.params;
  
  const regalosPath = path.join(__dirname, 'data', 'regalos.json');
  let regalos = [];
  
  if (fs.existsSync(regalosPath)) {
    regalos = JSON.parse(fs.readFileSync(regalosPath, 'utf-8'));
  }
  
  const regaloIndex = regalos.findIndex(r => r.id == id);
  
  if (regaloIndex === -1) {
    return res.status(404).json({ error: 'Regalo no encontrado' });
  }
  
  const regaloEliminado = regalos.splice(regaloIndex, 1)[0];
  
  try {
    fs.writeFileSync(regalosPath, JSON.stringify(regalos, null, 2));
    res.json({ 
      mensaje: 'Regalo eliminado correctamente',
      regalo: regaloEliminado
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el regalo' });
  }
});

// ===== RUTAS PARA GESTIÓN DE AGENDA =====

// Obtener agenda completa para admin (ya definida arriba)

// Obtener un evento específico por ID
app.get('/api/admin/agenda/:id', verificarAdmin, (req, res) => {
  const { id } = req.params;
  
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  if (!fs.existsSync(agendaPath)) {
    return res.status(404).json({ error: 'Agenda no encontrada' });
  }
  
  const agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  const evento = agenda.find(e => e.id == id);
  
  if (!evento) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  
  res.json(evento);
});

// Crear nuevo evento
app.post('/api/admin/agenda', verificarAdmin, (req, res) => {
  const { fecha, dia, hora, titulo, descripcion, lugar, direccion } = req.body;
  
  if (!fecha || !hora || !titulo || !lugar || !direccion) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  let agenda = [];
  
  if (fs.existsSync(agendaPath)) {
    agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  }
  
  // Generar nuevo ID
  const nuevoId = Math.max(...agenda.map(e => e.id), 0) + 1;
  
  const nuevoEvento = {
    id: nuevoId,
    fecha,
    dia,
    hora,
    titulo,
    descripcion: descripcion || '',
    lugar,
    direccion
  };
  
  agenda.push(nuevoEvento);
  fs.writeFileSync(agendaPath, JSON.stringify(agenda, null, 2));
  
  res.status(201).json({ 
    mensaje: 'Evento creado correctamente',
    evento: nuevoEvento
  });
});

// Editar evento de agenda
app.put('/api/admin/agenda/:id', verificarAdmin, (req, res) => {
  const { id } = req.params;
  const { fecha, dia, hora, titulo, descripcion, lugar, direccion } = req.body;
  
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  let agenda = [];
  
  if (fs.existsSync(agendaPath)) {
    agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  }
  
  const eventoIndex = agenda.findIndex(e => e.id == id);
  
  if (eventoIndex === -1) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  
  // Actualizar datos
  if (fecha) agenda[eventoIndex].fecha = fecha;
  if (dia) agenda[eventoIndex].dia = dia;
  if (hora) agenda[eventoIndex].hora = hora;
  if (titulo) agenda[eventoIndex].titulo = titulo;
  if (descripcion !== undefined) agenda[eventoIndex].descripcion = descripcion;
  if (lugar) agenda[eventoIndex].lugar = lugar;
  if (direccion) agenda[eventoIndex].direccion = direccion;
  
  try {
    fs.writeFileSync(agendaPath, JSON.stringify(agenda, null, 2));
    res.json({ 
      mensaje: 'Evento actualizado correctamente',
      evento: agenda[eventoIndex]
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el evento' });
  }
});

// Eliminar evento de agenda
app.delete('/api/admin/agenda/:id', verificarAdmin, (req, res) => {
  const { id } = req.params;
  
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  if (!fs.existsSync(agendaPath)) {
    return res.status(404).json({ error: 'Agenda no encontrada' });
  }
  
  let agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  const eventoIndex = agenda.findIndex(e => e.id == id);
  
  if (eventoIndex === -1) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  
  // Eliminar el evento de la agenda
  agenda.splice(eventoIndex, 1);
  fs.writeFileSync(agendaPath, JSON.stringify(agenda, null, 2));
  
  // Limpiar todas las confirmaciones de este evento de todos los invitados
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let confirmacionesEliminadas = 0;
  
  if (fs.existsSync(invitadosPath)) {
    let invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
    
    invitados.forEach((invitado, index) => {
      if (invitado.confirmacionesAgenda && invitado.confirmacionesAgenda[id]) {
        delete invitados[index].confirmacionesAgenda[id];
        confirmacionesEliminadas++;
      }
    });
    
    // Guardar los cambios si se eliminaron confirmaciones
    if (confirmacionesEliminadas > 0) {
      fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
      console.log(`🗑️ Eliminadas ${confirmacionesEliminadas} confirmaciones del evento ${id}`);
    }
  }
  
  res.json({ 
    mensaje: 'Evento eliminado correctamente',
    confirmacionesEliminadas: confirmacionesEliminadas
  });
});

// ===== ENDPOINTS PARA GESTIÓN DE EVENTOS =====

// Obtener todos los eventos
app.get('/api/eventos', (req, res) => {
  const eventosPath = path.join(__dirname, 'data', 'eventos.json');
  
  if (!fs.existsSync(eventosPath)) {
    return res.json({ eventos: [] });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(eventosPath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Error leyendo eventos:', error);
    res.status(500).json({ error: 'Error al leer eventos' });
  }
});

// Obtener confirmaciones de eventos para un invitado
app.get('/api/eventos/confirmaciones', (req, res) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido.' });
  }
  
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  const invitado = invitados.find(inv => inv.token === token);
  
  if (!invitado) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  
  // Obtener confirmaciones de eventos (usar confirmacionesAgenda como fallback)
  const confirmaciones = invitado.confirmacionesEventos || invitado.confirmacionesAgenda || {};
  
  res.json({ confirmaciones });
});

// Confirmar asistencia a un evento
app.post('/api/eventos/confirmar', (req, res) => {
  const { eventoId, confirmar } = req.body;
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido.' });
  }
  
  // Verificar si la agenda está bloqueada
  const configPath = path.join(__dirname, 'data', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.agenda && config.agenda.bloqueada) {
        return res.status(403).json({ 
          error: 'La agenda está bloqueada y no se pueden realizar cambios.',
          motivoBloqueo: config.agenda.motivoBloqueo,
          fechaBloqueo: config.agenda.fechaBloqueo
        });
      }
    } catch (error) {
      console.error('Error verificando bloqueo de agenda:', error);
    }
  }
  
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  const invitadoIndex = invitados.findIndex(inv => inv.token === token);
  
  if (invitadoIndex === -1) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  
  // Verificar que el evento existe
  const eventosPath = path.join(__dirname, 'data', 'eventos.json');
  let eventos = [];
  if (fs.existsSync(eventosPath)) {
    const data = JSON.parse(fs.readFileSync(eventosPath, 'utf-8'));
    eventos = data.eventos || [];
  }
  
  const eventoExiste = eventos.some(evento => evento.id == eventoId);
  if (!eventoExiste) {
    return res.status(400).json({ error: `El evento con ID ${eventoId} no existe.` });
  }
  
  // Inicializar confirmaciones de eventos si no existe
  if (!invitados[invitadoIndex].confirmacionesEventos) {
    invitados[invitadoIndex].confirmacionesEventos = {};
  }
  
  // Actualizar confirmación
  invitados[invitadoIndex].confirmacionesEventos[eventoId] = confirmar;
  
  // Guardar cambios
  fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
  
  res.json({ 
    mensaje: confirmar ? 'Asistencia confirmada' : 'Asistencia cancelada',
    confirmaciones: invitados[invitadoIndex].confirmacionesEventos
  });
});

// Guardar eventos (crear/actualizar)
app.post('/api/eventos', (req, res) => {
  console.log('📝 POST /api/eventos - Body recibido:', req.body);
  
  const { eventos } = req.body;
  const eventosPath = path.join(__dirname, 'data', 'eventos.json');
  
  if (!eventos || !Array.isArray(eventos)) {
    console.error('❌ Error: Datos de eventos inválidos');
    return res.status(400).json({ error: 'Datos de eventos inválidos' });
  }
  
  try {
    console.log('💾 Guardando eventos en:', eventosPath);
    fs.writeFileSync(eventosPath, JSON.stringify({ eventos }, null, 2));
    console.log('✅ Eventos guardados correctamente');
    res.json({ mensaje: 'Eventos guardados correctamente' });
  } catch (error) {
    console.error('❌ Error guardando eventos:', error);
    res.status(500).json({ error: 'Error al guardar eventos: ' + error.message });
  }
});

// Obtener evento específico
app.get('/api/eventos/:id', (req, res) => {
  const { id } = req.params;
  const eventosPath = path.join(__dirname, 'data', 'eventos.json');
  
  if (!fs.existsSync(eventosPath)) {
    return res.status(404).json({ error: 'Eventos no encontrados' });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(eventosPath, 'utf-8'));
    const evento = data.eventos.find(e => e.id == id);
    
    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    res.json(evento);
  } catch (error) {
    console.error('Error leyendo evento:', error);
    res.status(500).json({ error: 'Error al leer evento' });
  }
});

// Actualizar evento específico
app.put('/api/eventos/:id', (req, res) => {
  const { id } = req.params;
  const eventosPath = path.join(__dirname, 'data', 'eventos.json');
  
  if (!fs.existsSync(eventosPath)) {
    return res.status(404).json({ error: 'Eventos no encontrados' });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(eventosPath, 'utf-8'));
    const eventoIndex = data.eventos.findIndex(e => e.id == id);
    
    if (eventoIndex === -1) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    // Actualizar evento
    data.eventos[eventoIndex] = { ...data.eventos[eventoIndex], ...req.body };
    
    fs.writeFileSync(eventosPath, JSON.stringify(data, null, 2));
    res.json({ 
      mensaje: 'Evento actualizado correctamente',
      evento: data.eventos[eventoIndex]
    });
  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
});

// Eliminar evento
app.delete('/api/eventos/:id', (req, res) => {
  const { id } = req.params;
  const eventosPath = path.join(__dirname, 'data', 'eventos.json');
  
  if (!fs.existsSync(eventosPath)) {
    return res.status(404).json({ error: 'Eventos no encontrados' });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(eventosPath, 'utf-8'));
    const eventoIndex = data.eventos.findIndex(e => e.id == id);
    
    if (eventoIndex === -1) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    // Eliminar evento
    data.eventos.splice(eventoIndex, 1);
    
    fs.writeFileSync(eventosPath, JSON.stringify(data, null, 2));
    res.json({ mensaje: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
});

// ===== RUTAS PARA GESTIÓN DE BLOQUEO DE AGENDA =====

// Obtener estado de bloqueo de agenda
app.get('/api/config/agenda/bloqueo', (req, res) => {
  const configPath = path.join(__dirname, 'data', 'config.json');
  
  if (!fs.existsSync(configPath)) {
    return res.json({ 
      agenda: { 
        bloqueada: false, 
        fechaBloqueo: null, 
        motivoBloqueo: null 
      } 
    });
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    res.json(config);
  } catch (error) {
    console.error('Error leyendo configuración:', error);
    res.status(500).json({ error: 'Error al leer configuración' });
  }
});

// Actualizar estado de bloqueo de agenda (solo admin)
app.post('/api/config/agenda/bloqueo', verificarAdmin, (req, res) => {
  const { bloqueada, motivoBloqueo } = req.body;
  
  const configPath = path.join(__dirname, 'data', 'config.json');
  let config = {
    agenda: {
      bloqueada: false,
      fechaBloqueo: null,
      motivoBloqueo: null
    },
    sistema: {
      ultimaActualizacion: new Date().toISOString(),
      version: "1.0.0"
    }
  };
  
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  
  // Actualizar configuración de agenda
  config.agenda.bloqueada = bloqueada;
  config.agenda.fechaBloqueo = bloqueada ? new Date().toISOString() : null;
  config.agenda.motivoBloqueo = bloqueada ? motivoBloqueo : null;
  config.sistema.ultimaActualizacion = new Date().toISOString();
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    res.json({ 
      mensaje: bloqueada ? 'Agenda bloqueada correctamente' : 'Agenda desbloqueada correctamente',
      config: config.agenda
    });
  } catch (error) {
    console.error('Error guardando configuración:', error);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

// Modificar la ruta de confirmación de agenda para verificar bloqueo
app.post('/api/agenda/confirmar', (req, res) => {
  const { eventoId, confirmar } = req.body;
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido.' });
  }
  
  // Verificar si la agenda está bloqueada
  const configPath = path.join(__dirname, 'data', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.agenda && config.agenda.bloqueada) {
        return res.status(403).json({ 
          error: 'La agenda está bloqueada y no se pueden realizar cambios.',
          motivoBloqueo: config.agenda.motivoBloqueo,
          fechaBloqueo: config.agenda.fechaBloqueo
        });
      }
    } catch (error) {
      console.error('Error verificando bloqueo de agenda:', error);
    }
  }
  
  // Continuar con la lógica original de confirmación
  const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
  let invitados = [];
  
  if (fs.existsSync(invitadosPath)) {
    invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
  }
  
  const invitadoIndex = invitados.findIndex(inv => inv.token === token);
  
  if (invitadoIndex === -1) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
  
  // Verificar que el evento existe en la agenda
  const agendaPath = path.join(__dirname, 'data', 'agenda.json');
  let agenda = [];
  if (fs.existsSync(agendaPath)) {
    agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  }
  
  const eventoExiste = agenda.some(evento => evento.id == eventoId);
  if (!eventoExiste) {
    return res.status(400).json({ error: `El evento con ID ${eventoId} no existe en la agenda.` });
  }
  
  // Inicializar confirmaciones de agenda si no existe
  if (!invitados[invitadoIndex].confirmacionesAgenda) {
    invitados[invitadoIndex].confirmacionesAgenda = {};
  }
  
  // Actualizar confirmación
  invitados[invitadoIndex].confirmacionesAgenda[eventoId] = confirmar;
  
  // Guardar cambios
  fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
  
  res.json({ 
    mensaje: confirmar ? 'Asistencia confirmada' : 'Asistencia cancelada',
    confirmaciones: invitados[invitadoIndex].confirmacionesAgenda
  });
});

// Endpoint de prueba para verificar Stripe
app.get('/api/test-stripe', async (req, res) => {
  try {
    // Intentar crear un producto de prueba
    const product = await stripe.products.create({
      name: 'Test Product',
    });
    res.json({ success: true, product: product.id });
  } catch (error) {
    console.error('Error testing Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener regalos en efectivo (solo para administradores)
app.get('/api/regalos-efectivo', (req, res) => {
  try {
    const giftsPath = path.join(__dirname, 'data', 'regalos-efectivo.json');
    let gifts = [];
    
    if (fs.existsSync(giftsPath)) {
      gifts = JSON.parse(fs.readFileSync(giftsPath, 'utf-8'));
    }
    
    res.json(gifts);
  } catch (error) {
    console.error('Error loading cash gifts:', error);
    res.status(500).json({ error: 'Error al cargar los regalos en efectivo' });
  }
});

// Endpoint para crear sesión de pago con Stripe
app.post('/api/create-payment-session', async (req, res) => {
  try {
    const { amount, currency, donorName, donorEmail, donorMessage, successUrl, cancelUrl } = req.body;

    // Validar datos requeridos
    if (!amount || !currency || !donorName || !donorEmail) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Crear sesión de pago con Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: 'Regalo de Boda - Iluminada & George',
            description: `Regalo en efectivo de ${donorName}`,
            images: [], // Opcional: agregar imagen de los novios
          },
          unit_amount: amount, // amount ya está en centavos
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: donorEmail,
      metadata: {
        donorName: donorName,
        donorEmail: donorEmail,
        donorMessage: donorMessage || '',
        weddingCouple: 'Iluminada & George',
        giftType: 'cash'
      },
      // Configuraciones adicionales
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['ES', 'FR', 'GB', 'US'], // Países permitidos
      },
    });

    // NO guardar el regalo aquí - solo crear la sesión de pago
    // El regalo se guardará cuando Stripe confirme el pago exitoso via webhook

    res.json({ id: session.id });

  } catch (error) {
    console.error('Error creating payment session:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint para webhook de Stripe (para confirmar pagos exitosos)
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verificar webhook (necesitarás configurar el endpoint secret en Stripe)
    // event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // Por ahora, parseamos el evento directamente para desarrollo
    event = JSON.parse(req.body);
    
    console.log('Webhook recibido:', event.type);
    
    // Manejar evento de pago exitoso
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      console.log('Pago exitoso confirmado:', session.id);
      
      // Guardar el regalo solo cuando el pago sea exitoso
      const giftsPath = path.join(__dirname, 'data', 'regalos-efectivo.json');
      let gifts = [];
      
      if (fs.existsSync(giftsPath)) {
        gifts = JSON.parse(fs.readFileSync(giftsPath, 'utf-8'));
      }

      const giftRecord = {
        id: session.id,
        donorName: session.metadata.donorName,
        donorEmail: session.metadata.donorEmail,
        donorMessage: session.metadata.donorMessage || '',
        amount: session.amount_total, // Monto total en centavos
        currency: session.currency,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        sessionId: session.id,
        paymentIntentId: session.payment_intent
      };

      gifts.push(giftRecord);
      fs.writeFileSync(giftsPath, JSON.stringify(gifts, null, 2));
      
      console.log('Regalo registrado exitosamente:', giftRecord);
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Endpoint para gestión de tarjetas de pago en efectivo (solo para administradores)
app.get('/api/admin/efectivo', (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    // Verificar que es un administrador
    const adminPath = path.join(__dirname, 'data', 'admin.json');
    let admins = [];
    if (fs.existsSync(adminPath)) {
      admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
    }

    const admin = admins.find(a => a.token === token);
    if (!admin) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Cargar tarjetas de pago en efectivo
    const cardsPath = path.join(__dirname, 'data', 'cash-gift-cards.json');
    let cards = [];
    if (fs.existsSync(cardsPath)) {
      cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
    }

    // Cargar regalos en efectivo existentes
    const giftsPath = path.join(__dirname, 'data', 'regalos-efectivo.json');
    let gifts = [];
    if (fs.existsSync(giftsPath)) {
      gifts = JSON.parse(fs.readFileSync(giftsPath, 'utf-8'));
    }

    res.json({
      cards: cards,
      gifts: gifts,
      stats: {
        totalCards: cards.length,
        totalGifts: gifts.length,
        totalAmount: gifts.reduce((sum, gift) => sum + (gift.amount || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error loading cash gift cards:', error);
    res.status(500).json({ error: 'Error al cargar las tarjetas de pago en efectivo' });
  }
});

// Endpoint para crear una nueva tarjeta de pago en efectivo
app.post('/api/admin/efectivo/card', (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    // Verificar que es un administrador
    const adminPath = path.join(__dirname, 'data', 'admin.json');
    let admins = [];
    if (fs.existsSync(adminPath)) {
      admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
    }

    const admin = admins.find(a => a.token === token);
    if (!admin) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { amount, label, description, imageId, imageUrl } = req.body;
    
    console.log('📝 Datos recibidos para crear tarjeta:', { amount, label, description, imageId, imageUrl });

    if (!amount || !label) {
      return res.status(400).json({ error: 'Cantidad y etiqueta son requeridos' });
    }

    // Crear nueva tarjeta
    const newCard = {
      id: uuidv4(),
      amount: parseFloat(amount),
      label: label,
      description: description || '',
      imageId: imageId || null,
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Guardar tarjeta
    const cardsPath = path.join(__dirname, 'data', 'cash-gift-cards.json');
    let cards = [];
    if (fs.existsSync(cardsPath)) {
      cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
    }

    cards.push(newCard);
    fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

    res.json({ success: true, card: newCard });
  } catch (error) {
    console.error('Error creating cash gift card:', error);
    res.status(500).json({ error: 'Error al crear la tarjeta de pago' });
  }
});

// Endpoint para actualizar una tarjeta de pago en efectivo
app.put('/api/admin/efectivo/card/:id', (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    // Verificar que es un administrador
    const adminPath = path.join(__dirname, 'data', 'admin.json');
    let admins = [];
    if (fs.existsSync(adminPath)) {
      admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
    }

    const admin = admins.find(a => a.token === token);
    if (!admin) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { id } = req.params;
    const { amount, label, description, isActive } = req.body;

    // Cargar tarjetas
    const cardsPath = path.join(__dirname, 'data', 'cash-gift-cards.json');
    let cards = [];
    if (fs.existsSync(cardsPath)) {
      cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
    }

    const cardIndex = cards.findIndex(card => card.id === id);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    // Actualizar tarjeta
    if (amount !== undefined) cards[cardIndex].amount = parseFloat(amount);
    if (label !== undefined) cards[cardIndex].label = label;
    if (description !== undefined) cards[cardIndex].description = description;
    if (isActive !== undefined) cards[cardIndex].isActive = isActive;
    cards[cardIndex].updatedAt = new Date().toISOString();

    fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

    res.json({ success: true, card: cards[cardIndex] });
  } catch (error) {
    console.error('Error updating cash gift card:', error);
    res.status(500).json({ error: 'Error al actualizar la tarjeta de pago' });
  }
});

// Endpoint para eliminar una tarjeta de pago en efectivo
app.delete('/api/admin/efectivo/card/:id', (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    // Verificar que es un administrador
    const adminPath = path.join(__dirname, 'data', 'admin.json');
    let admins = [];
    if (fs.existsSync(adminPath)) {
      admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
    }

    const admin = admins.find(a => a.token === token);
    if (!admin) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { id } = req.params;

    // Cargar tarjetas
    const cardsPath = path.join(__dirname, 'data', 'cash-gift-cards.json');
    let cards = [];
    if (fs.existsSync(cardsPath)) {
      cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
    }

    const cardIndex = cards.findIndex(card => card.id === id);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    // Verificar si es una tarjeta por defecto
    if (cards[cardIndex].isDefault) {
      return res.status(400).json({ error: 'No se pueden eliminar las tarjetas por defecto' });
    }

    // Eliminar tarjeta
    cards.splice(cardIndex, 1);
    fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting cash gift card:', error);
    res.status(500).json({ error: 'Error al eliminar la tarjeta de pago' });
  }
});

// Endpoint para obtener tarjetas de pago activas (para invitados)
app.get('/api/cash-gift-cards', (req, res) => {
  try {
    const cardsPath = path.join(__dirname, 'data', 'cash-gift-cards.json');
    let cards = [];
    if (fs.existsSync(cardsPath)) {
      cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));
    }

    // Filtrar solo las tarjetas activas
    const activeCards = cards.filter(card => card.isActive);

    res.json(activeCards);
  } catch (error) {
    console.error('Error loading cash gift cards:', error);
    res.status(500).json({ error: 'Error al cargar las tarjetas de pago' });
  }
});

// Endpoint para resetear regalos en efectivo (solo para administradores)
app.delete('/api/admin/efectivo/reset', (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    // Verificar que es un administrador
    const adminPath = path.join(__dirname, 'data', 'admin.json');
    let admins = [];
    if (fs.existsSync(adminPath)) {
      admins = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
    }

    const admin = admins.find(a => a.token === token);
    if (!admin) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Limpiar el archivo de regalos en efectivo
    const giftsPath = path.join(__dirname, 'data', 'regalos-efectivo.json');
    fs.writeFileSync(giftsPath, JSON.stringify([], null, 2));

    console.log('Regalos en efectivo reseteados por administrador:', admin.username);

    res.json({ success: true, message: 'Regalos en efectivo reseteados correctamente' });
  } catch (error) {
    console.error('Error resetting cash gifts:', error);
    res.status(500).json({ error: 'Error al resetear los regalos en efectivo' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
}); 