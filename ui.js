/**
 * ui.js - UI Management & DOM Manipulation
 * Handles all rendering, DOM updates, and UI state management
 */

// ==========================================
// UI STATE
// ==========================================
const UIState = {
    currentNoteId: null,
    searchQuery: '',
    filterMode: 'all',
    isSidebarOpen: false,
    isColorPickerOpen: false
};

// ==========================================
// DOM ELEMENTS CACHE
// ==========================================
const DOM = {
    notesList: null,
    noteCount: null,
    searchInput: null,
    emptyState: null,
    noteEditor: null,
    noteTitleInput: null,
    noteContentInput: null,
    noteDate: null,
    noteStatus: null,
    colorPickerDropdown: null,
    sidebar: null,
    mobileToggle: null,
    toast: null,
    toastMessage: null,
    modalOverlay: null,
    modalTitle: null,
    modalDescription: null,
    btnModalConfirm: null,
    btnModalCancel: null
};

// ==========================================
// INITIALIZATION
// ==========================================
function initUI() {
    // Cache DOM elements
    DOM.notesList = document.getElementById('notesList');
    DOM.noteCount = document.getElementById('noteCount');
    DOM.searchInput = document.getElementById('searchInput');
    DOM.emptyState = document.getElementById('emptyState');
    DOM.noteEditor = document.getElementById('noteEditor');
    DOM.noteTitleInput = document.getElementById('noteTitleInput');
    DOM.noteContentInput = document.getElementById('noteContentInput');
    DOM.noteDate = document.getElementById('noteDate');
    DOM.noteStatus = document.getElementById('noteStatus');
    DOM.colorPickerDropdown = document.getElementById('colorPickerDropdown');
    DOM.sidebar = document.getElementById('sidebar');
    DOM.mobileToggle = document.getElementById('mobileToggle');
    DOM.toast = document.getElementById('toast');
    DOM.toastMessage = document.getElementById('toastMessage');
    DOM.modalOverlay = document.getElementById('modalOverlay');
    DOM.modalTitle = document.getElementById('modalTitle');
    DOM.modalDescription = document.getElementById('modalDescription');
    DOM.btnModalConfirm = document.getElementById('btnModalConfirm');
    DOM.btnModalCancel = document.getElementById('btnModalCancel');

    // Verify critical elements
    if (!DOM.notesList || !DOM.noteEditor || !DOM.emptyState) {
        console.error('Critical UI elements not found');
        return false;
    }

    // Setup mobile toggle if exists
    if (DOM.mobileToggle) {
        DOM.mobileToggle.addEventListener('click', toggleSidebar);
    }

    // Close color picker when clicking outside
    document.addEventListener('click', (e) => {
        if (UIState.isColorPickerOpen && 
            !e.target.closest('#btnColorPicker') && 
            !e.target.closest('#colorPickerDropdown')) {
            closeColorPicker();
        }
    });

    // Close sidebar on mobile when clicking main content
    if (window.innerWidth <= 768) {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.addEventListener('click', () => {
                if (UIState.isSidebarOpen) {
                    closeSidebar();
                }
            });
        }
    }

    return true;
}

// ==========================================
// RENDER NOTES LIST
// ==========================================
function renderNotesList(notes, searchQuery = '') {
    if (!DOM.notesList) return;

    // Filter notes based on search query
    let filteredNotes = notes;
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredNotes = notes.filter(note => 
            note.title.toLowerCase().includes(query) || 
            note.content.toLowerCase().includes(query)
        );
    }

    // Sort: pinned first, then by updatedAt
    filteredNotes.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    // Update note count
    if (DOM.noteCount) {
        DOM.noteCount.textContent = filteredNotes.length;
    }

    // Clear existing notes
    DOM.notesList.innerHTML = '';

    // Render note cards
    if (filteredNotes.length === 0) {
        if (searchQuery.trim()) {
            DOM.notesList.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--color-text-secondary); font-size: 0.875rem;">
                    <p>No notes found matching "${escapeHtml(searchQuery)}"</p>
                </div>
            `;
        } else {
            DOM.notesList.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--color-text-secondary); font-size: 0.875rem;">
                    <p>No notes yet</p>
                    <p style="margin-top: 0.5rem; font-size: 0.8125rem;">Click + to create your first note</p>
                </div>
            `;
        }
        return;
    }

    const fragment = document.createDocumentFragment();
    filteredNotes.forEach(note => {
        const noteCard = createNoteCard(note);
        fragment.appendChild(noteCard);
    });

    DOM.notesList.appendChild(fragment);
}

// ==========================================
// CREATE NOTE CARD
// ==========================================
function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.dataset.noteId = note.id;
    
    if (note.color && note.color !== 'default') {
        card.dataset.color = note.color;
    }
    
    if (note.pinned) {
        card.classList.add('pinned');
    }
    
    if (UIState.currentNoteId === note.id) {
        card.classList.add('active');
    }

    // Generate preview text (first 100 chars of content)
    const preview = note.content.trim() 
        ? note.content.substring(0, 100).replace(/\n/g, ' ')
        : 'No content';

    // Format date
    const formattedDate = formatRelativeDate(note.updatedAt);

    card.innerHTML = `
        <div class="note-card-header">
            <h3 class="note-card-title">${escapeHtml(note.title || 'Untitled Note')}</h3>
        </div>
        <p class="note-card-preview">${escapeHtml(preview)}</p>
        <span class="note-card-date">${formattedDate}</span>
    `;

    // Click handler
    card.addEventListener('click', () => {
        selectNote(note.id);
        if (window.innerWidth <= 768) {
            closeSidebar();
        }
    });

    return card;
}

// ==========================================
// SELECT NOTE
// ==========================================
function selectNote(noteId) {
    const note = window.StorageManager?.getNote(noteId);
    if (!note) {
        console.error('Note not found:', noteId);
        showToast('Note not found', 'error');
        return;
    }

    UIState.currentNoteId = noteId;

    // Update active state in sidebar
    document.querySelectorAll('.note-card').forEach(card => {
        if (card.dataset.noteId === noteId) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Show editor, hide empty state
    if (DOM.emptyState) DOM.emptyState.style.display = 'none';
    if (DOM.noteEditor) DOM.noteEditor.style.display = 'flex';

    // Populate editor
    if (DOM.noteTitleInput) DOM.noteTitleInput.value = note.title;
    if (DOM.noteContentInput) DOM.noteContentInput.value = note.content;
    if (DOM.noteDate) DOM.noteDate.textContent = formatFullDate(note.updatedAt);

    // Update pin button state
    const btnPin = document.getElementById('btnPinNote');
    if (btnPin) {
        btnPin.classList.toggle('active', note.pinned);
        btnPin.style.color = note.pinned ? 'var(--color-primary)' : '';
    }

    // Update color picker active state
    updateColorPickerActiveState(note.color || 'default');

    // Focus title input
    setTimeout(() => {
        if (DOM.noteTitleInput) {
            DOM.noteTitleInput.focus();
            DOM.noteTitleInput.setSelectionRange(DOM.noteTitleInput.value.length, DOM.noteTitleInput.value.length);
        }
    }, 100);
}

// ==========================================
// UPDATE NOTE IN UI
// ==========================================
function updateNoteInUI(noteId, updates) {
    if (UIState.currentNoteId !== noteId) return;

    // Update date
    if (updates.updatedAt && DOM.noteDate) {
        DOM.noteDate.textContent = formatFullDate(updates.updatedAt);
    }

    // Show saving indicator
    showSavingIndicator();

    // Hide saving indicator after delay
    setTimeout(() => {
        hideSavingIndicator();
    }, 500);
}

// ==========================================
// SHOW/HIDE SAVING INDICATOR
// ==========================================
function showSavingIndicator() {
    if (DOM.noteStatus) {
        DOM.noteStatus.classList.add('saving');
        const statusText = DOM.noteStatus.querySelector('.status-text');
        if (statusText) statusText.textContent = 'Saving...';
    }
}

function hideSavingIndicator() {
    if (DOM.noteStatus) {
        DOM.noteStatus.classList.remove('saving');
        const statusText = DOM.noteStatus.querySelector('.status-text');
        if (statusText) statusText.textContent = 'Saved';
    }
}

// ==========================================
// CLEAR EDITOR
// ==========================================
function clearEditor() {
    UIState.currentNoteId = null;

    if (DOM.emptyState) DOM.emptyState.style.display = 'flex';
    if (DOM.noteEditor) DOM.noteEditor.style.display = 'none';
    if (DOM.noteTitleInput) DOM.noteTitleInput.value = '';
    if (DOM.noteContentInput) DOM.noteContentInput.value = '';

    // Remove active state from all cards
    document.querySelectorAll('.note-card').forEach(card => {
        card.classList.remove('active');
    });
}

// ==========================================
// COLOR PICKER
// ==========================================
function toggleColorPicker() {
    if (!DOM.colorPickerDropdown) return;

    UIState.isColorPickerOpen = !UIState.isColorPickerOpen;
    DOM.colorPickerDropdown.style.display = UIState.isColorPickerOpen ? 'block' : 'none';
}

function closeColorPicker() {
    if (!DOM.colorPickerDropdown) return;
    UIState.isColorPickerOpen = false;
    DOM.colorPickerDropdown.style.display = 'none';
}

function updateColorPickerActiveState(activeColor) {
    document.querySelectorAll('.color-option').forEach(btn => {
        if (btn.dataset.color === activeColor) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ==========================================
// SIDEBAR TOGGLE (MOBILE)
// ==========================================
function toggleSidebar() {
    UIState.isSidebarOpen = !UIState.isSidebarOpen;
    if (DOM.sidebar) {
        DOM.sidebar.style.transform = UIState.isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
    }
}

function closeSidebar() {
    UIState.isSidebarOpen = false;
    if (DOM.sidebar) {
        DOM.sidebar.style.transform = 'translateX(-100%)';
    }
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================
function showToast(message, type = 'success') {
    if (!DOM.toast || !DOM.toastMessage) return;

    DOM.toastMessage.textContent = message;
    DOM.toast.className = `toast toast-${type}`;
    DOM.toast.classList.add('show');

    // Update icon based on type
    const iconSpan = DOM.toast.querySelector('.toast-icon');
    if (iconSpan) {
        iconSpan.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    }

    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// MODAL
// ==========================================
function showModal(title, description, onConfirm, confirmText = 'Confirm', isDanger = false) {
    if (!DOM.modalOverlay) return;

    if (DOM.modalTitle) DOM.modalTitle.textContent = title;
    if (DOM.modalDescription) DOM.modalDescription.textContent = description;
    if (DOM.btnModalConfirm) {
        DOM.btnModalConfirm.textContent = confirmText;
        DOM.btnModalConfirm.className = isDanger ? 'btn-danger' : 'btn-primary';
    }

    DOM.modalOverlay.style.display = 'flex';
    setTimeout(() => DOM.modalOverlay.classList.add('show'), 10);

    // Setup handlers
    const confirmHandler = () => {
        hideModal();
        if (typeof onConfirm === 'function') onConfirm();
    };

    const cancelHandler = () => {
        hideModal();
    };

    // Remove old listeners and add new ones
    if (DOM.btnModalConfirm) {
        DOM.btnModalConfirm.replaceWith(DOM.btnModalConfirm.cloneNode(true));
        DOM.btnModalConfirm = document.getElementById('btnModalConfirm');
        DOM.btnModalConfirm.addEventListener('click', confirmHandler);
    }

    if (DOM.btnModalCancel) {
        DOM.btnModalCancel.replaceWith(DOM.btnModalCancel.cloneNode(true));
        DOM.btnModalCancel = document.getElementById('btnModalCancel');
        DOM.btnModalCancel.addEventListener('click', cancelHandler);
    }

    // Close on overlay click
    DOM.modalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.modalOverlay) {
            hideModal();
        }
    });
}

function hideModal() {
    if (!DOM.modalOverlay) return;
    DOM.modalOverlay.classList.remove('show');
    setTimeout(() => {
        DOM.modalOverlay.style.display = 'none';
    }, 200);
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}