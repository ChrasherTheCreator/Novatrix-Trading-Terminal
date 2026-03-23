param(
    [string]$docx = "copy_grid.docx",
    [string]$output = "extracted_text.txt"
)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$temp = "temp_docx_extract"
if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
[System.IO.Compression.ZipFile]::ExtractToDirectory($docx, $temp)
$xml = [xml](Get-Content "$temp/word/document.xml")
$text = $xml.InnerXml -replace '<[^>]+>', "`n" -replace "[\n]+", "`n"
$text | Out-File -FilePath $output -Encoding utf8
