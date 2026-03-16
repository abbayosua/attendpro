'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const testimonials = [
  {
    name: 'Budi Santoso',
    role: 'HR Manager',
    company: 'PT. Teknologi Nusantara',
    image: '',
    content: 'AbsenKu sangat membantu kami mengelola kehadiran 200+ karyawan. Laporan real-time membuat pekerjaan HR jadi lebih efisien.',
    rating: 5,
  },
  {
    name: 'Siti Rahayu',
    role: 'CEO',
    company: 'Startup Digital Indonesia',
    image: '',
    content: 'Sejak menggunakan AbsenKu, proses approval cuti jadi jauh lebih cepat. Tidak ada lagi email bolak-balik yang membuang waktu.',
    rating: 5,
  },
  {
    name: 'Ahmad Wijaya',
    role: 'Operations Director',
    company: 'Retail Mart Indonesia',
    image: '',
    content: 'Fitur GPS clock-in membantu kami memastikan karyawan di cabang benar-benar hadir di lokasi kerja. Sangat akurat!',
    rating: 5,
  },
  {
    name: 'Diana Putri',
    role: 'Finance Manager',
    company: 'Konsultan Mandiri',
    image: '',
    content: 'Integrasi dengan sistem payroll kami sangat mudah. Data kehadiran langsung sinkron tanpa input manual.',
    rating: 5,
  },
  {
    name: 'Eko Prasetyo',
    role: 'IT Manager',
    company: 'Bank Digital Sejahtera',
    image: '',
    content: 'Keamanan data adalah prioritas kami. AbsenKu memenuhi standar keamanan yang kami butuhkan untuk data karyawan.',
    rating: 5,
  },
  {
    name: 'Maya Anggraini',
    role: 'People Operations',
    company: 'E-Commerce Terpercaya',
    image: '',
    content: 'Tim support AbsenKu sangat responsif. Setiap pertanyaan dijawab dengan cepat dan solutif.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Dipercaya oleh{' '}
            <span className="text-primary">1000+ Perusahaan</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lihat bagaimana AbsenKu membantu perusahaan lain mengelola kehadiran karyawan mereka.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 border"
            >
              <Quote className="h-8 w-8 text-primary/20 mb-4" />
              
              <p className="text-muted-foreground mb-6">
                &quot;{testimonial.content}&quot;
              </p>

              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={testimonial.image} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>

              <div className="flex gap-1 mt-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
