"use client"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function SubmitButton({ 
  children, 
  className,
  loadingText
}: { 
  children: React.ReactNode, 
  className?: string,
  loadingText?: React.ReactNode
}) {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      disabled={pending} 
      className={cn("disabled:opacity-50 flex items-center justify-center gap-2", className)}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {pending && loadingText ? loadingText : children}
    </button>
  )
}
