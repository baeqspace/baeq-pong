import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export function ChatItem({ roomId, users, lastMessage, newMsg }) {
    const [authUser] = useContext(AuthContext)

    const nav = useNavigate()

    return (
        <Link onClick={() => {if (users.length === 2) alert('Комната заполнена')} } to={users.length < 2 ? `/baeq-pong/rooms/${roomId}` : '/baeq-pong/rooms'}>
            <div className={`chat-item ${newMsg ? 'new-msg' : ''}`}>
                <div>{users.join(' ')}</div>
                <div className="chat-item-end">{users.length}/2</div>
            </div>
        </Link>
    )
}