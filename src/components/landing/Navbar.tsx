'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const setCurrentView = useStore((state) => state.setCurrentView)

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">AbsenKu</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fitur</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Harga</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimoni</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={() => setCurrentView('login')}>
              Masuk
            </Button>
            <Button onClick={() => setCurrentView('login')}>
              Coba Gratis
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-background border-b"
        >
          <div className="px-4 py-4 space-y-4">
            <a href="#features" className="block text-muted-foreground hover:text-foreground">Fitur</a>
            <a href="#pricing" className="block text-muted-foreground hover:text-foreground">Harga</a>
            <a href="#testimonials" className="block text-muted-foreground hover:text-foreground">Testimoni</a>
            <a href="#faq" className="block text-muted-foreground hover:text-foreground">FAQ</a>
            <div className="flex flex-col gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setCurrentView('login')}>Masuk</Button>
              <Button onClick={() => setCurrentView('login')}>Coba Gratis</Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
