from flask import Flask, request, jsonify

app = Flask(__name__)

# 1. Autenticazione e Gestione Utenti

@app.route('/auth/google', methods=['POST'])
def auth_google():
    pass

@app.route('/auth/google/callback', methods=['GET'])
def auth_google_callback():
    pass

@app.route('/auth/gestione', methods=['POST'])
def auth_gestione():
    pass

@app.route('/utenti', methods=['GET'])
def get_utenti():
    pass

@app.route('/utenti/<idUtente>', methods=['GET'])
def get_utente(idUtente):
    pass

@app.route('/utenti', methods=['POST'])
def create_utente():
    pass

@app.route('/utenti/<idUtente>', methods=['PUT'])
def update_utente(idUtente):
    pass

@app.route('/utenti/<idUtente>', methods=['DELETE'])
def delete_utente(idUtente):
    pass

# 2. Gestione Studenti e Classi

## Studenti
@app.route('/studenti', methods=['GET'])
def get_studenti():
    pass

@app.route('/studenti/<idStudente>', methods=['GET'])
def get_studente(idStudente):
    pass

@app.route('/studenti', methods=['POST'])
def create_studente():
    pass

@app.route('/studenti/<idStudente>', methods=['PUT'])
def update_studente(idStudente):
    pass

@app.route('/studenti/<idStudente>', methods=['DELETE'])
def delete_studente(idStudente):
    pass

@app.route('/studenti/<idStudente>/preferiti', methods=['GET'])
def get_studenti_preferiti(idStudente):
    pass

@app.route('/studenti/<idStudente>/preferiti', methods=['POST'])
def add_studente_preferito(idStudente):
    pass

@app.route('/studenti/<idStudente>/preferiti/<idProdotto>', methods=['DELETE'])
def delete_studente_preferito(idStudente, idProdotto):
    pass

## Classi
@app.route('/classi', methods=['GET'])
def get_classi():
    pass

@app.route('/classi/<nome>', methods=['GET'])
def get_classe(nome):
    pass

@app.route('/classi', methods=['POST'])
def create_classe():
    pass

@app.route('/classi/<nome>', methods=['PUT'])
def update_classe(nome):
    pass

@app.route('/classi/<nome>', methods=['DELETE'])
def delete_classe(nome):
    pass

# 3. Gestione Turni e Ordini

## 3.1 Turni
@app.route('/turni', methods=['GET'])
def get_turni():
    pass

@app.route('/turni/<data>/<int:n>', methods=['GET'])
def get_turno(data, n):
    pass

@app.route('/turni', methods=['POST'])
def create_turno():
    pass

@app.route('/turni/<data>/<int:n>', methods=['PUT'])
def update_turno(data, n):
    pass

@app.route('/turni/<data>/<int:n>', methods=['DELETE'])
def delete_turno(data, n):
    pass

## 3.2 Ordini Studente (Ordini individuali)
@app.route('/ordini/studenti', methods=['GET'])
def get_ordini_studenti():
    pass

@app.route('/ordini/studenti/<int:idOrdine>', methods=['GET'])
def get_ordine_studente(idOrdine):
    pass

@app.route('/ordini/studenti', methods=['POST'])
def create_ordine_studente():
    pass

@app.route('/ordini/studenti/<int:idOrdine>', methods=['PUT'])
def update_ordine_studente(idOrdine):
    pass

@app.route('/ordini/studenti/<int:idOrdine>', methods=['DELETE'])
def delete_ordine_studente(idOrdine):
    pass

# Dettagli Ordine Studente
@app.route('/ordini/studenti/<int:idOrdine>/dettagli', methods=['GET'])
def get_dettagli_ordine_studente(idOrdine):
    pass

@app.route('/ordini/studenti/<int:idOrdine>/dettagli', methods=['POST'])
def create_dettaglio_ordine_studente(idOrdine):
    pass

@app.route('/ordini/studenti/<int:idOrdine>/dettagli/<int:idDettaglio>', methods=['PUT'])
def update_dettaglio_ordine_studente(idOrdine, idDettaglio):
    pass

@app.route('/ordini/studenti/<int:idOrdine>/dettagli/<int:idDettaglio>', methods=['DELETE'])
def delete_dettaglio_ordine_studente(idOrdine, idDettaglio):
    pass

## 3.3 Ordini Classe
@app.route('/ordini/classi', methods=['GET'])
def get_ordini_classi():
    pass

@app.route('/ordini/classi/<int:idOrdine>', methods=['GET'])
def get_ordine_classe(idOrdine):
    pass

@app.route('/ordini/classi', methods=['POST'])
def create_ordine_classe():
    pass

@app.route('/ordini/classi/<int:idOrdine>', methods=['PUT'])
def update_ordine_classe(idOrdine):
    pass

@app.route('/ordini/classi/<int:idOrdine>', methods=['DELETE'])
def delete_ordine_classe(idOrdine):
    pass

## 3.4 Ordini Utente (per professori o altre tipologie)
@app.route('/ordini/utenti', methods=['GET'])
def get_ordini_utenti():
    pass

@app.route('/ordini/utenti/<int:idOrdine>', methods=['GET'])
def get_ordine_utente(idOrdine):
    pass

@app.route('/ordini/utenti', methods=['POST'])
def create_ordine_utente():
    pass

@app.route('/ordini/utenti/<int:idOrdine>', methods=['PUT'])
def update_ordine_utente(idOrdine):
    pass

@app.route('/ordini/utenti/<int:idOrdine>', methods=['DELETE'])
def delete_ordine_utente(idOrdine):
    pass

# Dettagli Ordine Utente
@app.route('/ordini/utenti/<int:idOrdine>/dettagli', methods=['GET'])
def get_dettagli_ordine_utente(idOrdine):
    pass

@app.route('/ordini/utenti/<int:idOrdine>/dettagli', methods=['POST'])
def create_dettaglio_ordine_utente(idOrdine):
    pass

@app.route('/ordini/utenti/<int:idOrdine>/dettagli/<int:idDettaglio>', methods=['PUT'])
def update_dettaglio_ordine_utente(idOrdine, idDettaglio):
    pass

@app.route('/ordini/utenti/<int:idOrdine>/dettagli/<int:idDettaglio>', methods=['DELETE'])
def delete_dettaglio_ordine_utente(idOrdine, idDettaglio):
    pass

# 4. Gestione Prodotti e Catalogo

## Prodotti
@app.route('/prodotti', methods=['GET'])
def get_prodotti():
    pass

@app.route('/prodotti/<int:idProdotto>', methods=['GET'])
def get_prodotto(idProdotto):
    pass

@app.route('/prodotti', methods=['POST'])
def create_prodotto():
    pass

@app.route('/prodotti/<int:idProdotto>', methods=['PUT'])
def update_prodotto(idProdotto):
    pass

@app.route('/prodotti/<int:idProdotto>', methods=['DELETE'])
def delete_prodotto(idProdotto):
    pass

## Associazione Tag/Ingredienti al Prodotto
@app.route('/prodotti/<int:idProdotto>/tags', methods=['POST'])
def add_tag_prodotto(idProdotto):
    pass

@app.route('/prodotti/<int:idProdotto>/tags/<nomeTag>', methods=['DELETE'])
def delete_tag_prodotto(idProdotto, nomeTag):
    pass

@app.route('/prodotti/<int:idProdotto>/ingredienti', methods=['POST'])
def add_ingrediente_prodotto(idProdotto):
    pass

@app.route('/prodotti/<int:idProdotto>/ingredienti/<nomeIngrediente>', methods=['DELETE'])
def delete_ingrediente_prodotto(idProdotto, nomeIngrediente):
    pass

## Gestione Tag
@app.route('/tags', methods=['GET'])
def get_tags():
    pass

@app.route('/tags/<nome>', methods=['GET'])
def get_tag(nome):
    pass

@app.route('/tags', methods=['POST'])
def create_tag():
    pass

@app.route('/tags/<nome>', methods=['PUT'])
def update_tag(nome):
    pass

@app.route('/tags/<nome>', methods=['DELETE'])
def delete_tag(nome):
    pass

## Gestione Ingredienti
@app.route('/ingredienti', methods=['GET'])
def get_ingredienti():
    pass

@app.route('/ingredienti/<nome>', methods=['GET'])
def get_ingrediente(nome):
    pass

@app.route('/ingredienti', methods=['POST'])
def create_ingrediente():
    pass

@app.route('/ingredienti/<nome>', methods=['PUT'])
def update_ingrediente(nome):
    pass

@app.route('/ingredienti/<nome>', methods=['DELETE'])
def delete_ingrediente(nome):
    pass

## Preferiti per Utenti non-studenti
@app.route('/utenti/<idUtente>/preferiti', methods=['GET'])
def get_utenti_preferiti(idUtente):
    pass

@app.route('/utenti/<idUtente>/preferiti', methods=['POST'])
def add_utenti_preferiti(idUtente):
    pass

@app.route('/utenti/<idUtente>/preferiti/<int:idProdotto>', methods=['DELETE'])
def delete_utenti_preferiti(idUtente, idProdotto):
    pass

# 5. Gestione QR Code per il Ritiro Ordini
@app.route('/qrcode/genera', methods=['POST'])
def genera_qrcode():
    pass

@app.route('/qrcode/<token>', methods=['GET'])
def get_qrcode(token):
    pass

@app.route('/qrcode/<token>/ritirato', methods=['PUT'])
def update_qrcode_ritirato(token):
    pass

# 6. Reporting e Statistiche
@app.route('/report/vendite', methods=['GET'])
def report_vendite():
    pass

@app.route('/report/classi', methods=['GET'])
def report_classi():
    pass

@app.route('/report/ordini', methods=['GET'])
def report_ordini():
    pass

# 7. Gestione Utenti per il Bar (UtenteGestione)
@app.route('/gestione/utenti', methods=['GET'])
def gestione_utenti():
    pass

@app.route('/gestione/utenti/<int:id>', methods=['GET'])
def get_gestione_utente(id):
    pass

@app.route('/gestione/utenti', methods=['POST'])
def create_gestione_utente():
    pass

@app.route('/gestione/utenti/<int:id>', methods=['PUT'])
def update_gestione_utente(id):
    pass

@app.route('/gestione/utenti/<int:id>', methods=['DELETE'])
def delete_gestione_utente(id):
    pass

if __name__ == '__main__':
    app.run(debug=True)

    
"""
db

CREATE TABLE Classe (
  nome CHAR(3) PRIMARY KEY
);

CREATE TABLE Studente (
  idStudente VARCHAR(30) PRIMARY KEY,
  mail VARCHAR(50) NOT NULL UNIQUE,
  classe CHAR(3) NOT NULL,
  paninaro BOOLEAN NOT NULL,
  bannato BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (classe) REFERENCES Classe(nome)
);

CREATE TABLE Utente (
  idUtente VARCHAR(30) PRIMARY KEY,
  mail VARCHAR(50) NOT NULL UNIQUE,
  ruolo ENUM('admin', 'terminale', 'prof', 'segreteria') NOT NULL
);

CREATE TABLE Turno (
  n INT,
  data DATE,
  oraInizioOrdine TIME NOT NULL,
  oraFineOrdine TIME NOT NULL,
  oraInizioRitiro TIME NOT NULL,
  oraFineRitiro TIME NOT NULL,
  PRIMARY KEY(n, data)
);

CREATE TABLE OrdineClasse (
  idOrdine INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  nTurno INT NOT NULL,
  classe CHAR(3) NOT NULL,
  lastUpdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confermato BOOLEAN NOT NULL DEFAULT false,
  preparato BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (nTurno, data) REFERENCES Turno(n, data),
  FOREIGN KEY (classe) REFERENCES Classe(nome),
  UNIQUE(data, nTurno, classe)
);

CREATE TABLE OrdineStudente (
  idOrdine INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  nTurno INT NOT NULL,
  lastUpdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user VARCHAR(30) NOT NULL,
  idOrdineClasse INT,
  confermato BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (nTurno, data) REFERENCES Turno(n, data),
  FOREIGN KEY (user) REFERENCES Studente(idStudente),
  FOREIGN KEY (idOrdineClasse) REFERENCES OrdineClasse(idOrdine),
  UNIQUE(data, nTurno, user)
);

CREATE TABLE OrdineUtente (
  idOrdine INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  preparato BOOLEAN NOT NULL DEFAULT false,
  oraRitiro TIME NOT NULL,
  lastUpdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Gestione (
  idGestione INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE Prodotto (
  idProdotto INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  prezzo DECIMAL(5,2) NOT NULL,
  quantita INT NOT NULL,
  descrizione VARCHAR(100) NOT NULL,
  temporaneo BOOLEAN NOT NULL DEFAULT false,
  disponibilita INT NOT NULL DEFAULT 0,
  attivo BOOLEAN NOT NULL DEFAULT true,
  proprietario INT NOT NULL,
  lastUpdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proprietario) REFERENCES Gestione(idGestione)
);

CREATE TABLE Tag (
  nome VARCHAR(20) PRIMARY KEY
);

CREATE TABLE Ingrediente (
  nome VARCHAR(20) PRIMARY KEY
);

CREATE TABLE DettagliOrdineStudente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idOrdineStudente INT NOT NULL,
  idProdotto INT NOT NULL,
  quantita INT NOT NULL,
  preparato BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (idOrdineStudente) REFERENCES OrdineStudente(idOrdine),
  FOREIGN KEY (idProdotto) REFERENCES Prodotto(idProdotto)
);

CREATE TABLE DettagliOrdineUtente (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idOrdineUtente INT NOT NULL,
  idProdotto INT NOT NULL,
  quantita INT NOT NULL,
  preparato BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (idOrdineUtente) REFERENCES OrdineUtente(idOrdine),
  FOREIGN KEY (idProdotto) REFERENCES Prodotto(idProdotto)
);

CREATE TABLE ProdottoTag (
  idProdotto INT,
  tag VARCHAR(20),
  FOREIGN KEY (idProdotto) REFERENCES Prodotto(idProdotto),
  FOREIGN KEY (tag) REFERENCES Tag(nome),
  PRIMARY KEY(idProdotto, tag)
);

CREATE TABLE ProdottoIngrediente (
  idProdotto INT,
  ingrediente VARCHAR(20),
  FOREIGN KEY (idProdotto) REFERENCES Prodotto(idProdotto),
  FOREIGN KEY (ingrediente) REFERENCES Ingrediente(nome),
  PRIMARY KEY(idProdotto, ingrediente)
);

CREATE TABLE QrCode (
  token CHAR(32) NOT NULL UNIQUE PRIMARY KEY,
  idOrdineClasse INT,
  idOrdineUtente INT,
  gestore INT NOT NULL,
  ritirato BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (idOrdineClasse) REFERENCES OrdineClasse(idOrdine),
  FOREIGN KEY (idOrdineUtente) REFERENCES OrdineUtente(idOrdine),
  FOREIGN KEY (gestore) REFERENCES Gestione(idGestione),
  CHECK (
    (idOrdineClasse IS NOT NULL AND idOrdineUtente IS NULL) OR
    (idOrdineClasse IS NULL AND idOrdineUtente IS NOT NULL)
  )
);

CREATE TABLE PreferitiStudente (
  idProdotto INT,
  idUser VARCHAR(30),
  FOREIGN KEY (idProdotto) REFERENCES Prodotto(idProdotto),
  FOREIGN KEY (idUser) REFERENCES Studente(idStudente),
  PRIMARY KEY(idProdotto, idUser)
);

CREATE TABLE PreferitiUtente (
  idProdotto INT,
  idUser VARCHAR(30),
  FOREIGN KEY (idProdotto) REFERENCES Prodotto(idProdotto),
  FOREIGN KEY (idUser) REFERENCES Utente(idUtente),
  PRIMARY KEY(idProdotto, idUser)
);

CREATE TABLE UtenteGestione (
  idUtente INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  idGestione INT NOT NULL,
  FOREIGN KEY (idGestione) REFERENCES Gestione(idGestione)
);






"""