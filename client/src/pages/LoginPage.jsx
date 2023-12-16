import { Button } from "../components/Button";
import { useContext, useState } from "react";
import AuthService from "../services/AuthService";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { IntlContext } from "../contexts/IntlContext";

export function LoginPage() {
    const [authUser, setAuthUser, checkAuth] = useContext(AuthContext)
    const [locale] = useContext(IntlContext)

    const [form, setForm] = useState({ isReg: false, username: '', password: ''})

    const nav = useNavigate()

    async function sendAuth() {
        
        let data;
        if (!form.username || !form.password) { alert('username или пароль не указаны'); return }
        if (form.isReg) {
            data = await AuthService.reg({...form})
        } else {
            data = await AuthService.login(form.username, form.password)
        }

        console.log(data)
        if (data.error) { alert(data.error); return }
        console.log(data.accessToken)
        localStorage.setItem('token', data.accessToken)
        checkAuth()
    }

    return (
        <div className="w-full h-full flex flex-col justify-center items-center">
            <div className="login-form">
                <label className="login-checkbox">
                    <span>{locale.loginLogin}</span>
                    <span>{locale.loginReg}</span>
                    <input className="hidden" checked={form.isReg} onChange={e => setForm(prev => { return { ...prev, isReg: e.target.checked } })} type="checkbox" />
                </label>
                <input value={form.username} onChange={e => setForm(prev => { return { ...prev, username: e.target.value, } })} type="text" placeholder={locale.loginEmail} />
                <input value={form.password} onChange={e => setForm(prev => { return { ...prev, password: e.target.value } })} type="password" placeholder={locale.loginPass} />
                <Button style={{marginTop: 25, padding: '20px 50px', fontSize: '21px'}} onClick={sendAuth}>{locale.loginSend}</Button>
            </div>
        </div>
    )
}