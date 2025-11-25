// Sistema de comentarios para la página de guests
class CommentsSystem {
    constructor() {
        this.comments = [];
        this.currentUser = this.getCurrentUser();
        this.isAdmin = this.checkIfAdmin();
        this.injectStyles();
        this.init();
    }

    // Inicializar el sistema
    init() {
        this.loadComments();
        this.setupEventListeners();
        this.updateCharCount();
    }

    // Obtener usuario actual desde localStorage
    getCurrentUser() {
        // Obtener el name y email del invitado logueado desde localStorage
        const name = localStorage.getItem('name');
        const email = localStorage.getItem('email');
        const token = localStorage.getItem('token');
        
        if (name && email && token) {
            return {
                id: 'guest_' + Date.now(),
                name: name,
                email: email
            };
        }
        
        // Usuario por defecto para pruebas (solo si no hay datos de login)
        return {
            id: 'guest_' + Date.now(),
            name: 'Invitado',
            email: 'invitado@example.com'
        };
    }

    // Verificar si es administrador
    checkIfAdmin() {
        return localStorage.getItem('isAdmin') === 'true';
    }

    // Configurar event listeners
    setupEventListeners() {
        const commentForm = document.getElementById('commentForm');
        const commentInput = document.getElementById('newComment');

        if (commentForm) {
            commentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addComment();
            });
        }

        if (commentInput) {
            commentInput.addEventListener('input', () => {
                this.updateCharCount();
            });
        }
    }

    // Actualizar contador de caracteres
    updateCharCount() {
        const commentInput = document.getElementById('newComment');
        const charCount = document.querySelector('.char-count');
        
        if (commentInput && charCount) {
            const length = commentInput.value.length;
            charCount.textContent = `${length}/500`;
            
            // Cambiar color si se excede el límite
            if (length > 450) {
                charCount.style.color = '#dc3545';
            } else if (length > 400) {
                charCount.style.color = '#ffc107';
            } else {
                charCount.style.color = 'var(--text-light)';
            }
        }
    }

    // Cargar comentarios desde el servidor
    async loadComments() {
        try {
            const response = await fetch('/api/messages');
            if (response.ok) {
                const items = await response.json();
                // Normalize server fields (Message) to comments UI format
                this.comments = (Array.isArray(items) ? items : []).map(it => ({
                    id: it._id || it.id,
                    name: it.name || it.name || 'Guest',
                    comentario: it.content || it.contenido || '',
                    fecha: it.createdAt || it.fecha || Date.now(),
                    reacciones: it.reacciones || {}
                }));
            } else {
                this.comments = [];
            }
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
            this.comments = [];
        }
        this.renderComments();
    }

    // Inyectar estilos para el selector flotante de reacciones
    injectStyles() {
        if (document.getElementById('reaction-styles')) return;
        const style = document.createElement('style');
        style.id = 'reaction-styles';
        style.textContent = `
          .reaction-wrapper { position: relative; display: inline-block; }
          .heart-btn { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:16px; border:1px solid #eee; background:#fff; cursor:pointer; transition: all .2s ease; }
          .heart-btn.active { background:#ffe6ea; border-color:#ffb3c1; color:#d6336c; }
          .heart-btn:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,.08); }
          .heart-count { font-size:.9em; color:#555; }
          /* Position picker directly above the button with a slight overlap so cursor stays within hover area */
          .emoji-picker { position:absolute; left:0; bottom: calc(100% - 6px); display:flex; gap:6px; background:#fff; border:1px solid #eee; border-radius:20px; padding:6px; box-shadow: 0 6px 20px rgba(0,0,0,.12); opacity:0; transform: translateY(6px); pointer-events:none; transition: all .15s ease; transition-delay: 0ms; z-index: 10; }
          /* Add a small delay before showing on hover; hide immediately on mouseout */
          .reaction-wrapper:hover .emoji-picker { opacity:1; transform: translateY(0); pointer-events:auto; transition-delay: 250ms; }
          .emoji-option { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:1px solid #eee; background:#fff; cursor:pointer; position:relative; }
          .emoji-option.active { outline: 2px solid #8B5A96; }
          .emoji-option .count { position:absolute; bottom:-10px; right:-6px; background:#8B5A96; color:#fff; border-radius:10px; padding:0 6px; font-size:.7em; line-height:18px; height:18px; }
          /* Summary list when there are reactions */
          .reaction-summary { display:inline-flex; align-items:center; gap:8px; padding:4px 6px; border:1px solid #eee; border-radius:16px; background:#fff; }
          .summary-pill { display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:12px; background:#f8f9fa; border:1px solid #eee; font-size:.9em; }
          .summary-pill .count { color:#555; font-weight:600; }
        `;
        document.head.appendChild(style);
    }

    // Emojis disponibles para reacciones
    getAvailableEmojis() {
        return [
            { emoji: '❤️', name: 'corazón' },
            { emoji: '👍', name: 'pulgar arriba' },
            { emoji: '😊', name: 'sonrisa' },
            { emoji: '🎉', name: 'celebración' },
            { emoji: '👏', name: 'aplausos' },
            { emoji: '💕', name: 'amor' }
        ];
    }

    // Agregar/quitar reacción
    async toggleReaction(commentId, emoji) {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`/api/messages/${commentId}/reaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ emoji })
            });
            const data = await res.json().catch(()=>({}));
            if (!res.ok) {
                const msg = data && (data.error || data.message) || 'Error al actualizar reacción';
                this.showToast(msg, 'error');
                return;
            }
            // Recargar comentarios para reflejar conteos actualizados
            await this.loadComments();
        } catch (err) {
            console.error('Error al aplicar reacción:', err);
            this.showToast('Error de conexión al aplicar reacción', 'error');
        }
    }

    // Verificar si el usuario actual reaccionó con un emoji específico
    hasUserReacted(reacciones, emoji) {
        if (!reacciones || !reacciones[emoji]) return false;
        const userEmail = localStorage.getItem('email');
        return reacciones[emoji].includes(userEmail);
    }

    // Obtener el emoji seleccionado por el usuario (una sola selección)
    getUserSelectedEmoji(reacciones) {
        const userEmail = localStorage.getItem('email');
        if (!userEmail || !reacciones) return null;
        for (const [emoji, list] of Object.entries(reacciones)) {
            if (Array.isArray(list) && list.includes(userEmail)) return emoji;
        }
        return null;
    }

    getCountFor(reacciones, emoji) {
        return (reacciones && Array.isArray(reacciones[emoji])) ? reacciones[emoji].length : 0;
    }

    // Total reactions across all emojis
    getTotalReactionsCount(reacciones) {
        if (!reacciones) return 0;
        let sum = 0;
        for (const v of Object.values(reacciones)) {
            if (Array.isArray(v)) sum += v.length;
        }
        return sum;
    }

    // Agregar nuevo comentario
    async addComment() {
        const commentInput = document.getElementById('newComment');
        const content = commentInput.value.trim();

        if (!content) {
            this.showToast('Por favor, escribe un comentario.', 'error');
            return;
        }

        if (content.length > 500) {
            this.showToast('El comentario no puede exceder 500 caracteres.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                // Limpiar formulario
                commentInput.value = '';
                this.updateCharCount();
                
                // Recargar comentarios
                await this.loadComments();
                
                this.showToast('Comentario publicado con éxito', 'success');
            } else {
                const errorData = await response.json();
                this.showToast(errorData.error || 'Error al publicar comentario', 'error');
            }
        } catch (error) {
            console.error('Error al publicar comentario:', error);
            this.showToast('Error de conexión al publicar comentario', 'error');
        }
    }

    // Eliminar comentario
    async deleteComment(commentId) {
        if (!this.isAdmin) {
            this.showToast('Solo los administradores pueden eliminar comentarios.', 'error');
            return;
        }

        if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
            try {
                const response = await fetch(`/api/messages/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                    }
                });

                if (response.ok) {
                    await this.loadComments();
                    this.showToast('Comentario eliminado con éxito', 'success');
                } else {
                    const errorData = await response.json();
                    this.showToast(errorData.error || 'Error al eliminar comentario', 'error');
                }
            } catch (error) {
                console.error('Error al eliminar comentario:', error);
                this.showToast('Error de conexión al eliminar comentario', 'error');
            }
        }
    }

    // Render Comments
    renderComments() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        if (this.comments.length === 0) {
            commentsList.innerHTML = `
                <div class="no-comments">
                    <i class="fas fa-comments"></i>
                    <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
                </div>
            `;
            return;
        }

        // Ordenar comentarios por fecha (más recientes primero)
        const sortedComments = this.comments.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        const commentsHTML = sortedComments.map(comment => {
            const reacciones = comment.reacciones || {};
            const emojisDisponibles = this.getAvailableEmojis();

            // Render, according to requirement:
            // 1) If no reactions yet -> show a single heart button (no count). Hover shows picker.
            // 2) If one or more reactions exist -> show a summary list of emojis with their counts instead of the heart.
            // 3) Hover over the summary list also shows the picker for selection.
            const selectedEmoji = this.getUserSelectedEmoji(reacciones);
            const totalCount = this.getTotalReactionsCount(reacciones);

            const pickerHTML = emojisDisponibles.map(({ emoji, name }) => {
                const count = this.getCountFor(reacciones, emoji);
                const isActive = selectedEmoji === emoji ? 'active' : '';
                return `
                  <button class="emoji-option ${isActive}" title="${name}" onclick="commentsSystem.toggleReaction('${comment.id}', '${emoji}')">
                    <span>${emoji}</span>
                    ${count > 0 ? `<span class=\"count\">${count}</span>` : ''}
                  </button>`;
            }).join('');

            let triggerAreaHTML = '';
            if (totalCount <= 0) {
              // Show only heart icon with no count when no reactions have been made
              triggerAreaHTML = `
                <button class="heart-btn" onclick="commentsSystem.toggleReaction('${comment.id}', '❤️')" title="Me gusta (❤️)">
                  <span>❤️</span>
                </button>`;
            } else {
              // Build summary list of reactions with their counts
              const summaryPills = emojisDisponibles.map(({ emoji }) => {
                const c = this.getCountFor(reacciones, emoji);
                if (c <= 0) return '';
                const isMine = selectedEmoji === emoji ? ' style="outline:2px solid #8B5A96;"' : '';
                return `<span class="summary-pill"${isMine}><span>${emoji}</span><span class=\"count\">${c}</span></span>`;
              }).join('');
              triggerAreaHTML = `<div class="reaction-summary">${summaryPills}</div>`;
            }

            const reaccionesHTML = `
              <div class="reaction-wrapper">
                ${triggerAreaHTML}
                <div class="emoji-picker">${pickerHTML}</div>
              </div>
            `;
            
            return `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author">${this.escapeHtml(comment.name)}</span>
                        <span class="comment-date">${new Date(comment.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.comentario)}</div>
                    <div class="comment-reactions">
                        ${reaccionesHTML}
                    </div>
                    ${this.isAdmin ? `
                        <div class="comment-actions">
                            <button class="delete-comment-btn" onclick="commentsSystem.deleteComment('${comment.id}')" title="Eliminar comentario">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        commentsList.innerHTML = commentsHTML;
    }

    // Escapar HTML para prevenir XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Mostrar toast de notificación
    showToast(message, type = 'success') {
        // Crear toast si no existe
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        // Configurar contenido
        toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Mostrar toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Ocultar toast después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Actualizar usuario actual
    updateCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentGuest', JSON.stringify(user));
    }

    // Actualizar estado de administrador
    updateAdminStatus(isAdmin) {
        this.isAdmin = isAdmin;
        localStorage.setItem('isAdmin', isAdmin.toString());
        this.renderComments(); // Re-renderizar para mostrar/ocultar botones de eliminar
    }
}

// Inicializar sistema de comentarios cuando el DOM esté listo
let commentsSystem;

document.addEventListener('DOMContentLoaded', () => {
    commentsSystem = new CommentsSystem();
});

// Hacer disponible globalmente para uso en otros scripts
window.commentsSystem = commentsSystem;
