"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function MainAppWrapper({ children }: { children: React.ReactNode }) {
  const [isModalActive, setIsModalActive] = useState(false)

  useEffect(() => {
    const checkHash = () => {
      setIsModalActive(window.location.hash === '#login')
    }
    
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  return (
    <motion.main
      animate={{ 
        scale: isModalActive ? 0.98 : 1,
        filter: isModalActive ? 'blur(4px)' : 'blur(0px)',
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex-1 w-full flex flex-col min-h-screen origin-top transition-colors duration-300"
    >
      {children}
    </motion.main>
  )
}
