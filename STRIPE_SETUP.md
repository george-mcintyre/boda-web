# Configuración de Stripe para Regalos en Efectivo

## 🎯 Resumen
Se ha implementado un sistema completo de regalos en efectivo usando Stripe para la boda de Iluminada y George. Los invitados pueden elegir cantidades fijas (€25, €50, €100, €200) o personalizadas.

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:
- `frontend/public/regalos-efectivo.html` - Página independiente para regalos en efectivo
- `STRIPE_SETUP.md` - Este archivo de instrucciones

### Archivos Modificados:
- `backend/package.json` - Agregada dependencia de Stripe
- `backend/server.js` - Agregados endpoints para pagos
- `frontend/public/invitados-i18n.html` - Nueva pestaña de regalos en efectivo

## 🔧 Configuración de Stripe

### 1. Crear Cuenta en Stripe
1. Ve a [stripe.com](https://stripe.com) y crea una cuenta
2. Completa la verificación de tu cuenta
3. Activa el modo de prueba (Test Mode)

### 2. Obtener Claves API
1. En el dashboard de Stripe, ve a "Developers" → "API keys"
2. Copia tu **Publishable key** (pk_test_...)
3. Copia tu **Secret key** (sk_test_...)

### 3. Configurar las Claves en el Código

#### Frontend (regalos-efectivo.html):
```javascript
const stripe = Stripe('pk_test_TU_CLAVE_PUBLICA_AQUI');
```

#### Frontend (invitados-i18n.html):
```javascript
const stripe = Stripe('pk_test_TU_CLAVE_PUBLICA_AQUI');
```

#### Backend (server.js):
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_TU_CLAVE_SECRETA_AQUI');
```

### 4. Configurar Variables de Entorno (Recomendado)
Crea un archivo `.env` en la carpeta `backend/`:
```
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
```

## 🚀 Instalación y Ejecución

### 1. Instalar Dependencias
```bash
cd backend
npm install
```

### 2. Iniciar el Servidor
```bash
npm start
```

### 3. Acceder a la Funcionalidad
- **Página independiente**: `http://localhost:3000/regalos-efectivo.html`
- **Desde invitados**: `http://localhost:3000/invitados-i18n.html` → Pestaña "Regalos en Efectivo"

## 💳 Funcionalidades Implementadas

### Opciones de Pago:
- **Cantidades fijas**: €25, €50, €100, €200
- **Cantidad personalizada**: Cualquier cantidad entre €1 y €1000
- **Información del donante**: Nombre, email, mensaje opcional
- **Pagos seguros**: Procesados por Stripe Checkout

### Características:
- ✅ Interfaz multilingüe (Español, Inglés, Francés)
- ✅ Validación de formularios
- ✅ Mensajes de confirmación y error
- ✅ Diseño responsive
- ✅ Integración con sistema de invitados existente
- ✅ Registro de regalos en archivo JSON

## 🔒 Seguridad

### Medidas Implementadas:
- Validación de datos en frontend y backend
- Uso de HTTPS (requerido por Stripe en producción)
- Claves API separadas para desarrollo y producción
- Validación de webhooks (configuración opcional)

### Para Producción:
1. Cambiar a claves de producción (pk_live_... y sk_live_...)
2. Configurar webhooks en Stripe Dashboard
3. Usar HTTPS en tu dominio
4. Configurar variables de entorno seguras

## 📊 Monitoreo de Pagos

### Archivo de Registro:
Los regalos se guardan en `backend/data/regalos-efectivo.json` con la siguiente estructura:
```json
[
  {
    "id": "cs_test_...",
    "donorName": "Nombre del Donante",
    "donorEmail": "email@ejemplo.com",
    "donorMessage": "Mensaje opcional",
    "amount": 5000,
    "currency": "eur",
    "status": "pending",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "sessionId": "cs_test_..."
  }
]
```

### Dashboard de Stripe:
- Ve a "Payments" en tu dashboard de Stripe
- Monitorea pagos exitosos, fallidos y reembolsos
- Exporta reportes para contabilidad

## 🎨 Personalización

### Cambiar Cantidades Fijas:
Edita las opciones en ambos archivos HTML:
```html
<div class="amount-option" data-amount="50">
  <div class="amount">€50</div>
  <div class="label">Regalo medio</div>
</div>
```

### Cambiar Moneda:
1. En el frontend, cambia los símbolos de moneda (€ → $, £, etc.)
2. En el backend, cambia `currency: 'eur'` por la moneda deseada
3. Verifica que Stripe soporte la moneda en tu región

### Personalizar Mensajes:
Edita las traducciones en el objeto `translations` de ambos archivos HTML.

## 🆘 Solución de Problemas

### Error: "Invalid API Key"
- Verifica que las claves sean correctas
- Asegúrate de usar claves de prueba (pk_test_...) en desarrollo

### Error: "No such product"
- Verifica que el modo de pago sea 'payment' (no 'subscription')
- Asegúrate de que la moneda sea válida

### Pagos no aparecen en Stripe
- Verifica la conexión a internet
- Revisa la consola del navegador para errores
- Verifica que el servidor backend esté ejecutándose

## 📞 Soporte

Para problemas técnicos:
1. Revisa los logs del servidor backend
2. Verifica la consola del navegador
3. Consulta la [documentación de Stripe](https://stripe.com/docs)

## 🎉 ¡Listo para Usar!

Una vez configurado, los invitados podrán:
1. Elegir una cantidad fija o personalizada
2. Completar sus datos
3. Escribir un mensaje opcional
4. Pagar de forma segura con tarjeta
5. Recibir confirmación del pago

¡El sistema está listo para recibir regalos en efectivo para la boda! 💒💝
