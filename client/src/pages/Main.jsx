import { Link, Routes, Route, Navigate } from "react-router-dom";
import { RoomsPage } from "./RoomsPage";
import { RoomPage } from "./RoomPage";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function Main() {
    const [authUser] = useContext(AuthContext)

    if (!authUser) return

    return (
        <main className="main">
            <Routes>
                <Route path="/baeq-pong/rooms" element={<RoomsPage />}/>
                <Route path="/baeq-pong/rooms/:id" element={<RoomPage />}/>
                <Route path="*" element={<Navigate to="/baeq-pong/rooms" />}/>
            </Routes>
        </main>
    )
}