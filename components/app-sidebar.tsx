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
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <ShieldIcon className="size-5! text-primary" />
              <span className="text-base font-semibold">Herotic Security</span>
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
                if(pathname == item.url) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton className="bg-zinc-200 hover:bg-zinc-200" render={<Link href={item.url} />}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton render={<Link href={item.url} />}>
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
