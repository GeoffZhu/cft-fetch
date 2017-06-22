/**
 * auther: GeoffZhu
 * date: 20170622
 *
 * desc:为http请求做的封装，提供了如下功能
 *
 * 1.提供错误统一弹出钩子,不需要在请求时候一个个的if(resp.status)
 * 2.请求接口统一加loading的钩子
 * 3.提供两种缓存，session，对应sessionStorage， storage对应localStorage
 *
 * Usage:
 * this.$fetch({
 *   url: url, *必填
 *   params: params, *必填
 *   type: POST,
 *   session: true,
 *   storage: false,
 *   hook: true // 有些情况可能并不想触发全局请求钩子函数，把这个属性改为false,
 *   cros: false // 是否为跨域请求
 *   beforeSend () {}, //请求发送前的钩子
 *   afterResponse () {}, //响应成功的钩子
 *   beforeSendAll () {}, //全局请求发送前的钩子， 其中的this指向插件本身，如需使用vue实例上的方法，请用this.$vm
 *   afterResponseAll () {}, //全局响应成功的钩子，其中的this指向插件本身，如需使用vue实例上的方法，请用this.$vm
 *   interceptor (resp) { // 拦截器，请求成功的时候，返回的数据会从拦截器穿过，可以做一些数据过滤
 *     return resp
 *   }
 *   ...
 *   ...
 *   ...
 * }).then((resp) => {
 *   //不需要在这处理resp.status
 * })
 * //这里的.catch也为非必要,除非你想再单独处理错误信息
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = install;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function install(Vue) {
  var INIT_OPTIONS = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var isVueNext = Vue.version.split('.')[0] === '2';
  // const inBrowser = typeof window !== 'undefined'
  if (!isVueNext) {
    console.error(' Need Vue Version > 2.0 ');
  }
  var DEFAULT_OPTION = {
    url: '',
    type: 'GET',
    params: {},
    session: false,
    storage: false,
    hook: true,
    cros: false,
    beforeSend: function beforeSend() {},
    afterResponse: function afterResponse() {},
    beforeSendAll: function beforeSendAll() {},
    afterResponseAll: function afterResponseAll() {},
    interceptor: function interceptor(resp) {
      return resp;
    }
  };
  var OPTIONS = Object.assign(DEFAULT_OPTION, INIT_OPTIONS);

  var vueFetch = {
    $vm: null,
    init: function init(vm) {
      this.$vm = vm;
    },
    start: function start(options) {
      Object.keys(OPTIONS).forEach(function (key) {
        if (options[key] === undefined) {
          options[key] = OPTIONS[key];
        }
      });
      options.hook && options.beforeSendAll(options);
      options.hook && options.beforeSend(options);
      if (options.session) {
        return this.getDataFromSession(options);
      } else if (options.storage) {
        return this.getDataFromSession(options);
      } else {
        return this.preFetch(options);
      }
    },
    preFetch: function preFetch(options) {
      var url = options.url;
      var fetchSetting = {
        method: options.type,
        credentials: options.credentials
      };
      if (options.type === 'GET') {
        var paramStr = Object.keys(options.params).reduce(function (acc, key) {
          return '' + acc + key + '=' + options.params[key] + '&';
        }, '?');
        url = url.concat(paramStr).slice(0, -1);
      } else if (options.type === 'POST') {
        fetchSetting.body = JSON.stringify(options.params);
      }
      if (options.cros) {
        fetchSetting.mode = 'cors';
        // 跨域请求带cookie，需要后端也加上相应请求头
        fetchSetting.credentials = 'include';
      } else {
        fetchSetting.credentials = 'same-origin';
      }
      return this.fetch(url, fetchSetting, options);
    },
    fetch: function fetch(url, setting, options) {
      var _this = this;

      return new Promise(function () {
        var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(resolve, reject) {
          var rawResp, resp;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return window.fetch(url, setting);

                case 2:
                  rawResp = _context.sent;
                  _context.next = 5;
                  return rawResp.json();

                case 5:
                  resp = _context.sent;

                  if (rawResp.status < 400) {
                    resolve(resp);
                  } else {
                    reject(resp);
                  }
                  options.hook && options.afterResponseAll(resp);
                  options.hook && options.afterResponse(resp);

                case 9:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this);
        }));

        return function (_x2, _x3) {
          return _ref.apply(this, arguments);
        };
      }()).then(options.interceptor);
    },
    getDataFromSession: function getDataFromSession(options) {
      var _this2 = this;

      return _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var url, type, content;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                url = options.url;
                type = options.type;
                content = JSON.parse(window.sessionStorage.getItem(type + ':' + url));

                if (content) {
                  _context2.next = 8;
                  break;
                }

                _context2.next = 6;
                return _this2.fetch(options);

              case 6:
                content = _context2.sent;

                content.status && window.sessionStorage.setItem(type + ':' + url, JSON.stringify(content));

              case 8:
                return _context2.abrupt('return', content);

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, _this2);
      }))();
    },
    getDataFromStorage: function getDataFromStorage(options) {
      var _this3 = this;

      return _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var url, type, content;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                url = options.url;
                type = options.type;
                content = JSON.parse(window.localStorage.getItem(type + ':' + url));

                if (content) {
                  _context3.next = 8;
                  break;
                }

                _context3.next = 6;
                return _this3.fetch(options);

              case 6:
                content = _context3.sent;

                content.status && window.localStorage.setItem(type + ':' + url, JSON.stringify(content));

              case 8:
                return _context3.abrupt('return', content);

              case 9:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, _this3);
      }))();
    }
  };

  var VueFetchEventBus = new Vue();
  window.VueFetchEventBus = VueFetchEventBus;
  window.VueFetch = vueFetch.start.bind(vueFetch);
  vueFetch.init(VueFetchEventBus);

  Vue.prototype.$fetch = vueFetch.start.bind(vueFetch);
}