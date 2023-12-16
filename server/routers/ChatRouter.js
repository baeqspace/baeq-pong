import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import queryDB from "../utils/queryDB.js";
import {v4 as uuidv4} from 'uuid'

const router = new Router()

router.post('/newRoom', authMiddleware('user'), async (req, res) => {
    const {user} = req.body
    const existRoom = (await queryDB(`select users from PongRooms where users='${JSON.stringify([user])}'`))[0]
    if (existRoom) {res.json({error: 'room already exists'}); return}

    const id = uuidv4()

    await queryDB(`insert into PongRooms (id, users) values ("${id}",'${JSON.stringify([user])}')`)
    res.json({id})
})

router.get('/getRooms', authMiddleware('user'), async (req, res) => {
    const rooms = await queryDB(`select * from PongRooms`)
    rooms.forEach(room => room.users = JSON.parse(room.users))
    res.json(rooms)
})

router.post('/newMessage', authMiddleware('user'), async (req, res) => {
    const {sender, dateAndTime, messageText, roomId} = req.body
    if (sender !== req.user.username) {res.json({error: 'Вы не можете писать за других пользователей'}); return}
    await queryDB(`insert into PongMessages (roomId, sender, dateAndTime, messageText) values ('${roomId}', '${sender}', ${dateAndTime}, '${messageText}')`)
    res.json('success')
})

router.post('/getMessages', authMiddleware('user'), async (req, res) => {
    const {roomId} = req.body

    const data = await queryDB(`select roomId, sender, dateAndTime, messageText from PongMessages where roomId='${roomId}' order by dateAndTime`)
    const members = (await queryDB(`select users from PongRooms where id='${roomId}'`))[0]
    res.json({data, members})
})

export default router