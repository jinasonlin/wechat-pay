var Payment = require('./payment').Payment;

var URLS = {
  TRANSFERS: "https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers",
  GET_TRANSFER_INFO: "https://api.mch.weixin.qq.com/mmpaymkttransfers/gettransferinfo"
};

var util = require('util');

var Transfer = function (config) {
  Payment.call(this, config);
};

util.inherits(Transfer, Payment);

Transfer.prototype.sendTransfer = function (params, callback) {
  var requiredData = ['mch_appid', 'partner_trade_no', 'openid',
    'check_name', 'amount', 'desc', 'spbill_create_ip'];
  if (!params.check_name) {
    params.check_name = 'NO_CHECK';
  }
  this._signedQuery(URLS.TRANSFERS, params, {
    https: true,
    params: [
      'appid',
      'mchid',
      'nonce_str'
    ],
    required: requiredData
  }, callback);
};

Transfer.prototype.getTransfers = function (params, callback) {
  var requiredData = ['appid', 'partner_trade_no'];
  this._signedQuery(URLS.GET_TRANSFER_INFO, params, {
    https: true,
    required: requiredData
  }, callback);
};

exports.Transfer = Transfer;
