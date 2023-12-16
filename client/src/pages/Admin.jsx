import axios from "axios"
import { useContext, useEffect, useState } from "react"
import api from "../axios"
import { AdminUser } from "../components/AdminUser"
import { AdminItem } from "../components/AdminItem"
import { Button } from "../components/Button"
import { AuthContext } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import AvitoService from "../services/AvitoService"
import UserService from "../services/UserService"
import { Modal } from "../components/Modal"
import { IntlContext } from "../contexts/IntlContext"




export function Admin() {
    const [authUser, setAuthUser, checkAuth] = useContext(AuthContext)

    const [items, setItems] = useState([])
    const [users, setUsers] = useState([])

    const [modalVisible, setModalVisible] = useState(false)

    const [avitoForm, setAvitoForm] = useState({title: '', price: '', location: '', photos: ''})


    async function loadItems() {
        const data = await AvitoService.avitoAll()
        setItems(data)
    }
    
    async function loadUsers() {
        const data = await UserService.usersAll()
        if (data.error) {
            alert(data.error)
            checkAuth()
            return
        }
        setUsers(data)
    }

    useEffect(() => {loadItems()},[])
    useEffect(() => {loadUsers()},[])

    
    async function deleteItem(id) {
        const data = await AvitoService.deleteAvitoOne(id)
        if (data === 'success') {
            alert('Удален')
            loadItems()
        } else {
            alert(data)
        }
    }

    async function deleteUser(id) {
        const data = await UserService.deleteUserOne(id)
        if (data === 'success') {
            alert('Удален')
            loadUsers()
            checkAuth()
        } else {
            alert(data)
        }
    }

    async function updateDB() {
        const data = await AvitoService.updateAvito()
        if (data === 'success') {
            alert('success')
            loadItems()
        } else {
            alert(data)
        }
    }

    async function addAvito() {
        const form = {...avitoForm}
        form.photos = [...form.photos.replaceAll(' ', '').split(',')]
        console.log(form.photos)
        if (!form.title || !form.price || !form.location || !form.photos) {alert('Некоторые поля пусты'); return}
        const data = await AvitoService.addAvito(form)
        if (data === 'success') {
            alert('success')
            loadItems()
        }
    }

    const [locale] = useContext(IntlContext)


    return (
        <div className="p-9">
            <h1 className="font-bold text-4xl">{locale.adminHeader}</h1>
            <div className="flex w-full mt-5">
                <div className="w-full">
                    <h2 className="text-center text-4xl">{locale.adminItemsHeader} {items.length} {locale.adminItemsUnit}</h2>
                    <div className="admin-list overflow-y-scroll">
                        {items?.map(item => {
                            return <AdminItem deleteFunc={deleteItem} itemId={item.id} key={item.id} text={item.itemName}/>
                        })}
                    </div>
                </div>
                <div className="w-full">
                    <h2 className="text-center text-4xl">{locale.adminUsersHeader} {users.length} {locale.adminUsersUnit}</h2>
                    <div className="admin-list overflow-y-scroll">
                        {users?.map(user => {
                            return <AdminUser userRoles={JSON.parse(user.roles)} deleteFunc={deleteUser} userId={user.id} key={user.id} text={user.email}/>
                        })}
                    </div>
                </div>
            </div>
            <div>
                <Button classes="mt-10" onClick={() => updateDB()}>{locale.adminUpdateDB}</Button>
                <Button onClick={() => setModalVisible(true)} classes="ml-10">{locale.adminAddItem}</Button>
            </div>
            <Modal modalVisible={modalVisible} setModalVisible={setModalVisible}>
                <h1>Добавление товара</h1>
                <input value={avitoForm.title} onChange={(e)=>setAvitoForm(prev => {return {...prev, title: e.target.value}})} className="block mt-5 w-full" type="text" placeholder="Введите название" />
                <input value={avitoForm.price} onChange={(e)=>setAvitoForm(prev => {return {...prev, price: e.target.value}})} className="block mt-5 w-full" type="text" placeholder="Введите цену" />
                <input value={avitoForm.photos} onChange={(e)=>setAvitoForm(prev => {return {...prev, photos: e.target.value}})} className="block mt-5 w-full" type="text" placeholder="Вставьте ссылки на фото, через запятую" />
                <input value={avitoForm.location} onChange={(e)=>setAvitoForm(prev => {return {...prev, location: e.target.value}})} className="block mt-5 w-full" type="text" placeholder="Введите адрес" />
                <Button onClick={addAvito} classes="mt-5">Добавить</Button>
            </Modal>
        </div>
    )
}