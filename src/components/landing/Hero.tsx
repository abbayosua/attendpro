'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Clock, Users, BarChart3, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'

export function Hero() {
  const setCurrentView = useStore((state) => state.setCurrentView)

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-chart-1/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <CheckCircle className="h-4 w-4" />
              <span>Dipercaya 1000+ Perusahaan di Indonesia</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Kelola Absensi Karyawan{' '}
              <span className="text-primary">Lebih Mudah</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              Solusi modern untuk manajemen kehadiran karyawan. Clock-in/out digital, 
              pengajuan cuti, dan laporan real-time dalam satu platform yang intuitif.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={() => setCurrentView('login')} className="text-base">
                Mulai Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-base">
                Lihat Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t">
              <div>
                <div className="text-2xl md:text-3xl font-bold">1000+</div>
                <div className="text-sm text-muted-foreground">Perusahaan</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">50K+</div>
                <div className="text-sm text-muted-foreground">Karyawan</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden">
              {/* Header */}
              <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">AttendPro Dashboard</span>
                </div>
                <div className="text-sm opacity-80">Hari Ini</div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Status Card */}
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">Status Kehadiran</div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-300">Hadir</div>
                    </div>
                    <div className="bg-green-500 rounded-full p-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Clock In/Out */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Clock In</div>
                    <div className="text-xl font-bold text-primary">08:45</div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Clock Out</div>
                    <div className="text-xl font-bold">--:--</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-semibold">156</div>
                    <div className="text-xs text-muted-foreground">Hadir</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-semibold">12</div>
                    <div className="text-xs text-muted-foreground">Terlambat</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-semibold">8</div>
                    <div className="text-xs text-muted-foreground">Cuti</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -right-4 top-20 bg-card shadow-lg rounded-xl p-3 border hidden lg:block"
            >
              <div className="flex items-center gap-2">
                <div className="bg-green-500 rounded-full p-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm font-medium">Clock In Berhasil!</div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
              className="absolute -left-4 bottom-20 bg-card shadow-lg rounded-xl p-3 border hidden lg:block"
            >
              <div className="text-sm font-medium">Cuti Disetujui</div>
              <div className="text-xs text-muted-foreground">3 hari cuti tahunan</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
