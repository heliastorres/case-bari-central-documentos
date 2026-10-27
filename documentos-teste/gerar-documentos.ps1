# Gera documentos sinteticos de teste para o prototipo do Case Bari.
# As datas sao calculadas a partir de HOJE: rode de novo quando quiser
# atualizar os documentos (ex.: o comprovante "valido" sempre tera 20 dias).
#
# Uso:  powershell -ExecutionPolicy Bypass -File .\gerar-documentos.ps1

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$dirOk  = Join-Path $base '1-aprovados'
$dirRev = Join-Path $base '2-revisao-middle'
$dirNok = Join-Path $base '3-reprovados'
foreach ($d in @($dirOk, $dirRev, $dirNok)) {
    if (Test-Path $d) { Remove-Item "$d\*" -Force -ErrorAction SilentlyContinue }
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

$inv  = [Globalization.CultureInfo]::InvariantCulture
function D($dt) { return $dt.ToString('dd/MM/yyyy', $inv) }

$hoje = Get-Date
$mes1 = (Get-Date -Day 1).AddMonths(-1)   # ultimo mes fechado
$mes2 = (Get-Date -Day 1).AddMonths(-2)
$mes3 = (Get-Date -Day 1).AddMonths(-3)
$fimMes1 = $mes1.AddMonths(1).AddDays(-1)

# Cliente da proposta (igual ao src/lib/checklist.ts)
$NOME = 'Maria Silva Souza'
$CPF  = '123.456.789-09'
# Terceiro (CPF valido, mas de outra pessoa)
$NOME3 = 'Carlos Eduardo Lima'
$CPF3  = '987.654.321-00'

# ---------------------------------------------------------------------------
# Desenho
# ---------------------------------------------------------------------------
function New-Doc {
    param(
        [string]$Path,
        [string]$Titulo,
        [string[]]$Linhas,
        [int]$Largura = 1400,
        [int]$Fonte = 24,
        [int[]]$Fundo = @(250, 250, 245),
        [int[]]$Texto = @(20, 20, 20),
        [int[]]$Cabecalho = @(0, 60, 130),
        [string]$Efeito = ''
    )
    $altura = [Math]::Max(1000, 220 + $Linhas.Count * ($Fonte * 2))
    $bmp = New-Object System.Drawing.Bitmap($Largura, $altura)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.TextRenderingHint = 'AntiAliasGridFit'
    $g.Clear([System.Drawing.Color]::FromArgb($Fundo[0], $Fundo[1], $Fundo[2]))

    $fTit = New-Object System.Drawing.Font('Arial', ($Fonte + 6), [System.Drawing.FontStyle]::Bold)
    $f    = New-Object System.Drawing.Font('Arial', $Fonte)
    $bTit = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($Cabecalho[0], $Cabecalho[1], $Cabecalho[2]))
    $bTxt = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($Texto[0], $Texto[1], $Texto[2]))

    $g.DrawString($Titulo, $fTit, $bTit, 50, 60)
    $y = 160
    foreach ($l in $Linhas) {
        $g.DrawString($l, $f, $bTxt, 50, $y)
        $y += [int]($Fonte * 2)
    }
    $g.Dispose()

    if ($Efeito -eq 'desfocar') {
        # reduz 10x e amplia de volta: perde as bordas das letras
        $pw = [int]($Largura / 10); $ph = [int]($altura / 10)
        $peq = New-Object System.Drawing.Bitmap($pw, $ph)
        $gp = [System.Drawing.Graphics]::FromImage($peq)
        $gp.InterpolationMode = 'HighQualityBilinear'
        $gp.DrawImage($bmp, 0, 0, $pw, $ph); $gp.Dispose()
        $bmp2 = New-Object System.Drawing.Bitmap($Largura, $altura)
        $g2 = [System.Drawing.Graphics]::FromImage($bmp2)
        $g2.InterpolationMode = 'HighQualityBilinear'
        $g2.DrawImage($peq, 0, 0, $Largura, $altura); $g2.Dispose()
        $peq.Dispose(); $bmp.Dispose(); $bmp = $bmp2
    }

    if ($Path.ToLower().EndsWith('.jpg')) {
        $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    } else {
        $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    $bmp.Dispose()
    Write-Host ("  " + (Split-Path -Leaf $Path))
}

# ---------------------------------------------------------------------------
# Conteudos reutilizaveis
# ---------------------------------------------------------------------------
function Linhas-Residencia($nome, $cpf, $emissao) {
    return @(
        "Cliente: $nome",
        "CPF: $cpf",
        'Rua das Laranjeiras, 123 - Apt 402',
        'Bairro Centro - Curitiba - PR',
        'CEP: 80010-100',
        "Data de emissao: $(D $emissao)",
        "Vencimento: $(D $emissao.AddDays(15))",
        'Consumo do mes: 182 kWh',
        'Valor a pagar: 145,80'
    )
}
$TIT_RES = 'COMPANHIA DE ENERGIA - CONTA DE ENERGIA ELETRICA'

function Linhas-Matricula($extras) {
    $l = @(
        'MATRICULA N. 45.678 - LIVRO 2 - REGISTRO GERAL',
        'Imovel: Apartamento 402 do Edificio Laranjeiras',
        'Rua das Laranjeiras, 123 - Centro - Curitiba - PR',
        "Proprietaria: $NOME - CPF $CPF",
        'R.1 - 15/03/2018 - Compra e venda registrada em nome da proprietaria.'
    )
    return $l + $extras + @('Nada mais consta. Certidao emitida em ' + (D $hoje) + '.')
}
$TIT_MAT = 'REGISTRO DE IMOVEIS - 1a CIRCUNSCRICAO DE CURITIBA - PR'

# ---------------------------------------------------------------------------
Write-Host "`n[1-aprovados]"
# ---------------------------------------------------------------------------
New-Doc "$dirOk\01-rg-maria.png" 'REPUBLICA FEDERATIVA DO BRASIL' @(
    'SECRETARIA DE SEGURANCA PUBLICA - INSTITUTO DE IDENTIFICACAO',
    'CARTEIRA DE IDENTIDADE - REGISTRO GERAL: 12.345.678-9',
    'Data de expedicao: 10/03/2015',
    "Nome: $NOME",
    'Filiacao: Jose Carlos Souza e Rita Silva Souza',
    'Naturalidade: Curitiba - PR',
    'Data de nascimento: 14/05/1985',
    "CPF $CPF"
)

# RG antigo, sem o numero do CPF: faz o item CPF virar obrigatorio
New-Doc "$dirOk\01b-rg-sem-cpf-maria.png" 'REPUBLICA FEDERATIVA DO BRASIL' @(
    'SECRETARIA DE SEGURANCA PUBLICA - INSTITUTO DE IDENTIFICACAO',
    'CARTEIRA DE IDENTIDADE - REGISTRO GERAL: 12.345.678-9',
    'Data de expedicao: 10/03/2015',
    "Nome: $NOME",
    'Filiacao: Jose Carlos Souza e Rita Silva Souza',
    'Naturalidade: Curitiba - PR',
    'Data de nascimento: 14/05/1985'
)

New-Doc "$dirOk\02-cnh-maria.png" 'CARTEIRA NACIONAL DE HABILITACAO' @(
    'DEPARTAMENTO NACIONAL DE TRANSITO',
    "Nome: $NOME",
    "CPF: $CPF",
    'Data de nascimento: 14/05/1985',
    'Filiacao: Jose Carlos Souza e Rita Silva Souza',
    'Primeira habilitacao: 10/02/2005',
    "Data de emissao: $(D $hoje.AddYears(-2))",
    "Validade: $(D $hoje.AddYears(3))",
    'Categoria: B'
)

New-Doc "$dirOk\03-cpf-maria.png" 'RECEITA FEDERAL DO BRASIL' @(
    'MINISTERIO DA FAZENDA',
    'CADASTRO DE PESSOAS FISICAS - CPF',
    "Numero de inscricao: $CPF",
    "Nome: $NOME",
    'Data de nascimento: 14/05/1985',
    'Situacao cadastral: REGULAR'
)

New-Doc "$dirOk\04-certidao-casamento-maria.png" 'CERTIDAO DE CASAMENTO' @(
    'Oficial de Registro Civil das Pessoas Naturais - Curitiba - PR',
    "Nome: $NOME",
    "CPF: $CPF",
    'Nome: Joao Pedro Souza',
    'CPF: 529.982.247-25',
    'Data do casamento: 12/06/2012',
    'Regime de bens: Comunhao parcial de bens',
    'Certidao emitida em ' + (D $hoje.AddDays(-10))
)

New-Doc "$dirOk\05-comprovante-residencia-maria.png" $TIT_RES (Linhas-Residencia $NOME $CPF $hoje.AddDays(-20))

New-Doc "$dirOk\06-holerite-3-meses.png" 'DEMONSTRATIVO DE PAGAMENTO - HOLERITE' @(
    'Empresa: Construtora Horizonte Ltda',
    "Nome: $NOME",
    "CPF: $CPF",
    'Cargo: Analista Financeira',
    "Competencia $(D $mes3.AddDays(4))   Salario base 6.200,00   Liquido 5.140,00",
    "Competencia $(D $mes2.AddDays(4))   Salario base 6.200,00   Liquido 5.140,00",
    "Competencia $(D $mes1.AddDays(4))   Salario base 6.200,00   Liquido 5.140,00",
    'Descontos: INSS e IRRF'
)

New-Doc "$dirOk\07-extrato-3-meses.png" 'BANCO EXEMPLO S.A. - EXTRATO DE CONTA CORRENTE' @(
    "Titular: $NOME",
    "CPF: $CPF",
    'Agencia: 0001   Conta: 12345-6',
    "Periodo: $(D $mes3) a $(D $fimMes1)",
    "$(D $mes3.AddDays(4))   PIX RECEBIDO - SALARIO   5.140,00",
    "$(D $mes2.AddDays(4))   PIX RECEBIDO - SALARIO   5.140,00",
    "$(D $mes1.AddDays(4))   PIX RECEBIDO - SALARIO   5.140,00",
    "Saldo em $(D $fimMes1): 8.420,35"
)

New-Doc "$dirOk\08-ir-com-recibo.png" 'RECEITA FEDERAL DO BRASIL' @(
    'IMPOSTO SOBRE A RENDA - PESSOA FISICA',
    'RECIBO DE ENTREGA DA DECLARACAO DE AJUSTE ANUAL',
    "Exercicio $($hoje.Year) - Ano-calendario $($hoje.Year - 1)",
    "Nome: $NOME",
    "CPF: $CPF",
    "Data de entrega: 28/04/$($hoje.Year)",
    'Numero do recibo: 1234567890'
)

New-Doc "$dirOk\09-iptu.png" "PREFEITURA MUNICIPAL DE CURITIBA - IPTU $($hoje.Year)" @(
    'Inscricao imobiliaria: 03.4.0012.0034.00-1',
    "Contribuinte: $NOME",
    'Endereco: Rua das Laranjeiras, 123 - Apt 402 - Centro',
    'Area do terreno: 360,00 m2',
    'Area construida: 85,00 m2',
    'Valor venal: 412.000,00',
    'Valor total do imposto: 1.250,00'
)

New-Doc "$dirOk\10-matricula-livre.png" $TIT_MAT (Linhas-Matricula @())

# ---------------------------------------------------------------------------
Write-Host "`n[2-revisao-middle]"
# ---------------------------------------------------------------------------
New-Doc "$dirRev\matricula-alienacao-fiduciaria.png" $TIT_MAT (Linhas-Matricula @(
    'R.2 - 20/05/2022 - ALIENACAO FIDUCIARIA em favor do Banco Exemplo S.A.'
))

New-Doc "$dirRev\matricula-penhora.png" $TIT_MAT (Linhas-Matricula @(
    'AV.3 - 11/08/2024 - PENHORA determinada pela 2a Vara Civel de Curitiba.'
))

# ---------------------------------------------------------------------------
Write-Host "`n[3-reprovados]"
# ---------------------------------------------------------------------------
New-Doc "$dirNok\cnh-vencida.png" 'CARTEIRA NACIONAL DE HABILITACAO' @(
    'DEPARTAMENTO NACIONAL DE TRANSITO',
    "Nome: $NOME",
    "CPF: $CPF",
    'Data de nascimento: 14/05/1985',
    'Primeira habilitacao: 10/02/2005',
    "Data de emissao: $(D $hoje.AddYears(-6))",
    "Validade: $(D $hoje.AddYears(-1))",
    'Categoria: B'
)

New-Doc "$dirNok\certidao-de-terceiros.png" 'CERTIDAO DE CASAMENTO' @(
    'Oficial de Registro Civil das Pessoas Naturais - Londrina - PR',
    'Nome: Ana Paula Ferreira',
    'CPF: 111.444.777-35',
    "Nome: $NOME3",
    "CPF: $CPF3",
    'Data do casamento: 03/09/2015',
    'Regime de bens: Comunhao parcial de bens'
)

New-Doc "$dirNok\residencia-vencida-150-dias.png" $TIT_RES (Linhas-Residencia $NOME $CPF $hoje.AddDays(-150))

New-Doc "$dirNok\residencia-de-terceiro.png" $TIT_RES (Linhas-Residencia $NOME3 $CPF3 $hoje.AddDays(-20))

New-Doc "$dirNok\holerite-faltando-mes.png" 'DEMONSTRATIVO DE PAGAMENTO - HOLERITE' @(
    'Empresa: Construtora Horizonte Ltda',
    "Nome: $NOME",
    "CPF: $CPF",
    'Cargo: Analista Financeira',
    "Competencia $(D $mes2.AddDays(4))   Salario base 6.200,00   Liquido 5.140,00",
    "Competencia $(D $mes1.AddDays(4))   Salario base 6.200,00   Liquido 5.140,00",
    'Descontos: INSS e IRRF'
)

New-Doc "$dirNok\extrato-apenas-1-mes.png" 'BANCO EXEMPLO S.A. - EXTRATO DE CONTA CORRENTE' @(
    "Titular: $NOME",
    "CPF: $CPF",
    'Agencia: 0001   Conta: 12345-6',
    "Periodo: $(D $mes1) a $(D $fimMes1)",
    "$(D $mes1.AddDays(4))   PIX RECEBIDO - SALARIO   5.140,00",
    "Saldo em $(D $fimMes1): 8.420,35"
)

New-Doc "$dirNok\ir-sem-recibo.png" 'RECEITA FEDERAL DO BRASIL' @(
    'IMPOSTO SOBRE A RENDA - PESSOA FISICA',
    'DECLARACAO DE AJUSTE ANUAL',
    "Exercicio $($hoje.Year) - Ano-calendario $($hoje.Year - 1)",
    "Nome: $NOME",
    "CPF: $CPF",
    'Rendimentos tributaveis: 74.400,00'
)

New-Doc "$dirNok\iptu-sem-inscricao-e-metragem.png" "PREFEITURA MUNICIPAL DE CURITIBA - IPTU $($hoje.Year)" @(
    "Contribuinte: $NOME",
    'Endereco: Rua das Laranjeiras, 123 - Apt 402 - Centro',
    'Valor total do imposto: 1.250,00',
    'Parcela unica com desconto: 1.187,50'
)

New-Doc "$dirNok\matricula-his.png" $TIT_MAT (Linhas-Matricula @(
    'AV.2 - 02/02/2019 - Imovel enquadrado como HIS - Habitacao de Interesse Social.'
))

# Qualidade de imagem (conteudo valido, imagem ruim)
$linRes = Linhas-Residencia $NOME $CPF $hoje.AddDays(-20)
New-Doc "$dirNok\qualidade-desfocada.png" $TIT_RES $linRes -Efeito 'desfocar'
New-Doc "$dirNok\qualidade-baixa-resolucao.png" $TIT_RES $linRes -Largura 700 -Fonte 12
New-Doc "$dirNok\qualidade-escura.png" $TIT_RES $linRes -Fundo @(15, 15, 18) -Texto @(70, 70, 70) -Cabecalho @(60, 60, 80)
New-Doc "$dirNok\qualidade-flash-estourada.png" $TIT_RES $linRes -Fundo @(255, 255, 255)

# Validacao de arquivo (F04)
$bytes = New-Object byte[] (11 * 1024 * 1024)
(New-Object System.Random).NextBytes($bytes)
[IO.File]::WriteAllBytes("$dirNok\arquivo-acima-de-10mb.png", $bytes)
Write-Host '  arquivo-acima-de-10mb.png'
Set-Content -Path "$dirNok\formato-invalido.txt" -Value 'Este arquivo nao e PDF, JPG nem PNG.' -Encoding ASCII
Write-Host '  formato-invalido.txt'

Write-Host "`nDocumentos gerados em: $base"
