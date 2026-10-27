# Instala as dependencias do prototipo do Case Bari no Windows.
#
# Uso: powershell -ExecutionPolicy Bypass -File .\instalar-dependencias.ps1
#
# O que ele faz:
#   1. Verifica/instala o Node.js LTS (via winget)
#   2. Verifica/instala as dependencias do prototipo (npm install)
#   3. Valida com o build de producao (tsc + vite build)
#   4. Sobe o servidor de desenvolvimento
#
# Pode ser executado mais de uma vez sem problema (idempotente).

$ErrorActionPreference = 'Stop'

function Write-Etapa($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Oki($msg)   { Write-Host "    $msg" -ForegroundColor Green }
function Write-Aviso($msg) { Write-Host "    $msg" -ForegroundColor Yellow }

$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$proto = Join-Path $raiz 'prototipo-case-bari'

# ---------------------------------------------------------------------------
# 1. Node.js
# ---------------------------------------------------------------------------
Write-Etapa 'Node.js'
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    # locais padrao do instalador — a sessao atual pode nao ter o PATH atualizado
    foreach ($fixo in @("$env:ProgramFiles\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe")) {
        if (Test-Path $fixo) { $env:Path = "$(Split-Path -Parent $fixo);$env:Path"; break }
    }
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
}
if (-not $nodeCmd) {
    Write-Aviso 'Node.js nao encontrado. Instalando via winget...'
    winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
    foreach ($fixo in @("$env:ProgramFiles\nodejs\node.exe", "$env:LOCALAPPDATA\Programs\nodejs\node.exe")) {
        if (Test-Path $fixo) { $env:Path = "$(Split-Path -Parent $fixo);$env:Path"; break }
    }
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) { throw 'Node.js instalado, mas nao encontrado. Feche e reabra o terminal/este script.' }
}
Write-Oki "Node.js: v$(& $nodeCmd.Source -v) ($($nodeCmd.Source))"

# npm acompanha o node
$npmCmd = Join-Path (Split-Path -Parent $nodeCmd.Source) 'npm.cmd'
if (-not (Test-Path $npmCmd)) { throw 'npm nao encontrado junto ao node.' }

# ---------------------------------------------------------------------------
# 2. Dependencias do prototipo
# ---------------------------------------------------------------------------
Write-Etapa 'Dependencias do prototipo (npm install)'
Set-Location $proto

# Em redes corporativas com proxy TLS, o npm pode rejeitar o certificado do
# proxy (SELF_SIGNED_CERT_IN_CHAIN). Se acontecer, rode uma vez:
#   & $npmCmd config set strict-ssl false
# (e reative depois com strict-ssl true, ou registre a CA da empresa no npm)
& $npmCmd install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Aviso 'npm install falhou. Se o erro for SELF_SIGNED_CERT_IN_CHAIN (proxy da empresa):'
    Write-Aviso '   1) & ' + $npmCmd + ' config set strict-ssl false'
    Write-Aviso '   2) rode este script de novo'
    Write-Aviso '   3) quando terminar, volte com strict-ssl true'
    throw 'Falha no npm install.'
}
Write-Oki 'Dependencias instaladas.'

# ---------------------------------------------------------------------------
# 3. Validacao (build de producao)
# ---------------------------------------------------------------------------
Write-Etapa 'Build de validacao (tsc + vite build)'
& $npmCmd run build
if ($LASTEXITCODE -ne 0) {
    # caso comum: postinstall do esbuild nao rodou (rede/proxy). Tenta reparar.
    Write-Aviso 'Build falhou. Tentando reparar o esbuild (postinstall)...'
    & $npmCmd rebuild esbuild --foreground-scripts | Out-Null
    & $npmCmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Falha no build. Veja as mensagens acima.' }
}
Write-Oki 'Build OK.'

# ---------------------------------------------------------------------------
# 4. Servidor de desenvolvimento
# ---------------------------------------------------------------------------
Write-Etapa 'Servidor de desenvolvimento'
Write-Oki 'Iniciando em http://localhost:5173 (Ctrl+C para parar)...'
Write-Oki 'Recarregue a pagina (F5) se apos alguma edicao o navegador reclamar de modulo.'
& $npmCmd run dev