const express=require('express');
const {pool}=require('../app');
const authenticateJWT=require('../middleware/auth');


const router=express.Router();


// Place Order
router.post('/',authenticateJWT,async(req,res)=>{
    const {products,total_amount,razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body;

    try {
        const result=await pool.query(
            'insert into transactions (customer_id,products,total_amount,status,razorpay_order_id,razorpay_payment_id,razorpay_signature) values ($1,$2,$3,$4,$5,$6,$7) returning id',[req.user.id,JSON.stringify(products),total_amount,'completed',razorpay_order_id,razorpay_payment_id,razorpay_signature]
        );

        res.status(201).json({transactionId:result.rows[0].id});
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get Transaction History
router.get('/',authenticateJWT,async(req,res)=>{
    try {
        const result=await pool.query('Select * from transactions where customer_id=$1',[req.user.id]);
        res.json(result.rows);
    } 
    catch (error) {
        res.status(500).json({ error: error.message });  
    }
});


module.exports=router;