const API_URL = 'http://127.0.0.1:8000/api/chat/';

const chatForm = document.getElementById('chatForm');
const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const chatMessages = document.getElementById('chatMessages');

let displayedMessageIds = new Set();
let isFirstLoad = true;

document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    setInterval(loadMessages, 3000);
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!name || !message) {
        showError('Bitte Name und Nachricht eingeben!');
        return;
    }
    
    await sendMessage(name, message);
});

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

async function sendMessage(name, message) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                message: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        messageInput.value = '';
        messageInput.focus();
        
        await loadMessages();
        
        scrollToBottom();
        
    } catch (error) {
        console.error('Fehler beim Senden der Nachricht:', error);
        showError('Fehler beim Senden der Nachricht. Bitte versuche es erneut.');
    }
}

function displayMessages(messages) {
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = '<div class="loading">Noch keine Nachrichten. Schreibe die erste!</div>';
        displayedMessageIds.clear();
        isFirstLoad = false;
        return;
    }
    
    let hasNewMessages = false;
    
    messages.forEach(msg => {
        if (!displayedMessageIds.has(msg.id)) {
            displayedMessageIds.add(msg.id);
            hasNewMessages = true;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = isFirstLoad ? 'message no-animation' : 'message';
            messageDiv.dataset.id = msg.id;
            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-name">${escapeHtml(msg.name)}</span>
                    <span class="message-time">${formatDate(msg.created_at)}</span>
                </div>
                <div class="message-text">${escapeHtml(msg.message)}</div>
            `;
            
            chatMessages.appendChild(messageDiv);
        }
    });
    
    if (isFirstLoad) {
        isFirstLoad = false;
        scrollToBottom();
    } else if (hasNewMessages) {
        scrollToBottom();
    }
}

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    chatMessages.insertBefore(errorDiv, chatMessages.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
