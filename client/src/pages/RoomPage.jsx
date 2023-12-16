import { Button } from "../components/Button";
import { Message } from "../components/Message";
import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { io } from 'socket.io-client'

export function RoomPage() {
    let { id } = useParams()
    const [authUser, setAuthUser, checkAuth] = useContext(AuthContext)
    const [messages, setMessages] = useState([])
    const [members, setMembers] = useState([])
    const [chatInput, setChatInput] = useState('')
    const [socket, setSocket] = useState()
    const [chatVisible, setChatVisible] = useState(false)
    const [myPlayer, setMyPlayer] = useState(200)
    const [enemyPlayer, setEnemyPlayer] = useState(200)
    const [amIFirstPlayer, setAmIFirstPlayer] = useState(true)
    const [ball, setBall] = useState({ x: 10, y: 290 })
    const [points, setPoints] = useState({ player1: 0, player2: 0 })
    const [gamePaused, setGamePaused] = useState(true)
    const [unreadMsg, setUnreadMsg] = useState(false)
    const chatButton = useRef()

    const interval = useRef()

    const mContainer = useRef()
    const nav = useNavigate()

    async function sendMessage() {
        if (!chatInput) { alert('Введите сообщение!'); return }
        const message = { sender: authUser.username, dateAndTime: Date.now(), messageText: chatInput, roomId: id }
        const data = (await api.post('/newMessage', message)).data
        if (data.error) { alert(data.error); return }
        setMessages(prev => [...prev, message])
        socket.emit('send-message', message)
        setChatInput('')
    }

    async function getMessages() {
        const data = (await api.post('/getMessages', { roomId: id })).data
        if (data.error) { alert(data.error); nav('/baeq-pong/rooms'); return }
        setMessages(data.data)
        const members = JSON.parse(data.members.users)
        setMembers(members)
        setAmIFirstPlayer(members.length === 1 ? true : false)
    }

    useEffect(() => {
        mContainer.current.scroll(0, mContainer.current.scrollHeight)
    }, [messages])

    /* useEffect(() => {
        getMessages()
    }, []) */

    async function connectSocket(socket) {
        await checkAuth()
        socket.emit('join-room', id, localStorage.getItem('token'))

        socket.on('successConnect', (message) => {
            console.log('sucessfully connected')
            getMessages()
        })

        socket.on('changed-room-users', (users, room) => {
            if (room === id) {
                setMembers(users)
            }
        })

        socket.on('zero-points', () => {
            setPoints({player1: 0, player2: 0})
        })


        socket.on('new-join', ({player1, player2, ballCoord}, gamePaused) => {
            setMyPlayer(player2.position)
            setEnemyPlayer(player1.position)
            setBall({ x: ballCoord.x, y: ballCoord.y })
            setPoints({ player1: player1.points, player2: player2.points })
            setGamePaused(gamePaused)
        })
    }

    useEffect(()=>{
        socket?.on('receive-message', (message) => {
            console.log(chatVisible)
            if (!chatVisible) {
                setUnreadMsg(true)
            }
            setMessages(prev => [...prev, message])
        })

        return () => {
            socket?.off('receive-message')
        }
    }, [socket, chatVisible])

    useEffect(() => {
        const newSocket = io(`${import.meta.env.VITE_API_URL}`.replace('/api-pong', ''), { path: '/api-pong/socketio/' })
        setSocket(newSocket)
        connectSocket(newSocket)

        const interval = setInterval(async ()=>{
            await checkAuth()
        }, 1000 * 60 * 5)

        return () => {
            clearInterval(interval)
            newSocket.emit('leave-room', id, localStorage.getItem('token'))
            newSocket.close()
        }
    }, [])

    useEffect(() => {
        socket?.on('tick-server', ({ player1, player2, ballCoord }) => {
            setEnemyPlayer(amIFirstPlayer ? player2.position : player1.position)
            setBall({ x: ballCoord.x, y: ballCoord.y })
            setPoints({ player1: player1.points, player2: player2.points })
            socket.emit('tick-client', id, amIFirstPlayer, myPlayer)
        })

        socket?.on('gameStateChanged', () => {
            setGamePaused(prev => !prev)
        })

        return () => {
            socket?.removeAllListeners('tick-server')
            socket?.removeAllListeners('gameStateChanged')
        }
    }, [amIFirstPlayer, myPlayer, socket])

    useEffect(() => {
        if (gamePaused) return
        

        function handleMovement(e) {
            if (e.repeat) return
            clearInterval(interval.current)
            switch (e.key) {
                case 'w':
                    clearInterval(interval.current)
                    interval.current = setInterval(() => {
                        setMyPlayer(prev => {
                            if (!(prev <= 0)) return prev - 20
                            return prev
                        })
                    },50)
                    document.onkeyup = (ev) => {
                        if (ev.key === 'w') clearInterval(interval.current)
                    }
                    break
                case 's':
                    clearInterval(interval.current)
                    interval.current = setInterval(()=> {
                        setMyPlayer(prev => {
                            if (!(prev >= 390)) return prev + 20
                            return prev
                        })
                    }, 50)
                    document.onkeyup = (ev) => {
                        if (ev.key === 's') clearInterval(interval.current)
                    }
                    break
            }
        }

        document.onkeydown = handleMovement

        return () => {
            document.onkeydown = undefined
        }
    }, [myPlayer, gamePaused])

    function changeGameState() {
        socket?.emit('changeGameState')
    }

    function sendZero() {
        socket?.emit('zero')
    }

    return (
        <div style={{ width: '100%' }}>
            <Link to='/baeq-social/rooms'>
                <div className="back-button">
                    <span className="material-symbols-rounded">arrow_back</span>
                    <span className="chat-nav-text">Выйти</span>
                </div>
            </Link>
            <div className="chat-members">
                <span className="material-symbols-rounded">groups</span>
                <span className="chat-nav-text">Участники комнаты</span>
                <div className="members">
                    {members.map(member => {
                        return <div key={member}>{member}</div>
                    })}
                </div>
            </div>

            <div className="game-buttons">
                <div onClick={() => sendZero()} className="zero">Обнулить счет</div>

                <div className="startGame" onClick={() => changeGameState()}>{gamePaused ? 'Начать игру' : 'Пауза'}</div>

                <div onClick={() => {setChatVisible(prev => !prev); setUnreadMsg(false)}} className={"toggle-chat " + (unreadMsg ? 'unread' : '')}>Чат</div>
            </div>





            <div className="points">{points.player1} : {points.player2}</div>


            <div className="game">
                <div style={amIFirstPlayer ? { top: myPlayer } : { top: enemyPlayer }} className="player-1"></div>
                <div style={amIFirstPlayer ? { top: enemyPlayer } : { top: myPlayer }} className="player-2"></div>
                <div style={{ top: ball.y, left: ball.x }} className="ball"></div>
            </div>

            <div className={"chat " + (!chatVisible ? 'hidden-chat' : '')}>
                <div ref={mContainer} className="messages-container">
                    {!messages.length && <h1 className="no-messages">Сообщений пока нет... Начните Вы!</h1>}
                    {messages.map(m => {
                        return <Message key={m.dateAndTime} mine={authUser?.username === m.sender} sender={m.sender} date={m.dateAndTime} text={m.messageText} />
                    })}
                </div>
                <div className="messages-form">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Введите текст сообщения..." type="text" />
                    <Button onClick={() => sendMessage()}>Отправить</Button>
                </div>
            </div>
        </div>
    )
}