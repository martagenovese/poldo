const mysql = require('mysql2/promise');
const { DB } = require('../config/config');


const pool = mysql.createPool(DB);
module.exports = pool;


/*
database structure


CREATE TABLE Classe (
                        nome CHAR(3) PRIMARY KEY
);

CREATE TABLE Utente (
                        idUtente VARCHAR(30) PRIMARY KEY,
                        mail VARCHAR(50) NOT NULL UNIQUE,
                        bannato BOOLEAN NOT NULL DEFAULT false,
                        ruolo ENUM('admin', 'terminale', 'prof', 'segreteria', 'paninaro', 'studente') NOT NULL
);

CREATE TABLE Turno (
                       n INT,
                       giorno VARCHAR(10),
                       oraInizioOrdine TIME NOT NULL,
                       oraFineOrdine TIME NOT NULL,
                       oraInizioRitiro TIME NOT NULL,
                       oraFineRitiro TIME NOT NULL,
                       PRIMARY KEY(n, giorno)
);

CREATE TABLE OrdineClasse (
                              idOrdine INT AUTO_INCREMENT PRIMARY KEY,
                              idResponsabile VARCHAR(30) NOT NULL,
                              data DATE NOT NULL,
                              nTurno INT NOT NULL,
                              giorno VARCHAR(10) NOT NULL,
                              lastUpdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                              confermato BOOLEAN NOT NULL DEFAULT false,
                              preparato BOOLEAN NOT NULL DEFAULT false,
                              oraRitiro TIME NOT NULL,
                              classe CHAR(3) NOT NULL,
                              FOREIGN KEY (nTurno, giorno) REFERENCES Turno(n, giorno),
                              FOREIGN KEY (idResponsabile) REFERENCES Utente(idUtente),
                              FOREIGN KEY (classe) REFERENCES Classe(nome),
                              UNIQUE(data, nTurno, giorno, classe)
);

CREATE TABLE OrdineSingolo (
                               idOrdine INT AUTO_INCREMENT PRIMARY KEY,
                               data DATE NOT NULL,
                               nTurno INT NOT NULL,
                               giorno VARCHAR(10) NOT NULL,
                               confermato BOOLEAN NOT NULL DEFAULT FALSE,
                               lastUpdate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               user VARCHAR(30) NOT NULL,
                               idOrdineClasse INT NOT NULL,
                               FOREIGN KEY (nTurno, giorno) REFERENCES Turno(n, giorno),
                               FOREIGN KEY (user) REFERENCES Utente(idUtente),
                               FOREIGN KEY (idOrdineClasse) REFERENCES OrdineClasse(idOrdine),
                               UNIQUE(data, nTurno, giorno, user)
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

CREATE TABLE DettagliOrdineSingolo (
                                       id INT AUTO_INCREMENT PRIMARY KEY,
                                       idOrdineSingolo INT NOT NULL,
                                       idProdotto INT NOT NULL,
                                       quantita INT NOT NULL,
                                       preparato BOOLEAN NOT NULL DEFAULT false,
                                       FOREIGN KEY (idOrdineSingolo) REFERENCES OrdineSingolo(idOrdine),
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
                        token CHAR(32) PRIMARY KEY,
                        idOrdineClasse INT,
                        gestore INT NOT NULL,
                        ritirato BOOLEAN NOT NULL DEFAULT false,
                        FOREIGN KEY (idOrdineClasse) REFERENCES OrdineClasse(idOrdine),
                        FOREIGN KEY (gestore) REFERENCES Gestione(idGestione)
);

CREATE TABLE Preferiti (
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



*/