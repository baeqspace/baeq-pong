import jwt from 'jsonwebtoken'
import queryDB from '../utils/queryDB.js'

function isArraysEqual(a,b) {
    return a.length === b.length && a.every((v,i) => v === b[i])
}

export function authMiddleware(userRoles) {
    return async function (req, res, next) {
        try {
            const authHeader = req.headers.authorization
            if (!authHeader) throw new Error('нет токена')

            const accessToken = authHeader.split(' ')[1]
            if (!accessToken) throw new Error('нет токена')


            const {id, roles} = jwt.verify(accessToken, 'secret')

            const userExist = (await queryDB(`select * from PongUsers where id=${id}`))[0]

            if (!userExist) {
                throw new Error('тебя не существует')
            }

            if (!isArraysEqual(JSON.parse(roles), JSON.parse(userExist.roles))) {
                res.clearCookie('refreshToken')
                throw new Error('roles changed')
            }

            if (!roles.includes(userRoles)) {
                throw new Error('у вас не прав')
            }

            req.user = userExist

            next()
        } catch (e) {
            console.log('authMiddle',e.message)
            res.status(401).json({error: e.message})
            return
        }
    }
} 