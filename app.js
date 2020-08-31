const express = require('express')
const morgan = require('morgan')
const createError = require('http-errors')
const { verifyAccessToken } = require('./utils/jwt_helper')

require('dotenv').config()
require('./utils/redis_helper')
require('./utils/mongoDb')

const app = express()
//middlewares
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/', verifyAccessToken, async (req, res, next) => {
    console.log(req.headers['authorization'])
    res.send('Hello World!')
})

//auth
app.use('/auth', require('./routes/Auth_router'))

//not found
app.use(async (req, res, next) => {
    next(createError.NotFound())
})
//error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.send({
        error: {
            status: err.status || 500,
            message: err.message
        }
    })
})

const PORT = process.env.PORT

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))