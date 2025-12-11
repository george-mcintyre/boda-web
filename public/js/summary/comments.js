// Comments system for the guests page - Willow-styled vanilla implementation
// This module integrates with the existing API endpoints

class CommentsSystem {
    constructor() {
        this.comments = [];
        this.nextCursor = null;
        this.hasMoreComments = true;
        this.isLoadingComments = false;
        this.limit = 15;
        this.partyMembers = [];
        this.selectedPartyMemberName = localStorage.getItem('selectedPartyMemberName') || '';
        this.isAdmin = localStorage.getItem('isAdmin') === 'true';
        this.initialized = false;
        this.availableEmojis = [
            { emoji: '❤️', name: 'heart' },
            { emoji: '👍', name: 'thumbs up' },
            { emoji: '😊', name: 'smile' },
            { emoji: '🎉', name: 'celebration' },
            { emoji: '👏', name: 'applause' },
            { emoji: '💕', name: 'love' }
        ];
        this.init();
    }

    async init() {
        const commentsSection = document.querySelector('.comments-card');
        if (!commentsSection || commentsSection.style.display === 'none') {
            console.log('Comments section is hidden, skipping initialization');
            return;
        }

        await this.loadPartyMembers();
        await this.loadComments({ fromBeginning: true });
        this.setupEventListeners();
        this.setupInfiniteScroll();
        this.initialized = true;
    }

    getAuthToken() {
        return localStorage.getItem('token') || '';
    }

    // Load party members for the dropdown
    async loadPartyMembers() {
        try {
            const response = await fetch('/api/guest/party', {
                headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
            });

            if (response.ok) {
                this.partyMembers = await response.json();
            }
        } catch (error) {
            console.error('Error loading party members:', error);
        }
        this.populatePartyDropdown();
    }

    populatePartyDropdown() {
        const select = document.getElementById('postingAsSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Select party member...</option>';
        
        this.partyMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = JSON.stringify({ id: member._id || member.id, name: member.name });
            option.textContent = member.name;
            if (member.primary) {
                option.textContent += ` (${typeof translate !== 'undefined' ? translate('common:party.primary') : 'Primary'})`;
            }
            select.appendChild(option);
        });

        // Restore selection
        if (this.selectedPartyMemberName) {
            const matchingOption = Array.from(select.options).find(opt => {
                if (!opt.value) return false;
                try {
                    const data = JSON.parse(opt.value);
                    return data.name === this.selectedPartyMemberName;
                } catch { return false; }
            });
            if (matchingOption) {
                select.value = matchingOption.value;
            }
        }
        
        // Default to primary member
        if (!select.value && this.partyMembers.length > 0) {
            const primary = this.partyMembers.find(m => m.primary) || this.partyMembers[0];
            const matchingOption = Array.from(select.options).find(opt => {
                if (!opt.value) return false;
                try {
                    const data = JSON.parse(opt.value);
                    return data.name === primary.name;
                } catch { return false; }
            });
            if (matchingOption) {
                select.value = matchingOption.value;
                this.selectedPartyMemberName = primary.name;
                localStorage.setItem('selectedPartyMemberName', this.selectedPartyMemberName);
            }
        }
    }

    getSelectedAuthor() {
        const select = document.getElementById('postingAsSelect');
        if (!select || !select.value) return null;
        try {
            return JSON.parse(select.value);
        } catch { return null; }
    }

    setupEventListeners() {
        const select = document.getElementById('postingAsSelect');
        if (select) {
            select.addEventListener('change', (e) => {
                const data = this.getSelectedAuthor();
                if (data) {
                    this.selectedPartyMemberName = data.name;
                    localStorage.setItem('selectedPartyMemberName', data.name);
                }
            });
        }

        // Comment form submission
        const form = document.getElementById('commentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addComment();
            });
        }

        // Character counter
        const textarea = document.getElementById('newComment');
        if (textarea) {
            textarea.addEventListener('input', () => this.updateCharCount());
        }
    }

    updateCharCount() {
        const textarea = document.getElementById('newComment');
        const counter = document.querySelector('.char-count');
        if (textarea && counter) {
            const len = textarea.value.length;
            counter.textContent = `${len}/500`;
            counter.style.color = len > 450 ? '#dc3545' : len > 400 ? '#ffc107' : 'var(--text-light)';
        }
    }

    setupInfiniteScroll() {
        const container = document.getElementById('comments-root');
        if (!container) return;

        const sentinel = document.createElement('div');
        sentinel.id = 'comments-scroll-sentinel';
        sentinel.style.height = '1px';
        container.appendChild(sentinel);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMoreComments && !this.isLoadingComments) {
                    this.loadComments({ cursor: this.nextCursor, append: true });
                }
            });
        }, { rootMargin: '100px' });

        observer.observe(sentinel);
    }

    async loadComments(options = {}) {
        const { cursor = null, fromBeginning = false, append = false } = options;
        
        if (this.isLoadingComments) return;
        this.isLoadingComments = true;

        try {
            const url = new URL('/api/guest/messages', window.location.origin);
            url.searchParams.append('limit', this.limit);
            if (!fromBeginning && cursor) {
                url.searchParams.append('cursor', cursor);
            }

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
            });

            if (response.ok) {
                const data = await response.json();
                const items = data.items || [];
                this.nextCursor = data.nextCursor || null;
                this.hasMoreComments = this.nextCursor !== null;

                const newComments = items.map(msg => ({
                    id: msg.id,
                    author: msg.author || 'Guest',
                    body: msg.body || '',
                    createdAt: msg.createdAt,
                    reactions: msg.reactions || []
                }));

                if (append) {
                    this.comments = [...this.comments, ...newComments];
                } else {
                    this.comments = newComments;
                }
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            this.isLoadingComments = false;
        }

        this.renderComments();
    }

    async addComment() {
        const textarea = document.getElementById('newComment');
        const body = textarea?.value.trim();
        const author = this.getSelectedAuthor();

        if (!body) {
            this.showToast('Please write a comment.', 'error');
            return;
        }

        if (!author) {
            this.showToast('Please select who is posting the comment.', 'error');
            return;
        }

        if (body.length > 500) {
            this.showToast('Comment cannot exceed 500 characters.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/guest/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ body, authorName: author.name })
            });

            if (response.ok) {
                textarea.value = '';
                this.updateCharCount();
                await this.loadComments({ fromBeginning: true });
                this.showToast('Comment posted successfully', 'success');
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Error posting comment', 'error');
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showToast('Connection error when posting comment', 'error');
        }
    }

    async toggleReaction(commentId, emoji) {
        try {
            const response = await fetch(`/api/guest/messages/${commentId}/reaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ emoji })
            });

            if (response.ok) {
                await this.loadComments({ fromBeginning: true });
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Error updating reaction', 'error');
            }
        } catch (error) {
            console.error('Error toggling reaction:', error);
            this.showToast('Connection error when updating reaction', 'error');
        }
    }

    async deleteComment(commentId) {
        if (!this.isAdmin) {
            this.showToast('Only administrators can delete comments.', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const token = localStorage.getItem('adminToken') || this.getAuthToken();
            const response = await fetch(`/api/admin/messages/${commentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                await this.loadComments({ fromBeginning: true });
                this.showToast('Comment deleted successfully', 'success');
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Error deleting comment', 'error');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showToast('Connection error when deleting comment', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    renderComments() {
        const container = document.getElementById('comments-root');
        if (!container) return;

        // Keep the sentinel if it exists
        const sentinel = document.getElementById('comments-scroll-sentinel');

        if (this.comments.length === 0) {
            container.innerHTML = `
                <div class="willow-empty-state">
                    <i class="fas fa-comments"></i>
                    <p>${typeof translate !== 'undefined' ? translate('guests:noComments') : 'No comments yet. Be the first to leave a message!'}</p>
                </div>
            `;
            if (sentinel) container.appendChild(sentinel);
            return;
        }

        const commentsHtml = this.comments
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(comment => this.renderComment(comment))
            .join('');

        container.innerHTML = `<div class="willow-comments-list">${commentsHtml}</div>`;
        
        if (sentinel) container.appendChild(sentinel);
        
        // Re-setup infinite scroll sentinel
        if (!sentinel) this.setupInfiniteScroll();
    }

    renderComment(comment) {
        const reactions = comment.reactions || [];
        const totalReactions = reactions.reduce((sum, r) => sum + (r.count || 0), 0);

        // Build reactions HTML
        let reactionsHtml = '';
        if (totalReactions > 0) {
            const pills = reactions
                .filter(r => r.count > 0)
                .map(r => `
                    <button class="willow-reaction-pill ${r.reacted ? 'active' : ''}" 
                            onclick="commentsSystem.toggleReaction('${comment.id}', '${r.emoji}')">
                        <span class="emoji">${r.emoji}</span>
                        <span class="count">${r.count}</span>
                    </button>
                `).join('');
            reactionsHtml = `<div class="willow-reactions-row">${pills}</div>`;
        }

        // Emoji picker
        const pickerOptions = this.availableEmojis.map(({ emoji, name }) => {
            const existing = reactions.find(r => r.emoji === emoji);
            const isActive = existing?.reacted ? 'active' : '';
            return `
                <button class="willow-emoji-option ${isActive}" 
                        title="${name}"
                        onclick="commentsSystem.toggleReaction('${comment.id}', '${emoji}')">
                    ${emoji}
                </button>
            `;
        }).join('');

        // Admin delete button
        const deleteBtn = this.isAdmin ? `
            <button class="willow-delete-btn" onclick="commentsSystem.deleteComment('${comment.id}')" title="Delete">
                <i class="fas fa-trash-alt"></i>
            </button>
        ` : '';

        return `
            <div class="willow-comment" data-id="${comment.id}">
                <div class="willow-comment-header">
                    <div class="willow-avatar">
                        <span>${this.escapeHtml(comment.author.charAt(0).toUpperCase())}</span>
                    </div>
                    <div class="willow-meta">
                        <span class="willow-author">${this.escapeHtml(comment.author)}</span>
                        <span class="willow-date">${this.formatDate(comment.createdAt)}</span>
                    </div>
                    ${deleteBtn}
                </div>
                <div class="willow-comment-body">${this.escapeHtml(comment.body)}</div>
                <div class="willow-comment-footer">
                    ${reactionsHtml}
                    <div class="willow-add-reaction">
                        <button class="willow-reaction-trigger">
                            <i class="fas fa-smile"></i>
                        </button>
                        <div class="willow-emoji-picker">${pickerOptions}</div>
                    </div>
                </div>
            </div>
        `;
    }

    showToast(message, type = 'success') {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Initialize when DOM is ready
let commentsSystem;
document.addEventListener('DOMContentLoaded', () => {
    commentsSystem = new CommentsSystem();
    
    // Re-initialize when settings change
    window.addEventListener('focus', () => {
        const section = document.querySelector('.comments-card');
        if (section && commentsSystem && !commentsSystem.initialized) {
            if (section.style.display !== 'none') {
                commentsSystem.init();
            }
        }
    });
});

window.commentsSystem = commentsSystem;
