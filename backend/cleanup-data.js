const fs = require('fs');
const path = require('path');

console.log('🧹 Iniciando limpieza de datos corruptos...');

// Cargar la agenda para obtener los eventos válidos
const agendaPath = path.join(__dirname, 'data', 'agenda.json');
let agenda = [];
if (fs.existsSync(agendaPath)) {
  agenda = JSON.parse(fs.readFileSync(agendaPath, 'utf-8'));
  console.log('📅 Eventos válidos en la agenda:', agenda.map(e => `${e.id}: ${e.titulo}`));
}

const eventosValidos = agenda.map(evento => evento.id.toString());

// Cargar invitados
const invitadosPath = path.join(__dirname, 'data', 'invitados.json');
let invitados = [];
if (fs.existsSync(invitadosPath)) {
  invitados = JSON.parse(fs.readFileSync(invitadosPath, 'utf-8'));
}

console.log(`👥 Procesando ${invitados.length} invitados...`);

let totalLimpios = 0;
let invitadosAfectados = 0;

invitados.forEach((invitado, index) => {
  if (invitado.confirmacionesAgenda) {
    const confirmacionesOriginales = Object.keys(invitado.confirmacionesAgenda);
    const confirmacionesLimpias = {};
    
    confirmacionesOriginales.forEach(eventoId => {
      if (eventosValidos.includes(eventoId)) {
        confirmacionesLimpias[eventoId] = invitado.confirmacionesAgenda[eventoId];
      } else {
        console.log(`❌ Eliminando evento ${eventoId} de ${invitado.nombre} (no existe en agenda)`);
        totalLimpios++;
      }
    });
    
    // Si se limpiaron datos, actualizar el invitado
    if (Object.keys(confirmacionesLimpias).length !== confirmacionesOriginales.length) {
      invitados[index].confirmacionesAgenda = confirmacionesLimpias;
      invitadosAfectados++;
      console.log(`✅ Limpiado ${invitado.nombre}: ${confirmacionesOriginales.length} → ${Object.keys(confirmacionesLimpias).length} eventos`);
    }
  }
});

// Guardar los cambios
if (totalLimpios > 0) {
  fs.writeFileSync(invitadosPath, JSON.stringify(invitados, null, 2));
  console.log(`\n🎉 Limpieza completada:`);
  console.log(`   - ${totalLimpios} confirmaciones de eventos eliminadas`);
  console.log(`   - ${invitadosAfectados} invitados afectados`);
  console.log(`   - Datos guardados en ${invitadosPath}`);
} else {
  console.log('\n✨ No se encontraron datos corruptos para limpiar');
}

console.log('\n📋 Resumen de eventos válidos:');
agenda.forEach(evento => {
  console.log(`   ${evento.id}: ${evento.titulo} (${evento.fecha} - ${evento.hora})`);
});

