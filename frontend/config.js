// Configurazione per rilevare automaticamente l'ambiente
window.APP_CONFIG = {
    getApiUrl: function() {
        // Se siamo in Codespaces
        if (window.location.hostname.includes('.app.github.dev')) {
            // L'URL segue il pattern: CODESPACE_NAME-PORT.app.github.dev
            const hostname = window.location.hostname;
            const protocol = window.location.protocol;
            // Sostituisci la porta 8080 con 5000
            const apiHostname = hostname.replace('-8080', '-5000');
            return `${protocol}//${apiHostname}/api`;
        }
        // Se siamo in localhost
        return 'http://localhost:5000/api';
    }
};

console.log('Environment detected. API URL:', window.APP_CONFIG.getApiUrl());
