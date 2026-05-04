'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Button, Card, Upload, Modal, Table, Alert, Badge, useToast
} from '@/components/ui'
import type { Column } from '@/components/ui'
import { cn } from '@/lib/utils'
import { read, utils, write } from 'xlsx'

// ─── TIPOS E CONSTANTES ───────────────────────────────────────────────────────

interface FrequenciaImport {
  aluno_nome: string
  data: string
  presente: boolean
}

interface FrequenciaComErro extends FrequenciaImport {
  erro?: string
}

const COLUNAS_MAPA: Record<string, string[]> = {
  aluno_nome: ['Aluno', 'Nome Aluno', 'Nome do Aluno', 'Student', 'nome'],
  data: ['Data', 'Date', 'data'],
  presente: ['Presente', 'Present', 'Presença', 'Status', 'presente'],
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ImportarFrequenciasPage() {
  const { success, danger } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<FrequenciaComErro[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // ── UTILS ─────────────────────────────────────────────────────────────────
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

  const normalizarBooleano = (valor: any): boolean => {
    if (typeof valor === 'boolean') return valor
    if (typeof valor === 'string') {
      return ['sim', 'yes', 's', '1', 'true', 'x', '✓', 'presente'].includes(
        valor.toLowerCase().trim()
      )
    }
    if (typeof valor === 'number') return valor > 0
    return false
  }

  const validarRow = (row: any, rowIndex: number, colunas: Record<string, number>) => {
    const resultado: FrequenciaComErro = {
      aluno_nome: row[colunas.aluno_nome]?.toString().trim() || '',
      data: validarData(row[colunas.data]) || new Date().toISOString().split('T')[0],
      presente: validarBooleano(row[colunas.presente]),
    }

    const erros: string[] = []

    if (!resultado.aluno_nome) erros.push('Aluno não informado')
    if (!resultado.data) erros.push('Data inválida')

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

      for (const [campo] of Object.entries(COLUNAS_MAPA)) {
        const idx = headers.findIndex(h =>
          COLUNAS_MAPA[campo].some(v =>
            h.toLowerCase().includes(v.toLowerCase()) ||
            v.toLowerCase().includes(h.toLowerCase())
          )
        )
        if (idx >= 0) colunas[campo] = idx
      }

      // Validar cada linha
      const frequencias: FrequenciaComErro[] = []
      for (let i = 0; i < dados.length; i++) {
        const validado = validarRow(dados[i], i + 2, colunas)
        frequencias.push(validado)
      }

      setPreview(frequencias)
      setShowPreview(true)
    } catch (err) {
      danger('Erro ao processar arquivo')
      console.error(err)
    }
  }

  const handleImport = async () => {
    const fValidas = preview.filter(f => !f.erro)

    if (fValidas.length === 0) {
      danger('Nenhuma frequência válida para importar')
      return
    }

    setIsImporting(true)

    try {
      const response = await fetch('/api/frequencias/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fValidas),
      })

      const result = await response.json()

      if (result.erros.length > 0) {
        danger(`${result.importados} importadas, ${result.erros.length} erro(s)`)
      } else {
        success(`${result.importados} registros de frequência importados!`)
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
        'Data': '01/05/2026',
        'Presente': 'Sim',
      },
      {
        'Aluno': 'Maria Santos',
        'Data': '02/05/2026',
        'Presente': 'Não',
      },
    ]

    try {
      const ws = utils.json_to_sheet(template)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Frequências')
      
      // Usar write correto do xlsx
      const wbout = write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([new Uint8Array(wbout)], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'modelo_frequencias.xlsx'
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
  const columns: Column<FrequenciaComErro>[] = [
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
      key: 'data',
      header: 'DATA',
      accessor: (row) => (
        <span className={row.erro ? 'text-danger-600' : 'text-ink'}>
          {new Date(row.data).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'presente',
      header: 'PRESENTE',
      accessor: (row) => (
        <Badge variant={row.presente ? 'success' : 'danger'}>
          {row.presente ? '✓ Sim' : '✗ Não'}
        </Badge>
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
          <h1 className="text-display font-semibold text-ink">Importar frequências</h1>
          <p className="text-body text-ink-muted mt-2">
            Carregue um arquivo Excel com presença diária em lote
          </p>
        </div>

        <Link href="/frequencias">
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
                {preview.filter(f => !f.erro).length} / {preview.length} válidas
              </span>
            </div>

            {preview.some(f => f.erro) && (
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
                ✓ Importar {preview.filter(f => !f.erro).length} frequências
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
            <h3 className="font-semibold text-ink mb-2">Colunas obrigatórias:</h3>
            <ul className="space-y-1 text-body-sm text-body">
              <li>• <strong>Aluno</strong> - Nome do aluno cadastrado</li>
              <li>• <strong>Data</strong> - Formato DD/MM/YYYY ou YYYY-MM-DD</li>
              <li>• <strong>Presente</strong> - Sim/Não, 1/0, S/N, ✓/✗</li>
            </ul>
          </div>

          <div className="bg-neutral-50 p-4 rounded border border-neutral-200">
            <p className="text-body-sm text-body">
              💡 Os nomes das colunas são flexíveis. O sistema detecta automaticamente
              mesmo com variações como "Nome do Aluno", "Presença", etc.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
