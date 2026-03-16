'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'

export function CTA() {
  const setCurrentView = useStore((state) => state.setCurrentView)

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary rounded-3xl p-8 md:p-12 text-center text-primary-foreground"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Siap Memulai?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Bergabung dengan 1000+ perusahaan yang telah mempercayakan manajemen kehadiran mereka kepada AbsenKu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-base"
              onClick={() => setCurrentView('login')}
            >
              Daftar Gratis Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10"
            >
              Jadwalkan Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
