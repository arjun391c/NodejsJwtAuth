const mongoose = require('mongoose')

let uri = process.env.MONGODB_URI
mongoose.connect(uri, { dbName: process.env.DB_NAME, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: true, useUnifiedTopology: true })
    .then(() => console.log('Mongodb connected'))
    .catch(err => console.log(err.message))

mongoose.connection.on('disconnected', () => console.log('Mongodb disconnected'))

process.on('SIGINT', async () => {
    await mongoose.connection.close()
    process.exit(0)
})