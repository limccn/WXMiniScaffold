//index.js
//获取应用实例
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    title: '加载中...', // 状态
    list: [], // 数据列表
    loading: true , // 显示等待框
    valid_date:'',
    update_time:'', // 数据更新时间
    has_msg: false, // 包含消息
    msg: ''
  },

  getDateToString:function(date)
  {
      var date_ = date?date:new Date();
      var year = date_.getFullYear();
      var month = date_.getMonth()+1;
      var day = date_.getDate();
      if(month<10) month = "0"+month;
      if(day<10) day = "0"+day;

      return year+"-"+month+"-"+day;
  },

  getDateTimeToString:function(date)
  {
      var date_ = date?date:new Date();
      var year = date_.getFullYear();
      var month = date_.getMonth()+1;
      var day = date_.getDate();
      if(month<10) month = "0"+month;
      if(day<10) day = "0"+day;

      var hours = date_.getHours();
      var mins = date_.getMinutes();
      var secs = date_.getSeconds();
      var msecs = date_.getMilliseconds();
      if(hours<10) hours = "0"+hours;
      if(mins<10) mins = "0"+mins;
      if(secs<10) secs = "0"+secs;
      if(msecs<10) secs = "0"+msecs;
      return year+"-"+month+"-"+day+" "+hours+":"+mins+":"+secs;
  },
  parseData:function(data) {
    var result = new Array();
    for(var i = 0; i < data.length; i++){
      var item = data[i];
      result[i] = {
        RN:item.RN,
        CODE:item.CODE,
        NAME:item.NAME,
        SBSJ:item.SBSJ.replace(/(\d{2})(\d{2})(\d{2})/mg, '$1:$2'),
        QD:item.QD,
        TL:item.TL,
        TUDE:item.TUDE.length > 32 ? item.TUDE.substr(0, 32) + "...":item.TUDE,
        SJLTP:Math.floor(item.SJLTP / 100000000).toString() + "亿",
        ZLJE:Math.floor(item.ZLJE / 10000).toString() + "万",
        BUY:Math.floor(item.BUY / 10000).toString() + "万",
        SELL:Math.floor(item.SELL / 10000).toString() + "万",
        RATE:item.RATE + "%",
        ZX_ZLJE:Math.floor(item.ZX_ZLJE / 10000).toString() + "万",
        ZX_BUY:Math.floor(item.ZX_BUY / 10000).toString() + "万",
        ZX_SELL:Math.floor(item.ZX_SELL / 10000).toString() + "万",
      };
    }
    return result;
  },

  requestData:function() {
    const _this = this;
    // 拼接请求url
    const url = 'https://quant.show/api/Signal?ttl=0&count=10&_rnd='+Math.random();
    // 请求数据
    wx.request({
      url: url,
      data: {},
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function(res) {
        console.log(res.data);
        var parsed = _this.parseData(res.data);
        if (parsed.length > 0){
          // 赋值
          _this.setData({
            list: parsed,
            loading: false, // 关闭等待框
            update_time:_this.getDateTimeToString(), //更新时间
            has_msg: false, // 包含消息
            msg: ''//消息内容
          })
        }else{
          _this.setData({
            list: [],
            loading: false, // 关闭等待框
            update_time:_this.getDateTimeToString(), //更新时间
            has_msg: true, // 包含消息
            msg: '没有符合条件的数据。'//消息内容
          })
        }
      },
      fail: function() {
        _this.setData({
          list: [],
          loading: false, // 关闭等待框
          has_msg: true, // 包含消息
          msg: '获取服务器数据失败，请尝试刷新页面。'//消息内容
        })
      },
      complete:function(){
        wx.hideNavigationBarLoading() //完成停止加载
        wx.stopPullDownRefresh() //停止下拉刷新
      }
    })
  },

  requestUserData:function(res) {
    const _this = this;
    console.log(res)
    // 拼接请求url
    const url = 'https://quant.show/api/UserInfo?_rnd='+Math.random();
    // 请求数据
    wx.request({
      url: url,
      data: {
        ed:res.detail.encryptedData,
        iv:res.detail.iv,
        sk:app.globalData.userOpenId.sessionkey
      },
      method:"POST",
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function(res) {
        console.log(res.data)
        if(res.data.code == 200){
        }
      }
    })
  },

  requestSubscribe:function(res) {
    const _this = this;
    const openid = res.data.detail.openid
    // 拼接请求url
    const url = 'https://quant.show/api/Subscribe?oid='+openid+'&_rnd='+Math.random();
    // 请求数据
    wx.request({
      url: url,
      data: {
      },
      method:"GET",
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function(res) {
        console.log(res.data)
        if(res.data.code == 200){
          var subscribe = res.data.detail
          app.globalData.userSub = subscribe
          var convert_date = new Date(subscribe.sub_expire * 1000)
          subscribe.sub_expire_date = _this.getDateToString(convert_date)
          // 设置到全局变量
          _this.setData({
            valid_date: subscribe.sub_expire_date ,
          })
        }
      }
    })
  },

  getUserInfo: function(e) {
    //console.log(e)
    const _this = this;
    app.globalData.userInfo = e.detail.userInfo
    if(e.detail.errMsg == "getUserInfo:ok"){
      // 将用户数据送到服务器
      _this.requestUserData(e);
      // 设置用户数据
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    }
    else{
      this.setData({
        hasUserInfo: false,
      })
    }
  },

  onLoad: function () {
    const _this = this;
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = function(res) {
        _this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }

    // 如果没有订阅数据
    if (app.globalData.userSub) {
      this.setData({
        valid_date:app.globalData.userSub.sub_expire_date
      })
    }
    else{
      app.requestUserOpenIdCallBack = function(res) {
        _this.requestSubscribe(res)
      }
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    wx.showNavigationBarLoading();
    this.requestData();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.requestData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
