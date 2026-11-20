$outputFile = "BXB-Teams-Complete-Codebase.md"
$enc = New-Object System.Text.UTF8Encoding($false)
$writer = New-Object System.IO.StreamWriter($outputFile, $false, $enc)
$writer.WriteLine("# BXB Teams - Complete Codebase")
$writer.WriteLine("Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm')")

$files = Get-ChildItem -Path "src", "supabase", "." -Recurse -File -Include *.ts,*.tsx,*.css,*.sql,*.json,*.html -Exclude *.bak,package-lock.json -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch 'node_modules' }

foreach ($f in $files) {
    $rel = $f.FullName.Replace((Get-Location).Path + "\", "")
    $ext = $f.Extension.TrimStart('.')
    $lang = if ($ext -eq 'ts' -or $ext -eq 'tsx') { 'typescript' } elseif ($ext -eq 'sql') { 'sql' } elseif ($ext -eq 'json') { 'json' } elseif ($ext -eq 'css') { 'css' } elseif ($ext -eq 'html') { 'html' } else { '' }
    
    $writer.WriteLine("")
    $writer.WriteLine("### File: " + $rel)
    $writer.WriteLine('```' + $lang)
    $writer.Write([IO.File]::ReadAllText($f.FullName, $enc))
    $writer.WriteLine("")
    $writer.WriteLine('```')
}
$writer.Close()
Write-Host "SUCCESS! Exported to $outputFile" -ForegroundColor Green
