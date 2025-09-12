# Configuración de Webhooks de Stripe para Regalos en Efectivo

## 🎯 **Problema Resuelto**

**ANTES**: El sistema registraba regalos cuando el invitado hacía clic en "Proceder al Pago", antes de confirmar que el pago fuera exitoso.

**AHORA**: El sistema registra regalos **SOLO** cuando Stripe confirma que el pago fue exitoso mediante webhooks.

## 🔄 **Flujo Correcto de Pagos**

### **1. Invitado hace clic en "Proceder al Pago"**
- ✅ Se crea sesión de pago en Stripe
- ❌ **NO** se registra el regalo aún
- ✅ Se redirige a Stripe Checkout

### **2. Invitado completa el pago en Stripe**
- ✅ Stripe procesa el pago
- ✅ Stripe envía webhook a nuestro servidor
- ✅ **AHORA SÍ** se registra el regalo
- ✅ Aparece en el panel de administración

### **3. Si el pago falla**
- ❌ Stripe no envía webhook de éxito
- ❌ **NO** se registra el regalo
- ❌ No aparece en el panel de administración

## 🔧 **Configuración de Webhooks en Stripe**

### **Paso 1: Configurar Webhook en Stripe Dashboard**

1. **Ve a tu Dashboard de Stripe**
   - Abre [dashboard.stripe.com](https://dashboard.stripe.com)
   - Asegúrate de estar en **modo de prueba**

2. **Navega a Webhooks**
   - Ve a **"Developers"** → **"Webhooks"**
   - Haz clic en **"Add endpoint"**

3. **Configurar el Endpoint**
   - **URL del endpoint**: `http://localhost:3000/api/stripe-webhook`
   - **Eventos a escuchar**: Selecciona `checkout.session.completed`
   - **Descripción**: "Regalos en efectivo - Confirmación de pagos"

4. **Obtener el Webhook Secret**
   - Después de crear el webhook, haz clic en él
   - Copia el **"Signing secret"** (whsec_...)

### **Paso 2: Configurar Variables de Entorno**

Crea un archivo `.env` en la carpeta `backend/`:

```env
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui
```

### **Paso 3: Actualizar el Código (Opcional)**

Si quieres usar variables de entorno, actualiza el webhook en `backend/server.js`:

```javascript
// Descomenta esta línea y comenta la siguiente
event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
// event = JSON.parse(req.body); // Comentar esta línea
```

## 🧪 **Para Desarrollo Local**

### **Opción 1: Usar Stripe CLI (Recomendado)**

1. **Instalar Stripe CLI**
   ```bash
   # Windows (usando Chocolatey)
   choco install stripe-cli
   
   # O descargar desde: https://github.com/stripe/stripe-cli/releases
   ```

2. **Autenticarse con Stripe**
   ```bash
   stripe login
   ```

3. **Reenviar webhooks a localhost**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

4. **Usar el webhook secret que te proporcione**
   - Copia el `whsec_...` que aparece en la terminal
   - Úsalo en tu archivo `.env`

### **Opción 2: Usar ngrok (Alternativa)**

1. **Instalar ngrok**
   - Descarga desde [ngrok.com](https://ngrok.com)

2. **Exponer tu servidor local**
   ```bash
   ngrok http 3000
   ```

3. **Usar la URL de ngrok en Stripe**
   - URL del endpoint: `https://tu-url-ngrok.ngrok.io/api/stripe-webhook`

## 📊 **Información Adicional en el Registro**

Ahora cada regalo registrado incluye:

```json
{
  "id": "cs_test_...",
  "donorName": "Juan Pérez",
  "donorEmail": "juan@email.com",
  "donorMessage": "¡Felicidades!",
  "amount": 5000,
  "currency": "eur",
  "status": "completed",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "completedAt": "2024-01-01T12:05:00.000Z",
  "sessionId": "cs_test_...",
  "paymentIntentId": "pi_..."
}
```

### **Campos Nuevos:**
- `status`: "completed" (confirmado)
- `completedAt`: Fecha y hora exacta del pago exitoso
- `paymentIntentId`: ID del intento de pago de Stripe

## 🚨 **Importante para Producción**

### **Antes de ir a producción:**

1. **Cambiar a claves live**
   - `pk_live_...` y `sk_live_...`
   - `whsec_...` (webhook secret live)

2. **Configurar webhook en producción**
   - URL: `https://tu-dominio.com/api/stripe-webhook`
   - Eventos: `checkout.session.completed`

3. **Verificar webhook signature**
   - Descomenta la línea de verificación en el código
   - Usa el webhook secret de producción

## ✅ **Beneficios del Sistema Correcto**

- ✅ **Solo regalos confirmados** aparecen en el panel
- ✅ **No hay regalos "fantasma"** de pagos fallidos
- ✅ **Información precisa** para el administrador
- ✅ **Auditoría completa** con fechas exactas
- ✅ **Integración robusta** con Stripe

## 🎉 **Resultado Final**

Ahora el administrador verá **SOLO** los regalos que realmente se pagaron exitosamente, con información completa y precisa sobre cada transacción.
