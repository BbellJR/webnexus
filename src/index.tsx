import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import LoginPage from './LoginPage'
import CalendarPage from './CalendarPage'

interface User {
  user_id: number
  other_username: string
  other_fullname: string
  other_nickname: string
  other_email: string
  other_gender: number
  other_picture: string | null
  other_dep: number
  other_role: number
  other_status: number
}

function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('saved_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) }
      catch { localStorage.removeItem('saved_user') }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('saved_user')
    setUser(null)
  }

  if (!user) return <LoginPage onLogin={setUser} />

  return <CalendarPage currentUser={user} onLogout={handleLogout} />
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode><App /></React.StrictMode>
)
