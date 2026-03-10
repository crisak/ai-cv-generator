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

  useEffect(() => setMounted(true), [])

  function handleLogout() {
    if (userId) clearDbInstance(userId)
    signOut({ redirectUrl: '/login' })
  }

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() ?? '??'

  const displayName = user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? ''
  const email = user?.emailAddresses?.[0]?.emailAddress ?? ''

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <FileText className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold tracking-tight">CV Generator</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname && (pathname === href || pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon
                className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-current')}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User menu */}
      <div className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.imageUrl} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
                {displayName !== email && (
                  <p className="truncate text-xs text-muted-foreground leading-tight">{email}</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="right" align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
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
                  {mounted && theme === 'light' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                  <Moon className="h-4 w-4" /> Oscuro
                  {mounted && theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
                  <Monitor className="h-4 w-4" /> Sistema
                  {mounted && theme === 'system' && <span className="ml-auto text-primary">✓</span>}
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
              className="gap-2 text-destructive focus:text-destructive"
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
