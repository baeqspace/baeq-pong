import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../axios";
import { ChatItem } from "../components/ChatItem";
import {io} from 'socket.io-client'
import { useNavigate } from "react-router-dom";

export function RoomsPage() {
    const [authUser, setAuthUser, checkAuth] = useContext(AuthContext)
    const [rooms, setRooms] = useState([])
    const nav = useNavigate()

    async function sendAddRoom() {
        const data = (await api.post('/newRoom', {user: authUser?.username})).data
        if (data.error) {alert(data.error); return}
        nav(`/baeq-pong/rooms/${data.id}`)
    }

    async function getRooms() {
        const data = (await api.get('/getRooms')).data
        setRooms(data)
    }

    useEffect(()=>{
        getRooms()
    },[])

    useEffect(()=>{
        const newSocket = io(`${import.meta.env.VITE_API_URL}`.replace('/api-pong', ''), { path: '/api-pong/socketio/' })

        newSocket.on('new-room', (newRoom, connectedUser) => {
            setRooms(prev => [...prev, {id: newRoom, users: connectedUser}])
        })

        newSocket.on('remove-room', (roomId) => {
            setRooms(prev => {
                prev.splice(prev.findIndex(room => room.id === roomId),1)
                return [...prev]
            })
        })

        newSocket.on('changed-room-users', (users, roomId) => {
            setRooms(prev => {
                return prev.map(room => {
                    if (roomId = room.id) room.users = users
                    return room
                })
            })
        })
    },[])

    return (
        <div>
            <h1 className="page-header">Комнаты</h1>
            <button onClick={() => sendAddRoom()} className="chats-add">+</button>
            <div className="chat-rooms-container">
                {rooms.map(room => {
                    let namesString = ''
                    console.log(room)
                    return <ChatItem key={room.id} roomId={room.id} users={room.users}/>
                })}
            </div>
        </div>
    )
}