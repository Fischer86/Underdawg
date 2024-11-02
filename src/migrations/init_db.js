import { openDb } from '../models/db.js';

async function initDb() {
    const db = await openDb();

    // Création de la table users
    await db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            admin BOOLEAN DEFAULT 0
        )
    `);

    // Création de la table events
    await db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date DATETIME NOT NULL,
            poster_url TEXT
        )
    `);

    // Création de la table fights
    await db.run(`
        CREATE TABLE IF NOT EXISTS fights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            fighter1_name TEXT NOT NULL,
            fighter2_name TEXT NOT NULL,
            issue INTEGER,
            main_event BOOLEAN DEFAULT 0,
            main_card BOOLEAN DEFAULT 0,
            win_method TEXT,
            winning_round INTEGER,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        )
    `);

    console.log('Tables créées avec succès');
}

initDb().catch(err => {
    console.error('Erreur lors de l\'initialisation de la base de données:', err);
});
