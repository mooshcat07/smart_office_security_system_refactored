"use client"

import { toast } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

export default function Page() {
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function test() {
      try {
        const { data, error } = await authClient.getSession()

        if (error || !data?.user) {
          router.replace('/sign-in')
          return
        }

        router.replace('/dashboard')
      } catch (error) {
        toast.add({
          type: "error",
          title: "Authentication Error",
          description: error instanceof Error ? error.message : "Failed to authenticate user, Please restart the application.",
        })
        router.replace('/sign-in')
      } finally {
        setIsCheckingSession(false)
      }
    }

    test()
  }, [router])

  if (isCheckingSession) {
    return (
      <section className="relative items-center justify-center w-full h-screen grid">
        <h2>Authenticating user...</h2>
      </section>
    )
  }

  return null
}
