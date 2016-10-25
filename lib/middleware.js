var Payment = require('./payment').Payment;
var util = require('util');

var getRawBody = function (req, callback) {
  if (req.rawBody) {
    return callback(null, req.rawBody);
  }

  var data='';
  req.setEncoding('utf8');
  req.on('data', function(chunk) {
    data += chunk;
  });

  req.on('end', function() {
    req.rawBody = data;
    callback(null, data);
  });
};

/**
 * 中间件基础类
 * @class Handler
 * @constructor
 * @param {String} partnerKey
 * @param {String} appId
 * @param {String} mchId
 * @param {String} notifyUrl
 * @param {String} pfx appkey
 * @chainable
 */
function Handler(config, handle) {
  this.setPayment(config);
  this.setHandle(handle);
  return this;
}

/**
 * 完成中间件配置，并返回中间件
 * @return {Function} 中间件
 */
Handler.prototype.middlewarify = function () {
  var self = this;
  if (!this.handle) {
    throw new Error('miss handle');
  }
  return function (req, res, next) {
    var payment = req.payment || req.wechatPayment || self.payment;
    if (req.method !== 'POST') {
      var error = new Error();
      error.name = 'NotImplemented';
      return self.fail(error, req, res);
    }
    getRawBody(req, function (err, rawBody) {
      if (err) {
        err.name = 'BadMessage' + err.name;
        return self.fail(err, req, res);
      }
      payment.validate(rawBody, function(err, message){
        res.reply = function(data){
          if (data instanceof Error) {
            self.fail(data, req, res);
          } else {
            self.success(data, req, res);
          }
        };

        if (err) {
          return self.fail(err, req, res);
        }

        req.wechatPaymentMessage = req.message = message;

        if (self.getNotify) {
          self.handle(message, req, res, next);
        } else {
          self.handle(req, res, next);
        }
      });
    });
  };
};

Handler.prototype.success = function (result, req, res) {
  var payment = req.payment || req.wechatPayment || self.payment;
  return res.end(payment.buildXml({
    return_code: 'SUCCESS',
    return_msg: result
  }));
};

Handler.prototype.fail = function (err, req, res) {
  var payment = req.payment || req.wechatPayment || self.payment;
  return res.end(payment.buildXml({
    return_code: 'FAIL',
    return_msg: err.name
  }));
};

Handler.prototype.setHandle = function (handle) {
  if (typeof handle === 'function') {
    this.handle = handle;
  }
};

Handler.prototype.setPayment = function (config) {
  if (config instanceof Payment) {
    this.payment = config;
  } else {
    this.payment = new Payment(config);
  }
};

var middleware = function (config, handle) {
  if (typeof config === 'function') {
    handle = config;
    config = {};
  }

  if (!handle) {
    return {
      getNotify: util.deprecate(function () {
        var handler = new Handler(config);
        handler.done = function (handle) {
          this.getNotify = true;
          this.setHandle(handle);
          return this.middlewarify();
        };
        return handler;
      }, '"middleware(config).getNotify().done(handle)" deprecated, use middleware(config, handle)')
    };
  }

  if (handle instanceof Handler) {
    handle.setPayment(config);
    return handle.middlewarify();
  } else {
    return new Handler(config, handle).middlewarify();
  }
};

middleware.Handler = middleware.Notify = Handler;

module.exports = middleware;
