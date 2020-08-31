const createError = require('http-errors')
const User = require('../models/User_model')
const { authSchema } = require('../utils/validation_schema/auth_schema')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt_helper')
const client = require('../utils/redis_helper')

module.exports = {
    register: async (req, res, next) => {
        try {
            const result = await authSchema.validateAsync(req.body)
    
            const userExists = await User.findOne({ email: result.email })
            if (userExists) throw createError.Conflict(`${result.email} is already been registered`)
    
            const user = new User(result)
            const savedUser = await user.save()
            const accessToken = await signAccessToken(savedUser.id)
            const refreshToken = await signRefreshToken(savedUser.id)
            res.send({ accessToken, refreshToken })
        } catch(err) {
            if(err.isJoi) err.status = 422
            next(err)
        }  
    },

    login: async (req, res, next) => {
        try {
            const result = await authSchema.validateAsync(req.body)
            const user = await User.findOne({ email: result.email }) 
            if(!user) throw createError.NotFound('User not registered')
    
            const isMatch = await user.isValidPassword(result.password)
            if(!isMatch) throw createError.Unauthorized('Username/password not valid')
            
            const accessToken = await signAccessToken(user.id)
            const refreshToken = await signRefreshToken(user.id)
            res.send({ accessToken, refreshToken })
        } catch(err) {
            if(err.isJoi) return next(createError.BadRequest('Invalid Username/Password'))
            next(err)
        }
    },

    refresh_token: async (req, res, next) => {
        try {
            const { refreshToken } = req.body
            if(!refreshToken) throw createError.BadGateway()
            const userId = await verifyRefreshToken(refreshToken)
            const accessToken = await signAccessToken(userId)
            const newrefreshToken = await signRefreshToken(userId)
            res.send({ accessToken, refreshToken: newrefreshToken })
        } catch(err) {
            next(err)
        }
    },
    
    logout: async (req, res, next) => {
        try {
            const { refreshToken } = req.body
            if(!refreshToken) throw createError.BadRequest()
            const userId = await verifyRefreshToken(refreshToken)
            
            client.DEL(userId, (err, val) => {
                if(err) {
                    console.log(err.message)
                    throw createError.InternalServerError()
                }
                console.log(val)
                res.sendStatus(204)
            })
        } catch(err) {
            next(err)
        }
    }
}