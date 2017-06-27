const _ = require('underscore');

const redis = require('redis').createClient({
    host: process.env.REDIS_HOST || 'localhost', 
    port: 6379,
    retry_strategy
});

function retry_strategy(retryInfo) {
    // If we've been at this for more than 10 seconds
    // kill this process to give Elastic Beanstalk a chance at rebooting us.
    if (retryInfo.total_retry_time > (1000 * 10)) {
        console.log('Fatal error: Lost connection to Redis.');
        process.exit(1);
    }
    // Wait one second between attempts.
    return 1000;
}

const app = require("http").createServer();
const io = require("socket.io")(app, {
    transports: ['websocket']
});

redis.subscribe('plenario_observations');
redis.on('message', (channel, msg) => { 
    let records;
    try {
        records = JSON.parse(msg);
    }
    catch (e) {
        console.log('Could not parse observations: ' + e);
        return;
    }

    // io.sockets.connected gives hash from id to socket for all connected sockets
    const sockets = _.values(io.sockets.connected);
    for (let record of records) {
        for (let s of sockets) {
            s.emit('data', record);
        }
    }
});

app.listen(8081);