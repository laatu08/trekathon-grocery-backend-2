const express=require('express');
const {pool}=require('../app');
const authenticateJWT=require('../middleware/auth');

const router=express.Router();

router.use(authenticateJWT);


// fetch customer order
router.get('/customer',async(req,res)=>{
    const customerId=req.user.id;

    try {
        const result = await pool.query(
            `SELECT o.id, o.total_amount, o.paypal_order_id, o.status, o.created_at, 
                    json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) AS items
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             WHERE o.customer_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [customerId]
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


router.get('/vendor', async (req, res) => {
    const vendorId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT o.id, o.total_amount, o.paypal_order_id, o.status, o.created_at, 
                    json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) AS items
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id
             JOIN products p ON oi.product_id = p.id
             WHERE p.vendor_id = $1
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [vendorId]
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.put('/:id/status', async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    try {
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, orderId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports=router;