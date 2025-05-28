const os = require('os');

const express = require('express');
const bodyParser = require('body-parser');
const errorHandler = require('./app/helpers/error-handler.helper');
const jwt = require('./app/helpers/jwt.helper');
const cors = require('cors');

const http = require('http');
const {socketio} = require('./socket');

const app = express();
const server = http.createServer(app);
socketio.attach(server);

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors());
app.options('*', cors());
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    }
    else {
        next();
    }
});

app.use(jwt.jwt());

const dbConfig = require('./config/database.config');
const mongoose = require('mongoose');

mongoose.connect(dbConfig.url, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('mongodb is connected!');
});

app.use((req, res,next) => {
	// console.log("::::::::::::::::req.body", req.body);
	next();
})
const userRoute = require('./app/routes/user.route');
const chatRoute = require('./app/routes/chat.route');
const statusRoute = require('./app/routes/status.route');
app.use('/users', [userRoute,statusRoute]);
app.use('/chats', chatRoute);
app.use(errorHandler);



function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        return config.address; // returns first non-internal IPv4
      }
    }
  }
  return process.env.HOST; // fallback
}

const HOST = getLocalIP();

// listen for requests
server.listen(process.env.PORT, HOST, () => {
	console.log("Server is listening on "+ HOST +':'+ process.env.PORT);
});

module.exports = server;
