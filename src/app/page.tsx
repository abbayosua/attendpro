'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { Pricing } from '@/components/landing/Pricing'
import { Testimonials } from '@/components/landing/Testimonials'
import { FAQ } from '@/components/landing/FAQ'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/landing/Footer'
import { LoginForm } from '@/components/auth/LoginForm'
import { Sidebar, Header } from '@/components/dashboard/Sidebar'
import { DashboardContent } from '@/components/dashboard/DashboardContent'
import { AttendanceContent } from '@/components/dashboard/AttendanceContent'
import { LeaveContent } from '@/components/dashboard/LeaveContent'
import { DepartmentsContent } from '@/components/dashboard/DepartmentsContent'
import { EmployeesContent } from '@/components/dashboard/EmployeesContent'
import { ReportsContent } from '@/components/dashboard/ReportsContent'
import { SettingsContent } from '@/components/dashboard/SettingsContent'

export default function Home() {
  const currentView = useStore((state) => state.currentView)
  const isAuthenticated = useStore((state) => state.isAuthenticated)
  const isLoading = useStore((state) => state.isLoading)
  const checkSession = useStore((state) => state.checkSession)
  
  const [activeDashboardView, setActiveDashboardView] = useState('dashboard')
  const [hasChecked, setHasChecked] = useState(false)

  useEffect(() => {
    if (!hasChecked) {
      checkSession().finally(() => setHasChecked(true))
    }
  }, [hasChecked, checkSession])

  // Loading state
  if (!hasChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Landing Page
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <Features />
          <Pricing />
          <Testimonials />
          <FAQ />
          <CTA />
        </main>
        <Footer />
      </div>
    )
  }

  // Login Page
  if (currentView === 'login' && !isAuthenticated) {
    return <LoginForm />
  }

  // Dashboard
  if (currentView === 'dashboard' && isAuthenticated) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Sidebar activeView={activeDashboardView} setActiveView={setActiveDashboardView} />
        <div className="ml-[260px] transition-all duration-300">
          <Header />
          <main className="p-6">
            {activeDashboardView === 'dashboard' && <DashboardContent />}
            {activeDashboardView === 'attendance' && <AttendanceContent />}
            {activeDashboardView === 'leave' && <LeaveContent />}
            {activeDashboardView === 'departments' && <DepartmentsContent />}
            {activeDashboardView === 'employees' && <EmployeesContent />}
            {activeDashboardView === 'reports' && <ReportsContent />}
            {activeDashboardView === 'settings' && <SettingsContent />}
          </main>
        </div>
      </div>
    )
  }

  // Fallback to login
  return <LoginForm />
}
