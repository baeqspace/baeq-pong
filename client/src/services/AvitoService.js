import api from "../axios/index.js";

class AvitoService {
    async avitoAll() {
        const data = await api.get('/avitoAll')
        return data?.data
    }

    async getAvitoOne(id) {
        const data = await api.get(`/avitoOne/${id}`)
        return data?.data
    }

    async deleteAvitoOne(id) {
        const data = await api.delete(`/avitoOne/${id}`)
        return data?.data
    }

    async updateAvito() {
        const data = await api.get('/updateAvito')
        return data?.data
    }

    async addAvito(body) {
        const data = await api.post('/addAvito', body)
        return data?.data
    }
}

export default new AvitoService()