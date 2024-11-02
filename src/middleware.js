import { isUserAdmin } from './models/db.js';

export const requireAdmin = async (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    try {
        const isAdmin = await isUserAdmin(req.app.locals.db, req.session.userId);
        if (!isAdmin) {
            return res.status(403).send('Access denied: Admin privileges required');
        }
        next();
    } catch (err) {
        console.error('Admin check error:', err);
        res.status(500).send('Server error');
    }
};

export const requireLogin = async (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    try {
        const user = await req.app.locals.db.get("SELECT id, username, email FROM users WHERE id = ?", [req.session.userId]);
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }
        res.locals.user = user;
        next();
    } catch (err) {
        console.error('User check error:', err);
        res.status(500).send('Server error');
    }
};