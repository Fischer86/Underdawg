import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

// Database initialization
export async function openDb() {
    try {
        const db = await open({
            filename: process.env.DB_PATH || './data/underdawg.sqlite',
            driver: sqlite3.Database
        });

        // Enable foreign keys
        await db.run('PRAGMA foreign_keys = ON');

        // Create tables if they don't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                admin BOOLEAN DEFAULT 0,
                creation DATETIME DEFAULT CURRENT_TIMESTAMP,
                profile_picture TEXT DEFAULT '../public/images/default.png'
            );

            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                date DATETIME NOT NULL,
                poster_url TEXT
            );

            CREATE TABLE IF NOT EXISTS fights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                name1 TEXT NOT NULL,
                name2 TEXT NOT NULL,
                image1 TEXT,
                image2 TEXT,
                weight_class TEXT NOT NULL,
                fight_type INTEGER NOT NULL,
                status TEXT DEFAULT 'scheduled' CHECK(
                    status IN ('scheduled', 'cancelled', 'completed')
                ),
                winner INTEGER DEFAULT 0,
                result TEXT CHECK(
                    result IN (
                        'KO/TKO',
                        'SUBMISSION',
                        'UNANIMOUS_DECISION',
                        'SPLIT_DECISION',
                        'MAJORITY_DECISION',
                        'TECHNICAL_DECISION',
                        'DRAW',
                        'DQ',
                        'NO_CONTEST',
                        'CANCELLED'
                    )
                ),
                winning_round INTEGER,
                modification_reason TEXT,
                date DATETIME NOT NULL,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS parlays (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                fight_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                winner INTEGER NOT NULL,
                result TEXT CHECK(
                    result IN (
                        'KO/TKO',
                        'SUBMISSION',
                        'UNANIMOUS_DECISION',
                        'SPLIT_DECISION',
                        'MAJORITY_DECISION',
                        'TECHNICAL_DECISION',
                        'DRAW',
                        'DQ',
                        'NO_CONTEST',
                        'CANCELLED'
                    )
                ),
                round INTEGER NOT NULL,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                FOREIGN KEY (fight_id) REFERENCES fights(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        return db;
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// User related functions
export async function createUser(db, { username, email, password }) {
    return await db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password]
    );
}

export async function getUserById(db, userId) {
    return await db.get('SELECT * FROM users WHERE id = ?', [userId]);
}

export async function getUserByEmail(db, email) {
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
}

export async function isUserAdmin(db, userId) {
    const user = await db.get('SELECT admin FROM users WHERE id = ?', [userId]);
    return user && user.admin === 1;
}

// Event related functions
export async function getAllEvents(db) {
    return await db.all(`SELECT * FROM events ORDER BY date DESC`);
}

export async function getUpcomingEvents(db) {
    return await db.all(`SELECT * FROM events WHERE date > datetime('now') ORDER BY date ASC`);
}

export async function getEventById(db, eventId) {
    return await db.get('SELECT * FROM events WHERE id = ?', [eventId]);
}

// Fight related functions
export async function getEventFights(db, eventId) {
    return await db.all(`SELECT * FROM fights WHERE event_id = ? AND fight_type != 0 ORDER BY fight_type DESC`, [eventId]);
}

export async function getFightById(db, fightId) {
    return await db.get('SELECT * FROM fights WHERE id = ?', [fightId]);
}

// Parlay related functions
export async function getUserParlays(db, userId) {
    return await db.all(`SELECT * FROM parlays WHERE user_id = ?`, [userId]);
}

export async function makeParlay(db, { userId, eventId, fightId, winner, result, round }) {
    return await db.run(
        'INSERT INTO parlays (event_id, fight_id, user_id, winner, result, round) VALUES (?, ?, ?, ?, ?, ?)',
        [eventId, fightId, userId, winner, result, round]
    );
}

// Function to get recent fights
export async function getRecentFights(db) {
    return await db.all("SELECT * FROM fights ORDER BY date DESC LIMIT 5");
}

// Fonction pour créer la table parlays si elle n'existe pas
export const createParlaysTable = async (db) => {
    await db.exec(`
        CREATE TABLE IF NOT EXISTS parlays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            fight_id INTEGER,
            prediction TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (fight_id) REFERENCES fights(id)
        );
    `);
};

// Appeler cette fonction lors de l'initialisation de votre base de données

export const getRecentEvents = async (db) => {
    return await db.all("SELECT * FROM events WHERE date < ? ORDER BY date DESC", [new Date().toISOString()]);
};

export async function getFightersByFightId(db, fightId) {
    return await db.all("SELECT * FROM fighters WHERE fight_id = ?", [fightId]);
}