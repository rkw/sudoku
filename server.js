const express = require('express')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')

const app = express();

// old backbone code
app.get('/backbone', function (req, res) {   
    res.sendFile(path.join(__dirname, 'backbone', 'index.html'))
})   
app.get('/backbone/style.css', function (req, res) {   
    res.sendFile(path.join(__dirname, 'backbone', 'style.css'))
})   
app.get('/backbone/sudoku.js', function (req, res) {   
    res.sendFile(path.join(__dirname, 'backbone', 'sudoku.js'))
})   

// sudoku data
app.get('/sudoku-data', function (req, res) {   
    axios.get(`http://nine.websudoku.com/?level=${req.query.level}`)
        .then(data =>  {
            let $ = cheerio.load(data.data);
            let values = $('body #puzzle_grid input').map(function() {
                return parseInt($(this).val() ||  0);
            }).toArray()
            res.send(values)
        })
        .catch(error => {
            console.log(error)
        })
})

// react
app.use(express.static(path.join(__dirname, 'react')));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'react', 'index.html'));
});

let server_port = process.env.YOUR_PORT || process.env.PORT || 3000
let server_host = process.env.YOUR_HOST || '0.0.0.0'

app.listen(server_port,server_host, function () {   
    console.log(`Example app listening on port ${server_port}!`) 
})   

module.exports = app
