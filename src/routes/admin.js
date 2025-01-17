const express=require('express');
const {pool}=require('../app');
const authenticateJWT=require('../middleware/auth');


const router=express.Router();

// Middleware for admin authentication
// const authenticateAdmin = (req, res, next) => {
//     if (req.user && req.user.role === 'admin') {
//         next();
//     } else {
//         res.status(403).json({ error: 'Access denied. Admins only.' });
//     }
// };
router.use(authenticateJWT);


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

// Get all vendors
router.get('/vendors', async (req, res) => {
    try {
      // Admin check or ensure proper access control
      const result = await pool.query('SELECT * FROM vendors');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });


// Delete a user
// router.delete('/users/:id',async(req,res)=>{
//     const userId=req.params.id;

//     try {
//         await pool.query('delete from users where id=$1',[userId]);
//         res.json({message:'User deleted successfully'});
//     } catch (error) {
//         res.status(500).json({error:error.message});
//     }
// })


// Edit user details
router.put('/users/:id', async (req, res) => {
    const userId = req.params.id;
    const { name, email, role } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING *',
            [name, email, role, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user (soft delete)
router.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await pool.query(
            'UPDATE users SET is_deleted = true WHERE id = $1 RETURNING *',
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Approve vendor registration
router.put('/vendors/approve/:id', async (req, res) => {
    const vendorId = req.params.id;

    try {
        const result = await pool.query(
            'UPDATE vendors SET is_approved = true WHERE id = $1 RETURNING *',
            [vendorId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Suspend vendor account
router.put('/vendors/suspend/:id', async (req, res) => {
    const vendorId = req.params.id;

    try {
        const result = await pool.query(
            'UPDATE vendors SET is_suspended = true WHERE id = $1 RETURNING *',
            [vendorId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Reactivate vendor account
router.put('/vendors/reactivate/:id', async (req, res) => {
    const vendorId = req.params.id;

    try {
        const result = await pool.query(
            'UPDATE vendors SET is_suspended = false WHERE id = $1 RETURNING *',
            [vendorId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get total sales
router.get('/analytics/total-sales', async (req, res) => {
    try {
        const result = await pool.query('SELECT SUM(total_amount) AS total_sales FROM orders');
        res.json({ totalSales: result.rows[0].total_sales || 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get top-selling products
router.get('/analytics/top-products', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.name, SUM(o.quantity) AS total_quantity 
             FROM order_items o 
             JOIN products p ON o.product_id = p.id 
             GROUP BY p.name 
             ORDER BY total_quantity DESC LIMIT 10`
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get vendor performance
router.get('/analytics/vendor-performance', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT v.business_name AS vendor_name, SUM(o.total_amount) AS total_sales
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id   -- assuming you have an order_items table
             JOIN products p ON oi.product_id = p.id
             JOIN vendors v ON p.vendor_id = v.id
             GROUP BY v.business_name
             ORDER BY total_sales DESC`
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports=router;