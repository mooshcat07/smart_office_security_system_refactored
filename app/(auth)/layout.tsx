"use client";

import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

export default function AuthLayout({children}: {children: React.ReactNode}) {
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const router = useRouter(); 

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data, error } = await authClient.getSession();

                if (error || !data?.user) {
                    setIsCheckingSession(false);
                    return;
                }

                router.replace('/dashboard');
            } catch(error) {
                toast.add({
                    type: "error",
                    title: "Authentication Error",
                    description: error instanceof Error ? error.message : "Failed to authenticate.",
                })
                setIsCheckingSession(false);
            }
        }

        checkAuth();
    }, [router])

    if (isCheckingSession) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-muted-foreground">Checking session...</p>
            </div>
        );
    }

    return children;
}
