import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

interface User {
  user_id: number
  other_nickname: string
  other_fullname: string
  other_picture: string | null
}

interface CalEvent {
  create_id: number
  user_id: number
  calendar_detail: string
  calendar_date: string
}

interface UserColor {
  user_id: number
  color_code: string
}

interface Props {
  currentUser: User
  onLogout: () => void
}

const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน',
  'พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม',
  'กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
]
const DAY_LABELS = ['จ','อ','พ','พฤ','ศ','ส','อา']

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export default function CalendarPage({ currentUser, onLogout }: Props) {
  const now = new Date()
  const [focused, setFocused] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 })
  const [eventMap, setEventMap] = useState<Record<string, CalEvent[]>>({})
  const [colorMap, setColorMap] = useState<Record<number, string>>({})
  const [userMap, setUserMap] = useState<Record<number, { nickname: string; picture: string | null }>>({})
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newEvent, setNewEvent] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  // ─── Load ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    const { year, month } = focused
    const from = dateKey(year, month, 1)
    const lastDay = new Date(year, month, 0).getDate()
    const to = dateKey(year, month, lastDay)

    const [evRes, colRes, usrRes] = await Promise.all([
      supabase.from('calendar_daily').select('*').gte('calendar_date', from).lte('calendar_date', to),
      supabase.from('user_color').select('*'),
      supabase.from('other_user').select('user_id, other_nickname, other_picture'),
    ])

    const map: Record<string, CalEvent[]> = {}
    for (const e of (evRes.data ?? []) as CalEvent[]) {
      const k = e.calendar_date.substring(0, 10)
      if (!map[k]) map[k] = []
      map[k].push(e)
    }
    setEventMap(map)

    const cmap: Record<number, string> = {}
    for (const c of (colRes.data ?? []) as UserColor[]) cmap[c.user_id] = c.color_code
    setColorMap(cmap)

    const umap: Record<number, { nickname: string; picture: string | null }> = {}
    for (const u of (usrRes.data ?? []) as { user_id: number; other_nickname: string; other_picture: string | null }[]) {
      umap[u.user_id] = { nickname: u.other_nickname, picture: u.other_picture }
    }
    setUserMap(umap)

    setLoading(false)
  }, [focused])

  useEffect(() => { loadData() }, [loadData])

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const prevMonth = () => setFocused(f => f.month === 1 ? { year: f.year - 1, month: 12 } : { ...f, month: f.month - 1 })
  const nextMonth = () => setFocused(f => f.month === 12 ? { year: f.year + 1, month: 1 } : { ...f, month: f.month + 1 })

  const eventsForDay = (d: Date) => eventMap[dateKey(d.getFullYear(), d.getMonth() + 1, d.getDate())] ?? []

  const userColor = (uid: number) => `#${colorMap[uid] ?? '4f8ef7'}`

  const avatarUrl = (uid: number) => {
    const u = userMap[uid]
    if (!u?.picture) return null
    if (u.picture.startsWith('http')) return u.picture
    return `https://vbqktemiotutpuejrvqy.supabase.co/storage/v1/object/public/avatars/${u.picture}`
  }

  const handleDayClick = (d: Date) => {
    setSelectedDay(d)
    setNewEvent('')
    setShowSidebar(true)
  }

  const handleAddEvent = async () => {
    if (!newEvent.trim() || !selectedDay) return
    setAddLoading(true)
    await supabase.from('calendar_daily').insert({
      user_id: currentUser.user_id,
      calendar_detail: newEvent.trim(),
      calendar_date: dateKey(selectedDay.getFullYear(), selectedDay.getMonth() + 1, selectedDay.getDate()),
    })
    setNewEvent('')
    await loadData()
    setAddLoading(false)
  }

  const handleDelete = async (id: number) => {
    await supabase.from('calendar_daily').delete().eq('create_id', id)
    await loadData()
  }

  // ─── Calendar Grid Data ────────────────────────────────────────────────────

  const firstDay = new Date(focused.year, focused.month - 1, 1)
  const daysInMonth = new Date(focused.year, focused.month, 0).getDate()
  // Monday = 0 offset
  const startOffset = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > daysInMonth) return null
    return new Date(focused.year, focused.month - 1, dayNum)
  })

  const todayKey = dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const selectedKey = selectedDay ? dateKey(selectedDay.getFullYear(), selectedDay.getMonth() + 1, selectedDay.getDate()) : null
  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : []

  const myAvatarUrl = currentUser.other_picture
    ? currentUser.other_picture.startsWith('http')
      ? currentUser.other_picture
      : `https://vbqktemiotutpuejrvqy.supabase.co/storage/v1/object/public/avatars/${currentUser.other_picture}`
    : null

  const rows = totalCells / 7

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* ── Sidebar ── */}
      <aside style={{ ...s.sidebar, transform: showSidebar ? 'translateX(0)' : 'translateX(100%)' }}>
        <div style={s.sidebarHeader}>
          <div>
            <div style={s.sidebarDate}>
              {selectedDay
                ? `${selectedDay.getDate()} ${THAI_MONTHS[selectedDay.getMonth()]} ${selectedDay.getFullYear() + 543}`
                : '-'}
            </div>
            <div style={s.sidebarSub}>{selectedEvents.length} กิจกรรม</div>
          </div>
          <button style={s.closeBtn} onClick={() => setShowSidebar(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={s.sidebarEvents}>
          {selectedEvents.length === 0 ? (
            <div style={s.emptyEvents}>ไม่มีกิจกรรมในวันนี้</div>
          ) : (
            selectedEvents.map(ev => {
              const uid = ev.user_id
              const color = userColor(uid)
              const pic = avatarUrl(uid)
              const nick = userMap[uid]?.nickname ?? '?'
              return (
                <div key={ev.create_id} style={s.eventCard}>
                  <div style={{ ...s.eventStripe, background: color }} />
                  <div style={s.eventBody}>
                    <div style={s.eventDetail}>{ev.calendar_detail}</div>
                    <div style={s.eventOwner}>
                      {pic
                        ? <img src={pic} style={s.eventAvatar} alt="" />
                        : <div style={{ ...s.eventAvatarFallback, background: color }}>{nick[0]}</div>
                      }
                      <span style={s.eventNick}>{nick}</span>
                    </div>
                  </div>
                  {uid === currentUser.user_id && (
                    <button style={s.deleteBtn} onClick={() => handleDelete(ev.create_id)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H21M8 6V4H16V6M19 6L18.1 19.1C18 20.2 17.1 21 16 21H8C6.9 21 6 20.2 5.9 19.1L5 6" stroke="#ff6b6b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div style={s.addSection}>
          <div style={s.addLabel}>เพิ่มกิจกรรม</div>
          <textarea
            value={newEvent}
            onChange={e => setNewEvent(e.target.value)}
            placeholder="รายละเอียดกิจกรรม..."
            style={s.textarea}
            rows={3}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddEvent() }}
          />
          <button
            style={{ ...s.addBtn, opacity: addLoading ? 0.6 : 1 }}
            onClick={handleAddEvent}
            disabled={addLoading || !newEvent.trim()}
          >
            {addLoading ? <span style={s.miniSpinner} /> : '+ เพิ่มกิจกรรม'}
          </button>
        </div>
      </aside>

      {/* ── Backdrop ── */}
      {showSidebar && <div style={s.backdrop} onClick={() => setShowSidebar(false)} />}

      {/* ── Main ── */}
      <div style={s.main}>

        {/* ── Top Bar ── */}
        <header style={s.topBar}>
          <div style={s.topLeft}>
            <div style={s.appIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
              </svg>
            </div>
            <span style={s.appName}>MyApp</span>
          </div>

          <div style={s.monthNav}>
            <button style={s.navBtn} onClick={prevMonth}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div style={s.monthLabel}>
              <span style={s.monthThai}>{THAI_MONTHS[focused.month - 1]}</span>
              <span style={s.monthYear}>{focused.year + 543}</span>
              {loading && <span style={s.loadDot} />}
            </div>
            <button style={s.navBtn} onClick={nextMonth}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div style={s.topRight}>
            <button style={s.todayBtn} onClick={() => setFocused({ year: now.getFullYear(), month: now.getMonth() + 1 })}>
              วันนี้
            </button>
            <button style={s.avatarBtn} onClick={onLogout} title="ออกจากระบบ">
              {myAvatarUrl
                ? <img src={myAvatarUrl} style={s.topAvatar} alt="" />
                : <div style={s.topAvatarFallback}>{currentUser.other_nickname[0]}</div>
              }
            </button>
          </div>
        </header>

        {/* ── Day Headers ── */}
        <div style={s.dayHeaders}>
          {DAY_LABELS.map(d => (
            <div key={d} style={s.dayHeaderCell}>{d}</div>
          ))}
        </div>

        {/* ── Grid ── */}
        <div style={{ ...s.grid, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={s.emptyCell} />
            const key = dateKey(day.getFullYear(), day.getMonth() + 1, day.getDate())
            const isToday = key === todayKey
            const isSelected = key === selectedKey
            const events = eventsForDay(day)
            const isSunday = day.getDay() === 0

            return (
              <div
                key={i}
                style={{
                  ...s.dayCell,
                  ...(isToday ? s.todayCell : {}),
                  ...(isSelected ? s.selectedCell : {}),
                }}
                className="day-cell"
                onClick={() => handleDayClick(day)}
              >
                <div style={{
                  ...s.dayNum,
                  ...(isToday ? s.todayNum : {}),
                  ...(isSunday ? s.sundayNum : {}),
                }}>
                  {day.getDate()}
                </div>

                <div style={s.eventsList}>
                  {events.slice(0, 3).map(ev => (
                    <div
                      key={ev.create_id}
                      style={{
                        ...s.eventChip,
                        background: `${userColor(ev.user_id)}22`,
                        borderLeft: `2.5px solid ${userColor(ev.user_id)}`,
                        color: userColor(ev.user_id),
                      }}
                    >
                      {ev.calendar_detail}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div style={s.moreEvents}>+{events.length - 3} อื่นๆ</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    overflow: 'hidden',
    fontFamily: "'Sarabun', sans-serif",
    position: 'relative',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: '60px',
    flexShrink: 0,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.2)',
    backdropFilter: 'blur(10px)',
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '120px',
  },
  appIcon: {
    width: '34px',
    height: '34px',
    background: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: 'white',
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '0.3px',
  },
  monthNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navBtn: {
    width: '36px',
    height: '36px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  monthLabel: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    minWidth: '200px',
    justifyContent: 'center',
  },
  monthThai: {
    color: 'white',
    fontSize: '20px',
    fontWeight: 700,
  },
  monthYear: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '15px',
    fontWeight: 400,
  },
  loadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4f8ef7',
    display: 'inline-block',
    animation: 'pulse 1s infinite',
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: '120px',
    justifyContent: 'flex-end',
  },
  todayBtn: {
    padding: '7px 16px',
    background: 'rgba(79,142,247,0.15)',
    border: '1px solid rgba(79,142,247,0.4)',
    borderRadius: '10px',
    color: '#4f8ef7',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Sarabun', sans-serif",
    transition: 'background 0.2s',
  },
  avatarBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    borderRadius: '50%',
  },
  topAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.3)',
  },
  topAvatarFallback: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    border: '2px solid rgba(255,255,255,0.3)',
  },
  dayHeaders: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  dayHeaderCell: {
    textAlign: 'center',
    padding: '10px 0',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  grid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    overflow: 'hidden',
  },
  emptyCell: {
    borderRight: '1px solid rgba(255,255,255,0.04)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(0,0,0,0.1)',
  },
  dayCell: {
    borderRight: '1px solid rgba(255,255,255,0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    padding: '8px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'relative',
  },
  todayCell: {
    background: 'rgba(79,142,247,0.08)',
    borderColor: 'rgba(79,142,247,0.2)',
  },
  selectedCell: {
    background: 'rgba(99,102,241,0.15)',
    borderColor: 'rgba(99,102,241,0.3)',
  },
  dayNum: {
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.75)',
    flexShrink: 0,
  },
  todayNum: {
    background: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    color: 'white',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(79,142,247,0.5)',
  },
  sundayNum: {
    color: '#ff6b6b',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  eventChip: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: 500,
    lineHeight: '1.4',
  },
  moreEvents: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.4)',
    padding: '1px 4px',
  },

  // Sidebar
  sidebar: {
    position: 'fixed',
    right: 0,
    top: 0,
    width: '320px',
    height: '100vh',
    background: 'rgba(15,25,50,0.96)',
    backdropFilter: 'blur(20px)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 99,
    background: 'rgba(0,0,0,0.3)',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  sidebarDate: {
    color: 'white',
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '2px',
  },
  sidebarSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '12px',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  sidebarEvents: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  emptyEvents: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: '13px',
    textAlign: 'center',
    padding: '32px 0',
  },
  eventCard: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.07)',
    overflow: 'hidden',
    position: 'relative',
  },
  eventStripe: {
    width: '3px',
    flexShrink: 0,
  },
  eventBody: {
    flex: 1,
    padding: '10px 12px',
    minWidth: 0,
  },
  eventDetail: {
    color: 'white',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '6px',
    lineHeight: 1.4,
  },
  eventOwner: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  eventAvatar: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  eventAvatarFallback: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    color: 'white',
    fontWeight: 700,
    flexShrink: 0,
  },
  eventNick: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
  },
  deleteBtn: {
    padding: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'center',
    opacity: 0.7,
    transition: 'opacity 0.2s',
  },
  addSection: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  addLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  textarea: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '13px',
    fontFamily: "'Sarabun', sans-serif",
    padding: '10px 12px',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
    boxSizing: 'border-box',
  },
  addBtn: {
    width: '100%',
    padding: '11px',
    background: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'Sarabun', sans-serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    boxShadow: '0 4px 15px rgba(79,142,247,0.3)',
  },
  miniSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { overflow: hidden; }

  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes spin { to { transform: rotate(360deg); } }

  .day-cell:hover { background: rgba(255,255,255,0.04) !important; }
  textarea::placeholder { color: rgba(255,255,255,0.25); }
  textarea:focus { border-color: rgba(79,142,247,0.6) !important; box-shadow: 0 0 0 3px rgba(79,142,247,0.1); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
`
