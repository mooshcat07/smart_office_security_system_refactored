"use client"

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import React, { ReactNode, useEffect, useState } from 'react'

export default function DashbordLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data, error } = await authClient.getSession();

                if (error || !data?.user) {
                    router.replace('/sign-in');
                    return;
                }

                setIsCheckingSession(false);
            } catch {
                router.replace('/sign-in');
            }
        };

        checkSession();
    }, [router]);

    if (isCheckingSession) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-sm text-muted-foreground">Checking session...</p>
            </div>
        );
    }

    return (
        <SidebarProvider
            style={
                {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
            >
                <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <section className='flex-1 relative'>
                    {children}
                </section>
            </SidebarInset>
        </SidebarProvider>
    )
}
