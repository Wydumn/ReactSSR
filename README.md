## 一、React中的服务器端渲染
### 1) 在服务器端编写React组件
1. 服务器端不能用import-export，这部遵循commonjs规范；要用require引入，module.exports{ default }导出


### 2) 服务器端webpack的配置
2. jsx要经过webpack编译打包之后才可以运行
```
return <div>Home</div>
           ^
SyntaxError: Unexpected token '<'
```

```js
// 服务器端
require('path')     // 不会把path打包到bundle.js中

// 浏览器端
require('path')     // 会把path打包到bundle.js中

module.exports = {
    target: 'node', // 打包的文件是服务器端
}
```

经过webpack.server.js一通配置，编译生成bundle.js；jsx可以在客户端运行不报错
```js
const Path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = {
    target: 'node',     // 打包的文件是在服务器端
    mode: 'development', 
    entry: './src/index.js',    // 打包入口文件
    output: {   // 打包生成的文件放在哪
        filename: 'bundle.js',  // 生成的文件名
        path: Path.resolve(__dirname, 'build')  // 生成的文件路径， __dirname是服务器端的根路径
    },
    // externals 配置选项提供了「从输出的 bundle 中排除依赖」的方法。相反，所创建的 bundle 依赖于那些存在于用户环境(consumer's environment)中的依赖。此功能通常对 library 开发人员来说是最有用的，然而也会有各种各样的应用程序用到它。
    // It might be useful to define your own function to control the behavior of what you want to externalize from webpack. webpack-node-externals, for example, excludes all modules from the node_modules directory and provides some options to, for example, whitelist packages.
    // 也就是开发过程中用到的引用库，不打包进去
    externals: [nodeExternals()],   
    module: {
        // 打包配置的规则
        rules: [{
            test: /\.jsx?$/,     // 检测文件类型
            loader: 'babel-loader',
            exclude: /node_modules/,    // node_modules下的文件除外
            options: {  // 可选配置
                // 使用babel-loader进行编译时，可以通过presets做一些编译规则
                // 如果需要编译jsx，需要预先加载"react"这个模块
                // ”stage-0"是对ES7一些提案的支持，Babel通过插件的方式引入，让Babel可以编译ES7代码
                // env：environment，webpack在打包的时候如何根据环境做一些适配
                // browsers：babel在打包编译时，要兼容浏览器的最新两个版本
                presets: ['react', 'stage-0', ['env', {
                    targets: {
                        browsers: ['last 2 versions']
                    }
                }]]
            }
        }]
    }
}
```

### 3) 实现服务器端组件渲染
- 实现最简单的服务器端渲染
```js
// const express = require('express')
// const Home = require('./containers/Home')
// 有了stage-0依赖包之后，可以使用es6语法
import express from 'express'
import Home from './containers/Home'
import React from 'react'   // 用到jsx
import { renderToString } from 'react-dom/server'

const app = express()
const content = renderToString(<Home />)

app.get('/', (req, res) => {
    // res.send(Home); // TypeError [ERR_INVALID_ARG_TYPE]: The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type function
    res.send(`
        <html>
            <head>
                <title>ssr</title>
            </head>
            <body>
                ${content}
            </body>
        </html>
    `)
})

var server = app.listen(3000)
```

### 4) 建立在虚拟DOM上的服务器端渲染
- 虚拟DOM是真实DOM的一个JS对象映射
- 虚拟DOM浏览器渲染    => ReactDOM.render(<rootComponent>, 'root')渲染为真实DOM
- 虚拟DOM的服务器端渲染    =>  ReactDOMServer.renderToString渲染为字符串

### 5) webpack的自动打包与服务器自动重启
- webpack.server.js --watch
> watch要打包的文件，一旦发生改变，自动重新打包编译

- nodemon --watch build --exec node \"./build/bundle.js\""
> nodemon(itor) 监听 /build文件夹的变化，一旦发生改变，就执行 node \"./build/bundle.js\""这条命令

### 6) npm-run-all提高开发效率
```js
"dev": "npm-run-all --parallel dev:**",
"dev:start": "",
"dev:build": ""
```
命令行执行npm-run-all --parallel dev:**时，以dev开头的命令都同时执行，也就是 打包编译和服务器启动都自动化了

## 二、同构的概念的梳理

### 1) 啥是同构
> 同构：一套React代码，在服务器端执行一次，在客户端再执行一次
```js
const Home = () => {
    return (
        <div>
            <div>This is my Home!</div>
            <button onClick={() => {alert('点了？')}}>click</button>
        </div>
    )
}

// 呈现的网页源代码
<body>
    <div data-reactroot="">
        <div>This is my Home!</div>
        <button>click</button>
    </div>
</body>
```
服务器端渲染的事件绑定并没有在浏览器端起作用，还要再浏览器端再渲染一遍

### 2) 在浏览器上执行一段JS代码
```js
// 1. 在返回的数据中放入 <script>
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>ssr</title>
            </head>
            <body>
                ${content}
                <script src='/index.js'></script>
            </body>
        </html>
    `)
})
// 2. 浏览器加载页面时，请求js文件
// 3. app.use(express.static('public')) 使用express.static内置中间件函数托管静态文件，将public目录下的文件对外开放
// 4. 返回 public文件夹下index.js文件响应
// 5. 执行js文件
```

### 3) 让React代码在浏览器上运行
1. 像客户端渲染一样，插入root标签

```js
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>ssr</title>
            </head>
            <body>
                <div id='root'>
                    ${content}
                </div>
                <script src='/index.js'></script>
            </body>
        </html>
    `)
})
```

2. 在public目录下index.js文件中写入浏览器端要用的代码

```js
import React from 'react'       
import ReactDOM from 'react-dom'

import Home from '../containers/Home'

ReactDOM.render(<Home />, document.getElementById('root'))
```
> 上面代码执行：Uncaught SyntaxError: Cannot use import statement outside a module
原因：ESmodule语法在浏览器端无法运行，经过编译才可以执行

3. webpack对以上代码进行编译
    1. src目录下新建client文件夹
    2. 新建index.js，放入客户端渲染时要用的代码
    3. 项目根目录下新建webpack.client.js，配置客户端渲染
    ```js
    const path = require('path')
    // const nodeExternals = require('webpack-node-externals')

    module.exports = {
        // target: 'node', 客户端渲染不再需要
        mode: 'development', 
        entry: './src/client/index.js', //
        output: {
            filename: 'index.js',   //
            path: path.resolve(__dirname, 'public')
        },
        // externals: [nodeExternals()],   
        module: {
            rules: [{
                test: /\.js?$/,     
                loader: 'babel-loader',
                exclude: /node_modules/,
                options: {  
                    presets: ['react', 'stage-0', ['env', {
                        targets: {
                            browsers: ['last 2 versions']
                        }
                    }]]
                }
            }]
        }
    }
    ```
    4. package.json下添加scripts "dev:build:client": "webpack --config webpack.client.js --watch"

4. 执行
> react-dom.development.js:12357 Warning: render(): Calling ReactDOM.render() to hydrate server-rendered markup will stop working in React v17. Replace the ReactDOM.render() call with ReactDOM.hydrate() if you want React to attach to the server HTML.
将客户端的代码中 ReactDOM.render()改为ReactDOM.hydrate()

### 4) 工程代码优化
1. 合并两个webpack配置文件的冗余项，webpack-merge
2. 新建webpack.base.js文件，将冗余项 module: {} 放入webpack.base.js
3. 修改配置
    ```js
    const merge = require('webpack-merge')
    const config = require('./webpack.base.js')

    const clientConfig = {
        // target: 'node', 客户端渲染不再需要
        mode: 'development', 
        entry: './src/client/index.js', //
        output: {
            filename: 'index.js',   //
            path: path.resolve(__dirname, 'public')
        },
        // externals: [nodeExternals()],   
    }

    module.exports = merge(config, clientConfig)
    ```

## 三、SSR中引入路由
### 1) 服务器端渲染中的路由
定义一个Routes组件
```js
import React from 'react'
import { Route } from 'react-router-dom'
import Home from './containers/Home'

export default (
    <div>
        <Route path='/' exact component={Home}></Route>
    </div>
)

// 相应地，在客户端index.js中
const App = () => {
    return (
        <BrowserRouter>
            {Routes}
        </BrowserRouter>
    )
}

ReactDOM.hydrate(<App />, document.getElementById('root'))
```
> 运行 Warning: Expected server HTML to contain a matching <div> in <div>.
原因：同构应用，服务器端的结构要和客户端的结构一样。    客户端组件外层有<div>，服务器端还是<Home/>，并没有<div>
```js
// 相应地，在服务器端也改为{Routes}
app.get('/', (req, res) => {

    const content = renderToString((
        <StaticRouter location={req.path} context={{}}>
            {Routes}
        </StaticRouter>
    ))

    res.send(`
        <html>
            <head>
                <title>ssr</title>
            </head>
            <body>
                <div id='root'>${content}</div>
                <script src='/index.js'></script>
            </body>
        </html>
    `)
})
```

- StaticRouter
> location永远不会改变的<Router>。服务器端渲染的场景下使用，因为用户不会真的点击
location: string
context: object
> 1. JS对象.渲染过程中，组件可以添加属性来保存信息。
```js
const context = {}
<StaticRouter context={context}>
  <App />
</StaticRouter>
```
2. 当一个<Route>匹配到时，会将context对象作为staticContext prop传递给渲染的组件
3. 渲染之后，这些属性用来配置服务器的响应
```js
if (context.status === "404") {
  // ...
}
```

### 2) 多页面路由跳转
1. 定义两个路由
```js
import React from 'react'
import { Route } from 'react-router-dom'
import Home from './containers/Home'
import Login from './containers/Login'

export default (
    <div>
        <Route path='/' exact component={Home}></Route>
        <Route path='/login' exact component={Login}></Route>
    </div>
)
```
浏览器跳转到 /login时，Cannot GET /login，
原因：app.use('/')只定义了 /API，改为 app.use('*')

2. 代码优化
```js
// Utils utility实用工具
import React from 'react'   // 用到jsx
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import Routes from '../Routes'

export const render = (req) => {
    const content = renderToString((
        <StaticRouter location={req.path} context={{}}>
            {Routes}
        </StaticRouter>
    ))

    return `
        <html>
            <head>
                <title>ssr</title>
            </head>
            <body>
                <div id='root'>${content}</div>
                <script src='/index.js'></script>
            </body>
        </html>
    `
}

// 将StaticRouter生成HTML的部分抽出来，放到utils部分
import express from 'express'
import { render } from './utils'

const app = express()
app.use(express.static('public'))

app.get('*', (req, res) => {
    res.send(render(req))
})
 
var server = app.listen(3000)
```


### 3) 使用Link标签串联起整个路由流程
建立一个Header公用头部
```js
import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
    return (
        <div>
            <Link to='/'>Home</Link>
            <br/>
            <Link to='/login'>Login</Link>
        </div>
    )
}

export default Header
```
> 同构项目，服务器端渲染只发生在第一次进入页面时；localhost => index.js 之后页面路由跳转，加载组件，都是客户端渲染

## 四、
### 1) 为什么要引入中间件
JAVA server：数据库的查询和一些数据的计算
        ||
        \/
Node server：取到数据，和react组件结合，拼装页面
        ||
        \/
浏览器：执行JS

### 2) 同构项目引入Redux
1. 客户端
```js
const reducer = (state = { name: 'firm' }, action) => {
    return state
}

const store = createStore(reducer, applyMiddleware(thunk))

const App = () => {
    return (
        <Provider store={store}>
            <BrowserRouter>
                {Routes} 
            </BrowserRouter>
        </Provider>
    )
}

// 通过connect和Provider在组件中使用
const Home = (props) => {
    return (
        <div>
            <Header/>
            <div>This is {props.name}</div>
            <button onClick={() => {alert('点了？')}}>click</button>
        </div>
    )
} 

const mapStateToProps = state => ({
    name: state.name   
})

export default connect(mapStateToProps, null)(Home)
```
> 运行，TypeError: cannot find 'store' .....
原因：访问localhost:3000时，先访问server/index.js   =>  render()    =>  utils   =>  并没有store，报错
```js
// 服务器端再搞一个store
const reducer = (state = {name: 'firm'}, action) => {
    return state
}

const store = createStore(reducer, applyMiddleware(thunk))

const content = renderToString((
    <Provider store={store}>
        <StaticRouter location={req.path} context={{}}>
            {Routes}
        </StaticRouter>
    </Provider>
))
```

### 3) 如何复用store中的代码
- 将创建store的代码抽出来，放在一个单独的文件中
```js
import thunk from 'redux-thunk'
import { createStore, applyMiddleware } from 'redux'

const reducer = (state = { name: 'firm' }, action) => {
    return state
}

const store = createStore(reducer, applyMiddleware(thunk))

export default store
```
> 这样做，可以拿到store，但是每个用户的store都是一样的，显然每个用户的数据是有差异的，将store改为一个函数，每次使用，都创建一个新的store
```js
export default () => {
    return createStore(reducer, applyMiddleware(thunk))
}
```

### 4) 构建Redux代码结构
