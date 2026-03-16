'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore } from '@/store'
import { toast } from '@/hooks/use-toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const login = useStore((state) => state.login)
  const setCurrentView = useStore((state) => state.setCurrentView)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const result = await login(email, password)
    
    if (result.success) {
      toast({
        title: 'Login Berhasil!',
        description: 'Selamat datang di AbsenKu.',
      })
    } else {
      toast({
        title: 'Login Gagal',
        description: result.message,
        variant: 'destructive',
      })
    }
    
    setIsLoading(false)
  }

  const demoAccounts = [
    { email: 'admin@absensi.com', role: 'Admin' },
    { email: 'hr@absensi.com', role: 'HR' },
    { email: 'manager.engineering@absensi.com', role: 'Manager' },
    { email: 'john.doe@absensi.com', role: 'Karyawan' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full mx-auto"
        >
          {/* Back Button */}
          <Button 
            variant="ghost" 
            className="mb-8 -ml-2"
            onClick={() => setCurrentView('landing')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Beranda
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-primary rounded-lg p-2">
              <Clock className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">AbsenKu</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">Selamat Datang Kembali!</h1>
          <p className="text-muted-foreground mb-8">
            Masuk ke akun Anda untuk melanjutkan.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Demo akun untuk testing (password: <code className="bg-muted px-1 rounded">demo123</code>):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  variant="outline"
                  size="sm"
                  className="justify-start text-xs"
                  onClick={() => {
                    setEmail(account.email)
                    setPassword('demo123')
                  }}
                >
                  {account.role}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Belum punya akun?{' '}
            <a href="#" className="text-primary hover:underline">
              Hubungi admin
            </a>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Image/Pattern */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-1 bg-primary items-center justify-center"
      >
        <div className="max-w-md text-center text-primary-foreground p-12">
          <div className="bg-primary-foreground/10 rounded-2xl p-8 mb-8">
            <Clock className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">AbsenKu</h2>
            <p className="opacity-80">Manajemen Kehadiran Modern</p>
          </div>
          <p className="text-lg opacity-90">
            &quot;AbsenKu membantu kami menghemat 10+ jam per minggu dalam administrasi kehadiran.&quot;
          </p>
          <p className="mt-4 opacity-70">— HR Manager, PT. Teknologi Nusantara</p>
        </div>
      </motion.div>
    </div>
  )
}
