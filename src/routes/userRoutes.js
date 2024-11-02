import express from 'express';
import { requireLogin } from '../middleware.js';
import { getUpcomingEvents, getRecentFights, getUserParlays, getRecentEvents } from '../models/db.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Page de tableau de bord utilisateur
router.get('/dashboard', requireLogin, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const events = await getUpcomingEvents(db);
        const recentFights = await getRecentFights(db);
        const userParlays = await getUserParlays(db, req.session.userId);
        const recentEvents = await getRecentEvents(db);

        res.render('user/dashboard', { events, recentFights, userParlays, recentEvents });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).send('Server error');
    }
});

// Page de connexion utilisateur
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('user/login');
});

// Page d'inscription utilisateur
router.get('/register', (req, res) => {
    res.render('register');
});

// Route pour la page des parlays
router.get('/parlays', requireLogin, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = await db.get("SELECT * FROM users WHERE id = ?", [req.session.userId]);
        const userParlays = await getUserParlays(db, req.session.userId);

        res.render('parlays', { user, userParlays });
    } catch (err) {
        console.error('Error loading parlays:', err);
        res.status(500).send('Server error');
    }
});

// Route pour la page des événements
router.get('/events', requireLogin, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const events = await getUpcomingEvents(db); // Assurez-vous que cette fonction existe
        const recentEvents = await getRecentEvents(db); // Récupérer les événements récents
        res.render('events/events', { events, recentEvents }); // Passer les événements récents à la vue
    } catch (err) {
        console.error('Error loading events:', err);
        res.status(500).send('Server error');
    }
});

// Route pour afficher les détails d'un événement
router.get('/events/:id', requireLogin, async (req, res) => {
    const eventId = req.params.id; // Récupérer l'ID de l'événement

    try {
        const db = req.app.locals.db;
        const event = await db.get("SELECT * FROM events WHERE id = ?", [eventId]); // Récupérer l'événement par ID
        const fights = await db.all("SELECT * FROM fights WHERE event_id = ?", [eventId]); // Récupérer les combats associés à l'événement

        if (!event) {
            return res.status(404).send('Event not found'); // Gérer le cas où l'événement n'existe pas
        }

        res.render('events/eventDetails', { event, fights }); // Rendre la vue avec les détails de l'événement
    } catch (err) {
        console.error('Error loading event details:', err);
        res.status(500).send('Server error');
    }
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
        res.render('user/login', { error: 'Invalid credentials' });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send('Server error');
    }
});

// Autres routes utilisateur...

export default router;