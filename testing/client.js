// const {io}=require('socket.io-client');

// // Connect to websocket server
// const socket=io('http://localhost:5000');

// socket.on('connect',()=>{
//     console.log('Client connected to server: ',socket.id);
// })

// // Listen for price update events
// socket.on('price_updated',(data)=>{
//     console.log('Price Updated: ',data);
// })

// // Handle Disconnection
// socket.on('disconnect',()=>{
//     console.log('Disconnected from server');
// })