'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CvBasics } from '@/types/experience'

interface BasicsFormProps {
  value: CvBasics
  onChange: (value: CvBasics) => void
}

export function BasicsForm({ value, onChange }: BasicsFormProps) {
  function set(field: keyof CvBasics, val: string) {
    onChange({ ...value, [field]: val })
  }

  function setContact(field: keyof CvBasics['contact'], val: string) {
    onChange({ ...value, contact: { ...value.contact, [field]: val } })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Nombre completo</Label>
        <Input
          value={value.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          placeholder="Cristian Camilo Romero"
        />
      </div>

      <div className="rounded-md border border-border/60 p-4 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Contacto
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Input
              value={value.contact.city}
              onChange={(e) => setContact('city', e.target.value)}
              placeholder="Bogotá D.C"
            />
          </div>
          <div className="space-y-1.5">
            <Label>País / Estado</Label>
            <Input
              value={value.contact.state}
              onChange={(e) => setContact('state', e.target.value)}
              placeholder="Colombia"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={value.contact.email}
            onChange={(e) => setContact('email', e.target.value)}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input
              value={value.contact.phone}
              onChange={(e) => setContact('phone', e.target.value)}
              placeholder="+57 3001234567"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Dirección (opcional)</Label>
            <Input
              value={value.contact.address}
              onChange={(e) => setContact('address', e.target.value)}
              placeholder="Calle 123 #45-67"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Código postal (opcional)</Label>
          <Input
            value={value.contact.zip}
            onChange={(e) => setContact('zip', e.target.value)}
            placeholder="110111"
            className="max-w-[160px]"
          />
        </div>
      </div>
    </div>
  )
}
