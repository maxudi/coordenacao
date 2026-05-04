'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button, Input, Select, Card, Alert, useToast,
} from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface FormData {
  nome: string
  email: string
  telefone: string
  status: string
}

const FORM_INITIAL: FormData = {
  nome: '',
  email: '',
  telefone: '',
  status: 'ativo',
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NovoProfessorPage() {
  const router = useRouter()
  const { success, danger } = useToast()

  const [form, setForm] = useState<FormData>(FORM_INITIAL)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)

  // ── VALIDAÇÃO ─────────────────────────────────────────────────────────────
  function validar(): boolean {
    const novosErros: Record<string, string> = {}

    if (!form.nome.trim()) novosErros.nome = 'Campo obrigatório'
    if (!form.email.trim()) {
      novosErros.email = 'Campo obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      novosErros.email = 'E-mail inválido'
    }

    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setSalvando(true)

    const { error } = await (supabase as any)
      .from('professores')
      .insert({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.trim() || null,
        status: form.status,
      })

    if (error) {
      danger(error.message)
      setSalvando(false)
      return
    }

    success('Professor criado com sucesso!')
    router.push('/professores')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-display font-semibold text-ink">Novo professor</h1>
        <p className="text-body text-ink-muted mt-1">
          Cadastre um novo professor na escola
        </p>
      </div>

      {/* FORM */}
      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nome */}
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                Nome completo
              </label>
              <Input
                type="text"
                placeholder="Ex: João da Silva"
                value={form.nome}
                onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                className={erros.nome ? 'border-danger-300' : ''}
              />
              {erros.nome && <p className="text-caption text-danger-600 mt-1">{erros.nome}</p>}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="joao@escola.com.br"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className={erros.email ? 'border-danger-300' : ''}
              />
              {erros.email && <p className="text-caption text-danger-600 mt-1">{erros.email}</p>}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                Telefone (opcional)
              </label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.telefone}
                onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                Status
              </label>
              <Select
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                options={[
                  { value: 'ativo', label: 'Ativo' },
                  { value: 'inativo', label: 'Inativo' },
                ]}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Link href="/professores">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" isLoading={salvando}>
                Criar professor
              </Button>
            </div>

          </form>
        </Card.Body>
      </Card>

    </div>
  )
}
