"""
Utility functions per calcoli e logica di business.
Include il calcolo del costo totale delle ricette basato su ingredienti.
"""
from config import get_db_connection

def converti_unita(quantita, unita_da, unita_a):
    """
    Converte quantità tra unità di misura (g/kg, ml/L).
    Gestisce varianti comuni (g/gr/grammi, kg/kilo, pz/pezzo/pezzi, ecc.)
    
    Args:
        quantita (float): Quantità da convertire
        unita_da (str): Unità di partenza (g, ml, pezzo)
        unita_a (str): Unità di destinazione (kg, L, pezzo)
    
    Returns:
        float: Quantità convertita
    """
    # Normalizza le stringhe (case-insensitive e trim)
    unita_da = unita_da.strip().lower()
    unita_a = unita_a.strip().lower()
    
    # Gestisce varianti comuni
    varianti_peso_g = ['g', 'gr', 'grammi', 'grammo']
    varianti_peso_kg = ['kg', 'kilo', 'kilogrammi', 'kilogrammo']
    varianti_volume_ml = ['ml', 'millilitri', 'millilitro']
    varianti_volume_l = ['l', 'lt', 'litri', 'litro']
    varianti_pezzi = ['pz', 'pezzo', 'pezzi', 'unità', 'unita']
    
    # Normalizza alle unità standard
    if unita_da in varianti_peso_g:
        unita_da = 'g'
    elif unita_da in varianti_peso_kg:
        unita_da = 'kg'
    elif unita_da in varianti_volume_ml:
        unita_da = 'ml'
    elif unita_da in varianti_volume_l:
        unita_da = 'l'
    elif unita_da in varianti_pezzi:
        unita_da = 'pz'
        
    if unita_a in varianti_peso_g:
        unita_a = 'g'
    elif unita_a in varianti_peso_kg:
        unita_a = 'kg'
    elif unita_a in varianti_volume_ml:
        unita_a = 'ml'
    elif unita_a in varianti_volume_l:
        unita_a = 'l'
    elif unita_a in varianti_pezzi:
        unita_a = 'pz'
    
    # Se sono uguali dopo normalizzazione, nessuna conversione
    if unita_da == unita_a:
        return quantita
    
    # Conversioni peso
    if unita_da == 'g' and unita_a == 'kg':
        return quantita / 1000
    elif unita_da == 'kg' and unita_a == 'g':
        return quantita * 1000
    
    # Conversioni volume
    elif unita_da == 'ml' and unita_a == 'l':
        return quantita / 1000
    elif unita_da == 'l' and unita_a == 'ml':
        return quantita * 1000
    
    # Default: nessuna conversione (assumiamo compatibilità)
    return quantita

def calc_costo_ricetta(id_ricetta, num_persone=1):
    """
    Calcola il costo totale di una ricetta per un numero di persone.
    
    LOGICA DI CALCOLO (basata su schema DB):
    1. Recupera ingredienti con JOIN: RicettaIngrediente → Ingrediente
    2. Per ogni ingrediente:
       - Quantità ricetta (es: 200g) dalla colonna RicettaIngrediente.quantita
       - Unità misura (es: 'g') dalla colonna RicettaIngrediente.unitaMisura
       - Prezzo unitario (es: €2.50) dalla colonna Ingrediente.prezzoPerUnitaBase
       - Unità base (es: 'kg') dalla colonna Ingrediente.unitaBase
    3. Converti quantità ricetta nell'unità base: 200g → 0.2kg
    4. Calcola: 0.2 × €2.50 = €0.50 per 1 persona
    5. Moltiplica per numero persone
    
    Args:
        id_ricetta (int): ID della ricetta (FK a Ricetta.idRicetta)
        num_persone (int): Numero di persone (default: 1)
    
    Returns:
        float: Costo totale arrotondato a 2 decimali, 0.0 se nessun ingrediente
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Query JOIN basata sullo schema DB
            # RicettaIngrediente ha: idRicetta, idIngrediente, quantita, unitaMisura (PK composita)
            # Ingrediente ha: idIngrediente, nomeIngrediente, unitaBase, prezzoPerUnitaBase
            query = """
                SELECT 
                    ri.idRicetta,
                    ri.idIngrediente,
                    ri.quantita AS quantita_ricetta,
                    ri.unitaMisura AS unita_ricetta,
                    i.nomeIngrediente,
                    i.unitaBase AS unita_base_ingrediente,
                    i.prezzoPerUnitaBase AS prezzo_per_unita_base
                FROM RicettaIngrediente ri
                INNER JOIN Ingrediente i ON ri.idIngrediente = i.idIngrediente
                WHERE ri.idRicetta = %s
                ORDER BY i.nomeIngrediente ASC
            """
            cursor.execute(query, (id_ricetta,))
            ingredienti = cursor.fetchall()
            
        conn.close()
        
        # Se non ci sono ingredienti, ritorna 0.0
        if not ingredienti or len(ingredienti) == 0:
            return 0.0
        
        costo_totale = 0.0
        debug = False  # Imposta True per vedere il calcolo dettagliato
        
        if debug:
            print(f"\n=== CALCOLO COSTO RICETTA {id_ricetta} per {num_persone} persona/e ===")
        
        for ing in ingredienti:
            # Estrai dati dal DB (valori DECIMAL e VARCHAR dallo schema)
            qta_ricetta = float(ing['quantita_ricetta'])  # DECIMAL(10,2)
            unita_ricetta = str(ing['unita_ricetta'])     # VARCHAR(50)
            prezzo_unitario = float(ing['prezzo_per_unita_base'])  # DECIMAL(10,2)
            unita_base = str(ing['unita_base_ingrediente'])  # VARCHAR(50)
            nome = ing['nomeIngrediente']
            
            # Converti quantità ricetta nell'unità base dell'ingrediente
            # Es: 200g → 0.2kg se unita_base='kg'
            qta_convertita = converti_unita(qta_ricetta, unita_ricetta, unita_base)
            
            # Calcola costo per 1 persona
            # Es: 0.2kg × €2.50/kg = €0.50
            costo_1_persona = qta_convertita * prezzo_unitario
            
            # Moltiplica per numero persone
            costo_ingrediente_totale = costo_1_persona * num_persone
            
            if debug:
                print(f"{nome}:")
                print(f"  Ricetta: {qta_ricetta} {unita_ricetta}")
                print(f"  Convertito: {qta_convertita} {unita_base}")
                print(f"  Prezzo: €{prezzo_unitario}/{unita_base}")
                print(f"  Costo 1 pers: €{costo_1_persona:.4f}")
                print(f"  Costo {num_persone} pers: €{costo_ingrediente_totale:.4f}")
            
            costo_totale += costo_ingrediente_totale
        
        if debug:
            print(f"\nTOTALE: €{costo_totale:.2f}")
        
        # Arrotonda a 2 decimali (come schema DB: DECIMAL(10,2))
        return round(costo_totale, 2)
        
    except Exception as e:
        print(f"❌ ERRORE calcolo costo ricetta {id_ricetta}: {e}")
        import traceback
        traceback.print_exc()
        return 0.0

def calc_costo_ricetta_per_persona(id_ricetta):
    """
    Calcola il costo di una ricetta per 1 persona.
    
    Args:
        id_ricetta (int): ID della ricetta
    
    Returns:
        float: Costo per persona arrotondato a 2 decimali
    """
    return calc_costo_ricetta(id_ricetta, num_persone=1)

def valida_carrello(carrello_items):
    """
    Valida e calcola il totale di un carrello.
    
    Args:
        carrello_items (list): Lista di dict [{idRicetta, num_persone, idVino?}]
    
    Returns:
        dict: {totale: float, items: list con costi dettagliati}
        
    Raises:
        ValueError: Se dati carrello non validi
    """
    try:
        items_dettagliati = []
        totale = 0.0
        
        for item in carrello_items:
            id_ricetta = item.get('idRicetta')
            num_persone = item.get('num_persone', 1)
            
            if not id_ricetta or num_persone <= 0:
                raise ValueError("Dati carrello non validi")
            
            # Calcola costo ricetta
            costo_ricetta = calc_costo_ricetta(id_ricetta, num_persone)
            
            items_dettagliati.append({
                'idRicetta': id_ricetta,
                'num_persone': num_persone,
                'costo': costo_ricetta
            })
            
            totale += costo_ricetta
        
        return {
            'totale': round(totale, 2),
            'items': items_dettagliati
        }
        
    except Exception as e:
        print(f"Errore validazione carrello: {e}")
        raise
