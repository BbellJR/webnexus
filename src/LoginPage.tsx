import React, { useState } from 'react'
import { supabase } from './supabase'

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

interface LoginPageProps {
  onLogin: (user: User) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await supabase.rpc('login_user', {
        p_username: username.trim(),
        p_password: password,
      })

      if (result.error) throw result.error

      const data = result.data as { status: string; message?: string; user?: User }

      if (data?.status === 'success' && data.user) {
        localStorage.setItem('saved_user', JSON.stringify(data.user))
        onLogin(data.user)
      } else {
        setError(data?.message ?? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่อีกครั้ง')
    }

    setIsLoading(false)
  }

  return (
    <div style={styles.container}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoCircle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                fill="white"
              />
            </svg>
          </div>
          <div style={styles.logoGlow} />
        </div>

        <h1 style={styles.title}>ยินดีต้อนรับ</h1>
        <p style={styles.subtitle}>เข้าสู่ระบบเพื่อดำเนินการต่อ</p>

        <form onSubmit={handleLogin} style={styles.form}>
          {/* Username */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                    fill="rgba(255,255,255,0.6)"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="กรอก Username"
                style={styles.input}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z"
                    fill="rgba(255,255,255,0.6)"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="กรอก Password"
                style={styles.input}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={styles.eyeBtn}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="rgba(255,255,255,0.6)" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 7C14.76 7 17 9.24 17 12C17 12.65 16.87 13.26 16.64 13.83L19.56 16.75C21.07 15.49 22.26 13.86 22.99 12C21.26 7.61 16.99 4.5 11.99 4.5C10.59 4.5 9.25 4.75 8.01 5.2L10.17 7.36C10.74 7.13 11.35 7 12 7ZM2 4.27L4.28 6.55L4.74 7.01C3.08 8.3 1.78 10.02 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.8 19.08L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8ZM11.84 9.02L14.99 12.17L15.01 12.01C15.01 10.35 13.67 9.01 12.01 9.01L11.84 9.02Z" fill="rgba(255,255,255,0.6)" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#ff6b6b" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Forgot password */}
          <div style={{ textAlign: 'right', marginBottom: '4px' }}>
            <button type="button" style={styles.forgotBtn}>ลืมรหัสผ่าน?</button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.submitBtn,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? (
              <span style={styles.spinner} />
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </form>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Sarabun', sans-serif; }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { outline: none; border-color: rgba(79,142,247,0.8) !important; box-shadow: 0 0 0 3px rgba(79,142,247,0.15); }
        button:hover:not(:disabled) { filter: brightness(1.1); }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Sarabun', sans-serif",
  },
  blob1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '-100px',
    right: '-100px',
    animation: 'blob 8s infinite',
  },
  blob2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    borderRadius: '50%',
    bottom: '-80px',
    left: '-80px',
    animation: 'blob 10s infinite 2s',
  },
  blob3: {
    position: 'absolute',
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    top: '50%',
    left: '20%',
    animation: 'blob 12s infinite 4s',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.12)',
    padding: '40px 36px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    animation: 'fadeIn 0.5s ease',
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
    position: 'relative',
  },
  logoCircle: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, rgba(79,142,247,0.3), rgba(99,102,241,0.3))',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  logoGlow: {
    position: 'absolute',
    width: '80px',
    height: '80px',
    background: 'rgba(79,142,247,0.3)',
    borderRadius: '50%',
    filter: 'blur(20px)',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  },
  title: {
    color: 'white',
    fontSize: '26px',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    fontWeight: 500,
    letterSpacing: '0.3px',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    padding: '13px 44px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '14px',
    color: 'white',
    fontSize: '15px',
    fontFamily: "'Sarabun', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    borderRadius: '6px',
    transition: 'filter 0.2s',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,107,107,0.12)',
    border: '1px solid rgba(255,107,107,0.3)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#ff9999',
    fontSize: '13px',
  },
  forgotBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: "'Sarabun', sans-serif",
    transition: 'color 0.2s',
  },
  submitBtn: {
    width: '100%',
    padding: '15px',
    background: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    border: 'none',
    borderRadius: '14px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: "'Sarabun', sans-serif",
    cursor: 'pointer',
    transition: 'filter 0.2s, opacity 0.2s, transform 0.1s',
    boxShadow: '0 4px 20px rgba(79,142,247,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '52px',
    letterSpacing: '0.5px',
  },
  spinner: {
    display: 'inline-block',
    width: '22px',
    height: '22px',
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
}
