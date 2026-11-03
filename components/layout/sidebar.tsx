'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  FileOutput,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Settings2,
  User,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useClerk, useUser } from '@clerk/nextjs'
import { clearDbInstance } from '@/lib/db'
import { useAuth } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navItems = [
  { href: '/applications', label: 'Postulaciones', icon: LayoutDashboard },
  { href: '/experience', label: 'Mi Experiencia', icon: FileText },
  { href: '/cv-generator', label: 'Generar CV', icon: Sparkles },
  { href: '/cvs', label: 'Mis CVs', icon: FileOutput },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { userId } = useAuth()
  const { user } = useUser()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === '1')
    } catch {}
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      try {
        localStorage.setItem('sidebar-collapsed', prev ? '0' : '1')
      } catch {}
      return !prev
    })
  }

  function handleLogout() {
    if (userId) clearDbInstance(userId)
    signOut({ redirectUrl: '/login' })
  }

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (user?.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() ?? '??')

  const displayName = user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? ''
  const email = user?.emailAddresses?.[0]?.emailAddress ?? ''

  return (
    <aside
      className={cn(
        'border-border bg-background flex h-full flex-col border-r transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center', collapsed ? 'justify-center' : 'gap-3 px-5')}>
        {!collapsed && (
          <>
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <FileText className="text-primary-foreground h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">CV Generator</span>
          </>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Plegar menú'}
          title={collapsed ? 'Expandir menú' : 'Plegar menú'}
          className={cn(
            'text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors',
            !collapsed && '-mr-2 ml-auto'
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className={cn('flex-1 space-y-1 py-4', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname && (pathname === href || pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-current')}
              />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User menu */}
      <div className={cn('py-3', collapsed ? 'px-2' : 'px-3')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'hover:bg-muted flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors',
                collapsed && 'justify-center px-0'
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.imageUrl} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm leading-tight font-medium">{displayName}</p>
                  {displayName !== email && (
                    <p className="text-muted-foreground truncate text-xs leading-tight">{email}</p>
                  )}
                </div>
              )}
              {!collapsed && <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="right" align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="text-muted-foreground truncate text-xs">{email}</p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Apariencia submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                {mounted && theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : mounted && theme === 'light' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                Apariencia
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
                  <Sun className="h-4 w-4" /> Claro
                  {mounted && theme === 'light' && <span className="text-primary ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                  <Moon className="h-4 w-4" /> Oscuro
                  {mounted && theme === 'dark' && <span className="text-primary ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
                  <Monitor className="h-4 w-4" /> Sistema
                  {mounted && theme === 'system' && <span className="text-primary ml-auto">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            {/* Modelo de IA */}
            <DropdownMenuItem asChild className="gap-2">
              <Link href="/settings">
                <Settings2 className="h-4 w-4" />
                Modelo de IA
              </Link>
            </DropdownMenuItem>

            {/* Perfil */}
            <DropdownMenuItem asChild className="gap-2">
              <Link href="/profile">
                <User className="h-4 w-4" />
                Mi perfil
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Cerrar sesión */}
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
