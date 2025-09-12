// Sistema de comentarios para la página de invitados
class CommentsSystem {
    constructor() {
        this.comments = [];
        this.currentUser = this.getCurrentUser();
        this.isAdmin = this.checkIfAdmin();
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
        // Obtener el nombre y email del invitado logueado desde localStorage
        const nombre = localStorage.getItem('nombre');
        const email = localStorage.getItem('email');
        const token = localStorage.getItem('token');
        
        if (nombre && email && token) {
            return {
                id: 'guest_' + Date.now(),
                name: nombre,
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
            const response = await fetch('/api/comentarios');
            if (response.ok) {
                this.comments = await response.json();
            } else {
                this.comments = [];
            }
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
            this.comments = [];
        }
        this.renderComments();
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
            const response = await fetch(`/api/comentarios/${commentId}/reaccion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({ emoji })
            });

            if (response.ok) {
                // Recargar comentarios para mostrar las reacciones actualizadas
                await this.loadComments();
            } else {
                const errorData = await response.json();
                this.showToast(errorData.error || 'Error al reaccionar', 'error');
            }
        } catch (error) {
            console.error('Error al reaccionar:', error);
            this.showToast('Error de conexión al reaccionar', 'error');
        }
    }

    // Verificar si el usuario actual reaccionó con un emoji específico
    hasUserReacted(reacciones, emoji) {
        if (!reacciones || !reacciones[emoji]) return false;
        const userEmail = localStorage.getItem('email');
        return reacciones[emoji].includes(userEmail);
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
            const response = await fetch('/api/comentarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({ comentario: content })
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
                const response = await fetch(`/api/comentarios/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': localStorage.getItem('adminToken')
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

    // Renderizar comentarios
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
            
            // Generar HTML de reacciones
            const reaccionesHTML = emojisDisponibles.map(({ emoji, name }) => {
                const count = reacciones[emoji] ? reacciones[emoji].length : 0;
                const hasReacted = this.hasUserReacted(reacciones, emoji);
                const isActive = hasReacted ? 'active' : '';
                
                return `
                    <button class="reaction-btn ${isActive}" 
                            onclick="commentsSystem.toggleReaction('${comment.id}', '${emoji}')" 
                            title="${name}">
                        <span class="reaction-emoji">${emoji}</span>
                        ${count > 0 ? `<span class="reaction-count">${count}</span>` : ''}
                    </button>
                `;
            }).join('');
            
            return `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author">${this.escapeHtml(comment.nombre)}</span>
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
