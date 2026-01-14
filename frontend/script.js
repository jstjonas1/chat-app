/**
 * Chat Application - Frontend JavaScript
 * Handles real-time chat functionality with Django backend
 */

// Constants
const API_URL = 'http://127.0.0.1:8000/api/chat/';
const MESSAGE_REFRESH_INTERVAL = 3000;
const ERROR_DISPLAY_DURATION = 5000;

// DOM Elements
const chatForm = document.getElementById('chatForm');
const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');

// State
let displayedMessageIds = new Set();
let isFirstLoad = true;

/**
 * Initialize application on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the chat application
 * Sets up message loading and periodic refresh
 */
function initializeApp() {
    loadMessages();
    setInterval(loadMessages, MESSAGE_REFRESH_INTERVAL);
    setupFormHandler();
}

/**
 * Setup form submission handler
 */
function setupFormHandler() {
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const message = messageInput.value.trim();
        
        if (!isValidInput(name, message)) {
            showError('Bitte Name und Nachricht eingeben!');
            return;
        }
        
        await sendMessage(name, message);
    });
}

/**
 * Validate user input
 * @param {string} name - User name
 * @param {string} message - Chat message
 * @returns {boolean} True if input is valid
 */
function isValidInput(name, message) {
    return name && message;
}

/**
 * Load all messages from the API
 * @async
 */
async function loadMessages() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayMessages(data.chats);
    } catch (error) {
        console.error('Fehler beim Laden der Nachrichten:', error);
        showError('Fehler beim Laden der Nachrichten. Ist der Server gestartet?');
    }
}

/**
 * Send a new message to the API
 * @async
 * @param {string} name - User name
 * @param {string} message - Chat message
 */
async function sendMessage(name, message) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        clearMessageInput();
        await loadMessages();
        scrollToBottom();
        
    } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
        showError('Fehler beim Senden der Nachricht. Bitte versuche es erneut.');
    }
}

/**
 * Clear message input field and set focus
 */
function clearMessageInput() {
    messageInput.value = '';
    messageInput.focus();
}

/**
 * Display messages in the chat container
 * Only renders new messages to avoid re-animation
 * @param {Array} messages - Array of message objects
 */
function displayMessages(messages) {
    if (!hasMessages(messages)) {
        displayEmptyState();
        return;
    }
    
    const hasNewMessages = renderNewMessages(messages);
    handleScrollBehavior(hasNewMessages);
}

/**
 * Check if messages array has content
 * @param {Array} messages - Array of messages
 * @returns {boolean} True if messages exist
 */
function hasMessages(messages) {
    return messages && messages.length > 0;
}

/**
 * Display empty state message
 */
function displayEmptyState() {
    chatMessages.innerHTML = '<div class="loading">Noch keine Nachrichten. Schreibe die erste!</div>';
    displayedMessageIds.clear();
    isFirstLoad = false;
}

/**
 * Render new messages that haven't been displayed yet
 * @param {Array} messages - Array of message objects
 * @returns {boolean} True if new messages were rendered
 */
function renderNewMessages(messages) {
    let hasNewMessages = false;
    
    messages.forEach(msg => {
        if (!displayedMessageIds.has(msg.id)) {
            displayedMessageIds.add(msg.id);
            hasNewMessages = true;
            
            const messageElement = createMessageElement(msg);
            chatMessages.appendChild(messageElement);
        }
    });
    
    return hasNewMessages;
}

/**
 * Create a message DOM element
 * @param {Object} msg - Message object with id, name, message, created_at
 * @returns {HTMLElement} Message element
 */
function createMessageElement(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = getMessageClassName();
    messageDiv.dataset.id = msg.id;
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-name">${escapeHtml(msg.name)}</span>
            <span class="message-time">${formatDate(msg.created_at)}</span>
        </div>
        <div class="message-text">${escapeHtml(msg.message)}</div>
    `;
    
    return messageDiv;
}

/**
 * Get CSS class name for message based on load state
 * @returns {string} CSS class name
 */
function getMessageClassName() {
    return isFirstLoad ? 'message no-animation' : 'message';
}

/**
 * Handle scroll behavior after rendering messages
 * @param {boolean} hasNewMessages - Whether new messages were added
 */
function handleScrollBehavior(hasNewMessages) {
    if (isFirstLoad) {
        isFirstLoad = false;
        scrollToBottom();
    } else if (hasNewMessages) {
        scrollToBottom();
    }
}

/**
 * Format date string to relative or absolute time
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Display an error message to the user
 * @param {string} message - Error message to display
 */
function showError(message) {
    const errorDiv = createErrorElement(message);
    chatMessages.insertBefore(errorDiv, chatMessages.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, ERROR_DISPLAY_DURATION);
}

/**
 * Create error message DOM element
 * @param {string} message - Error message text
 * @returns {HTMLElement} Error element
 */
function createErrorElement(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    return errorDiv;
}

/**
 * Scroll chat container to bottom
 * Shows the most recent messages
 */
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
