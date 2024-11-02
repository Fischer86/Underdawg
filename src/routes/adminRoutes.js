import express from 'express';
import { requireAdmin } from '../middleware.js';
import { getAllEvents } from '../models/db.js';
import bcrypt from 'bcrypt';
import { getFightById } from '../models/db.js';
import { getFightersByFightId } from '../models/db.js';

const router = express.Router();

// Page de connexion admin
router.get('/admin/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/admin');
    }
    res.render('admin/admin-login');
});

// Traitement de la connexion admin
router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    const db = req.app.locals.db;

    try {
        if (email !== process.env.ADMIN_EMAIL) {
            return res.render('admin/admin-login', { error: 'Invalid credentials' });
        }

        const user = await db.get("SELECT * FROM users WHERE email = ? AND admin = 1", [email]);
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.isAdmin = true;
            return res.redirect('/admin');
        }
        res.render('admin/admin-login', { error: 'Invalid credentials' });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).render('admin/admin-login', { error: 'Server error' });
    }
});

// Dashboard admin (protégé)
router.get('/admin', requireAdmin, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const events = await getAllEvents(db);
        res.render('admin/admin', { events, messages: req.flash() });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).send('Server error');
    }
});

// Route pour accéder à la page admin
router.get('/admin', requireAdmin, (req, res) => {
    res.render('admin/admin'); // Assurez-vous que cette vue existe
});

// Autres routes pour créer des événements et des combats...

router.post('/add-event', requireAdmin, async (req, res) => {
    const { name, date, poster_url } = req.body;

    // Validation des données
    if (!name || !date) {
        return res.status(400).send('All fields are required');
    }

    try {
        const db = req.app.locals.db;
        await db.run("INSERT INTO events (name, date, poster_url) VALUES (?, ?, ?)", [name, date, poster_url]);
        res.redirect('/admin'); // Rediriger vers la page admin après l'ajout
    } catch (err) {
        console.error('Failed to add event:', err);
        res.status(500).send('Failed to add event');
    }
});

router.post('/add-fight', requireAdmin, async (req, res) => {
    const { event_id, fighter1_name, fighter2_name, fighter1_image_url, fighter2_image_url, weight_class, is_main_event, number_of_rounds, fight_date } = req.body;

    try {
        const db = req.app.locals.db;
        await db.run("INSERT INTO fights (event_id, name1, name2, image1, image2, weight_class, fight_type, rounds, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [event_id, fighter1_name, fighter2_name, fighter1_image_url, fighter2_image_url, weight_class, is_main_event, number_of_rounds, fight_date]);
        
        // Redirige vers le tableau de bord avec un message de succès
        req.flash('success', 'Fight added successfully!'); // Utilisation de connect-flash pour les messages
        res.redirect('/admin'); // Redirige vers le tableau de bord
    } catch (err) {
        console.error('Failed to add fight:', err);
        res.status(500).send('Failed to add fight');
    }
});

// Route pour afficher la page de prédiction
router.get('/parlay/:id', requireAdmin, async (req, res) => {
    const fightId = req.params.id;

    try {
        const db = req.app.locals.db;
        const fight = await getFightById(db, fightId); // Récupérer les détails du combat

        if (!fight) {
            return res.status(404).send('Fight not found');
        }

        // Passer les informations des combattants directement à la vue
        const fighters = [
            {
                name: fight.name1,
                image_url: fight.image1
            },
            {
                name: fight.name2,
                image_url: fight.image2
            }
        ];

        const numberOfRounds = fight.rounds; // Récupérer le nombre de rounds

        res.render('parlay', { fightId: fightId, fight: fight, fighters: fighters, numberOfRounds: numberOfRounds }); // Rendre le fichier parlay.ejs
    } catch (err) {
        console.error('Error fetching fight details:', err);
        res.status(500).send('Server error');
    }
});

export default router;