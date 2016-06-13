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
      return self.fail(error, res);
    }
    getRawBody(req, function (err, rawBody) {
      if (err) {
        err.name = 'BadMessage' + err.name;
        return self.fail(err, res);
      }
      payment.validate(rawBody, function(err, message){
        res.reply = function(data){
          if (data instanceof Error) {
            self.fail(data, res);
          } else {
            self.success(data, res);
          }
        };

        if (err) {
          return self.fail(err, res);
        }

        req.wechatPaymentMessage = req.message = message;

        self.handle(req, res, next);
      });
    });
  };
};


Handler.prototype.success = function (result, res) {
  return res.end(this.payment.buildXml({
    return_code: 'SUCCESS',
    return_msg: result
  }));
};

Handler.prototype.fail = function (err, res) {
  return res.end(this.payment.buildXml({
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
    throw new Error('need handle');
  }

  if (handle instanceof Handler) {
    handle.setPayment(config);
    return handle.middlewarify();
  } else {
    return new Handler(config, handle).middlewarify();
  }
};

middleware.Handler = Handler;

module.exports = middleware;
