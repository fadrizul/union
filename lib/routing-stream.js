/*
 * routing-stream.js: A Stream focused on connecting an arbitrary RequestStream and
 * ResponseStream through a given Router.
 *
 * (C) 2011, Nodejitsu Inc.
 * MIT LICENSE
 *
 */
 
var util = require('util'),
    RequestStream = require('./request-stream'),
    ResponseStream = require('./response-stream');

//
// ### function RequestStream (options) 
// 
//  
var RoutingStream = module.exports = function (options) {
  options = options || {};
  RequestStream.call(this, options);
  
  this.before = options.before || [];
  this.after = options.after || [];
  this.response = options.response || options.res;
  this.target = new ResponseStream({ 
    response: this.response
  });
  
  this.once('pipe', this.route);
};

util.inherits(RoutingStream, RequestStream);

//
// Called when this instance is piped to **by another stream**
//
RoutingStream.prototype.route = function (req) {
  //
  // When a `RoutingStream` is piped to:
  //
  // 1. Setup the pipe-chain between the `after` middleware, the abstract response
  //    and the concrete response. 
  // 2. Attempt to dispatch to the `before` middleware, which represent things such as 
  //    favicon, static files, application routing. 
  // 3. If no match is found then pipe to the 404Stream
  //
  var self = this,
      after,
      error,
      i;
      
  //
  // Don't allow `this.target` to be writable on HEAD requests
  //
  this.target.writable = req.method !== 'HEAD';
  
  //
  // 1. Setup the pipe-chain between the `after` middleware, the abstract response
  //    and the concrete response. 
  //
  after = [this.target].concat(this.after, this.response);
  for (i = 0; i < after.length - 1; i++) {
    after[i].pipe(after[i + 1]);
    after[i].on('error', this.onError);
  }
  
  //
  // Helper function for dispatching to the 404 stream.
  //
  function notFound() {
    error = new Error('Not found');
    error.status = 404;
    self.onError(error);
  }
  
  //
  // 2. Attempt to dispatch to the `before` middleware, which represent things such as 
  //    favicon, static files, application routing. 
  //
  (function dispatch(i) {
    if (self.target.modified) {
      return;
    }
    else if (++i === self.before.length) {
      //
      // 3. If no match is found then pipe to the 404Stream
      //
      return notFound();
    }

    self.target.once('next', dispatch.bind(null, i));
    
    if (self.before[i].length === 3) {
      self.before[i](self, self.target, function () {
        self.target.emit('next');
      });
    }
    else {
      self.before[i](self, self.target);
    }
  })(-1);  
};

RoutingStream.prototype.onError = function (err) {
  this.emit('error', err);
};