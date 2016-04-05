var Payment = require('./payment').Payment;

var URLS = {
  REDPACK_URL: "https://api.mch.weixin.qq.com/mmpaymkttransfers/sendredpack",
  GROUPREDPACK_URL: "https://api.mch.weixin.qq.com/mmpaymkttransfers/sendgroupredpack"
};

// var RedPack = function (config) {
//   return new Payment(config);
// };

var util = require('util');

var RedPack = function (config) {
  Payment.call(this, config);
};

util.inherits(RedPack, Payment);

RedPack.prototype.sendRedPack = function (params, callback) {
  var requiredData = ['mch_billno', 'wxappid', 'send_name', 're_openid',
    'total_amount', 'wishing', 'client_ip', 'act_name', 'remark'];
  params.total_num = 1;
  this._signedQuery(URLS.REDPACK_URL, params, {
    https: true,
    required: requiredData
  }, callback);
};

RedPack.prototype.sendGroupRedPack = function (params, callback) {
  var requiredData = ['mch_billno', 'wxappid', 'send_name', 're_openid',
    'total_amount', 'total_num', 'amt_type', 'wishing', 'act_name', 'remark'];
  params.amt_type = 'ALL_RAND';
  this._signedQuery(URLS.GROUPREDPACK_URL, params, {
    https: true,
    required: requiredData
  }, callback);
};

exports.RedPack = RedPack;
