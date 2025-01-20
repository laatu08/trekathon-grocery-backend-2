const express = require('express');
const router = express.Router();
const { pool } = require('../app'); // Import the database connection
const authenticateJWT = require('../middleware/auth');

// Middleware to ensure only vendors can access these routes
router.use(authenticateJWT);

// Fetch all products for a vendor
router.get('/products', async (req, res) => {
    const vendorId = req.user.id; // Assuming JWT provides user id
    try {
        const result = await pool.query(
            'SELECT * FROM products WHERE vendor_id = $1',
            [vendorId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch a single product by ID
router.get('/products/:id', async (req, res) => {
    const { id } = req.params;
    const vendorId = req.user.id;
    try {
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1 AND vendor_id = $2',
            [id, vendorId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new product
router.post('/products', async (req, res) => {
    const { name, price, image_url, stock, category } = req.body;
    const vendorId = req.user.id;

    try {
        const result = await pool.query(
            `INSERT INTO products (name, price, image_url, stock, category, vendor_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, price, image_url, stock, category, vendorId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update an existing product
router.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, image_url, stock, category } = req.body;
    const vendorId = req.user.id;

    try {
        const result = await pool.query(
            `UPDATE products 
             SET name = $1, price = $2, image_url = $3, stock = $4, category = $5 
             WHERE id = $6 AND vendor_id = $7 RETURNING *`,
            [name, price, image_url, stock, category, id, vendorId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a product
router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    const vendorId = req.user.id;

    try {
        const result = await pool.query(
            'DELETE FROM products WHERE id = $1 AND vendor_id = $2 RETURNING *',
            [id, vendorId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Product not found or unauthorized' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
