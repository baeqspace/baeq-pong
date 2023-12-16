import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import queryDB from "../utils/queryDB.js";

const router = new Router()

router.get('/usersAll', authMiddleware('admin'), async (req, res) => {
    const users = await queryDB('select id, email, roles from SocialUsers')
    res.json(users)
})

router.delete('/user/:id', authMiddleware('admin'), async (req, res) => {
    const id = req.params.id
    const data = await queryDB(`delete from SocialUsers where id=${id}`)
    if (data.error) {res.json(data.error); return}
    res.json('success')
})

router.post('/user/:id', authMiddleware('admin'), async (req,res)=>{
    const id = req.params.id
    const data = await queryDB(`update SocialUsers set roles='${JSON.stringify(req.body)}' where id=${id}`)
    if (data.error) {res.json(data.error); return}
    res.json('success')
})

export default router