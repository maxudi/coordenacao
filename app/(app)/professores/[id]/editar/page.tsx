'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button, Input, Select, Card, Spinner, Alert, useToast,
} from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Professor {
  id: string
  nome: string
  email: string
  telefone: string | null
  status: string
}

interface FormData {
  nome: string
  email: string
  telefone: string
  status: string
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function EditarProfessorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { success, danger } = useToast()

  const [form, setForm] = useState<FormData>({ nome: '', email: '', telefone: '', status: 'ativo' })
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [errosForm, setErrosForm] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    supabase
      .from('professores')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setErro(error?.message ?? 'Professor não encontrado')
          setLoading(false)
          return
        }
        const prof = data as Professor
        setForm({
          nome: prof.nome,
          email: prof.email,
          telefone: prof.telefone ?? '',
          status: prof.status ?? 'ativo',
        })
        setLoading(false)
      })
  }, [id])

  function validar(): boolean {
    const novosErros: Record<string, string> = {}
    if (!form.nome.trim()) novosErros.nome = 'Campo obrigatório'
    if (!form.email.trim()) {
      novosErros.email = 'Campo obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      novosErros.email = 'E-mail inválido'
    }
    setErrosForm(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setSalvando(true)

    const { error } = await supabase
      .from('professores')
      .update({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.trim() || null,
        status: form.status,
      })
      .eq('id', id)

    if (error) {
      danger(error.message)
      setSalvando(false)
      return
    }

    success('Professor atualizado!')
    router.push(`/professores/${id}`)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (erro) return <Alert variant="danger" title="Erro" description={erro} />

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="text-display font-semibold text-ink">Editar professor</h1>
        <p className="text-body text-ink-muted mt-1">
          Atualize os dados do professor
        </p>
      </div>

      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                Nome completo
              </label>
              <Input
                type="text"
                value={form.nome}
                onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                className={errosForm.nome ? 'border-danger-300' : ''}
              />
              {errosForm.nome && <p className="text-caption text-danger-600 mt-1">{errosForm.nome}</p>}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                E-mail
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className={errosForm.email ? 'border-danger-300' : ''}
              />
              {errosForm.email && <p className="text-caption text-danger-600 mt-1">{errosForm.email}</p>}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                Telefone (opcional)
              </label>
              <Input
                type="tel"
                value={form.telefone}
                onChange={(e) => setForm(f => ({ ...f, telefone: e.target.value }))}
              />
            </div>

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

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Link href={`/professores/${id}`}>
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" isLoading={salvando}>
                Atualizar
              </Button>
            </div>

          </form>
        </Card.Body>
      </Card>

    </div>
  )
}
