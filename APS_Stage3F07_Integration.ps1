
# APS Stage 3F-07 - Controlled Bibliographic Integration
# Run from the aps-web-1 repository root.
# Do not commit or deploy until validation is complete.

$ErrorActionPreference = 'Stop'

$article = 'src/content/articles/can-ai-be-alive-an-aps-clarification-ci.md'
$refs = 'src/data/aps-canonical-references.yaml'
$utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($path in @($article, $refs)) {
    if (-not (Test-Path $path)) {
        throw "Missing required file: $path"
    }
}

$a = [System.IO.File]::ReadAllText(
    (Resolve-Path $article).Path,
    [System.Text.Encoding]::UTF8
)
$r = [System.IO.File]::ReadAllText(
    (Resolve-Path $refs).Path,
    [System.Text.Encoding]::UTF8
)

$ids = @(
    'bedau-2003-artificial-life'
    'butlin-et-al-2026-consciousness-indicators'
    'katla-lin-perez-mercader-2025-self-reproduction'
    'minagawa-et-al-2025-self-growing-protocells'
    'restrepo-sierra-et-al-2026-synthetic-cell'
    'stepney-2025-virtual-artificial-life'
)

foreach ($id in $ids) {
    $pattern = "(?m)^\s*- id: $([regex]::Escape($id))\s*$"
    if ($r -match $pattern) {
        throw "Reference identifier already exists: $id"
    }
}

if ($a -notmatch '(?m)^## Provisional References\s*$') {
    throw 'Expected provisional bibliography not found.'
}

if ($a -notmatch '(?m)^revised: 2026-11-06\s*$') {
    throw 'Unexpected article revision date.'
}

$fm = [regex]::Match(
    $a,
    '(?s)\A---\r?\n(.*?)\r?\n---\r?\n'
)

if (-not $fm.Success) {
    throw 'Frontmatter boundaries not found.'
}

$fmText = $fm.Groups[1].Value

foreach ($expected in @(
    'canonical: true'
    'canonicalLockDate: 2026-05-07'
    'role: extension'
    'cluster: artificial-systems-and-boundaries'
)) {
    if (-not $fmText.Contains($expected)) {
        throw "Unexpected frontmatter: $expected"
    }
}

$newRecords = @'
- id: bedau-2003-artificial-life
  type: journal-article
  authors: Bedau, M. A.
  year: 2003
  title: 'Artificial life: organization, adaptation and complexity from the bottom up'
  journal: Trends in Cognitive Sciences
  volume: '7'
  issue: '11'
  pages: 505–512
  doi: 10.1016/j.tics.2003.09.012
  verification:
    status: verified
    authority: Elsevier
    verifiedDate: 2026-11-06

- id: butlin-et-al-2026-consciousness-indicators
  type: journal-article
  authors: Butlin, P., et al.
  year: 2026
  title: Identifying indicators of consciousness in AI systems
  journal: Trends in Cognitive Sciences
  volume: '30'
  issue: '6'
  pages: 488–501
  doi: 10.1016/j.tics.2025.10.011
  verification:
    status: verified
    authority: Elsevier
    verifiedDate: 2026-11-06

- id: katla-lin-perez-mercader-2025-self-reproduction
  type: journal-article
  authors: Katla, S. K., Lin, C., & Pérez-Mercader, J.
  year: 2025
  title: Self-reproduction as an autonomous process of growth and reorganization in fully abiotic, artificial and synthetic cells
  journal: Proceedings of the National Academy of Sciences
  volume: '122'
  issue: '22'
  article-number: e2412514122
  doi: 10.1073/pnas.2412514122
  verification:
    status: verified
    authority: National Academy of Sciences
    verifiedDate: 2026-11-06

- id: minagawa-et-al-2025-self-growing-protocells
  type: journal-article
  authors: Minagawa, Y., Yabuta, M., Su’etsugu, M., & Noji, H.
  year: 2025
  title: Self-growing protocell models in aqueous two-phase system induced by internal DNA replication reaction
  journal: Nature Communications
  volume: '16'
  article-number: '1522'
  doi: 10.1038/s41467-025-56172-7
  verification:
    status: verified
    authority: Springer Nature
    verifiedDate: 2026-11-06

- id: restrepo-sierra-et-al-2026-synthetic-cell
  type: journal-article
  authors: Restrepo Sierra, A. M., Ramirez Gomez, F., van Tongeren, M., Sierra Heras, L., & Danelon, C.
  year: 2026
  title: A synthetic cell with integrated DNA self-replication and lipid biosynthesis
  journal: Nature Communications
  volume: '17'
  article-number: '2727'
  doi: 10.1038/s41467-026-69531-9
  verification:
    status: verified
    authority: Springer Nature
    verifiedDate: 2026-11-06

- id: stepney-2025-virtual-artificial-life
  type: journal-article
  authors: Stepney, S.
  year: 2025
  title: 'Towards origins of virtual artificial life: an overview'
  journal: Philosophical Transactions of the Royal Society B
  volume: '380'
  issue: '1936'
  article-number: '20240298'
  doi: 10.1098/rstb.2024.0298
  verification:
    status: verified
    authority: Royal Society
    verifiedDate: 2026-11-06
'@

$newFMReferences = @'
references:
  - id: bedau-2003-artificial-life
    authors: "Bedau, M. A."
    year: 2003
    title: "Artificial life: organization, adaptation and complexity from the bottom up"
    journal: "Trends in Cognitive Sciences"
    volume: "7"
    pages: "505–512"
  - id: butlin-et-al-2026-consciousness-indicators
    authors: "Butlin, P., et al."
    year: 2026
    title: "Identifying indicators of consciousness in AI systems"
    journal: "Trends in Cognitive Sciences"
    volume: "30"
    pages: "488–501"
  - id: katla-lin-perez-mercader-2025-self-reproduction
    authors: "Katla, S. K., Lin, C., & Pérez-Mercader, J."
    year: 2025
    title: "Self-reproduction as an autonomous process of growth and reorganization in fully abiotic, artificial and synthetic cells"
    journal: "Proceedings of the National Academy of Sciences"
    volume: "122"
  - id: maturana-varela-1980-autopoiesis-cognition
    authors: "Maturana, H. R., & Varela, F. J."
    year: 1980
    title: "Autopoiesis and Cognition: The Realization of the Living"
    source: "D. Reidel"
  - id: minagawa-et-al-2025-self-growing-protocells
    authors: "Minagawa, Y., Yabuta, M., Su’etsugu, M., & Noji, H."
    year: 2025
    title: "Self-growing protocell models in aqueous two-phase system induced by internal DNA replication reaction"
    journal: "Nature Communications"
    volume: "16"
  - id: montevil-mossio-2015-closure-constraints
    authors: "Montévil, M., & Mossio, M."
    year: 2015
    title: "Biological Organisation as Closure of Constraints"
    journal: "Journal of Theoretical Biology"
    volume: "372"
    pages: "179–191"
  - id: moreno-mossio-2015-biological-autonomy
    authors: "Moreno, A., & Mossio, M."
    year: 2015
    title: "Biological Autonomy: A Philosophical and Theoretical Enquiry"
    source: "Springer"
  - id: restrepo-sierra-et-al-2026-synthetic-cell
    authors: "Restrepo Sierra, A. M., Ramirez Gomez, F., van Tongeren, M., Sierra Heras, L., & Danelon, C."
    year: 2026
    title: "A synthetic cell with integrated DNA self-replication and lipid biosynthesis"
    journal: "Nature Communications"
    volume: "17"
  - id: stepney-2025-virtual-artificial-life
    authors: "Stepney, S."
    year: 2025
    title: "Towards origins of virtual artificial life: an overview"
    journal: "Philosophical Transactions of the Royal Society B"
    volume: "380"
'@

$abstractAndPoints = @'
abstract: >
  Can artificial intelligence be alive? This article examines the difference between intelligent behaviour and living organisation through the Agency–Process–Scale (APS) framework. It explains why intelligence, learning, and computational sophistication do not by themselves establish life, and considers whether future robots, synthetic cells, or virtual systems could meet the organisational conditions associated with living systems. Drawing on recent artificial-cell research and competing theories of life, it distinguishes APS's conceptual criteria from empirical evidence and acknowledges the unresolved boundaries of artificial life.
keyPoints:
  - Intelligence, cognition, consciousness, and biological agency are distinct concepts.
  - APS characterises life in terms of viability-oriented, constraint-closed organisation.
  - Dependence on external resources does not distinguish artificial systems from living organisms; the organisation of self-maintenance is the relevant question.
  - Recent synthetic-cell experiments demonstrate important components of living organisation without establishing fully autonomous artificial life.
  - APS does not exclude artificial or non-carbon-based life in principle, but its criteria must be assessed against empirical evidence and competing theoretical accounts.
'@

$bibliography = @'
## References

Bedau, M. A. (2003). Artificial life: organization, adaptation and complexity from the bottom up. *Trends in Cognitive Sciences*, 7(11), 505–512. https://doi.org/10.1016/j.tics.2003.09.012

Butlin, P., et al. (2026). Identifying indicators of consciousness in AI systems. *Trends in Cognitive Sciences*, 30(6), 488–501. https://doi.org/10.1016/j.tics.2025.10.011

Katla, S. K., Lin, C., & Pérez-Mercader, J. (2025). Self-reproduction as an autonomous process of growth and reorganization in fully abiotic, artificial and synthetic cells. *Proceedings of the National Academy of Sciences*, 122(22), e2412514122. https://doi.org/10.1073/pnas.2412514122

Maturana, H. R., & Varela, F. J. (1980). *Autopoiesis and Cognition: The Realization of the Living*. D. Reidel.

Minagawa, Y., Yabuta, M., Su’etsugu, M., & Noji, H. (2025). Self-growing protocell models in aqueous two-phase system induced by internal DNA replication reaction. *Nature Communications*, 16, 1522. https://doi.org/10.1038/s41467-025-56172-7

Montévil, M., & Mossio, M. (2015). Biological organisation as closure of constraints. *Journal of Theoretical Biology*, 372, 179–191. https://doi.org/10.1016/j.jtbi.2015.02.029

Moreno, A., & Mossio, M. (2015). *Biological Autonomy: A Philosophical and Theoretical Enquiry*. Springer. https://doi.org/10.1007/978-94-017-9837-2

Restrepo Sierra, A. M., Ramirez Gomez, F., van Tongeren, M., Sierra Heras, L., & Danelon, C. (2026). A synthetic cell with integrated DNA self-replication and lipid biosynthesis. *Nature Communications*, 17, 2727. https://doi.org/10.1038/s41467-026-69531-9

Stepney, S. (2025). Towards origins of virtual artificial life: an overview. *Philosophical Transactions of the Royal Society B*, 380(1936), 20240298. https://doi.org/10.1098/rstb.2024.0298
'@

$fmText2 = [regex]::Replace(
    $fmText,
    '(?sm)^abstract: >\r?\n.*?(?=^relatedGlossaryTerms:)',
    ($abstractAndPoints.TrimEnd() + "`n")
)

if ($fmText2 -eq $fmText) {
    throw 'Abstract and key points could not be located.'
}

$fmText3 = [regex]::Replace(
    $fmText2,
    '(?sm)^references:\r?\n.*\z',
    $newFMReferences.TrimEnd()
)

if ($fmText3 -eq $fmText2) {
    throw 'Frontmatter reference block could not be located.'
}

$newA = "---`n" + $fmText3 + "`n---`n" +
    $a.Substring($fm.Length)

$newA = [regex]::Replace(
    $newA,
    '(?sm)^## Provisional References\s*\r?\n.*\z',
    ($bibliography.TrimEnd() + "`n")
)

if ($newA -match 'Provisional References|Bibliographic status: Provisional') {
    throw 'Provisional bibliography remains.'
}

$newR = $r.TrimEnd("`r", "`n") +
    "`n" + $newRecords.Trim() + "`n"

# Back up both files before writing.
Copy-Item $article "$article.pre-3F07.bak" -ErrorAction Stop
Copy-Item $refs "$refs.pre-3F07.bak" -ErrorAction Stop

[System.IO.File]::WriteAllText(
    (Resolve-Path $refs).Path, $newR, $utf8
)

[System.IO.File]::WriteAllText(
    (Resolve-Path $article).Path, $newA, $utf8
)

Write-Host 'Stage 3F-07 integration written.'
Write-Host 'Inspect Git changes and run validators.'
Write-Host 'Do not commit or deploy yet.'
