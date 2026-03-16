'use client'

import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/store'

const plans = [
  {
    name: 'Starter',
    price: 'Gratis',
    period: '',
    description: 'Untuk bisnis kecil yang baru mulai.',
    features: [
      'Hingga 10 karyawan',
      'Clock In/Out dasar',
      'Laporan kehadiran bulanan',
      '1 admin',
      'Support email',
    ],
    cta: 'Mulai Gratis',
    popular: false,
  },
  {
    name: 'Professional',
    price: 'Rp 99.000',
    period: '/bulan',
    description: 'Untuk perusahaan yang sedang berkembang.',
    features: [
      'Hingga 50 karyawan',
      'Semua fitur Starter',
      'Pengajuan cuti online',
      'Manajemen departemen',
      'Laporan real-time',
      '5 admin/manager',
      'Support prioritas',
    ],
    cta: 'Coba 14 Hari Gratis',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Rp 299.000',
    period: '/bulan',
    description: 'Untuk perusahaan besar dengan kebutuhan khusus.',
    features: [
      'Unlimited karyawan',
      'Semua fitur Professional',
      'Integrasi API',
      'Custom branding',
      'SSO/SAML',
      'Unlimited admin',
      'Dedicated support',
      'SLA 99.99%',
    ],
    cta: 'Hubungi Sales',
    popular: false,
  },
]

export function Pricing() {
  const setCurrentView = useStore((state) => state.setCurrentView)

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pilih Paket yang{' '}
            <span className="text-primary">Sesuai Kebutuhan</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Harga transparan tanpa biaya tersembunyi. Upgrade atau downgrade kapan saja.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-card rounded-2xl border p-8 ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Paling Populer
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => setCurrentView('login')}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
