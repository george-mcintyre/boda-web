// Comments system for the guests page
class CommentsSystem {
    constructor() {
        this.comments = [];
        this.nextCursor = null;
        this.currentUser = this.getCurrentUser();
        this.isAdmin = this.checkIfAdmin();
        this.partyMembers = [];
        this.selectedPartyMemberName = '';
        this.initialized = false;
        this.injectStyles();
        this.init();
    }

    // Initialize the system
    init() {
        // Check if comments section is visible (respects messagesEnabled setting)
        const commentsSection = document.querySelector('.comments-card');
        if (!commentsSection || commentsSection.style.display === 'none') {
            console.log('Comments section is hidden, skipping initialization');
            this.initialized = false;
            return;
        }
        
        this.loadComments();
        this.loadPartyMembers();
        this.setupEventListeners();
        this.updateCharCount();
        this.initialized = true;
    }

    // Get current user from localStorage
    getCurrentUser() {
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
        
        // Default user for testing (only if no login data)
        return {
            id: 'guest_' + Date.now(),
            name: 'Guest',
            email: 'guest@example.com'
        };
    }

    // Check if user is admin
    checkIfAdmin() {
        return localStorage.getItem('isAdmin') === 'true';
    }

    // Setup event listeners
    setupEventListeners() {
        const commentForm = document.getElementById('commentForm');
        const commentInput = document.getElementById('newComment');
        const postingAsSelect = document.getElementById('postingAsSelect');

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

        if (postingAsSelect) {
            postingAsSelect.addEventListener('change', (e) => {
                this.selectedPartyMemberName = e.target.value;
                localStorage.setItem('selectedPartyMemberName', this.selectedPartyMemberName);
            });
        }
    }

    // Load party members for the dropdown
    async loadPartyMembers() {
        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch('/api/guest/party', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const partyMembers = await response.json();
                this.partyMembers = partyMembers;
                this.populatePartyMemberDropdown();
            } else {
                console.error('Failed to load party members:', response.status);
                this.partyMembers = [];
                this.populatePartyMemberDropdown();
            }
        } catch (error) {
            console.error('Error loading party members:', error);
            this.partyMembers = [];
            this.populatePartyMemberDropdown();
        }
    }

    // Populate the party member dropdown
    populatePartyMemberDropdown() {
        const postingAsSelect = document.getElementById('postingAsSelect');
        if (!postingAsSelect) return;

        // Clear existing options
        postingAsSelect.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select party member...';
        postingAsSelect.appendChild(defaultOption);

        // Add party member options
        this.partyMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.name;
            option.textContent = member.name;
            if (member.primary) {
                option.textContent += ' (' + translate('common:primary') + ')';
            }
            postingAsSelect.appendChild(option);
        });

        // Restore previously selected value
        const savedSelection = localStorage.getItem('selectedPartyMemberName') || '';
        if (savedSelection && this.partyMembers.some(m => m.name === savedSelection)) {
            postingAsSelect.value = savedSelection;
            this.selectedPartyMemberName = savedSelection;
        } else {
            // Default to primary member or first member
            const primaryMember = this.partyMembers.find(m => m.primary);
            const fallbackMember = this.partyMembers[0];
            const defaultMember = primaryMember || fallbackMember;
            if (defaultMember) {
                postingAsSelect.value = defaultMember.name;
                this.selectedPartyMemberName = defaultMember.name;
                localStorage.setItem('selectedPartyMemberName', this.selectedPartyMemberName);
            }
        }
    }

    // Update character counter
    updateCharCount() {
        const commentInput = document.getElementById('newComment');
        const charCount = document.querySelector('.char-count');
        
        if (commentInput && charCount) {
            const length = commentInput.value.length;
            charCount.textContent = `${length}/500`;
            
            // Change color if limit is exceeded
            if (length > 450) {
                charCount.style.color = '#dc3545';
            } else if (length > 400) {
                charCount.style.color = '#ffc107';
            } else {
                charCount.style.color = 'var(--text-light)';
            }
        }
    }

    // Load comments from the server
    async loadComments() {
        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch('/api/guest/messages', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // API returns { items: [...], nextCursor: string|null }
                const items = data.items || [];
                this.nextCursor = data.nextCursor || null;
                
                // Map API response format to internal format
                this.comments = items.map(msg => ({
                    id: msg.id,
                    name: msg.author || 'Guest',
                    body: msg.body || '',
                    createdAt: msg.createdAt,
                    reactions: msg.reactions || []
                }));
            } else {
                console.error('Failed to load comments:', response.status);
                this.comments = [];
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            this.comments = [];
        }
        this.renderComments();
    }

    // Inject styles for floating reaction picker
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
          .summary-pill { display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:12px; background:#f8f9fa; border:1px solid #eee; font-size:.9em; cursor:pointer; }
          .summary-pill .count { color:#555; font-weight:600; }
          .summary-pill.reacted { outline: 2px solid #8B5A96; background: #f8f0fa; }
        `;
        document.head.appendChild(style);
    }

    // Available emojis for reactions
    getAvailableEmojis() {
        return [
            { emoji: '❤️', name: 'heart' },
            { emoji: '👍', name: 'thumbs up' },
            { emoji: '😊', name: 'smile' },
            { emoji: '🎉', name: 'celebration' },
            { emoji: '👏', name: 'applause' },
            { emoji: '💕', name: 'love' }
        ];
    }

    // Add/toggle reaction
    async toggleReaction(commentId, emoji) {
        try {
            const token = localStorage.getItem('token') || '';
            const res = await fetch(`/api/guest/messages/${commentId}/reaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ emoji })
            });
            
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = (data && (data.error || data.message)) || 'Error updating reaction';
                this.showToast(msg, 'error');
                return;
            }
            
            // Reload comments to reflect updated counts
            await this.loadComments();
        } catch (err) {
            console.error('Error applying reaction:', err);
            this.showToast('Connection error when applying reaction', 'error');
        }
    }

    // Check if user reacted with a specific emoji using the new API format
    hasUserReacted(reactions, emoji) {
        if (!reactions || !Array.isArray(reactions)) return false;
        const reaction = reactions.find(r => r.emoji === emoji);
        return reaction ? reaction.reacted === true : false;
    }

    // Get the emoji selected by the user (if any)
    getUserSelectedEmoji(reactions) {
        if (!reactions || !Array.isArray(reactions)) return null;
        const reaction = reactions.find(r => r.reacted === true);
        return reaction ? reaction.emoji : null;
    }

    // Get count for a specific emoji
    getCountFor(reactions, emoji) {
        if (!reactions || !Array.isArray(reactions)) return 0;
        const reaction = reactions.find(r => r.emoji === emoji);
        return reaction ? reaction.count : 0;
    }

    // Total reactions across all emojis
    getTotalReactionsCount(reactions) {
        if (!reactions || !Array.isArray(reactions)) return 0;
        return reactions.reduce((sum, r) => sum + (r.count || 0), 0);
    }

    // Add new comment
    async addComment() {
        const commentInput = document.getElementById('newComment');
        const body = commentInput.value.trim();
        const postingAsSelect = document.getElementById('postingAsSelect');
        const authorName = postingAsSelect ? postingAsSelect.value : '';

        if (!body) {
            this.showToast('Please write a comment.', 'error');
            return;
        }

        if (!authorName) {
            this.showToast('Please select who is posting the comment.', 'error');
            return;
        }

        if (body.length > 500) {
            this.showToast('Comment cannot exceed 500 characters.', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token') || '';
            const response = await fetch('/api/guest/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    body,
                    authorName: authorName 
                })
            });

            if (response.ok) {
                // Clear form
                commentInput.value = '';
                this.updateCharCount();
                
                // Reload comments
                await this.loadComments();
                
                this.showToast('Comment posted successfully', 'success');
            } else {
                const errorData = await response.json();
                this.showToast(errorData.error || 'Error posting comment', 'error');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showToast('Connection error when posting comment', 'error');
        }
    }

    // Delete comment (admin only)
    async deleteComment(commentId) {
        if (!this.isAdmin) {
            this.showToast('Only administrators can delete comments.', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this comment?')) {
            try {
                const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
                const response = await fetch(`/api/admin/messages/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    await this.loadComments();
                    this.showToast('Comment deleted successfully', 'success');
                } else {
                    const errorData = await response.json();
                    this.showToast(errorData.error || 'Error deleting comment', 'error');
                }
            } catch (error) {
                console.error('Error deleting comment:', error);
                this.showToast('Connection error when deleting comment', 'error');
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

        // Sort comments by date (most recent first)
        const sortedComments = this.comments.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        const commentsHTML = sortedComments.map(comment => {
            const reactions = comment.reactions || [];
            const emojisDisponibles = this.getAvailableEmojis();

            // Render according to requirement:
            // 1) If no reactions yet -> show a single heart button (no count). Hover shows picker.
            // 2) If one or more reactions exist -> show a summary list of emojis with their counts.
            // 3) Hover over the summary list also shows the picker for selection.
            const selectedEmoji = this.getUserSelectedEmoji(reactions);
            const totalCount = this.getTotalReactionsCount(reactions);

            const pickerHTML = emojisDisponibles.map(({ emoji, name }) => {
                const count = this.getCountFor(reactions, emoji);
                const isActive = selectedEmoji === emoji ? 'active' : '';
                return `
                  <button class="emoji-option ${isActive}" title="${name}" onclick="commentsSystem.toggleReaction('${comment.id}', '${emoji}')">
                    <span>${emoji}</span>
                    ${count > 0 ? `<span class="count">${count}</span>` : ''}
                  </button>`;
            }).join('');

            let triggerAreaHTML = '';
            if (totalCount <= 0) {
              // Show only heart icon with no count when no reactions have been made
              triggerAreaHTML = `
                <button class="heart-btn" onclick="commentsSystem.toggleReaction('${comment.id}', '❤️')" title="Like (❤️)">
                  <span>❤️</span>
                </button>`;
            } else {
              // Build summary list of reactions with their counts
              const summaryPills = reactions
                .filter(r => r.count > 0)
                .map(r => {
                  const isMine = r.reacted ? 'reacted' : '';
                  return `<span class="summary-pill ${isMine}" onclick="commentsSystem.toggleReaction('${comment.id}', '${r.emoji}')"><span>${r.emoji}</span><span class="count">${r.count}</span></span>`;
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
                        <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.body)}</div>
                    <div class="comment-reactions">
                        ${reaccionesHTML}
                    </div>
                    ${this.isAdmin ? `
                        <div class="comment-actions">
                            <button class="delete-comment-btn" onclick="commentsSystem.deleteComment('${comment.id}')" title="Delete comment">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

        commentsList.innerHTML = commentsHTML;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show toast notification
    showToast(message, type = 'success') {
        // Create toast if it doesn't exist
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        // Configure content
        toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Update current user
    updateCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('currentGuest', JSON.stringify(user));
    }

    // Update admin status
    updateAdminStatus(isAdmin) {
        this.isAdmin = isAdmin;
        localStorage.setItem('isAdmin', isAdmin.toString());
        this.renderComments(); // Re-render to show/hide delete buttons
    }
}

// Initialize comments system when DOM is ready
let commentsSystem;

document.addEventListener('DOMContentLoaded', () => {
    commentsSystem = new CommentsSystem();
    
    // Re-initialize when settings change (for when messagesEnabled is toggled)
    // This handles the case when admin enables/disables messages
    const checkAndReinitComments = () => {
        const commentsSection = document.querySelector('.comments-card');
        if (commentsSection && commentsSystem) {
            const isVisible = commentsSection.style.display !== 'none';
            if (isVisible && !commentsSystem.initialized) {
                commentsSystem.init();
            }
        }
    };
    
    // Check on window focus (settings might have changed)
    window.addEventListener('focus', checkAndReinitComments);
});

// Make available globally for use in other scripts
window.commentsSystem = commentsSystem;
