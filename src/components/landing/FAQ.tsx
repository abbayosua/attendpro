'use client'

import { motion } from 'framer-motion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Bagaimana cara kerja AbsenKu?',
    answer: 'Karyawan dapat melakukan clock in/out melalui aplikasi web atau mobile. Sistem akan mencatat waktu secara real-time. HR dan manager dapat melihat laporan kehadiran, menyetujui cuti, dan mengelola data karyawan melalui dashboard.',
  },
  {
    question: 'Apakah data karyawan kami aman?',
    answer: 'Ya, keamanan data adalah prioritas utama kami. Semua data dienkripsi end-to-end, dan kami mengikuti standar keamanan ISO 27001. Data backup dilakukan setiap hari ke server yang terpisah.',
  },
  {
    question: 'Apakah bisa menggunakan GPS untuk validasi lokasi?',
    answer: 'Ya, AbsenKu mendukung GPS clock-in. Anda bisa mengatur radius lokasi kantor, dan sistem akan memvalidasi apakah karyawan berada di lokasi yang benar saat melakukan clock in/out.',
  },
  {
    question: 'Bagaimana dengan integrasi dengan sistem yang sudah ada?',
    answer: 'AbsenKu menyediakan API terbuka yang memudahkan integrasi dengan sistem HRIS, payroll, atau aplikasi lain yang sudah Anda gunakan. Tim kami juga siap membantu proses integrasi.',
  },
  {
    question: 'Apakah ada batasan jumlah karyawan?',
    answer: 'Paket Starter mendukung hingga 10 karyawan secara gratis. Paket Professional mendukung hingga 50 karyawan, sedangkan Enterprise tidak memiliki batasan jumlah karyawan.',
  },
  {
    question: 'Bagaimana proses migrasi dari sistem lama?',
    answer: 'Tim kami akan membantu proses migrasi data dari sistem lama Anda. Kami menyediakan template import data dan support dedicated untuk memastikan transisi berjalan lancar.',
  },
  {
    question: 'Apakah ada aplikasi mobile?',
    answer: 'Saat ini AbsenKu adalah web app yang sudah responsif dan bisa diakses dari browser smartphone manapun. Aplikasi mobile native sedang dalam pengembangan.',
  },
  {
    question: 'Bagaimana sistem pembayarannya?',
    answer: 'Pembayaran dilakukan secara bulanan atau tahunan melalui transfer bank atau kartu kredit. Untuk paket tahunan, Anda akan mendapat diskon 20%.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pertanyaan yang{' '}
            <span className="text-primary">Sering Diajukan</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Temukan jawaban untuk pertanyaan umum tentang AbsenKu.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
