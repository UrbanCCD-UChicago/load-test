const socketClient = require('socket.io-client');
const socket = socketClient('http://localhost:8083', {
    transports: ['websocket']
}).on('error', console.log)

socket.on('poo', console.log).on('poo',console.log);
