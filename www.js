'use strict';

const app = require('./server');
const http = require('http');

/*** START THE SERVER ***/

const port = process.env.PORT || 3000;
app.set('port', port);
const server = http.createServer(app);

server.listen(port);

/*** HANDLE EVENTS ***/

server.on('listening', () => {
    console.log(`Listening on port ${server.address().port}`);
});

server.on('error', error => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    // handle specific listening errors with friendly messages
    switch (error.code) {
        case 'EACCESS':
            console.error(`Port ${port} requires elevated privileges`);
            break;
        case 'EADDRINUSE':
            console.error(`Port ${port} is already in use`);
            break;
        default:
            throw error;
    }
});

module.exports = server; // for testing
