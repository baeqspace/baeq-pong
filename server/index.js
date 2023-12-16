import express from "express"
import cors from 'cors'
import AuthRouter from "./routers/AuthRouter.js"
import UserRouter from './routers/UserRouter.js'
import ChatRouter from './routers/ChatRouter.js'
import cookieParser from "cookie-parser"
import * as http from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import queryDB from "./utils/queryDB.js"
import bodyParser from "body-parser"
import 'dotenv/config'
import path from 'path'



const app = express()
const PORT = 3000
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
    path: '/api-pong/socketio/',
    cors: {
        origin: [process.env.FRONTEND_URL]
    }
})

io.on('connection', (socket) => {
    socket.on('join-room', async (room, token) => {
        try {
            const user = jwt.verify(token, 'secret')
            const clients = io.sockets.adapter.rooms.get(room)
            const numberOfClients = clients ? clients.size : 0
            if (numberOfClients < 2) {
                const connectedUser = JSON.parse((await queryDB(`select users from PongRooms where id='${room}'`))[0].users)
                if (!connectedUser.includes(user.username)) connectedUser.push(user.username)
                await queryDB(`update PongRooms set users='${JSON.stringify(connectedUser)}' where id='${room}'`)
                socket.join(room)
                socket.emit('successConnect', true)
                io.emit('changed-room-users', connectedUser, room)
                if (connectedUser.length === 1) {
                    io.emit('new-room', room, connectedUser)
                    let connectedPlayers = await io.in(room).fetchSockets()

                    const entities = {
                        player1: {
                            position: 200,
                            points: 0
                        },
                        player2: {
                            position: 200,
                            points: 0
                        },
                        ballCoord: {
                            x: 20,
                            y: 300,
                            direction: 'top left'
                        }
                    }

                    function getEntities() {
                        return entities
                    }

                    let ballSpeed = 10

                    function handleBall() {
                        const ball = entities.ballCoord
                        const player1 = entities.player1
                        const player2 = entities.player2

                        if (ball.y <= 0) {
                            if (ball.direction === 'bottom left') ball.direction = 'top left'
                            else ball.direction = 'top right'
                        } else if (ball.y >= 570) {
                            if (ball.direction === 'top left') ball.direction = 'bottom left'
                            else ball.direction = 'bottom right'
                        }

                        if (ball.x <= 0 - ballSpeed) {
                            player2.points += 1
                            ball.direction = 'top left'
                            ball.x = 20
                            ball.y = player1.position + 100
                            ballSpeed = 10
                        }

                        else if (ball.x <= 10) {
                            if (ball.y >= player1.position && ball.y <= (player1.position + 200)) {
                                if (ball.direction === 'top right') ball.direction = 'top left'
                                else ball.direction = 'bottom left'
                            }
                        }

                        else if (ball.x >= 1000 + ballSpeed) {
                            player1.points += 1
                            ball.direction = 'top right'
                            ball.x = 960
                            ball.y = player2.position + 100
                            ballSpeed = 10
                        }

                        else if (ball.x >= 960) {
                            if (ball.y >= player2.position && ball.y <= (player2.position + 200)) {
                                if (ball.direction === 'top left') ball.direction = 'top right'
                                else ball.direction = 'bottom right'
                            }
                        }

                        switch (ball.direction) {
                            case 'top left':
                                ball.x += ballSpeed
                                ball.y += ballSpeed
                                break
                            case 'bottom left':
                                ball.x += ballSpeed
                                ball.y -= ballSpeed
                                break
                            case 'top right':
                                ball.x -= ballSpeed
                                ball.y += ballSpeed
                                break
                            case 'bottom right':
                                ball.x -= ballSpeed
                                ball.y -= ballSpeed
                        }
                    }

                    let gamePaused = true

                    function tickClient(room, isFirstPlayer, position) {
                        if (isFirstPlayer) {
                            entities.player1.position = position
                        } else {
                            entities.player2.position = position
                        }
                    }

                    function changeGameState() {
                        gamePaused = !gamePaused
                        io.to(room).emit('gameStateChanged')
                    }

                    function leaveRoom() {
                        if (!gamePaused) io.to(room).emit('gameStateChanged')
                        gamePaused = true
                    }

                    function zeroPoints() {
                        entities.player1.points = 0
                        entities.player2.points = 0
                        io.to(room).emit('zero-points')
                    }

                    function setListeners() {
                        console.log('placing listeners')
                        for (let s of connectedPlayers) {
                            s.off('tick-client', tickClient)
                            s.off('changeGameState', changeGameState)
                            s.off('leave-room', leaveRoom)
                            s.off('zero', zeroPoints)

                            s.on('tick-client', tickClient)
                            s.on('changeGameState', changeGameState)
                            s.on('leave-room', leaveRoom)
                            s.on('zero', zeroPoints)
                        }
                    }

                    setListeners()

                    io.of('/').adapter.on('join-room', async (room2, id) => {
                        if (room === room2) {
                            connectedPlayers = await io.in(room).fetchSockets()
                            setListeners()
                            io.sockets.sockets.get(id).emit('new-join', getEntities(), gamePaused)
                        }
                    })

                    let spentTime = 0




                    const tickrate = setInterval(() => {
                        if (gamePaused) return

                        if (spentTime % 10000 === 0) {
                            ballSpeed += 5
                        }
                        handleBall()
                        const coords = getEntities()

                        io.to(room).emit('tick-server', coords)
                        spentTime += 50
                    }, 50, gamePaused)
                }
            } else {
                socket.emit('fullRoom', 'room is full')
            }
        } catch (e) {
            console.log(e.message)
        }
    })

    socket.on('leave-room', async (room, token) => {
        console.log('leaving registered')
        try {
            const user = jwt.verify(token, 'secret')
            const clients = io.sockets.adapter.rooms.get(room)
            const numberOfClients = clients ? clients.size : 0
            if (numberOfClients === 1) {
                await queryDB(`delete from PongRooms where id='${room}'`)
                await queryDB(`delete from PongMessages where roomId='${room}'`)
                io.emit('remove-room', room)
            } else {
                const connectedUser = JSON.parse((await queryDB(`select users from PongRooms where id='${room}'`))[0].users)
                connectedUser.splice(connectedUser.indexOf(user.username), 1)
                await queryDB(`update PongRooms set users='${JSON.stringify(connectedUser)}' where id='${room}'`)
                io.emit('changed-room-users', connectedUser, room)
            }
        } catch (e) {
            console.log(e)
        }

    })

    socket.on('send-message', (message) => {
        console.log(message)
        socket.broadcast.to(message.roomId).emit('receive-message', message)
    })
})




app.use(cors({
    credentials: true,
    origin: [process.env.FRONTEND_URL]
}))
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api-pong', AuthRouter)
app.use('/api-pong', UserRouter)
app.use('/api-pong', ChatRouter)
app.use('/baeq-pong', express.static('../client/dist'))

//app.set('socketio', io)

app.get('/baeq-pong/*', (req, res) => {
    res.sendFile(path.join(path.resolve(), '../client/dist/index.html'))
})


httpServer.listen(PORT, () => {
    console.log('server started on port ' + PORT, 'working with frontend on ' + process.env.FRONTEND_URL)
})