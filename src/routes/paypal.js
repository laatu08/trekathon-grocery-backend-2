const express=require('express');
const router=express.Router();

const client=require('../utils/paypal');
const {pool}=require('../app');
const authenticateJWT=require('../middleware/auth');
const paypal=require('@paypal/checkout-server-sdk')

router.use(authenticateJWT);

// Create Paypal Order
router.post('/create-order',async(req,res)=>{
    const {totalAmount}=req.body;
    
    const request=new paypal.orders.OrdersCreateRequest();

    request.requestBody({
        intent:'CAPTURE',
        purchase_units:[
            {
                amount:{
                    currency_code:"USD",
                    value:totalAmount.toFixed(2),
                }
            }
        ]
    })

    try {
        const order=await client.execute(request);
        res.json({id:order.result.id});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


const createNotification = async (userId, message) => {
    try {
        await pool.query(
            'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
            [userId, message]
        );

        // Emit notification to the specific user via WebSocket
        const io = req.app.get('io');
        io.emit(`notification:${userId}`, { message });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Capture and Create Order with PayPal Payment
router.post('/capture-order', async (req, res) => {
    const { orderId } = req.body; // PayPal order ID
    const { items, totalAmount } = req.body; // Order items and total amount

    const userId = req.user.id;  // Assuming the user is authenticated via JWT

    try {
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        // Capture the PayPal payment
        const capture = await client.execute(request);

        // Store order details in the database after successful capture
        const { id, status } = capture.result;

        // Begin transaction to insert order and order items in the database
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert the order into the `orders` table
            const orderResult = await client.query(
                'INSERT INTO orders (customer_id, total_amount, paypal_order_id, status) VALUES ($1, $2, $3, $4) RETURNING id',
                [userId, totalAmount, id, status]
            );

            const orderIdDb = orderResult.rows[0].id;

            // Insert order items into the `order_items` table
            const orderItemsPromises = items.map(item => {
                return pool.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [orderIdDb, item.product_id, item.quantity, item.price]
                );
            });

            // Update product stock based on the quantity in the order
            const stockUpdatePromises = items.map(item => {
                return pool.query(
                    'UPDATE products SET stock = stock - $1 WHERE id = $2',
                    [item.quantity, item.product_id]
                );
            });

            // Execute all insertions and stock updates in parallel
            await Promise.all([...orderItemsPromises, ...stockUpdatePromises]);

            await client.query('COMMIT');  // Commit the transaction

            await createNotification(userId, 'Your payment was successful!');

            res.status(201).json({
                message: 'Payment captured successfully, order created!',
                orderId: orderIdDb,  // Send the newly created order ID
                paypal_order_id: id  // Send PayPal order ID to frontend
            });
        } catch (error) {
            await client.query('ROLLBACK');  // Rollback in case of error
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports=router;