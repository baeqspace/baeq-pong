import api from "../axios/index.js";

class UserService {
    async usersAll() {
        const data = await api.get('/usersAll')
        return data?.data
    }

    async deleteUserOne(id) {
        const data = await api.delete(`/user/${id}`)
        return data?.data
    }

    async updateUserOne(id, body) {
        const data = await api.post(`/user/${id}`, body)
        return data?.data
    }

    async getUsersNames(ids) {
        const data = await api.post('/user/getUsersNames', ids)
        return data?.data
    }
}

export default new UserService()