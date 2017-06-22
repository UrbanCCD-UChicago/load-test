"use strict";

var _ = require('underscore');

const redis = require('redis').createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379
});

const app = require("http").createServer();
const io = require("socket.io")(app, {
    transports: ['websocket']
});

app.listen(8083);

redis.subscribe('plenario_observations');
redis.on('message', (channel, msg) => {
    let parsed;
    try {
        parsed = JSON.parse(msg);
        for (let msg of parsed) {
            broadcast(msg)
        }
    }
    catch(e) {
        broadcast(msg)
    }

});

function broadcast(msg) {
    console.log('Emitting ' + msg);
    // console.log(io.sockets.connected);
    for (let socket of _.values(io.sockets.connected)) {
        console.log(socket.id);
        socket.emit('poo', msg);
    }
}

setInterval(() => broadcast('hola'), 1000);
