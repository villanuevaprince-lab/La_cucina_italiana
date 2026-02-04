"""
Configurazione database MySQL con Aiven.
Gestisce la connessione al DB remoto usando PyMySQL.
"""
import os
import pymysql
from dotenv import load_dotenv

# Carica variabili d'ambiente da .env
load_dotenv()

# Configurazione DB da variabili d'ambiente
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'port': int(os.getenv('DB_PORT', 11562)),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
    # Aiven richiede SSL, quindi aggiungiamo parametri SSL
    'ssl': {'ssl_mode': 'REQUIRED'}
}

def get_db_connection():
    """
    Crea e ritorna una connessione al database MySQL.
    
    Returns:
        pymysql.Connection: Connessione al database
        
    Raises:
        Exception: Se la connessione fallisce
    """
    try:
        connection = pymysql.connect(**DB_CONFIG)
        return connection
    except Exception as e:
        print(f"ERRORE connessione DB: {e}")
        raise

def test_connection():
    """
    Testa la connessione al database.
    
    Returns:
        bool: True se connessione riuscita, False altrimenti
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
        conn.close()
        print("✓ Connessione DB riuscita!")
        return True
    except Exception as e:
        print(f"✗ Errore connessione DB: {e}")
        return False

if __name__ == "__main__":
    # Test connessione quando eseguito direttamente
    test_connection()
