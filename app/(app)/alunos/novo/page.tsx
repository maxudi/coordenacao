'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button, Input, Select, Textarea,
  Card, Alert, Upload, useToast, Spinner,
} from '@/components/ui'
import { supabase } from '@/lib/supabase'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Turma {
  id:    string
  nome:  string
  serie: string
  turno: string
}

const TURNO_LABEL: Record<string, string> = {
  manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral',
}

interface FormData {
  // Dados pessoais
  nomeCompleto:   string
  dataNascimento: string
  cpfAluno:       string
  naturalidade:   string
  // Endereço
  cep:            string
  logradouro:     string
  numero:         string
  bairro:         string
  cidade:         string
  uf:             string
  // Matrícula
  turmaId:         string
  // Responsável
  nomeResponsavel: string
  parentesco:      string
  telefone:        string
  email:           string
}

interface FormErrors {
  [key: string]: string
}

const FORM_INITIAL: FormData = {
  nomeCompleto:    '',
  dataNascimento:  '',
  cpfAluno:        '',
  naturalidade:    '',
  cep:             '',
  logradouro:      '',
  numero:          '',
  bairro:          '',
  cidade:          '',
  uf:              '',
  turmaId:         '',
  nomeResponsavel: '',

  parentesco:      '',
  telefone:        '',
  email:           '',
}

// ─── VALIDAÇÃO ────────────────────────────────────────────────────────────────

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {}

  if (!data.nomeCompleto.trim())    errors.nomeCompleto    = 'Nome completo é obrigatório'
  if (!data.dataNascimento)         errors.dataNascimento  = 'Data de nascimento é obrigatória'
  if (!data.nomeResponsavel.trim()) errors.nomeResponsavel = 'Nome do responsável é obrigatório'
  if (!data.parentesco)             errors.parentesco      = 'Selecione o parentesco'
  if (!data.telefone.trim())        errors.telefone        = 'Telefone é obrigatório'

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'E-mail inválido'
  }

  return errors
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function NovoAlunoPage() {
  const router        = useRouter()
  const { success, danger } = useToast()

  const [form,          setForm]          = useState<FormData>(FORM_INITIAL)
  const [errors,        setErrors]        = useState<FormErrors>({})
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [documentos,    setDocumentos]    = useState<File[]>([])
  const [turmas,        setTurmas]        = useState<Turma[]>([])
  const [loadingTurmas, setLoadingTurmas] = useState(true)

  useEffect(() => {
    supabase
      .from('turmas')
      .select('id, nome, serie, turno')
      .order('nome')
      .then(({ data }) => { setTurmas((data ?? []) as Turma[]); setLoadingTurmas(false) })
  }, [])

  // ── Campo genérico ────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Limpa o erro do campo ao editar
    if (errors[name]) {
      setErrors((prev) => { const next = { ...prev }; delete next[name]; return next })
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const erros = validate(form)
    if (Object.keys(erros).length > 0) {
      setErrors(erros)
      return
    }

    setIsSubmitting(true)

    try {
      const matricula = `MAT${Date.now().toString().slice(-8)}`
      const { error } = await supabase.from('alunos').insert({
        matricula,
        nome:            form.nomeCompleto.trim(),
        data_nascimento: form.dataNascimento || null,
        turma_id:        form.turmaId || null,
        responsavel:     form.nomeResponsavel.trim() || null,
        telefone:        form.telefone.trim() || null,
        email:           form.email.trim() || null,
        status:          'ativo' as const,
      })
      if (error) throw error
      success('Aluno cadastrado!', `${form.nomeCompleto} foi adicionado ao sistema.`)
      router.push('/alunos')
    } catch (err: any) {
      danger('Erro ao salvar', err?.message ?? 'Verifique os dados e tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="p-8 space-y-6 max-w-4xl">

      {/* ── Cabeçalho ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link href="/alunos">
          <Button variant="ghost" size="sm">
            ← Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-display font-semibold text-ink">Novo aluno</h1>
          <p className="text-body text-ink-muted mt-0.5">Preencha os dados para cadastrar um novo aluno</p>
        </div>
      </div>

      {/* ── Alerta de erros ───────────────────────────────────────────────── */}
      {hasErrors && (
        <Alert
          variant="danger"
          title="Corrija os erros abaixo"
          description={`${Object.keys(errors).length} campo(s) precisam de atenção antes de salvar.`}
        />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">

        {/* ── 1. Dados pessoais ──────────────────────────────────────────── */}
        <Card>
          <Card.Header>
            <h2 className="text-heading font-semibold text-ink">Dados pessoais</h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  name="nomeCompleto"
                  label="Nome completo"
                  required
                  placeholder="Ex: João da Silva Pereira"
                  value={form.nomeCompleto}
                  onChange={handleChange}
                  errorText={errors.nomeCompleto}
                />
              </div>
              <Input
                name="dataNascimento"
                label="Data de nascimento"
                required
                type="date"
                value={form.dataNascimento}
                onChange={handleChange}
                errorText={errors.dataNascimento}
              />
              <Input
                name="cpfAluno"
                label="CPF do aluno"
                placeholder="000.000.000-00"
                value={form.cpfAluno}
                onChange={handleChange}
                errorText={errors.cpfAluno}
              />
              <div className="sm:col-span-2">
                <Input
                  name="naturalidade"
                  label="Naturalidade"
                  placeholder="Cidade/UF"
                  value={form.naturalidade}
                  onChange={handleChange}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ── 2. Endereço ───────────────────────────────────────────────── */}
        <Card>
          <Card.Header>
            <h2 className="text-heading font-semibold text-ink">Endereço</h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Input
                  name="cep"
                  label="CEP"
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={handleChange}
                />
              </div>
              <div className="sm:col-span-4">
                <Input
                  name="logradouro"
                  label="Logradouro"
                  placeholder="Rua, Avenida..."
                  value={form.logradouro}
                  onChange={handleChange}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  name="numero"
                  label="Número"
                  placeholder="123"
                  value={form.numero}
                  onChange={handleChange}
                />
              </div>
              <div className="sm:col-span-4">
                <Input
                  name="bairro"
                  label="Bairro"
                  value={form.bairro}
                  onChange={handleChange}
                />
              </div>
              <div className="sm:col-span-4">
                <Input
                  name="cidade"
                  label="Cidade"
                  value={form.cidade}
                  onChange={handleChange}
                />
              </div>
              <div className="sm:col-span-2">
                <Select
                  name="uf"
                  label="UF"
                  placeholder="—"
                  value={form.uf}
                  onChange={handleChange}
                  options={[
                    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
                    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
                    'RS','RO','RR','SC','SP','SE','TO',
                  ].map((uf) => ({ value: uf, label: uf }))}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ── 3. Matrícula ──────────────────────────────────────────────── */}
        <Card>
          <Card.Header>
            <h2 className="text-heading font-semibold text-ink">Matrícula</h2>
          </Card.Header>
          <Card.Body>
            <Select
              name="turmaId"
              label="Turma"
              placeholder={loadingTurmas ? 'Carregando turmas…' : turmas.length === 0 ? 'Nenhuma turma cadastrada' : 'Sem turma (definir depois)'}
              value={form.turmaId}
              onChange={handleChange}
              options={turmas.map((t) => ({
                value: t.id,
                label: `${t.nome} — ${t.serie} (${TURNO_LABEL[t.turno] ?? t.turno})`,
              }))}
            />
          </Card.Body>
        </Card>

        {/* ── 4. Responsável ────────────────────────────────────────────── */}
        <Card>
          <Card.Header>
            <h2 className="text-heading font-semibold text-ink">Responsável</h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  name="nomeResponsavel"
                  label="Nome completo"
                  required
                  placeholder="Ex: Maria da Silva"
                  value={form.nomeResponsavel}
                  onChange={handleChange}
                  errorText={errors.nomeResponsavel}
                />
              </div>
              <Select
                name="parentesco"
                label="Parentesco"
                required
                placeholder="Selecione..."
                value={form.parentesco}
                onChange={handleChange}
                errorText={errors.parentesco}
                options={[
                  { value: 'pai',    label: 'Pai' },
                  { value: 'mae',    label: 'Mãe' },
                  { value: 'avo',    label: 'Avó/Avô' },
                  { value: 'tio',    label: 'Tio/Tia' },
                  { value: 'outro',  label: 'Outro' },
                ]}
              />
              <Input
                name="telefone"
                label="Telefone / WhatsApp"
                required
                placeholder="(00) 00000-0000"
                type="tel"
                value={form.telefone}
                onChange={handleChange}
                errorText={errors.telefone}
              />
              <div className="sm:col-span-2">
                <Input
                  name="email"
                  label="E-mail"
                  placeholder="responsavel@email.com"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  errorText={errors.email}
                  helperText="Usado para comunicados e notificações do sistema"
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ── 5. Documentos ────────────────────────────────────────────── */}
        <Card>
          <Card.Header>
            <div>
              <h2 className="text-heading font-semibold text-ink">Documentos</h2>
              <p className="text-body-sm text-ink-muted mt-0.5">
                Opcional — você pode enviar depois também
              </p>
            </div>
          </Card.Header>
          <Card.Body>
            <Upload
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              maxSizeMB={10}
              label="Arraste os documentos aqui ou clique para selecionar"
              hint="Histórico escolar, certidão de nascimento, comprovante de residência — PDF ou imagem até 10 MB"
              onFilesChange={setDocumentos}
            />
          </Card.Body>
        </Card>

        {/* ── Rodapé ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-8">
          <Link href="/alunos">
            <Button variant="outline" disabled={isSubmitting}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Cadastrar aluno'}
          </Button>
        </div>

      </form>
    </div>
  )
}
