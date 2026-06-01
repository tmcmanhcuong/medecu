import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [authed, setAuthed] = useState(false)
    const [initializing, setInitializing] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (token) {
            setAuthed(true)
        }
        setInitializing(false)
    }, [])

    const login = () => {
        return new Promise((res) => {
            setAuthed(true)
            res()
        })
    }

    const logout = () => {
        return new Promise((res) => {
            setAuthed(false)
            res()
        })
    }

    return (
        <AuthContext.Provider value={{ authed, initializing, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export default function useAuth() {
    return useContext(AuthContext)
}