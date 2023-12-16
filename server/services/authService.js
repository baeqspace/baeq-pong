import bcrypt from 'bcrypt'
import queryDB from '../utils/queryDB.js'
import jwt from 'jsonwebtoken'

function generateTokens(user) {
    try {
        const accessToken = jwt.sign({ username: user.username, id: user.id, roles: user.roles}, 'secret', { expiresIn: '10m' })
        const refreshToken = jwt.sign({ username: user.username, id: user.id, roles: user.roles}, 'secret', { expiresIn: '30d' })
        return [accessToken, refreshToken]
    } catch(e) {
        console.log('generateTokens', e.message)
    }

}

class AuthService {
    async reg(userData) {
        const candidate = (await queryDB(`select * from PongUsers where username="${userData.username}"`))[0]
        if (candidate) {
            throw new Error('Пользователь уже существует')
        }

        const hashPass = await bcrypt.hash(userData.password, 3)
        await queryDB(`insert into PongUsers (username, pass, roles) values ("${userData.username}", "${hashPass}", '${JSON.stringify(['user'])}')`)

        const user = (await queryDB(`select id, username, roles from PongUsers where username="${userData.username}"`))[0]

        const [accessToken, refreshToken] = generateTokens(user)

        const userReturn = {
            user,
            accessToken,
            refreshToken
        }

        return userReturn
    }

    async login(username, password) {
        const user = (await queryDB(`select * from PongUsers where username="${username}"`))[0]
        if (!user) {
            throw new Error('пользователь не найден')
        }

        const isPassEqual = await bcrypt.compare(password, user.pass)
        if (!isPassEqual) {
            throw new Error('пароль неверный')
        }

        const [accessToken, refreshToken] = generateTokens(user)

        const userData = {
            username: user.username,
            id: user.id,
            roles: user.roles,
            accessToken,
            refreshToken
        }

        return userData
    }

    async refresh(token) {
        try {
            const user = jwt.verify(token, 'secret')

            const userExist = (await queryDB(`select username from PongUsers where id=${user.id}`))[0]
            if (!userExist) {
                throw new Error('пользователя не существует')
            }

            const [accessToken, refreshToken] = generateTokens(user)
            const userData = {
                user,
                accessToken,
                refreshToken
            }

            return userData
        } catch (e) {
            throw new Error(e.message)
        }
        
    }

    async checkAuth(token) {
        try {
            const user = jwt.verify(token, 'secret')

            const userExist = (await queryDB(`select id, username, roles from PongUsers where id=${user.id}`))[0]
            if (!userExist) {
                throw new Error('пользователя не существует')
            }

            return userExist
        } catch (e) {
            throw new Error(e.message)
        }
    }
}

export default new AuthService()