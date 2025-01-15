const express=require('express');
const authenticateJWT = require('../middleware/auth');
const {pool}=require('../app');

const router=express.Router();

// Middleware to authenticate JWT
router.use(authenticateJWT);


// get cart items
router.get('/',async(req,res)=>{
    const customer_id=req.user.id;

    try {
        const result=await pool.query(`select c.id,c.quantity,p.name,p.price,p.image_url from cart c join products p on c.product_id=p.id where c.customer_id=$1`,[customer_id]);

        if (result.rowCount === 0) {
            console.error('No cart items found for customer_id:', customer_id); // Debug
            return res.status(404).json({ error: 'Cart Item not found' });
        }

        console.log(result.rows);
        res.json(result.rows);
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
})


// Add product to cart
router.post('/',async(req,res)=>{
    const {product_id,quantity}=req.body;
    const customer_id=req.user.id;

    try {
        const result=await pool.query(`insert into cart(customer_id,product_id,quantity) values ($1,$2,$3) returning *`,[customer_id,product_id,quantity]);

        res.status(201).json(result.rows[0]);
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
})


// update quantity
router.put('/:id',async(req,res)=>{
    const {quantity}=req.body;
    const cartId=req.params.id;

    try {
        const result=await pool.query(`update cart set quantity=$1, updated_at=CURRENT_TIMESTAMP where id=$2 returning *`,[quantity,cartId]);

        if(result.rowCount===0){
            return res.status(404).json({error:'Cart Item not found'});
        }

        res.json(result.rows[0]);
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
})


// Delete item
router.delete('/:id',async(req,res)=>{
    const cardId=req.params.id;

    try {
        const result=await pool.query(`delete from cart where id=$1 returning *`,[cardId]);

        if(result.rowCount===0){
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.json(result.rows[0]);
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
})


module.exports=router;