'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useStore, type UserRole } from '@/store'

interface NavItem {
  icon: React.ElementType
  label: string
  view: string
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard', roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { icon: Clock, label: 'Absensi', view: 'attendance', roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { icon: Calendar, label: 'Cuti', view: 'leave', roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
  { icon: Building2, label: 'Departemen', view: 'departments', roles: ['SUPER_ADMIN', 'ADMIN', 'HR'] },
  { icon: Users, label: 'Karyawan', view: 'employees', roles: ['SUPER_ADMIN', 'ADMIN', 'HR'] },
  { icon: FileText, label: 'Laporan', view: 'reports', roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER'] },
  { icon: Settings, label: 'Pengaturan', view: 'settings', roles: ['SUPER_ADMIN', 'ADMIN'] },
]

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
}

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const currentUser = useStore((state) => state.currentUser)
  const logout = useStore((state) => state.logout)

  if (!currentUser) return null

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role))

  return (
    <motion.aside
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className={cn(
        'fixed left-0 top-0 h-screen bg-card border-r flex flex-col z-40 transition-all duration-300',
        isCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="bg-primary rounded-lg p-1.5">
                <Clock className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">AttendPro</span>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="shrink-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <Button
            key={item.view}
            variant={activeView === item.view ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start gap-3',
              isCollapsed && 'justify-center px-0'
            )}
            onClick={() => setActiveView(item.view)}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        ))}
      </nav>

      {/* User Info */}
      <div className="border-t p-3">
        <div className={cn(
          'flex items-center gap-3',
          isCollapsed && 'justify-center'
        )}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={currentUser.avatar || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="font-medium text-sm truncate">{currentUser.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{currentUser.role.toLowerCase().replace('_', ' ')}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-muted-foreground hover:text-foreground"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  )
}

// Header Component
export function Header() {
  const currentUser = useStore((state) => state.currentUser)

  if (!currentUser) return null

  return (
    <header className="h-16 bg-card border-b flex items-center justify-between px-6">
      <div>
        <h1 className="font-semibold">Selamat Datang, {currentUser.name.split(' ')[0]}! 👋</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">0</Badge>
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={currentUser.avatar || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
