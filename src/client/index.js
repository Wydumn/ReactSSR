// 这里写一些客户端要执行的代码
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import Routes from '../Routes'
import getStore from '../store'
import { Provider } from 'react-redux'

const App = () => {
    return (
        <Provider store={getStore()}>
            <BrowserRouter>
                {Routes} 
            </BrowserRouter>
        </Provider>
    )
}

ReactDOM.hydrate(<App />, document.getElementById('root'))