'use client'

import { motion } from 'framer-motion'
import { Clock, Users, FileText, BarChart3, Bell, Shield, Smartphone, Zap } from 'lucide-react'

const features = [
  {
    icon: Clock,
    title: 'Clock In/Out Digital',
    description: 'Rekam kehadiran dengan satu klik. Lengkapi dengan lokasi GPS untuk validasi otomatis.',
    color: 'bg-green-500/10 text-green-500',
  },
  {
    icon: FileText,
    title: 'Pengajuan Cuti Online',
    description: 'Ajukan cuti kapan saja. Approval otomatis ke atasan dengan notifikasi real-time.',
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: BarChart3,
    title: 'Laporan Real-time',
    description: 'Dashboard analitik lengkap. Rekap kehadiran, keterlambatan, dan cuti dalam sekali klik.',
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: Users,
    title: 'Manajemen Karyawan',
    description: 'Kelola data karyawan, departemen, dan struktur organisasi dengan mudah.',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    icon: Bell,
    title: 'Notifikasi Otomatis',
    description: 'Reminder clock in/out, pengingat cuti, dan alert keterlambatan otomatis.',
    color: 'bg-pink-500/10 text-pink-500',
  },
  {
    icon: Shield,
    title: 'Keamanan Data',
    description: 'Enkripsi end-to-end dan backup otomatis. Data aman sesuai standar ISO 27001.',
    color: 'bg-red-500/10 text-red-500',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Akses dari smartphone, tablet, atau desktop. UI responsif di semua perangkat.',
    color: 'bg-cyan-500/10 text-cyan-500',
  },
  {
    icon: Zap,
    title: 'Integrasi Mudah',
    description: 'API terbuka untuk integrasi dengan sistem HRIS, payroll, dan aplikasi lainnya.',
    color: 'bg-yellow-500/10 text-yellow-500',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Fitur Lengkap untuk{' '}
            <span className="text-primary">Bisnis Anda</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Semua yang Anda butuhkan untuk mengelola kehadiran karyawan dalam satu platform yang terintegrasi.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 border hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
