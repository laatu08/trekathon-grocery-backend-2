const express=require('express');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const {pool}=require('../app');


const router=express.Router();


// Register User
router.post('/register',async(req,res)=>{
    const {name,email,password,role}=req.body;
    console.log(name);
    console.log(email);
    console.log(password);
    console.log(role);
    try {
        const hashPassword=await bcrypt.hash(password,10);
        const result=await pool.query(
            'insert into users (name,email,password,role) values ($1,$2,$3,$4) returning id',[name,email,hashPassword,role]
        );

        res.status(201).json({userId:result.rows[0].id});
    } catch (error) {
        res.status(500).json({error:error.message});
    }
});


// Login User
// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, userId: user.id });  // Return userId along with the token
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports=router;