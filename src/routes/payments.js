const express=require('express');
const razorpay=require('../utils/razorpay');
const authenticateJWT=require('../middleware/auth');

const router=express.Router();

// Generate Razor Pay Order
router.post('/create-order',authenticateJWT,async(req,res)=>{
    const {amount,currency='INR'}=req.body;

    try {
        const options={
            amount:amount*100,
            currency,
            receipt:`receipt_${Date.now()}`,
        };

        const order=await razorpay.orders.create(options);
        res.json(order);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Verify Payment Signature
router.post('/verify',authenticateJWT,async(req,res)=>{
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body;

    const crypto=require('crypto');
    const hash=crypto.createHmac('sha256',process.env.RAZORPAY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');

    if(hash===razorpay_signature){
        res.json({success:true});
    }
    else{
        res.status(400).json({error:'Invalid payment signature'});
    }
});


module.exports=router;