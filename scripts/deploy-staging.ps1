$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
function Require-Success([string] $operation) {
    if ($LASTEXITCODE -ne 0) { throw "$operation failed; deployment stopped." }
}
$commit = (git rev-parse HEAD).Trim()
Require-Success 'Resolve commit'
if (git status --porcelain) { throw 'Deploy from a clean committed checkout only.' }
$remote = git ls-remote origin refs/heads/main
Require-Success 'Read remote main'
if (-not $remote.StartsWith($commit)) { throw 'HEAD must match approved origin/main.' }
$runs = gh run list --repo Nifemi0/Ver --workflow CI --commit $commit --limit 10 --json databaseId,status,conclusion,headSha | ConvertFrom-Json
Require-Success 'Read CI runs'
$run = $runs | Select-Object -First 1
if (-not $run -or $run.status -ne 'completed' -or $run.conclusion -ne 'success' -or $run.headSha -ne $commit) {
    throw 'The latest CI run for this exact commit must be completed and successful.'
}
$runDetails = gh run view $run.databaseId --repo Nifemi0/Ver --json jobs | ConvertFrom-Json
Require-Success 'Read CI jobs'
foreach ($required in @('app (ubuntu-latest)', 'app (windows-latest)', 'contracts')) {
    if (-not ($runDetails.jobs | Where-Object { $_.name -eq $required -and $_.conclusion -eq 'success' })) {
        throw "Required check missing or unsuccessful: $required"
    }
}
$link = Get-Content .vercel/project.json -Raw | ConvertFrom-Json
if ($link.projectId -ne 'prj_hE8q0aqirBkswN4stxOPQpGdfv72' -or $link.orgId -ne 'team_MsmPCRYHNYE4kOYP8mywdGip') {
    throw 'Unexpected Vercel project link.'
}
Write-Output "CI gate passed for $commit (run $($run.databaseId)). Deploying preview only."
if ($IsWindows) {
    # Native function dependencies must be built for the Linux deployment runtime.
    # Upload this clean CI-approved source; Vercel builds it with npm ci on Linux.
    vercel deploy --yes --scope nifemi0s-projects
    Require-Success 'Build and deploy preview on Linux'
    exit 0
}
vercel pull --yes --environment=preview --git-branch=main --scope nifemi0s-projects
Require-Success 'Pull preview settings'
vercel build --scope nifemi0s-projects
Require-Success 'Build preview'
if (git status --porcelain) { throw 'Build changed the checkout; deployment stopped.' }
vercel deploy --prebuilt --yes --scope nifemi0s-projects
Require-Success 'Deploy preview'
