/*
 * index.js: Top-level plugin exposing HTTP features in flatiron
 *
 * (C) 2011, Nodejitsu Inc.
 * MIT LICENSE
 *
 */
 
var http = exports;

http.BufferedStream = require('./buffered-stream');
http.HttpStream     = require('./http-stream');
http.ResponseStream = require('./response-stream');
http.RoutingStream  = require('./routing-stream');
http.createServer   = require('./core').createServer;
http.errorHandler   = require('./core').errorHandler;