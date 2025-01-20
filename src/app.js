const dotenv=require('dotenv');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const http=require('http');
const socketIo=require('socket.io');


const {Pool} = require('pg');

// const productRoutes=require('./routes/products.js');
// const authRoutes=require('./routes/auth.js');

dotenv.config();

// App Initialization
const app=express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Wrap the express app with HTTP Server
const server=http.createServer(app);

// Initialize Socket.io
const io=socketIo(server,{
    cors:{
        origin:'*',
        methods:['GET','POST'],
    },
});

const userSockets=new Map();
// Store Active Socket Connection
io.on('connection',(socket)=>{
    console.log('A user connected at web socket: ',socket.id);

    // Listen for a custom event to register user
    socket.on('register', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} is registered with socket ID ${socket.id}`);
    });

    socket.on('disconnect',()=>{
        console.log('A user disconnected at web socket: ',socket.id); //small typo here in commit 3

        // Remove user from map on disconnect
        for (const [userId, sockId] of userSockets.entries()) {
            if (sockId === socket.id) {
                userSockets.delete(userId);
                console.log(`User ${userId} is unregistered`);
                break;
            }
        }
    });
});

// Expose the io instance globally
app.set('io',io);

// Database Connection
const pool = new Pool({
    connectionString:process.env.DATABASE_URL,
});
pool.connect()
    .then(()=>{console.log('Connected to Database');})
    .catch(err=>{console.log(`Connection Error: ${err.stack}`);});


// Test Route
app.get('/',(req,res)=>{
    res.send("API is Running !");
})




// Start Server
const PORT=process.env.PORT||5000;
server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
    console.log("Happing Coding");
})


module.exports = {pool};

const productRoutes=require('./routes/products.js');
const authRoutes=require('./routes/auth.js');
const paymentRoutes=require('./routes/payments.js');
const transactionRoutes=require('./routes/transactions.js');
const cartRoutes=require('./routes/cart.js');
const paypalRoutes=require('./routes/paypal.js')
const orderRoutes=require('./routes/orders.js');
const adminRoutes=require('./routes/admin.js');
const notifyRoutes=require('./routes/notify.js');
const vendorRoutes=require('./routes/vendors.js');

app.use('/auth',authRoutes);

app.use('/products',productRoutes);

app.use('/payments',paymentRoutes);

app.use('/transactions',transactionRoutes);

app.use('/cart',cartRoutes);

app.use('/paypal',paypalRoutes);

app.use('/orders',orderRoutes);

app.use('/admin',adminRoutes);

app.use('/notification',notifyRoutes);

app.use('/vendor',vendorRoutes);