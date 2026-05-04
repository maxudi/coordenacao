'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { Button, Card, Badge, Modal, Alert } from '@/components/ui'
import { useToast } from '@/components/ui'
import { cn } from '@/lib/utils'

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface AlunoRow {
  nome: string
  data_nascimento?: string
  turma_nome?: string
  responsavel?: string
  telefone?: string
  email?: string
  status?: string
  _linha: number
  _valido: boolean
  _erros: string[]
}

interface ImportResult {
  importados: number
  erros: { linha: number; nome: string; motivo: string }[]
}

// ─── COLUNAS ESPERADAS ────────────────────────────────────────────────────────

const COLUNAS_MAPA: Record<string, keyof Omit<AlunoRow, '_linha' | '_valido' | '_erros'>> = {
  'nome': 'nome',
  'nome completo': 'nome',
  'data_nascimento': 'data_nascimento',
  'data nascimento': 'data_nascimento',
  'data de nascimento': 'data_nascimento',
  'nascimento': 'data_nascimento',
  'turma': 'turma_nome',
  'turma_nome': 'turma_nome',
  'nome da turma': 'turma_nome',
  'responsavel': 'responsavel',
  'responsável': 'responsavel',
  'nome do responsavel': 'responsavel',
  'nome do responsável': 'responsavel',
  'telefone': 'telefone',
  'fone': 'telefone',
  'celular': 'telefone',
  'email': 'email',
  'e-mail': 'email',
  'status': 'status',
  'situação': 'status',
  'situacao': 'status',
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function excelSerialToDate(serial: number): string {
  const date = new Date((serial - 25569) * 86400 * 1000)
  const d = String(date.getUTCDate()).padStart(2, '0')
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const y = date.getUTCFullYear()
  return `${d}/${m}/${y}`
}

function parseCellValue(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'number' && val > 10000) return excelSerialToDate(val)
  return String(val).trim()
}

function validarRow(row: AlunoRow): AlunoRow {
  const erros: string[] = []
  if (!row.nome?.trim()) erros.push('Nome obrigatório')
  if (row.data_nascimento && !/^\d{2}\/\d{2}\/\d{4}$/.test(row.data_nascimento) && !/^\d{4}-\d{2}-\d{2}$/.test(row.data_nascimento)) {
    erros.push('Data inválida (use DD/MM/AAAA)')
  }
  const statusOk = ['ativo', 'inativo', 'transferido']
  if (row.status && !statusOk.includes(row.status.toLowerCase())) {
    erros.push(`Status inválido: "${row.status}"`)
  }
  return { ...row, _erros: erros, _valido: erros.length === 0 }
}

// ─── INSTRUÇÕES ──────────────────────────────────────────────────────────────

function InstrucoesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="p-6 space-y-5">
        <h2 className="text-display-sm font-bold text-ink">Como importar alunos via XLSX</h2>

        <div className="space-y-4 text-body-sm text-body">
          <section>
            <h3 className="font-semibold text-ink mb-1">1. Formato do arquivo</h3>
            <p>O arquivo deve ser <strong>.xlsx</strong> ou <strong>.xls</strong>. A primeira linha deve conter os cabeçalhos das colunas.</p>
          </section>

          <section>
            <h3 className="font-semibold text-ink mb-2">2. Colunas aceitas</h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-caption">
                <thead className="bg-surface-raised">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-ink">Coluna</th>
                    <th className="text-left px-3 py-2 font-semibold text-ink">Obrigatório</th>
                    <th className="text-left px-3 py-2 font-semibold text-ink">Exemplo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { col: 'nome', obrig: true,  ex: 'João da Silva' },
                    { col: 'data_nascimento', obrig: false, ex: '15/03/2010 ou 2010-03-15' },
                    { col: 'turma', obrig: false, ex: 'Turma A — deve bater exatamente com o nome no sistema' },
                    { col: 'responsavel', obrig: false, ex: 'Maria da Silva' },
                    { col: 'telefone', obrig: false, ex: '(11) 99999-9999' },
                    { col: 'email', obrig: false, ex: 'joao@escola.com.br' },
                    { col: 'status', obrig: false, ex: 'ativo · inativo · transferido (padrão: ativo)' },
                  ].map(r => (
                    <tr key={r.col}>
                      <td className="px-3 py-2 font-mono text-ink">{r.col}</td>
                      <td className="px-3 py-2">{r.obrig ? <Badge variant="danger">Sim</Badge> : <Badge variant="neutral">Não</Badge>}</td>
                      <td className="px-3 py-2 text-body">{r.ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-ink mb-1">3. Nomes alternativos aceitos nos cabeçalhos</h3>
            <p>Os cabeçalhos não diferenciam maiúsculas/minúsculas. Você pode usar: <em>Nome Completo</em>, <em>Data de Nascimento</em>, <em>Responsável</em>, <em>Celular</em>, <em>E-mail</em>, <em>Situação</em> etc.</p>
          </section>

          <section>
            <h3 className="font-semibold text-ink mb-1">4. Turmas</h3>
            <p>O nome da turma deve corresponder exatamente ao nome cadastrado no sistema (sem acento ou com, mas igual). Se a turma não for encontrada, a linha será rejeitada.</p>
          </section>

          <section>
            <h3 className="font-semibold text-ink mb-1">5. Limites</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Máximo de <strong>1.000 alunos</strong> por importação</li>
              <li>Máximo de <strong>5 MB</strong> por arquivo</li>
            </ul>
          </section>

          <section className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="font-semibold text-warning-800 mb-1">Atenção</p>
            <p className="text-warning-700">Revise os dados na pré-visualização antes de confirmar. A importação <strong>não pode ser desfeita</strong> automaticamente.</p>
          </section>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            onClick={downloadTemplate}
            className="text-body-sm text-primary-600 hover:underline"
          >
            Baixar planilha modelo (.xlsx)
          </button>
          <Button onClick={onClose}>Entendi</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── DOWNLOAD TEMPLATE ───────────────────────────────────────────────────────

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['nome', 'data_nascimento', 'turma', 'responsavel', 'telefone', 'email', 'status'],
    ['João da Silva', '15/03/2010', 'Turma A', 'Maria da Silva', '(11) 99999-9999', 'joao@escola.com.br', 'ativo'],
    ['Ana Paula Souza', '22/07/2011', 'Turma B', 'Carlos Souza', '(11) 98888-7777', '', 'ativo'],
  ])
  ws['!cols'] = [18, 18, 12, 20, 18, 25, 12].map(w => ({ wch: w }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Alunos')
  XLSX.writeFile(wb, 'modelo_importacao_alunos.xlsx')
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function ImportarAlunosPage() {
  const router = useRouter()
  const { success, danger } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [dragging, setDragging] = useState(false)
  const [rows, setRows] = useState<AlunoRow[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [showInstrucoes, setShowInstrucoes] = useState(false)
  const [importing, setImporting] = useState(false)
  const [resultado, setResultado] = useState<ImportResult | null>(null)

  const processFile = useCallback((file: File) => {
    setParseError(null)
    setResultado(null)

    if (file.size > 5 * 1024 * 1024) {
      setParseError('Arquivo muito grande. Máximo permitido: 5 MB.')
      return
    }
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setParseError('Formato inválido. Envie um arquivo .xlsx ou .xls.')
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellDates: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (raw.length === 0) { setParseError('A planilha está vazia.'); return }
        if (raw.length > 1000) { setParseError('Máximo de 1.000 alunos por importação.'); return }

        const parsed: AlunoRow[] = raw.map((r, idx) => {
          const row: AlunoRow = { nome: '', _linha: idx + 2, _valido: false, _erros: [] }
          for (const [key, val] of Object.entries(r)) {
            const campo = COLUNAS_MAPA[key.toLowerCase().trim()]
            if (campo) (row as any)[campo] = parseCellValue(val)
          }
          return validarRow(row)
        })

        setRows(parsed)
      } catch {
        setParseError('Erro ao ler o arquivo. Verifique se é um XLSX válido.')
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const validos = rows.filter(r => r._valido)
  const invalidos = rows.filter(r => !r._valido)

  async function handleImportar() {
    if (validos.length === 0) return
    setImporting(true)
    try {
      const payload = validos.map(({ _linha, _valido, _erros, ...r }) => r)
      const res = await fetch('/api/alunos/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json: ImportResult = await res.json()
      if (!res.ok) {
        danger((json as any).error ?? 'Erro ao importar')
        return
      }
      setResultado(json)
      if (json.importados > 0) {
        success(`${json.importados} aluno(s) importado(s) com sucesso!`)
      }
    } catch {
      danger('Falha de conexão ao importar')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display font-semibold text-ink">Importar Alunos</h1>
          <p className="text-body text-ink-muted mt-1">
            Carregue uma planilha XLSX para cadastrar alunos em lote
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInstrucoes(true)}
            title="Ver instruções de preenchimento"
            className="flex items-center gap-1.5 text-body-sm text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-400 rounded-lg px-3 py-1.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
            Instruções
          </button>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-body-sm text-ink-muted hover:text-ink border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
            </svg>
            Baixar modelo
          </button>
          <Link href="/alunos">
            <Button variant="ghost">← Voltar</Button>
          </Link>
        </div>
      </div>

      {/* DROPZONE */}
      {rows.length === 0 && (
        <Card>
          <Card.Body>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-16 cursor-pointer transition-colors select-none',
                dragging ? 'border-primary-400 bg-primary-50' : 'border-border hover:border-primary-300 hover:bg-surface-raised',
              )}
            >
              <div className={cn('p-4 rounded-full transition-colors', dragging ? 'bg-primary-100' : 'bg-surface-raised')}>
                <svg xmlns="http://www.w3.org/2000/svg" className={cn('h-10 w-10', dragging ? 'text-primary-600' : 'text-ink-muted')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-body-sm font-medium text-ink">
                  {dragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo XLSX ou clique para selecionar'}
                </p>
                <p className="text-caption text-ink-muted mt-1">Somente .xlsx ou .xls · Máx. 5 MB · Até 1.000 alunos</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onFileInput}
              />
            </div>

            {parseError && (
              <div className="mt-4">
                <Alert variant="danger" title="Erro no arquivo" description={parseError} />
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* RESULTADO DE IMPORTAÇÃO */}
      {resultado && (
        <Card>
          <Card.Body className="space-y-3">
            <h2 className="text-body-sm font-semibold text-ink">Resultado da importação</h2>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="success">{resultado.importados} importados</Badge>
              </div>
              {resultado.erros.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="danger">{resultado.erros.length} com erro</Badge>
                </div>
              )}
            </div>
            {resultado.erros.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border mt-2">
                <table className="w-full text-caption">
                  <thead className="bg-danger-50">
                    <tr>
                      <th className="text-left px-3 py-2">Linha</th>
                      <th className="text-left px-3 py-2">Nome</th>
                      <th className="text-left px-3 py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resultado.erros.map((e, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{e.linha}</td>
                        <td className="px-3 py-2">{e.nome}</td>
                        <td className="px-3 py-2 text-danger-600">{e.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => router.push('/alunos')}>Ver alunos importados</Button>
              <Button variant="outline" onClick={() => { setRows([]); setFileName(''); setResultado(null) }}>
                Importar mais
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* PRÉ-VISUALIZAÇÃO */}
      {rows.length > 0 && !resultado && (
        <>
          {/* Sumário */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-body-sm text-body">
                Arquivo: <strong className="text-ink">{fileName}</strong>
              </p>
              <Badge variant="success">{validos.length} válidos</Badge>
              {invalidos.length > 0 && <Badge variant="danger">{invalidos.length} com erro</Badge>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setRows([]); setFileName('') }}>
                Trocar arquivo
              </Button>
              <Button
                onClick={handleImportar}
                isLoading={importing}
                disabled={validos.length === 0}
              >
                Importar {validos.length} aluno(s)
              </Button>
            </div>
          </div>

          {/* Avisos de erros */}
          {invalidos.length > 0 && (
            <Alert
              variant="warning"
              title={`${invalidos.length} linha(s) com problemas serão ignoradas`}
              description="Corrija os erros no arquivo original e reimporte, ou prossiga para importar apenas os registros válidos."
            />
          )}

          {/* Tabela pré-visualização */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-caption">
                <thead className="bg-surface-raised border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-semibold text-ink">Linha</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-ink">Nome</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-ink">Nascimento</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-ink">Turma</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-ink">Responsável</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-ink">Telefone</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-ink">E-mail</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-ink">Status</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-ink">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row._linha} className={cn(row._valido ? '' : 'bg-danger-50')}>
                      <td className="px-3 py-2 text-ink-muted">{row._linha}</td>
                      <td className="px-3 py-2 font-medium text-ink">{row.nome || <span className="text-danger-500 italic">vazio</span>}</td>
                      <td className="px-3 py-2 text-body">{row.data_nascimento ?? '—'}</td>
                      <td className="px-3 py-2 text-body">{row.turma_nome ?? '—'}</td>
                      <td className="px-3 py-2 text-body">{row.responsavel ?? '—'}</td>
                      <td className="px-3 py-2 text-body">{row.telefone ?? '—'}</td>
                      <td className="px-3 py-2 text-body">{row.email ?? '—'}</td>
                      <td className="px-3 py-2 text-body">{row.status ?? 'ativo'}</td>
                      <td className="px-3 py-2 text-center">
                        {row._valido ? (
                          <Badge variant="success">OK</Badge>
                        ) : (
                          <span title={row._erros.join(' | ')}>
                            <Badge variant="danger">Erro</Badge>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detalhes dos erros */}
            {invalidos.length > 0 && (
              <div className="border-t border-border bg-danger-50 px-4 py-3 space-y-1">
                <p className="text-caption font-semibold text-danger-700">Detalhes dos erros:</p>
                {invalidos.map(r => (
                  <p key={r._linha} className="text-caption text-danger-600">
                    Linha {r._linha} — {r._erros.join(' · ')}
                  </p>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* MODAL DE INSTRUÇÕES */}
      <InstrucoesModal open={showInstrucoes} onClose={() => setShowInstrucoes(false)} />
    </div>
  )
}
