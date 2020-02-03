// const express = require('express')
// 有了stage-0依赖包之后，可以使用es6语法
import express from 'express'
import { render } from './utils'

const app = express()
app.use(express.static('public'))

app.get('*', (req, res) => {
    res.send(render(req))
})

var server = app.listen(3000)