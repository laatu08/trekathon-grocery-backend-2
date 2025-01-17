const express=require('express');
const {pool}=require('../app');

const router=express.Router();

// Middleware for admin authentication
const authenticateAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admins only.' });
    }
};

// Get all users
router.get('/users',async(req,res)=>{
    try {
        const result=await pool.query('select id,name,email,role from users');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
})


// Get all orders
router.get('/orders',async(req,res)=>{
    try {
        const result=await pool.query('select * from orders');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
})


// Get all product
router.get('/products',async(req,res)=>{
    try {
        const result=await pool.query('select * from products');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({error:error.message});
    }
})


// Delete a user
router.delete('/users/:id',async(req,res)=>{
    const userId=req.params.id;

    try {
        await pool.query('delete from users where id=$1',[userId]);
        res.json({message:'User deleted successfully'});
    } catch (error) {
        res.status(500).json({error:error.message});
    }
})




module.exports=router;