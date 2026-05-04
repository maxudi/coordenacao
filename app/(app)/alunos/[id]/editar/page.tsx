'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button, Input, Select, Card, Alert, Spinner, useToast,
} from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface Turma {
  id:    string
  nome:  string
  serie: string
  turno: string
}

interface FormData {
  nome:           string
  dataNascimento: string
  turmaId:        string
  responsavel:    string
  telefone:       string
  email:          string
  status:         string
}

interface FormErrors { [k: string]: string }

const TURNO_LABEL: Record<string, string> = {
  manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral',
}

function validate(data: FormData): FormErrors {
  const e: FormErrors = {}
  if (!data.nome.trim()) e.nome = 'Nome obrigatório'
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    e.email = 'E-mail inválido'
  }
  return e
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function EditarAlunoPage() {
  const params = useParams()
  const id     = params?.id as string
  const router = useRouter()
  const { success, danger } = useToast()

  const [form, setForm] = useState<FormData>({
    nome: '', dataNascimento: '', turmaId: '',
    responsavel: '', telefone: '', email: '', status: 'ativo',
  })
  const [errors,       setErrors]       = useState<FormErrors>({})
  const [turmas,       setTurmas]       = useState<Turma[]>([])
  const [loading,      setLoading]      = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadErro,     setLoadErro]     = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      const [alunoRes, turmasRes] = await Promise.all([
        supabase
          .from('alunos')
          .select('nome, data_nascimento, turma_id, responsavel, telefone, email, status')
          .eq('id', id)
          .single(),
        supabase
          .from('turmas')
          .select('id, nome, serie, turno')
          .order('nome'),
      ])

      const aluno = alunoRes as any
      if (aluno.error || !aluno.data) {
        setLoadErro('Aluno não encontrado')
        setLoading(false)
        return
      }

      const a = aluno.data as any
      setForm({
        nome:           a.nome            ?? '',
        dataNascimento: a.data_nascimento ?? '',
        turmaId:        a.turma_id        ?? '',
        responsavel:    a.responsavel     ?? '',
        telefone:       a.telefone        ?? '',
        email:          a.email           ?? '',
        status:         a.status          ?? 'ativo',
      })
      setTurmas((turmasRes.data ?? []) as Turma[])
      setLoading(false)
    }

    fetchData()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    if (errors[name]) setErrors((p) => { const n = { ...p }; delete n[name]; return n })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const erros = validate(form)
    if (Object.keys(erros).length) { setErrors(erros); return }

    setIsSubmitting(true)
    const { error } = await (supabase as any)
      .from('alunos')
      .update({
        nome:            form.nome.trim(),
        data_nascimento: form.dataNascimento || null,
        turma_id:        form.turmaId        || null,
        responsavel:     form.responsavel.trim()  || null,
        telefone:        form.telefone.trim()      || null,
        email:           form.email.trim()         || null,
        status:          form.status as 'ativo' | 'inativo' | 'transferido',
      })
      .eq('id', id)

    if (error) { danger('Erro ao salvar', error.message) }
    else       { success('Aluno atualizado!'); router.push(`/alunos/${id}`) }

    setIsSubmitting(false)
  }

  if (loading) return (
    <div className="p-8 flex justify-center"><Spinner /></div>
  )
  if (loadErro) return (
    <div className="p-8 space-y-4">
      <Alert variant="danger" title="Erro" description={loadErro} />
      <Link href="/alunos"><Button variant="outline">← Voltar</Button></Link>
    </div>
  )

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="p-8 space-y-6 max-w-3xl">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link href={`/alunos/${id}`}>
          <Button variant="ghost" size="sm">← Voltar</Button>
        </Link>
        <div>
          <h1 className="text-display font-semibold text-ink">Editar aluno</h1>
          <p className="text-body text-ink-muted mt-0.5">{form.nome}</p>
        </div>
      </div>

      {hasErrors && (
        <Alert
          variant="danger"
          title="Corrija os erros"
          description={`${Object.keys(errors).length} campo(s) com erro antes de salvar.`}
        />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* 1. Dados pessoais */}
        <Card>
          <Card.Header>
            <h2 className="text-heading font-semibold text-ink">Dados pessoais</h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  name="nome"
                  label="Nome completo"
                  required
                  value={form.nome}
                  onChange={handleChange}
                  errorText={errors.nome}
                />
              </div>
              <Input
                name="dataNascimento"
                label="Data de nascimento"
                type="date"
                value={form.dataNascimento}
                onChange={handleChange}
              />
              <Select
                name="status"
                label="Status"
                value={form.status}
                onChange={handleChange}
                options={[
                  { value: 'ativo',       label: 'Ativo' },
                  { value: 'inativo',     label: 'Inativo' },
                  { value: 'transferido', label: 'Transferido' },
                ]}
              />
            </div>
          </Card.Body>
        </Card>

        {/* 2. Matrícula */}
        <Card>
          <Card.Header>
            <h2 className="text-heading font-semibold text-ink">Matrícula</h2>
          </Card.Header>
          <Card.Body>
            <Select
              name="turmaId"
              label="Turma"
              placeholder={turmas.length === 0 ? 'Nenhuma turma cadastrada' : 'Sem turma'}
              value={form.turmaId}
              onChange={handleChange}
              options={turmas.map((t) => ({
                value: t.id,
                label: `${t.nome} — ${t.serie} (${TURNO_LABEL[t.turno] ?? t.turno})`,
              }))}
            />
          </Card.Body>
        </Card>

        {/* 3. Responsável */}
        <Card>
          <Card.Header>
            <h2 className="text-heading font-semibold text-ink">Responsável</h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  name="responsavel"
                  label="Nome do responsável"
                  value={form.responsavel}
                  onChange={handleChange}
                />
              </div>
              <Input
                name="telefone"
                label="Telefone / WhatsApp"
                type="tel"
                value={form.telefone}
                onChange={handleChange}
              />
              <Input
                name="email"
                label="E-mail"
                type="email"
                value={form.email}
                onChange={handleChange}
                errorText={errors.email}
              />
            </div>
          </Card.Body>
        </Card>

        {/* RODAPÉ */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href={`/alunos/${id}`}>
            <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>

      </form>
    </div>
  )
}
