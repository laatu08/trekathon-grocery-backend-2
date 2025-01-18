const express=require('express');
const {pool}=require('../app');
const authenticateJWT=require('../middleware/auth');

const router=express.Router();

router.use(authenticateJWT);


// Get All Notifications for a User
router.get('/', async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark a Notification as Read
router.put('/:id', async (req, res) => {
    const notificationId = req.params.id;

    try {
        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *',
            [notificationId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/notify', (req, res) => {
    const { userId, message } = req.body;

    const io = req.app.get('io');
    const userSockets = req.app.get('userSockets');

    const socketId = userSockets.get(userId);
    if (socketId) {
        io.to(socketId).emit('notification', { message });
        res.status(200).json({ message: 'Notification sent successfully' });
    } else {
        res.status(404).json({ error: 'User not connected' });
    }
});

module.exports = router;
