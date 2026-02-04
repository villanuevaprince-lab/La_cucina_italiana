# 🍝 Cucina Italiana Verifica

Web application full-stack per la gestione di ricette, ingredienti, vini e ordini della cucina italiana.

## 📋 Descrizione Progetto

Applicazione sviluppata per esame con:
- **Backend**: Flask (Python) con API REST JSON
- **Database**: MySQL su Aiven (già popolato)
- **Frontend**: HTML/CSS/JS vanilla (fetch API, localStorage)
- **Funzionalità**: Login, visualizzazione ricette con calcolo costi, carrello guest, checkout utenti loggati

## 🗄️ Modello Database

### Tabelle Principali
- **Ricetta**: ricette con titolo e descrizione
- **Genere**: categorie di ricette
- **Ingrediente**: ingredienti con prezzi per unità base
- **Vino**: vini abbinati alle ricette
- **Utente**: gestione autenticazione
- **Ordine**: ordini effettuati da utenti loggati
- **DettaglioOrdineRicetta**: dettagli ricette in ordini

### Relazioni
- Ricetta ↔ Genere (N:M)
- Ricetta ↔ Ingrediente (N:M con quantità)
- Ricetta ↔ Vino (N:M con annata)
- Ricetta ↔ Media (1:N)
- Utente ↔ Ordine (1:N)
- Ordine ↔ Ricetta (N:M tramite DettaglioOrdineRicetta)

## 🚀 Setup e Installazione

### Prerequisiti
- Python 3.8+
- pip
- Accesso a MySQL Aiven (credenziali in `.env`)

### Avvio Rapido (Consigliato)

```bash
# Installa dipendenze (solo prima volta)
cd backend
pip install -r requirements.txt

# Avvia tutto automaticamente
cd ..
./start.sh
```

Poi apri nel browser: **http://localhost:8080**

### Setup Manuale (Alternativo)

### 1. Installa Dipendenze

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurazione

Il file `.env` contiene le credenziali per il database MySQL Aiven.

Variabili richieste in `backend/.env`:
```
DB_HOST=your-mysql-host.aivencloud.com
DB_PORT=11562
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=cucina_italiana_verifica
SECRET_KEY=your-secret-key-for-flask-sessions
```

**Nota**: Le credenziali reali sono già configurate nel file `.env` (protetto da `.gitignore`).

### 3. Test Connessione Database

```bash
cd backend
python config.py
```

Se vedi "✓ Connessione DB riuscita!" puoi procedere.

### 4. Avvia Backend Flask

```bash
cd backend
python app.py
# oppure
flask run --host=0.0.0.0 --port=5000
```

Il backend sarà disponibile su `http://localhost:5000`

### 5. Apri Frontend

Apri `frontend/index.html` nel browser oppure usa un server HTTP:

```bash
cd frontend
python -m http.server 8080
```

Poi vai su `http://localhost:8080`

## 📡 API Endpoints

### Autenticazione
- `POST /api/login` - Login utente (body: `{email, password}`)
- `GET /api/user` - Info utente loggato (protetta)
- `POST /api/logout` - Logout

### Ricette
- `GET /api/ricette?genere=<id>` - Lista ricette (filtro genere opzionale)
- `GET /api/ricetta/<id>` - Dettagli ricetta completa
- `GET /api/generi` - Lista generi

### Vini
- `GET /api/vini?ricetta_id=<id>` - Lista vini (filtro ricetta opzionale)

### Carrello e Ordini
- `POST /api/carrello/validate` - Valida carrello (body: `{carrello: [{idRicetta, num_persone}]}`)
- `POST /api/ordine` - Crea ordine (protetta, body: `{carrello: [{idRicetta, num_persone}]}`)

### Utility
- `GET /api/health` - Health check
- `GET /` - Info API

## 🧮 Calcolo Costi

Il calcolo del costo di una ricetta avviene tramite `utils.calc_costo_ricetta()`:

1. Recupera tutti gli ingredienti della ricetta con quantità e unità di misura
2. Per ogni ingrediente:
   - Converte la quantità ricetta nell'unità base dell'ingrediente (g→kg, ml→L)
   - Moltiplica per il prezzo per unità base
   - Moltiplica per numero di persone
3. Somma tutti i costi e arrotonda a 2 decimali

**Esempio**: 
- Ricetta richiede 200g di farina
- Farina costa €1.50/kg
- Costo ingrediente = (200/1000) × 1.50 = €0.30

## 🎯 Funzionalità Frontend

### Utente Non Loggato
- ✅ Visualizza ricette con costo per persona
- ✅ Filtra per genere
- ✅ Visualizza dettagli ricette
- ❌ NON può effettuare checkout

### Utente Loggato
- ✅ Tutte le funzionalità guest
- ✅ Aggiunge ricette al carrello (localStorage)
- ✅ Checkout e creazione ordini
- ✅ Visualizza email in header

## 🧪 Test con curl

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt
```

### Ricette
```bash
curl http://localhost:5000/api/ricette
```

### Ricetta con genere
```bash
curl "http://localhost:5000/api/ricette?genere=1"
```

### Crea ordine (richiede login)
```bash
curl -X POST http://localhost:5000/api/ordine \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"carrello":[{"idRicetta":1,"num_persone":2}]}'
```

## 📁 Struttura Progetto

```
/
├── backend/
│   ├── app.py              # Flask app principale + routes
│   ├── config.py           # Configurazione DB MySQL
│   ├── utils.py            # Funzioni utility (calc costi)
│   ├── requirements.txt    # Dipendenze Python
│   └── .env               # Credenziali DB (gitignored)
├── frontend/
│   ├── index.html         # UI principale
│   ├── style.css          # Stili responsive
│   └── script.js          # Logica frontend (fetch, localStorage)
├── .gitignore             # File da ignorare
└── README.md              # Questo file
```

## 🔒 Sicurezza

- Password in chiaro nel DB per testing (in produzione usare `werkzeug.security.generate_password_hash`)
- Sessioni Flask per autenticazione
- CORS abilitato per comunicazione frontend-backend
- `.env` in `.gitignore` per proteggere credenziali

## 🐛 Troubleshooting

Per problemi comuni e soluzioni dettagliate, consulta [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

### Quick Fixes

**Errore CORS**: Riavvia il backend con `./start.sh`

**Porte occupate**: 
```bash
pkill -9 -f "python.*app.py"; pkill -9 -f "http.server.*8080"
./start.sh
```

### Errore connessione DB
- Verifica credenziali in `backend/.env`
- Controlla firewall/rete per accesso Aiven
- Esegui `python backend/config.py` per test connessione

### Backend non risponde
- Verifica che Flask sia avviato: `cd backend && python app.py`
- Controlla porta 5000 non occupata: `lsof -i :5000`

### Frontend non carica ricette
- Apri console browser (F12) per errori
- Verifica URL API in `frontend/script.js` (default: `http://localhost:5000/api`)
- Controlla CORS: deve essere abilitato in Flask

### Costi ricette a 0
- Verifica che tabelle `Ingrediente` e `RicettaIngrediente` siano popolate
- Controlla log backend per errori calcolo

## 📝 Note per Esame

- **Architettura**: Backend separato da frontend (API REST)
- **Gestione Errori**: Try/except in Python, HTTP status codes appropriati
- **Modularità**: Logica separata in `utils.py`, config in `config.py`
- **UI/UX**: Responsive, feedback visivi, gestione stati utente
- **Calcoli**: Conversione unità misura, arrotondamenti corretti
- **Sicurezza**: Sessioni, protezione route, credenziali in .env

## 👥 Credenziali Test

(Assumendo che il DB Aiven sia popolato con utenti di test)

Esempio:
- Email: `utente@test.it`
- Password: `password123`

*Verificare con amministratore DB per credenziali reali.*

## 📄 Licenza

Progetto didattico - Uso educativo

---

**Sviluppato per esame Cucina Italiana Verifica - 2026**