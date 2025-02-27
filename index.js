#!/usr/bin/env node

/**
 * Module dependencies.
 */
require("dotenv").config();
var db = require("./config/connection");
var favicon = require('serve-favicon')
var app = require("./app");
var debug = require("debug")("shopping-cart:server");
var http = require("http");




var express = require('express')
// var favicon = require('serve-favicon')
// var path = require('path')

// var app = express()
// app.use(favicon(path.join(__dirname, 'public','images','favicon.ico')))

var port = normalizePort(process.env.PORT || "3000");

// db.connect((err) => {
// 	//connect to database
// 	if (err) console.log("connection error" + err);
// 	else {
// 		server.listen(port, () => {
// 			// console.log("listening for requests");
// 			console.log(`connection established at port ${port}`);
// 		});
// 	}
// });
var server = http.createServer(app);

db.connect()
.then(console.log)
.catch(console.error)
//   .finally(() => client.close())
server.listen(port, () => {
	// console.log("listening for requests");
	console.log(`connection established at port ${port}`)
app.set("port", port);
})
// console.log("environment variable:", process.env.MONGO_URL);
/**
 * Create HTTP server.o
 */


/**
 * Listen on provided port, on all network interfaces.
 */
// console.log("creating port....");
// server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== "listen") {
		throw error;
	}

	var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case "EACCES":
			console.error(bind + " requires elevated privileges");
			process.exit(1);
			break;
		case "EADDRINUSE":
			console.error(bind + " is already in use");
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	var addr = server.address();
	var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
	debug("Listening on " + bind);
}
