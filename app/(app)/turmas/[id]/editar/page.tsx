'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button, Input, Select, Card, Spinner, Alert, useToast,
} from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Turma {
  id: string
  nome: string
  serie: string
  turno: string
  professor_id: string | null
}

interface FormData {
  nome: string
  serie: string
  turno: string
  professor_id: string
}

interface Professor {
  id: string
  nome: string
}

const SERIE_OPCOES = [
  { value: '1º Ano', label: '1º Ano' },
  { value: '2º Ano', label: '2º Ano' },
  { value: '3º Ano', label: '3º Ano' },
  { value: '4º Ano', label: '4º Ano' },
  { value: '5º Ano', label: '5º Ano' },
  { value: '6º Ano', label: '6º Ano' },
  { value: '7º Ano', label: '7º Ano' },
  { value: '8º Ano', label: '8º Ano' },
  { value: '9º Ano', label: '9º Ano' },
]

const TURNO_OPCOES = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
  { value: 'integral', label: 'Integral' },
]

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function EditarTurmaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { success, danger } = useToast()

  const [form, setForm] = useState<FormData>({ nome: '', serie: '', turno: 'manha', professor_id: '' })
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [errosForm, setErrosForm] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loadingProfs, setLoadingProfs] = useState(true)

  useEffect(() => {
    supabase
      .from('professores')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('nome')
      .then(({ data, error }) => {
        if (!error && data) setProfessores(data as Professor[])
        setLoadingProfs(false)
      })
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)

    supabase
      .from('turmas')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setErro(error?.message ?? 'Turma não encontrada')
          setLoading(false)
          return
        }
        const turma = data as Turma
        setForm({
          nome: turma.nome,
          serie: turma.serie,
          turno: turma.turno,
          professor_id: turma.professor_id ?? '',
        })
        setLoading(false)
      })
  }, [id])

  const professorOpcoes = professores.map(p => ({
    value: p.id,
    label: p.nome,
  }))

  function validar(): boolean {
    const novosErros: Record<string, string> = {}
    if (!form.nome.trim()) novosErros.nome = 'Campo obrigatório'
    if (!form.serie.trim()) novosErros.serie = 'Série obrigatória'
    if (!form.turno.trim()) novosErros.turno = 'Turno obrigatório'
    if (!form.professor_id.trim()) novosErros.professor_id = 'Professor obrigatório'
    setErrosForm(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setSalvando(true)

    const { error } = await supabase
      .from('turmas')
      .update({
        nome: form.nome.trim(),
        serie: form.serie.trim(),
        turno: form.turno,
        professor_id: form.professor_id,
      })
      .eq('id', id)

    if (error) {
      danger(error.message)
      setSalvando(false)
      return
    }

    success('Turma atualizada!')
    router.push(`/turmas/${id}`)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (erro) return <Alert variant="danger" title="Erro" description={erro} />

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="text-display font-semibold text-ink">Editar turma</h1>
        <p className="text-body text-ink-muted mt-1">
          Atualize os dados da turma
        </p>
      </div>

      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                Nome da turma
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
                Série
              </label>
              <Select
                value={form.serie}
                onChange={(e) => setForm(f => ({ ...f, serie: e.target.value }))}
                options={SERIE_OPCOES}
              />
              {errosForm.serie && <p className="text-caption text-danger-600 mt-1">{errosForm.serie}</p>}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                Turno
              </label>
              <Select
                value={form.turno}
                onChange={(e) => setForm(f => ({ ...f, turno: e.target.value }))}
                options={TURNO_OPCOES}
              />
              {errosForm.turno && <p className="text-caption text-danger-600 mt-1">{errosForm.turno}</p>}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">
                Professor responsável
              </label>
              <Select
                value={form.professor_id}
                onChange={(e) => setForm(f => ({ ...f, professor_id: e.target.value }))}
                options={[
                  { value: '', label: 'Selecione um professor' },
                  ...professorOpcoes,
                ]}
                disabled={loadingProfs}
              />
              {errosForm.professor_id && <p className="text-caption text-danger-600 mt-1">{errosForm.professor_id}</p>}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Link href={`/turmas/${id}`}>
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
