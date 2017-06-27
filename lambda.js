/**
 * Imports and constants
 */

//@ts-check
exports.handler = handler;

const _ = require('underscore');

/* Make sure all io-performing libraries return promises */
const Promise = require('bluebird');
// https://aws.amazon.com/blogs/developer/support-for-promises-in-the-sdk/
const aws = require('aws-sdk');
aws.config.setPromisesDependency(Promise);
// https://github.com/NodeRedis/node_redis#promises
const redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);

/* Constants and config */
// const FIREHOSE_STREAM_NAME = 'DatabaseStream';
const REDIS_CHANNEL_NAME = 'plenario_observations';
const REDIS_ENDPOINT = process.env.REDIS_ENDPOINT || 'localhost';

/**
 * Per-invocation logic
 */

/**
 * Implementation of required handler for an incoming batch of kinesis records.
 * http://docs.aws.amazon.com/lambda/latest/dg/with-kinesis-example-deployment-pkg.html#with-kinesis-example-deployment-pkg-nodejs
 */
function handler(event, context, callback) {
    // Decode and format the incoming records,
    const records = event.Records.map(decode)
    // and discard the ones we can't parse.
    .filter(Boolean);
    
    const redisClient = redis.createClient({
        host: REDIS_ENDPOINT, 
        port: 6379
    });
    redisClient.publishAsync(REDIS_CHANNEL_NAME, JSON.stringify(records))
    // Claim victory...
    .then(results => {
        // pushToSocketServer resolves with number of observations published
        const msg = `Published ${records.length} records`;
        callback(null, msg)
    })
    // or propagate the error.
    .catch(callback);
    
}

function decode(record) {
    let data;
    try {
        data = Buffer.from(record.kinesis.data, 'base64').toString();
        const parsed = JSON.parse(data);
        return parsed;
    } catch (e) {
        console.log(`Could not decode ${data}: ${e.toString()}`);
        return false;
    }
}