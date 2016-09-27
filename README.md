# 微信支付 for Nodejs

## 初始化
```js
var Payment = require('wechat-pay').Payment;
var initConfig = {
  partnerKey: "<partnerkey>",
  appId: "<appid>",
  mchId: "<mchid>",
  notifyUrl: "<notifyurl>",
  pfx: fs.readFileSync("<location-of-your-apiclient-cert.p12>")
};
var payment = new Payment(initConfig);
```
所有参数都不是必须的，不过这样配置最省事。实际调用时候的参数若有同名会覆盖。

## 付个钱
```javascript
var order = {
  body: '吮指原味鸡 * 1',
  attach: '{"部位":"三角"}',
  out_trade_no: 'kfc' + (+new Date),
  total_fee: 10 * 100,
  spbill_create_ip: req.ip,
  openid: req.user.openid,
  trade_type: 'JSAPI'
};

payment.getBrandWCPayRequestParams(order, function(err, payargs){
  res.json(payargs);
});
```

注：   
1. 页面的路径需要位于`支付授权目录`下   
2. 由于每次呼出支付界面，无论用户是否支付成功，out_trade_no 都会失效（OUT_TRADE_NO_USED），所以这里使用timestamp保证每次的id不同。业务逻辑中应该自行维护之   


__前端通过__
```javascript
WeixinJSBridge.invoke('getBrandWCPayRequest', payargs, function(res){
  if(res.err_msg == "get_brand_wcpay_request:ok"){
    alert("支付成功");
    // 这里可以跳转到订单完成页面向用户展示
  }else{
    alert("支付失败，请重试");
  }
});
```
来呼出微信的支付界面（JS-SDK http://mp.weixin.qq.com/wiki/11/74ad127cc054f6b80759c40f77ec03db.html#.E5.8F.91.E8.B5.B7.E4.B8.80.E4.B8.AA.E5.BE.AE.E4.BF.A1.E6.94.AF.E4.BB.98.E8.AF.B7.E6.B1.82）   

## 接收微信付款确认请求
```javascript
var middleware = require('wechat-pay').middleware;
app.use('<notifyUrl>', middleware(initConfig, function(req, res, next) {
  var openid = req.message.openid;
  var order_id = req.message.out_trade_no;

  /**
   * 查询订单，在自己系统里把订单标为已处理
   * 如果订单之前已经处理过了直接返回成功
   */
  res.reply('success');

  /**
   * 有错误返回错误，不然微信会在一段时间里以一定频次请求你
   * res.reply(new Error('...'))
   */
}));
```

## 退个款
```javascript
payment.refund({
  out_trade_no: "kfc001",
  out_refund_no: 'kfc001_refund',
  total_fee: 10 * 100,
  refund_fee: 10 * 100
}, function(err, result){
  /**
   * 微信收到正确的请求后会给用户退款提醒
   * 这里一般不用处理，有需要的话有err的时候记录一下以便排查
   */
});
```

## 查询历史订单
```javascript
payment.downloadBill({
  bill_date: "20140913",
  bill_type: "ALL"
}, function(err, data){
  // 账单列表
  var list = data.list;
  // 账单统计信息
  var stat = data.stat;
});
```

## 红包
```
var RedPack = require('wechat-pay').RedPack;
var initConfig = {
  partnerKey: "<partnerkey>",
  appId: "<appid>",
  mchId: "<mchid>",
  notifyUrl: "<notifyurl>",
  pfx: fs.readFileSync("<location-of-your-apiclient-cert.p12>")
};
var redpack = new RedPack(initConfig);

redpack.sendRedPack({
  mch_billno: 'billno',
  wxappid: 'appid',
  send_name: 'name',
  re_openid: 'openid',
  total_amount: 40,
  wishing: 'wishing',
  act_name: '红包祝福语',
  remark: '备注信息',
  client_ip: '192.168.0.1'
}, function (err, result) {
  // todo
});
```

## 企业付款
```
var Transfer = require('wechat-pay').Transfer;
var initConfig = {
  partnerKey: "<partnerkey>",
  appId: "<appid>",
  mchId: "<mchid>",
  notifyUrl: "<notifyurl>",
  pfx: fs.readFileSync("<location-of-your-apiclient-cert.p12>")
};
var transfer = new Transfer(initConfig);

transfer.sendTransfer({
  mch_appid: 'appid',
  partner_trade_no: 'billno',
  openid: 'openid',
  amount: 100,
  desc: 'desc',
  spbill_create_ip: '192.168.0.1'
}, function (err, result) {
  // todo
});
```

## TODO

## 错误处理

在回调的Error上的以name做了区分，有需要可以拿来做判断

* ProtocolError 协议错误，看看有没有必须要传的参数没传
* BusinessError 业务错误，可以从返回的data里面看看错误细节
