import { useState, useEffect, useRef, useContext } from "react"
import api from "../axios";
import UserService from "../services/UserService.js";
import { AuthContext } from "../contexts/AuthContext.js";
import { IntlContext } from "../contexts/IntlContext.jsx";

export function AdminUser({ userRoles, text, deleteFunc, userId, ...rest }) {
    const [authUser, setAuthUser, checkAuth] = useContext(AuthContext)

    const [isAdmin, setIsAdmin] = useState(userRoles.includes('admin') ? true : false)

    async function sendRoles(isAdmin) {
        setIsAdmin(isAdmin)
        const roles = isAdmin ? ['user', 'admin'] : ['user']
        const data = await UserService.updateUserOne(userId, roles)
        alert(data)
        if (userId === authUser.id) {
            checkAuth()
        }
    }

    const [locale] = useContext(IntlContext)

    return (
        <div className="admin-item relative flex justify-between items-center mt-5 mx-auto h-12 w-96 pl-3 rounded-xl" {...rest}>
            <p className="admin-item-text inline-block w-full">{text}</p>
            <button className="admin-role h-full w-24 text-white">{locale.adminRoles}</button>
            <div className="admin-role-menu z-10 invisible absolute top-8 right-0 bg-stone-500">
                <label className="block"><input checked disabled type="checkbox" />{locale.adminRolesUser}</label>
                <label className="block"><input checked={isAdmin} onChange={e => {sendRoles(e.target.checked)}} type="checkbox" />{locale.adminRolesAdmin}</label>
            </div>
            <button onClick={() => deleteFunc(userId)} className="bg-red-500 h-full text-white w-28 rounded-r-xl">{locale.adminDelete}</button>
        </div>
    )
}