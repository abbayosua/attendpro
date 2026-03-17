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
    question: 'How does AttendPro work?',
    answer: 'Employees can clock in/out via web or mobile app. The system records time in real-time. HR and managers can view attendance reports, approve leave requests, and manage employee data through the dashboard.',
  },
  {
    question: 'Is our employee data secure?',
    answer: 'Ya, keamanan data adalah prioritas utama kami. Semua data dienkripsi end-to-end, dan kami mengikuti standar keamanan ISO 27001. Data backup dilakukan setiap hari ke server yang terpisah.',
  },
  {
    question: 'Can we use GPS for location validation?',
    answer: 'Yes, AttendPro supports GPS clock-in. You can set the office location radius, and the system will validate whether employees are at the correct location when clocking in/out.',
  },
  {
    question: 'How about integration with existing systems?',
    answer: 'AttendPro provides an open API that makes it easy to integrate with HRIS, payroll, or other applications you already use. Our team is also ready to help with the integration process.',
  },
  {
    question: 'Is there a limit on the number of employees?',
    answer: 'Paket Starter mendukung hingga 10 karyawan secara gratis. Paket Professional mendukung hingga 50 karyawan, sedangkan Enterprise tidak memiliki batasan jumlah karyawan.',
  },
  {
    question: 'How does the migration process work?',
    answer: 'Tim kami akan membantu proses migrasi data dari sistem lama Anda. Kami menyediakan template import data dan support dedicated untuk memastikan transisi berjalan lancar.',
  },
  {
    question: 'Is there a mobile app?',
    answer: 'Currently AttendPro is a responsive web app that can be accessed from any smartphone browser. A native mobile app is under development.',
  },
  {
    question: 'How does the payment system work?',
    answer: 'Payment is made monthly or annually via bank transfer or credit card. For annual packages, you get a 20% discount.',
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
            Temukan jawaban untuk pertanyaan umum tentang AttendPro.
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
