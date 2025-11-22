### Endpoints de API adicionales
- **Eventos**: `GET /api/event` (público), `GET/POST /api/events` (admin)
- **Mensajes**: `GET /api/messages`, `POST /api/messages` (invitados), `DELETE /api/messages/:id` (admin)
- **Panel de Administración**:
  - Invitados: `/api/admin/guests` (CRUD)
  - Regalos: `/api/admin/gifts` (CRUD)
  - Eventos: `/api/admin/events` (CRUD)
  - Menú: `/api/admin/menu` (CRUD)
  - Mensajes: `/api/admin/messages` (GET, DELETE)
  - Tarjetas de regalo en efectivo: `/api/admin/cash-gift-cards` (CRUD)
  - Configuración: `/api/config/event/blocked` (GET/PUT/DELETE)

**Nota**: La función de pago para regalos en efectivo está implementada en el frontend pero requiere un endpoint de creación de sesiones Stripe en el backend (`/api/create-payment-session`) para ser completamente funcional. Actualmente, los pagos fallarán con un error de "endpoint not found".
