const app = require('./src/app')
const http = require('http')
const {Server} = require('socket.io')
require('dotenv').config()

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
})

io.on('connection', (socket) => {
    console.log('A user connected: ', socket.id)

    socket.on('disconnect', () => {
        console.log('User disconnected: ', socket.id)
    })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})