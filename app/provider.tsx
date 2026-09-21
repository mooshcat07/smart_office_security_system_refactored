"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import React from 'react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export default function Provider({ children }: { children: React.ReactNode }) {
  
  return (
    <ConvexProvider client={convex}>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ConvexProvider>
  )
}
