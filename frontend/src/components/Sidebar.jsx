import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import { BookOpen, Wallet, LayoutDashboard, Settings, LogOut } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/diary', icon: BookOpen, label: 'Diary' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

/* Desktop sidebar — hidden on mobile */
export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex w-64 bg-dark-900 border-r border-dark-700 flex-col shrink-0">
      <div className="p-5 border-b border-dark-700">
        <h1 className="text-xl font-bold text-brand-400 flex items-center gap-2">
          🩺 Doctor Daily
        </h1>
        <p className="text-xs text-dark-400 mt-1">Write messy. AI organizes.</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-600/20 text-brand-400 font-medium'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-700">
        <div className="text-sm text-dark-300 mb-2 truncate">{user?.username}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-dark-400 hover:text-red-400 transition-colors w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}

/* Mobile bottom tab bar */
export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 z-40 safe-area-bottom">
      <div className="flex justify-around items-center h-14">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors w-full h-full ${
                isActive
                  ? 'text-brand-400 font-medium'
                  : 'text-dark-400 active:text-dark-200'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
