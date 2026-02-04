/**
 * Frontend JavaScript per Cucina Italiana Verifica
 * Gestisce autenticazione, ricette, carrello e checkout con fetch API e localStorage
 */

// Configurazione API - Usa la funzione definita in config.js
const API_BASE_URL = window.APP_CONFIG ? window.APP_CONFIG.getApiUrl() : 'http://localhost:5000/api';
console.log('Using API Base URL:', API_BASE_URL);

// Stato applicazione
let currentUser = null;
let ricette = [];
let generi = [];
let carrello = []; // Struttura: [{idRicetta, titolo, num_persone, costo, idVino?}]

// ==================== INIZIALIZZAZIONE ====================

document.addEventListener('DOMContentLoaded', () => {
    // Carica carrello da localStorage
    loadCarrelloFromStorage();
    
    // Verifica se utente già loggato
    checkUserSession();
    
    // Carica generi per filtro
    loadGeneri();
    
    // Carica ricette
    loadRicette();
    
    // Event listeners
    setupEventListeners();
    
    // Aggiorna UI carrello
    updateCarrelloUI();
});

function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Filtro genere
    document.getElementById('genere-filter').addEventListener('change', handleGenereFilter);
    
    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
    
    // Svuota carrello
    document.getElementById('svuota-carrello-btn').addEventListener('click', svuotaCarrello);
    
    // Chiudi modal
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.id === 'ricetta-modal') closeModal();
    });
}

// ==================== AUTENTICAZIONE ====================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = { email: data.email };
            updateAuthUI();
            errorDiv.textContent = '';
            document.getElementById('login-form').reset();
            updateCarrelloUI(); // Mostra checkout se loggato
        } else {
            errorDiv.textContent = data.error || 'Login fallito';
        }
    } catch (error) {
        console.error('Errore login:', error);
        errorDiv.textContent = 'Errore di connessione. Verifica che il backend sia attivo.';
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        updateAuthUI();
        updateCarrelloUI();
    } catch (error) {
        console.error('Errore logout:', error);
    }
}

async function checkUserSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/user`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentUser = { email: data.email };
                updateAuthUI();
            }
        }
    } catch (error) {
        console.log('Nessuna sessione attiva');
    }
}

function updateAuthUI() {
    const loginSection = document.getElementById('login-section');
    const userSection = document.getElementById('user-section');
    const userEmail = document.getElementById('user-email');
    
    if (currentUser) {
        loginSection.style.display = 'none';
        userSection.style.display = 'flex';
        userEmail.textContent = currentUser.email;
    } else {
        loginSection.style.display = 'flex';
        userSection.style.display = 'none';
    }
}

// ==================== GENERI ====================

async function loadGeneri() {
    try {
        const response = await fetch(`${API_BASE_URL}/generi`);
        const data = await response.json();
        
        if (data.success) {
            generi = data.generi;
            populateGeneriFilter();
        }
    } catch (error) {
        console.error('Errore caricamento generi:', error);
    }
}

function populateGeneriFilter() {
    const select = document.getElementById('genere-filter');
    
    generi.forEach(genere => {
        const option = document.createElement('option');
        option.value = genere.idGenere;
        option.textContent = genere.nomeGenere;
        select.appendChild(option);
    });
}

function handleGenereFilter(e) {
    const genereId = e.target.value;
    loadRicette(genereId || null);
}

// ==================== RICETTE ====================

async function loadRicette(genereId = null) {
    try {
        const url = genereId 
            ? `${API_BASE_URL}/ricette?genere=${genereId}`
            : `${API_BASE_URL}/ricette`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            ricette = data.ricette;
            displayRicette();
        }
    } catch (error) {
        console.error('Errore caricamento ricette:', error);
        document.getElementById('ricette-list').innerHTML = 
            '<p class="error">Errore caricamento ricette. Verifica che il backend sia attivo.</p>';
    }
}

function displayRicette() {
    const container = document.getElementById('ricette-list');
    
    if (ricette.length === 0) {
        container.innerHTML = '<p>Nessuna ricetta trovata.</p>';
        return;
    }
    
    container.innerHTML = '';
    
    ricette.forEach(ricetta => {
        const card = createRicettaCard(ricetta);
        container.appendChild(card);
    });
}

function createRicettaCard(ricetta) {
    const card = document.createElement('div');
    card.className = 'ricetta-card';
    
    // Immagine
    const imgDiv = document.createElement('div');
    if (ricetta.media_url) {
        const img = document.createElement('img');
        img.src = ricetta.media_url;
        img.alt = ricetta.titolo;
        img.className = 'ricetta-img';
        imgDiv.appendChild(img);
    } else {
        imgDiv.className = 'ricetta-img placeholder';
        imgDiv.textContent = '🍝';
    }
    card.appendChild(imgDiv);
    
    // Info
    const info = document.createElement('div');
    info.className = 'ricetta-info';
    
    const title = document.createElement('h3');
    title.textContent = ricetta.titolo;
    info.appendChild(title);
    
    const costo = document.createElement('div');
    costo.className = 'ricetta-costo';
    costo.textContent = `€${ricetta.costo_per_persona.toFixed(2)} / persona`;
    info.appendChild(costo);
    
    // Generi
    if (ricetta.generi && ricetta.generi.length > 0) {
        const generiDiv = document.createElement('div');
        generiDiv.className = 'ricetta-generi';
        ricetta.generi.forEach(g => {
            const badge = document.createElement('span');
            badge.className = 'genere-badge';
            badge.textContent = g.nomeGenere;
            generiDiv.appendChild(badge);
        });
        info.appendChild(generiDiv);
    }
    
    // Form aggiungi carrello
    const form = document.createElement('form');
    form.className = 'add-to-cart-form';
    form.innerHTML = `
        <input type="number" min="1" value="1" placeholder="N. persone" required>
        <button type="submit">Aggiungi al Carrello</button>
    `;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const numPersone = parseInt(form.querySelector('input').value);
        aggiungiAlCarrello(ricetta, numPersone);
    });
    
    info.appendChild(form);
    card.appendChild(info);
    
    // Click su card apre dettaglio
    card.addEventListener('click', (e) => {
        if (!e.target.closest('form')) {
            showRicettaDettaglio(ricetta.idRicetta);
        }
    });
    
    return card;
}

async function showRicettaDettaglio(idRicetta) {
    try {
        const response = await fetch(`${API_BASE_URL}/ricetta/${idRicetta}`);
        const data = await response.json();
        
        if (data.success) {
            displayRicettaModal(data.ricetta);
        }
    } catch (error) {
        console.error('Errore caricamento dettaglio:', error);
    }
}

function displayRicettaModal(ricetta) {
    const modal = document.getElementById('ricetta-modal');
    const dettaglio = document.getElementById('ricetta-dettaglio');
    
    let html = `
        <h2>${ricetta.titolo}</h2>
        <p class="ricetta-costo">€${ricetta.costo_per_persona.toFixed(2)} / persona</p>
        
        <h3>Descrizione</h3>
        <p>${ricetta.descrizionePreparazione || 'Nessuna descrizione disponibile'}</p>
        
        <h3>Ingredienti</h3>
        <ul>
    `;
    
    ricetta.ingredienti.forEach(ing => {
        html += `<li>${ing.nomeIngrediente}: ${ing.quantita} ${ing.unitaMisura}</li>`;
    });
    
    html += '</ul>';
    
    if (ricetta.vini && ricetta.vini.length > 0) {
        html += '<h3>Vini Consigliati</h3><ul>';
        ricetta.vini.forEach(vino => {
            html += `<li>${vino.nomeVino} (${vino.tipo}) - ${vino.regione}, ${vino.nazione}`;
            if (vino.annata) html += ` - Annata: ${vino.annata}`;
            html += '</li>';
        });
        html += '</ul>';
    }
    
    if (ricetta.media && ricetta.media.length > 0) {
        html += '<h3>Media</h3>';
        ricetta.media.forEach(m => {
            if (m.tipo === 'immagine') {
                html += `<img src="${m.url}" alt="Foto ricetta" style="max-width: 100%; margin: 10px 0;">`;
            }
        });
    }
    
    dettaglio.innerHTML = html;
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('ricetta-modal').style.display = 'none';
}

// ==================== CARRELLO ====================

function aggiungiAlCarrello(ricetta, numPersone) {
    // Calcola costo per questo item
    const costo = ricetta.costo_per_persona * numPersone;
    
    // Verifica se ricetta già in carrello
    const esistente = carrello.find(item => item.idRicetta === ricetta.idRicetta);
    
    if (esistente) {
        // Aggiorna quantità
        esistente.num_persone += numPersone;
        esistente.costo = ricetta.costo_per_persona * esistente.num_persone;
    } else {
        // Aggiungi nuovo item
        carrello.push({
            idRicetta: ricetta.idRicetta,
            titolo: ricetta.titolo,
            num_persone: numPersone,
            costo: costo,
            costo_per_persona: ricetta.costo_per_persona
        });
    }
    
    saveCarrelloToStorage();
    updateCarrelloUI();
    
    // Feedback visivo
    alert(`✓ ${ricetta.titolo} aggiunto al carrello!`);
}

function rimuoviDalCarrello(idRicetta) {
    carrello = carrello.filter(item => item.idRicetta !== idRicetta);
    saveCarrelloToStorage();
    updateCarrelloUI();
}

function svuotaCarrello() {
    if (confirm('Sei sicuro di voler svuotare il carrello?')) {
        carrello = [];
        saveCarrelloToStorage();
        updateCarrelloUI();
    }
}

function updateCarrelloUI() {
    const itemsContainer = document.getElementById('carrello-items');
    const totaleSection = document.getElementById('carrello-totale');
    const guestWarning = document.getElementById('carrello-guest-warning');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (carrello.length === 0) {
        itemsContainer.innerHTML = '<p class="empty-cart">Il carrello è vuoto</p>';
        totaleSection.style.display = 'none';
        guestWarning.style.display = 'none';
        return;
    }
    
    // Mostra items
    itemsContainer.innerHTML = '';
    let totale = 0;
    
    carrello.forEach(item => {
        totale += item.costo;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'carrello-item';
        itemDiv.innerHTML = `
            <div class="carrello-item-info">
                <h4>${item.titolo}</h4>
                <p>${item.num_persone} persona/e × €${item.costo_per_persona.toFixed(2)}</p>
            </div>
            <div class="carrello-item-costo">€${item.costo.toFixed(2)}</div>
            <button class="btn-remove" data-id="${item.idRicetta}">Rimuovi</button>
        `;
        
        itemDiv.querySelector('.btn-remove').addEventListener('click', () => {
            rimuoviDalCarrello(item.idRicetta);
        });
        
        itemsContainer.appendChild(itemDiv);
    });
    
    // Mostra totale
    document.getElementById('totale-amount').textContent = totale.toFixed(2);
    totaleSection.style.display = 'block';
    
    // Gestisci warning guest
    if (currentUser) {
        guestWarning.style.display = 'none';
        checkoutBtn.disabled = false;
    } else {
        guestWarning.style.display = 'block';
        checkoutBtn.disabled = true;
    }
}

function loadCarrelloFromStorage() {
    const stored = localStorage.getItem('carrello');
    if (stored) {
        try {
            carrello = JSON.parse(stored);
        } catch (e) {
            console.error('Errore parsing carrello:', e);
            carrello = [];
        }
    }
}

function saveCarrelloToStorage() {
    localStorage.setItem('carrello', JSON.stringify(carrello));
}

// ==================== CHECKOUT ====================

async function handleCheckout() {
    if (!currentUser) {
        alert('Effettua il login per completare l\'ordine');
        return;
    }
    
    if (carrello.length === 0) {
        alert('Il carrello è vuoto');
        return;
    }
    
    try {
        // Prepara dati ordine
        const carrelloData = carrello.map(item => ({
            idRicetta: item.idRicetta,
            num_persone: item.num_persone
        }));
        
        const response = await fetch(`${API_BASE_URL}/ordine`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ carrello: carrelloData })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✓ Ordine #${data.idOrdine} creato con successo!\nTotale: €${data.totale.toFixed(2)}`);
            
            // Svuota carrello
            carrello = [];
            saveCarrelloToStorage();
            updateCarrelloUI();
        } else {
            alert('Errore creazione ordine: ' + (data.error || 'Errore sconosciuto'));
        }
    } catch (error) {
        console.error('Errore checkout:', error);
        alert('Errore di connessione durante il checkout');
    }
}
