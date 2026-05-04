'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Button, Card, Upload, Modal, Table, Alert, Badge, useToast
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { read, utils, write } from 'xlsx'

// ─── TIPOS E CONSTANTES ───────────────────────────────────────────────────────

interface AvaliacaoImport {
  aluno_nome: string
  disciplina_nome: string
  tipo: string
  valor: number
  data: string
}

interface AvaliacaoComErro extends AvaliacaoImport {
  erro?: string
}

const COLUNAS_MAPA: Record<string, string[]> = {
  aluno_nome: ['Aluno', 'Nome Aluno', 'Nome do Aluno', 'Student', 'nome'],
  disciplina_nome: ['Disciplina', 'Matéria', 'Subject', 'disciplina'],
  tipo: ['Tipo', 'Type', 'Avaliação', 'Assessment'],
  valor: ['Nota', 'Note', 'Valor', 'Score', 'nota', 'valor'],
  data: ['Data', 'Date', 'Data da Avaliação', 'data'],
}

const TIPOS_VALIDOS = ['prova', 'trabalho', 'participacao', 'atividade']

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ImportarAvalicoesPage() {
  const { success, danger } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<AvaliacaoComErro[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // ── UTILS ─────────────────────────────────────────────────────────────────
  const normalizarHeader = (header: string): string | null => {
    const lower = header.toLowerCase().trim()
    for (const [campo, variantes] of Object.entries(COLUNAS_MAPA)) {
      if (variantes.some(v => lower.includes(v.toLowerCase()))) {
        return campo
      }
    }
    return null
  }

  const validarData = (valor: any): string | null => {
    if (typeof valor === 'string') {
      const formats = [
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      ]
      if (formats.some(f => f.test(valor))) {
        return valor.includes('/') 
          ? valor.split('/').reverse().join('-') 
          : valor
      }
    }
    if (typeof valor === 'number') {
      const date = new Date((valor - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0]
    }
    return null
  }

  const validarRow = async (row: any, rowIndex: number, colunas: Record<string, number>) => {
    const resultado: AvaliacaoComErro = {
      aluno_nome: row[colunas.aluno_nome]?.toString().trim() || '',
      disciplina_nome: row[colunas.disciplina_nome]?.toString().trim() || '',
      tipo: row[colunas.tipo]?.toString().toLowerCase().trim() || '',
      valor: parseFloat(row[colunas.valor]),
      data: validarData(row[colunas.data]) || new Date().toISOString().split('T')[0],
    }

    const erros: string[] = []

    if (!resultado.aluno_nome) erros.push('Aluno não informado')
    if (!resultado.disciplina_nome) erros.push('Disciplina não informada')
    if (!resultado.tipo) erros.push('Tipo não informado')
    if (isNaN(resultado.valor)) erros.push('Nota inválida')
    if (resultado.valor < 0 || resultado.valor > 10) erros.push('Nota deve estar entre 0 e 10')
    if (!TIPOS_VALIDOS.includes(resultado.tipo)) {
      erros.push(`Tipo "${resultado.tipo}" inválido. Use: ${TIPOS_VALIDOS.join(', ')}`)
    }

    if (erros.length > 0) {
      resultado.erro = erros.join('; ')
    }

    return resultado
  }

  const handleFileSelect = async (file: File) => {
    setFile(file)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = read(arrayBuffer)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const dados = utils.sheet_to_json(sheet, { defval: '' })

      if (dados.length === 0) {
        danger('Arquivo vazio')
        return
      }

      // Detectar colunas
      const headers = Object.keys(dados[0] || {})
      const colunas: Record<string, number> = {}

      for (const [campo, header] of Object.entries(COLUNAS_MAPA)) {
        const idx = headers.findIndex(h => header.includes(h.toLowerCase()) || h.toLowerCase().includes(header[0].toLowerCase()))
        if (idx >= 0) colunas[campo] = idx
      }

      // Validar cada linha
      const avaliacoes: AvaliacaoComErro[] = []
      for (let i = 0; i < dados.length; i++) {
        const validado = await validarRow(dados[i], i + 2, colunas)
        avaliacoes.push(validado)
      }

      setPreview(avaliacoes)
      setShowPreview(true)
    } catch (err) {
      danger('Erro ao processar arquivo')
      console.error(err)
    }
  }

  const handleImport = async () => {
    const aValidas = preview.filter(a => !a.erro)

    if (aValidas.length === 0) {
      danger('Nenhuma avaliação válida para importar')
      return
    }

    setIsImporting(true)

    try {
      const response = await fetch('/api/avaliacoes/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aValidas),
      })

      const result = await response.json()

      if (result.erros.length > 0) {
        danger(`${result.importados} importadas, ${result.erros.length} erro(s)`)
      } else {
        success(`${result.importados} avaliações importadas com sucesso!`)
        setFile(null)
        setPreview([])
        setShowPreview(false)
      }
    } catch (err) {
      danger('Erro ao importar')
      console.error(err)
    }

    setIsImporting(false)
  }

  const downloadTemplate = () => {
    const template = [
      {
        'Aluno': 'João Silva',
        'Disciplina': 'Português',
        'Tipo': 'prova',
        'Nota': 8.5,
        'Data': '01/05/2026',
      },
      {
        'Aluno': 'Maria Santos',
        'Disciplina': 'Matemática',
        'Tipo': 'trabalho',
        'Nota': 9.0,
        'Data': '02/05/2026',
      },
    ]

    try {
      const ws = utils.json_to_sheet(template)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Avaliações')
      
      // Usar write correto do xlsx
      const wbout = write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([new Uint8Array(wbout)], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'modelo_avaliacoes.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      success('Template baixado com sucesso!')
    } catch (err) {
      danger('Erro ao baixar template')
      console.error(err)
    }
  }

  // ── COLUNAS PREVIEW ───────────────────────────────────────────────────────
  const columns: Column<AvaliacaoComErro>[] = [
    {
      key: 'aluno_nome',
      header: 'ALUNO',
      accessor: (row) => (
        <span className={row.erro ? 'text-danger-600' : 'text-ink'}>
          {row.aluno_nome}
        </span>
      ),
    },
    {
      key: 'disciplina_nome',
      header: 'DISCIPLINA',
      accessor: (row) => (
        <span className={row.erro ? 'text-danger-600' : 'text-ink'}>
          {row.disciplina_nome}
        </span>
      ),
    },
    {
      key: 'tipo',
      header: 'TIPO',
      accessor: (row) => (
        <Badge variant={row.erro ? 'danger' : 'neutral'}>
          {row.tipo}
        </Badge>
      ),
    },
    {
      key: 'valor',
      header: 'NOTA',
      align: 'center',
      accessor: (row) => (
        <span className={row.erro ? 'text-danger-600 font-semibold' : 'text-ink font-semibold'}>
          {isNaN(row.valor) ? '-' : row.valor.toFixed(1)}
        </span>
      ),
    },
    {
      key: 'erro',
      header: 'STATUS',
      accessor: (row) => (
        row.erro ? (
          <Badge variant="danger" size="sm">{row.erro}</Badge>
        ) : (
          <Badge variant="success" size="sm">✓ Válido</Badge>
        )
      ),
    },
  ]

  return (
    <div className="p-8 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-display font-semibold text-ink">Importar avaliações</h1>
          <p className="text-body text-ink-muted mt-2">
            Carregue um arquivo Excel com notas em lote
          </p>
        </div>

        <Link href="/avaliacoes">
          <Button variant="secondary">← Voltar</Button>
        </Link>
      </div>

      {/* UPLOAD */}
      <Card>
        <Card.Body>
          <Upload
            maxSize={5}
            accept=".xlsx,.xls"
            onSelect={handleFileSelect}
            title="📊 Arrastar arquivo aqui ou clicar"
            description="Formatos: .xlsx, .xls (Máx. 5MB)"
          />

          <div className="mt-6 flex gap-3">
            <Button onClick={() => setShowInstructions(true)} variant="secondary">
              📖 Instruções
            </Button>
            <Button onClick={downloadTemplate} variant="secondary">
              📥 Download template
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* PREVIEW */}
      {showPreview && (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-body-lg font-semibold text-ink">Pré-visualização</h2>
              <span className="text-caption text-body">
                {preview.filter(a => !a.erro).length} / {preview.length} válidas
              </span>
            </div>

            {preview.some(a => a.erro) && (
              <Alert variant="warning" className="mb-4">
                ⚠️ Algumas linhas contêm erros e não serão importadas
              </Alert>
            )}

            <Table
              columns={columns}
              data={preview}
              keyExtractor={(_, i) => i.toString()}
            />

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleImport}
                isLoading={isImporting}
              >
                ✓ Importar {preview.filter(a => !a.erro).length} avaliações
              </Button>
              <Button
                onClick={() => setShowPreview(false)}
                variant="secondary"
              >
                Cancelar
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* INSTRUÇÕES */}
      <Modal
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        title="Instruções de importação"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-ink mb-2">Coluna obrigatória:</h3>
            <ul className="space-y-1 text-body-sm text-body">
              <li>• <strong>Aluno</strong> - Nome do aluno cadastrado</li>
              <li>• <strong>Disciplina</strong> - Nome da disciplina cadastrada</li>
              <li>• <strong>Tipo</strong> - prova, trabalho, participacao, atividade</li>
              <li>• <strong>Nota</strong> - Valor entre 0 e 10</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-ink mb-2">Coluna opcional:</h3>
            <ul className="space-y-1 text-body-sm text-body">
              <li>• <strong>Data</strong> - Formato DD/MM/YYYY ou YYYY-MM-DD</li>
            </ul>
          </div>

          <div className="bg-neutral-50 p-4 rounded border border-neutral-200">
            <p className="text-body-sm text-body">
              💡 Os nomes das colunas são flexíveis. O sistema detecta automaticamente
              mesmo com variações como "Nome do Aluno", "Student", etc.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
