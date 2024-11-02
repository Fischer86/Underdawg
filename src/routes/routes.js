import express from 'express';
import { createUser } from '../models/db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Page de connexion utilisateur
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('user/login');
});

// Traitement de la connexion utilisateur
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    try {
        const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            return res.redirect('/dashboard');
        }
        res.render('/user/login', { error: 'Invalid credentials' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send('Server error');
    }
});

// Page d'inscription utilisateur
router.get('/register', (req, res) => {
    res.render('register');
});

// Traitement de l'inscription utilisateur
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(req.app.locals.db, { username, email, password: hashedPassword });
        res.redirect('/user/login');
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).send('Server error');
    }
});

// Autres routes utilisateur...

export default router;