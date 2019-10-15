const express = require('express')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')

let app = express()

// quick and dirty
app.get('/', function (req, res) {   
    res.sendFile(path.join(__dirname + '/index.html'))
})   
app.get('/style.css', function (req, res) {   
    res.sendFile(path.join(__dirname + '/style.css'))
})   
app.get('/sudoku.js', function (req, res) {   
    res.sendFile(path.join(__dirname + '/sudoku.js'))
})   
app.get('/sudoku-data', function (req, res) {   
    axios.get(`http://nine.websudoku.com/?level=${req.query.level}`)
        .then(data =>  {
            res.send(data.data)
        })
        .catch(error => {
            console.log(error)
        })
})

let server_port = process.env.YOUR_PORT || process.env.PORT || 3000
let server_host = process.env.YOUR_HOST || '0.0.0.0'

app.listen(server_port,server_host, function () {   
    console.log(`Example app listening on port ${server_port}!`) 
})   

module.exports = app