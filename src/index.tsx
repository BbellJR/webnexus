import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import LoginPage from './LoginPage'

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
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem('saved_user')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('saved_user')
    setUser(null)
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Sarabun', sans-serif",
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '40px',
        textAlign: 'center',
        color: 'white',
      }}>
        <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>
          สวัสดี, {user.other_nickname} 👋
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
          {user.other_fullname}
        </p>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 28px',
            background: 'rgba(255,107,107,0.2)',
            border: '1px solid rgba(255,107,107,0.4)',
            borderRadius: '12px',
            color: '#ff9999',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: "'Sarabun', sans-serif",
          }}
        >
          ออกจากระบบ
        </button>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');`}</style>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
