import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: { id: string; name: string } | null
  position?: string | null
  avatar?: string | null
  manager?: { id: string; name: string; email: string } | null
  organization?: {
    id: string
    name: string
    slug: string
  } | null
}

export interface Attendance {
  id: string
  userId: string
  date: string
  clockIn: string | null
  clockOut: string | null
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'HOLIDAY'
  clockInLat?: number | null
  clockInLng?: number | null
  clockInAddress?: string | null
  clockInPhoto?: string | null
  clockOutLat?: number | null
  clockOutLng?: number | null
  clockOutAddress?: string | null
  clockOutPhoto?: string | null
  workHours?: number | null
  user?: {
    id: string
    name: string
    email: string
    position?: string | null
    department?: { id: string; name: string } | null
  }
}

export interface LeaveRequest {
  id: string
  userId: string
  type: 'ANNUAL' | 'SICK' | 'EMERGENCY' | 'MATERNITY' | 'PATERNITY' | 'MARRIAGE' | 'OTHER'
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  approvedBy?: string | null
  approver?: { id: string; name: string; email: string } | null
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
    position?: string | null
    department?: { id: string; name: string } | null
  }
}

export interface Department {
  id: string
  name: string
  description?: string | null
  manager?: { id: string; name: string; email: string } | null
  userCount?: number
}

export interface Holiday {
  id: string
  name: string
  date: string
  isRecurring: boolean
}

export interface Settings {
  // Work hours
  workStartTime: string
  workEndTime: string
  breakStartTime: string
  breakEndTime: string
  lateTolerance: number
  
  // Notifications
  notifyClockIn: boolean
  notifyClockOut: boolean
  notifyLate: boolean
  notifyLeave: boolean
  
  // Security
  requireGps: boolean
  requirePhoto: boolean
  gpsRadius: number
  
  // Location
  officeLatitude: number | null
  officeLongitude: number | null
  officeAddress: string | null
  
  // Organization
  orgName: string
  orgAddress: string | null
  orgPhone: string | null
  orgEmail: string | null
  orgLogo: string | null
}

// API Helper
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'API Error')
  }

  return data
}

// Store State Interface
interface AppState {
  // Auth
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Data
  users: any[]
  departments: Department[]
  attendances: Attendance[]
  leaveRequests: LeaveRequest[]
  holidays: Holiday[]
  
  // UI State
  currentView: 'landing' | 'login' | 'dashboard'
  
  // Settings
  settings: Settings | null
  
  // Actions
  checkSession: () => Promise<void>
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  setCurrentView: (view: 'landing' | 'login' | 'dashboard') => void
  
  // Attendance Actions
  clockIn: (location?: { latitude: number; longitude: number; address: string }, photo?: string) => Promise<{ success: boolean; message: string }>
  clockOut: (location?: { latitude: number; longitude: number; address: string }, photo?: string) => Promise<{ success: boolean; message: string }>
  fetchTodayAttendance: () => Promise<Attendance | null>
  fetchAttendanceHistory: (params?: { userId?: string; startDate?: string; endDate?: string }) => Promise<Attendance[]>
  
  // Leave Request Actions
  createLeaveRequest: (request: { type: string; startDate: string; endDate: string; reason: string }) => Promise<{ success: boolean; message: string }>
  approveLeaveRequest: (requestId: string) => Promise<{ success: boolean; message: string }>
  rejectLeaveRequest: (requestId: string, reason?: string) => Promise<{ success: boolean; message: string }>
  fetchLeaveRequests: (params?: { userId?: string; status?: string; pending?: boolean }) => Promise<LeaveRequest[]>
  
  // Department Actions
  fetchDepartments: () => Promise<Department[]>
  createDepartment: (data: { name: string; description?: string; managerId?: string }) => Promise<{ success: boolean; message: string }>
  updateDepartment: (id: string, data: { name?: string; description?: string; managerId?: string }) => Promise<{ success: boolean; message: string }>
  deleteDepartment: (id: string) => Promise<{ success: boolean; message: string }>
  
  // Employee Actions
  fetchEmployees: (params?: { role?: string; departmentId?: string; search?: string }) => Promise<any[]>
  createEmployee: (data: any) => Promise<{ success: boolean; message: string }>
  updateEmployee: (id: string, data: any) => Promise<{ success: boolean; message: string }>
  deleteEmployee: (id: string) => Promise<{ success: boolean; message: string }>
  
  // Report Actions
  fetchReport: (type: string, params?: any) => Promise<any>
  
  // Settings Actions
  fetchSettings: () => Promise<Settings | null>
  updateSettings: (settings: Partial<Settings>) => Promise<{ success: boolean; message: string }>
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentUser: null,
      isAuthenticated: false,
      isLoading: true,
      users: [],
      departments: [],
      attendances: [],
      leaveRequests: [],
      holidays: [],
      currentView: 'landing',
      settings: null,
      
      // Auth Actions
      checkSession: async () => {
        set({ isLoading: true })
        try {
          const data = await apiCall('/api/auth/session')
          if (data.success && data.user) {
            set({ 
              currentUser: data.user, 
              isAuthenticated: true, 
              currentView: 'dashboard',
              isLoading: false 
            })
          } else {
            set({ 
              currentUser: null, 
              isAuthenticated: false, 
              currentView: 'landing',
              isLoading: false 
            })
          }
        } catch {
          set({ 
            currentUser: null, 
            isAuthenticated: false, 
            currentView: 'landing',
            isLoading: false 
          })
        }
      },
      
      login: async (email: string, password: string) => {
        try {
          const data = await apiCall('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          })
          
          if (data.success) {
            set({ 
              currentUser: data.user, 
              isAuthenticated: true, 
              currentView: 'dashboard' 
            })
            return { success: true, message: data.message }
          }
          return { success: false, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      logout: async () => {
        try {
          await apiCall('/api/auth/logout', { method: 'POST' })
        } catch {
          // Ignore logout errors
        }
        set({ 
          currentUser: null, 
          isAuthenticated: false, 
          currentView: 'landing' 
        })
      },
      
      setCurrentView: (view) => set({ currentView: view }),
      
      // Attendance Actions
      clockIn: async (location, photo) => {
        try {
          const data = await apiCall('/api/attendance', {
            method: 'POST',
            body: JSON.stringify({
              action: 'clockIn',
              latitude: location?.latitude,
              longitude: location?.longitude,
              address: location?.address,
              photo,
            }),
          })
          
          if (data.success) {
            // Refresh attendance
            get().fetchTodayAttendance()
          }
          
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      clockOut: async (location, photo) => {
        try {
          const data = await apiCall('/api/attendance', {
            method: 'POST',
            body: JSON.stringify({
              action: 'clockOut',
              latitude: location?.latitude,
              longitude: location?.longitude,
              address: location?.address,
              photo,
            }),
          })
          
          if (data.success) {
            // Refresh attendance
            get().fetchTodayAttendance()
          }
          
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      fetchTodayAttendance: async () => {
        try {
          const today = new Date().toISOString().split('T')[0]
          const data = await apiCall(`/api/attendance?date=${today}`)
          if (data.success && data.data?.length > 0) {
            return data.data[0]
          }
          return null
        } catch {
          return null
        }
      },
      
      fetchAttendanceHistory: async (params) => {
        try {
          const query = new URLSearchParams()
          if (params?.userId) query.set('userId', params.userId)
          if (params?.startDate) query.set('startDate', params.startDate)
          if (params?.endDate) query.set('endDate', params.endDate)
          
          const data = await apiCall(`/api/attendance?${query.toString()}`)
          return data.success ? data.data : []
        } catch {
          return []
        }
      },
      
      // Leave Request Actions
      createLeaveRequest: async (request) => {
        try {
          const data = await apiCall('/api/leave', {
            method: 'POST',
            body: JSON.stringify(request),
          })
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      approveLeaveRequest: async (requestId) => {
        try {
          const data = await apiCall('/api/leave', {
            method: 'PUT',
            body: JSON.stringify({ id: requestId, action: 'approve' }),
          })
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      rejectLeaveRequest: async (requestId, reason) => {
        try {
          const data = await apiCall('/api/leave', {
            method: 'PUT',
            body: JSON.stringify({ id: requestId, action: 'reject', rejectedReason: reason }),
          })
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      fetchLeaveRequests: async (params) => {
        try {
          const query = new URLSearchParams()
          if (params?.userId) query.set('userId', params.userId)
          if (params?.status) query.set('status', params.status)
          if (params?.pending) query.set('pending', 'true')
          
          const data = await apiCall(`/api/leave?${query.toString()}`)
          return data.success ? data.data : []
        } catch {
          return []
        }
      },
      
      // Department Actions
      fetchDepartments: async () => {
        try {
          const data = await apiCall('/api/departments')
          return data.success ? data.data : []
        } catch {
          return []
        }
      },
      
      createDepartment: async (departmentData) => {
        try {
          const data = await apiCall('/api/departments', {
            method: 'POST',
            body: JSON.stringify(departmentData),
          })
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      updateDepartment: async (id, departmentData) => {
        try {
          const data = await apiCall('/api/departments', {
            method: 'PUT',
            body: JSON.stringify({ id, ...departmentData }),
          })
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      deleteDepartment: async (id) => {
        try {
          const data = await apiCall(`/api/departments?id=${id}`, {
            method: 'DELETE',
          })
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      // Employee Actions
      fetchEmployees: async (params) => {
        try {
          const query = new URLSearchParams()
          if (params?.role) query.set('role', params.role)
          if (params?.departmentId) query.set('departmentId', params.departmentId)
          if (params?.search) query.set('search', params.search)
          
          const data = await apiCall(`/api/employees?${query.toString()}`)
          return data.success ? data.data : []
        } catch {
          return []
        }
      },
      
      createEmployee: async (employeeData) => {
        try {
          const data = await apiCall('/api/employees', {
            method: 'POST',
            body: JSON.stringify(employeeData),
          })
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      updateEmployee: async (id, employeeData) => {
        try {
          const data = await apiCall('/api/employees', {
            method: 'PUT',
            body: JSON.stringify({ id, ...employeeData }),
          })
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      deleteEmployee: async (id) => {
        try {
          const data = await apiCall(`/api/employees?id=${id}`, {
            method: 'DELETE',
          })
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
      
      // Report Actions
      fetchReport: async (type, params) => {
        try {
          const query = new URLSearchParams({ type })
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              if (value) query.set(key, String(value))
            })
          }
          
          const data = await apiCall(`/api/reports?${query.toString()}`)
          return data.success ? data.data : null
        } catch {
          return null
        }
      },
      
      // Settings Actions
      fetchSettings: async () => {
        try {
          const data = await apiCall('/api/settings')
          if (data) {
            set({ settings: data })
            return data
          }
          return null
        } catch {
          return null
        }
      },
      
      updateSettings: async (settingsData) => {
        try {
          const data = await apiCall('/api/settings', {
            method: 'PUT',
            body: JSON.stringify(settingsData),
          })
          
          if (data.success) {
            // Refresh settings
            get().fetchSettings()
          }
          
          return { success: data.success, message: data.message }
        } catch (error: any) {
          return { success: false, message: error.message }
        }
      },
    }),
    {
      name: 'absensi-storage',
      partialize: (state) => ({
        // Don't persist auth state - use session cookies
      }),
    }
  )
)
