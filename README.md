# cheftin vue fetch

> 对fetch API根据业务需要进行通用封装，解决了如下问题：

1. 提供统一钩子函数, 方便统一加loading
2. 提供响应数据拦截器，可在数据到达组建之前修改响应数据
3. 提供两种缓存，session，对应sessionStorage， storage对应localStorage，解决重复调用的问题


## Requirements
- vue: ^2.0.0

## Usage

#### Install

``` sh
 npm install cft-fetch --save
```

#### Main.js

``` javascript

import vueFetch from 'vue-cft-fetch'

Vue.use(vueFetch, {
  beforeSendAll () {
    // 请求前勾子函数，如需调用vue实例上的方法，请使用this.$vm.xxx()
  },
  afterResponseAll (resp) {
    // 响应后勾子函数，如需调用vue实例上的方法，请使用this.$vm.xxx()
  },
  interceptor (resp) {
    // 拦截器，可对请求结果进行拦截修改，方便组件中使用async函数
    if (resp.status) {
      return resp.data
    } else {
      return resp
    }
  }
})
```


#### Options

``` javascript
url: url, *必填
params: params, *必填
type: GET, //默认 ‘GET’
session: false,
storage: false,
hook: true // 有些情况可能并不想触发全局请求钩子函数，把这个属性改为false即可, 默认为true
cros: false // 是否为跨域请求
beforeSend () {}, //请求发送前的钩子
afterResponse () {}, //响应成功的钩子
beforeSendAll () {}, //全局请求发送前的钩子， 其中的this指向插件本身，如需使用vue实例上的方法，请用this.$vm
afterResponseAll () {}, //全局响应成功的钩子，其中的this指向插件本身，如需使用vue实例上的方法，请用this.$vm
interceptor (resp) { // 拦截器，请求成功的时候，返回的数据会从拦截器穿过，可以做一些数据过滤
  return resp
}
```