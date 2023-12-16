import { validationResult } from 'express-validator'
import authService from '../services/authService.js'

class AuthController {
    async reg(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) { res.json(errors.array()); return }

        const userData = req.body

        try {    
            const user = await authService.reg(userData)
            res.cookie('refreshToken', user.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            res.json({ message: 'success', ...user })
        } catch(e) {
            res.json({error: e.message})
        }
        
    }



    async login(req, res) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) { res.json(errors.array()); return }

        const { username, password } = req.body

        try {
            const user = await authService.login(username, password)
            console.log(user)
            res.cookie('refreshToken', user.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true})
            res.json({ message: 'success', ...user })
        } catch(e) {
            res.json({error: e.message})
        }
        
    }




    async logout(req, res) {
        res.clearCookie('refreshToken')
        res.json({ message: 'success' })
    }




    async refresh(req, res) {
        const { refreshToken } = req.cookies
        if (!refreshToken) { res.json('не указан токен'); return }

        try {
            const user = await authService.refresh(refreshToken)
            res.cookie('refreshToken', user.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true })
            res.json({ message: 'success', ...user })
        } catch (e) {
            res.clearCookie('refreshToken')
            res.status(401).json({error: e.message})
        }
    }





    async checkAuth(req, res) {
        const accessToken = req.headers.authorization.split(' ')[1]
        if (!accessToken) {
            res.json({error: 'нет токена'})
            return
        }

        try {
            const user = await authService.checkAuth(accessToken)

            user.roles = JSON.parse(user.roles)
            res.json({ message: 'success', user })
        } catch(e) {
            res.status(401).json({error: e.message})
        }
    }
}

export default new AuthController()