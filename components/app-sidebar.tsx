"use client"

import * as React from "react"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ShieldCheckIcon,
  ActivityIcon,
  BellIcon,
  UsersIcon,
  CpuIcon,
  Settings2Icon,
  CircleHelpIcon,
  ShieldIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navItems = [
  { title: "Dashboard",        url: "/dashboard",               icon: LayoutDashboardIcon },
  { title: "Access Logs",      url: "/dashboard/access-logs",   icon: ShieldCheckIcon },
  { title: "Motion Events",    url: "/dashboard/motion-events", icon: ActivityIcon },
  { title: "Alarms",           url: "/dashboard/alarms",        icon: BellIcon },
  { title: "Registered Users", url: "/dashboard/users",         icon: UsersIcon },
  { title: "Devices",          url: "/dashboard/devices",       icon: CpuIcon },
]

const navSecondaryItems = [
  { title: "Settings", url: "#", icon: <Settings2Icon className="size-4" /> },
  { title: "Help",     url: "#", icon: <CircleHelpIcon className="size-4" /> },
]

const user = {
  name: "Admin",
  email: "admin@herotic.mw",
  avatar: "",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5! gap-2.5"
              render={<a href="/dashboard" />}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <ShieldIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-sm font-semibold tracking-tight">Herotic Security</span>
                <span className="text-[11px] text-muted-foreground">Access Control</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className={
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent font-medium"
                          : "hover:bg-sidebar-accent/60"
                      }
                      render={<Link href={item.url} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
