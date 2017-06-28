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
'use strict'
export default function install(Vue, INIT_OPTIONS = {}) {
  const isVueNext = Vue.version.split('.')[0] === '2'
  // const inBrowser = typeof window !== 'undefined'
  if (!isVueNext) {
    console.error(' Need Vue Version > 2.0 ')
  }
  const DEFAULT_OPTION = {
    url: '',
    type: 'GET',
    params: {},
    session: false,
    storage: false,
    hook: true,
    cros: false,
    beforeSend () {},
    afterResponse () {},
    beforeSendAll () {},
    afterResponseAll () {},
    interceptor (resp) {
      return resp
    }
  }
  const OPTIONS = Object.assign(DEFAULT_OPTION, INIT_OPTIONS)

  let vueFetch = {
    $vm: null,
    init(vm) {
      this.$vm = vm
    },
    start(options) {
      Object.keys(OPTIONS).forEach(key => {
        if (options[key] === undefined) {
          options[key] = OPTIONS[key]
        }
      })
      options.hook && options.beforeSendAll.call(vueFetch, options)
      options.hook && options.beforeSend.call(vueFetch, options)
      if (options.session) {
        return this.getDataFromSession(options)
      } else if (options.storage) {
        return this.getDataFromSession(options)
      } else {
        return this.preFetch(options)
      }
    },
    preFetch(options) {
      let url = options.url
      let fetchSetting = {
        method: options.type,
        credentials: options.credentials
      }
      if (options.type === 'GET') {
        let paramStr = Object.keys(options.params).reduce((acc, key) => `${acc}${key}=${options.params[key]}&`, '?')
        url = url.concat(paramStr).slice(0, -1)
      } else if (options.type === 'POST') {
        fetchSetting.body = JSON.stringify(options.params)
      }
      if (options.cros) {
        fetchSetting.mode = 'cors'
        // 跨域请求带cookie，需要后端也加上相应请求头
        fetchSetting.credentials = 'include'
      } else {
        fetchSetting.credentials = 'same-origin'
      }
      return this.fetch(url, fetchSetting, options)
    },
    fetch(url, setting, options) {
      return new Promise(async (resolve, reject) => {
        let rawResp = await window.fetch(url, setting)
        let resp = await rawResp.json()
        if (rawResp.status < 400) {
          resolve(resp)
        } else {
          reject(resp)
        }
        options.hook && options.afterResponseAll.call(vueFetch, options)
        options.hook && options.afterResponse.call(vueFetch, options)
      }).then(options.interceptor.bind(vueFetch))
    },
    async getDataFromSession(options) {
      let url = options.url
      let type = options.type
      let content = JSON.parse(window.sessionStorage.getItem(`${type}:${url}`))
      if (!content) {
        content = await this.fetch(options)
        content.status && window.sessionStorage.setItem(`${type}:${url}`, JSON.stringify(content))
      }
      return content
    },
    async getDataFromStorage(options) {
      let url = options.url
      let type = options.type
      let content = JSON.parse(window.localStorage.getItem(`${type}:${url}`))
      if (!content) {
        content = await this.fetch(options)
        content.status && window.localStorage.setItem(`${type}:${url}`, JSON.stringify(content))
      }
      return content
    }
  }

  const VueFetchEventBus = new Vue()
  window.VueFetchEventBus = VueFetchEventBus
  window.VueFetch = vueFetch.start.bind(vueFetch)
  vueFetch.init(VueFetchEventBus)

  Vue.prototype.$fetch = vueFetch.start.bind(vueFetch)
}
