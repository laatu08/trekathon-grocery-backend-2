const express=require('express');
const authenticateJWT = require('../middleware/auth');
const {pool} = require('../app.js');


const router=express.Router();
console.log(authenticateJWT);
// console.log(authenticateJWT);

// MiddleWare to Authenticate JWT
router.use(authenticateJWT);


// Fetch all products 
router.get('/',async(req,res)=>{
    try {
        const result=await pool.query('select * from products');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


// Add a Product
router.post('/',async(req,res)=>{
    const {name,price,stock,image_url}=req.body;
    const vendor_id=req.user.id;

    try {
        const result=await pool.query(
            'INsert into products (name,price,vendor_id,stock,image_url) values ($1,$2,$3,$4,$5) returning id',[name,price,vendor_id,stock,image_url]
        );

        res.status(201).json({productId:result.rows[0].id});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


// Update Product
router.put('/:id',async(req,res)=>{
    // const {name,price,stock,image_url}=req.body;
    const {price}=req.body;
    const vendor_id=req.user.id;
    const productId=req.params.id;

    try {
        const result=await pool.query(
            // 'update products set name=$1, price=$2,stock=$3,image_url=$4 where id=$5 and vendor_id=$6 returning id',[name,price,stock,image_url,productId,vendor_id]

            'update products set price=$1 where id=$2 and vendor_id=$3 returning id',[price,productId,vendor_id]
        );

        if(result.rowCount===0){
            return res.status(404).json({ error: 'Product not found or not authorized' });
        }

        // Emit real time price update event
        const updatedProduct=result.rows[0];
        const io=req.app.get('io');
        io.emit('price_updated',updatedProduct);

        // res.json({productId:result.rows[0].id});
        res.json(updatedProduct);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})


// fetch product for a specific vendor
router.get('/vendor',async(req,res)=>{
    const vendor_id=req.user.id

    try {
        const result=await pool.query(
            'select * from products where vendor_id=$1',[vendor_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching vendor products:', error.message);
        res.status(500).json({ error: 'Failed to fetch vendor products.' });
    }
})


// Search route
router.get('/search',async(req,res)=>{
    const {name,category,minPrice,maxPrice,sortBy}=req.query;

    try {
        const query = `SELECT * FROM products WHERE (LOWER(name) LIKE LOWER($1))`;
        //  AND  (LOWER(category) LIKE LOWER($2)) AND (price>=$3) AND (price<=$4) ORDER BY CASE WHEN $5='price_asc' THEN price END ASC, CASE WHEN $5='price_desc' THEN price END DESC

        // const result = await pool.query(query, [`%${name || ''}%`,`%${category || ''}%`,minPrice||null,maxPrice||null,sortBy||null]);
        const result = await pool.query(query, [`%${name || ''}%`]);

        res.json(result.rows);
    } 
    catch (error) {
        console.error('Error searching products:', error.message);
        res.status(500).json({ error: 'Failed to search products.' }); 
    }
})
module.exports = router;