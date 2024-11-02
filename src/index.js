import dotenv from 'dotenv';
import express from 'express';
import session from "express-session";
import SQLite3SessionStore from 'connect-sqlite3';
import path from "path";
import { openDb, createParlaysTable } from './models/db.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import flash from 'connect-flash';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Vérification de la présence de SESSION_SECRET
if (!process.env.SESSION_SECRET) {
    console.error('ERROR: SESSION_SECRET manquant dans le fichier .env');
    process.exit(1);
}

// Initialisation de la base de données
let db;
try {
    db = await openDb();
    app.locals.db = db;
} catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
}

// Configuration du stockage des sessions
const SQLiteStore = SQLite3SessionStore(session);
const sessionStore = new SQLiteStore({
    dir: './data',
    db: 'sessions.sqlite'
});

// Configuration du middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'public', 'views'));
app.use(express.static(path.join(process.cwd(), 'public')));

// Configuration des sessions
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    },
    name: 'sessionId'
}));

app.use(flash());

// Middleware utilisateur global
app.use(async (req, res, next) => {
    if (req.session.userId) {
        try {
            const user = await req.app.locals.db.get("SELECT id, username, email FROM users WHERE id = ?", [req.session.userId]);
            if (user) {
                res.locals.user = user;
            } else {
                req.session.destroy();
                return res.redirect('/login');
            }
        } catch (err) {
            console.error('User middleware error:', err);
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
});

// Route pour la racine
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

// Routes
app.use('/', adminRoutes);
app.use('/', userRoutes);

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

const initDb = async () => {
    const db = await openDb();
    await createParlaysTable(db);
    // Autres initialisations...
};

initDb();