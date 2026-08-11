# Inicia Activo en http://localhost:8123 sin instalar Node.js ni Python.
# Para detenerlo, presiona Ctrl+C en esta ventana.
param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 8123)
try { $listener.Start() } catch { Write-Error "No se pudo usar el puerto 8123. Cierra otra instancia o cambia el puerto en este archivo."; exit 1 }
$contentTypes = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.webmanifest'='application/manifest+json'; '.svg'='image/svg+xml' }
if (!$NoBrowser) { Start-Process 'http://localhost:8123/' }
Write-Host 'Activo está disponible en http://localhost:8123/  (Ctrl+C para cerrar)'
$running = $true
while ($running) {
  try {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    while (($line = $reader.ReadLine()) -ne $null -and $line -ne '') { }
    $match = [regex]::Match($requestLine, '^GET\s+([^\s?]+)')
    if (!$match.Success) { $client.Close(); continue }
    $relative = [Uri]::UnescapeDataString($match.Groups[1].Value.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
    $relative = $relative.Replace('/','\')
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
    if (!$file.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or !(Test-Path -LiteralPath $file -PathType Leaf)) {
      $header = [System.Text.Encoding]::ASCII.GetBytes("HTTP/1.1 404 Not Found`r`nContent-Length: 0`r`nConnection: close`r`n`r`n")
      $stream.Write($header,0,$header.Length); $client.Close(); continue
    }
    $extension = [System.IO.Path]::GetExtension($file)
    $contentType = if ($contentTypes.ContainsKey($extension)) { $contentTypes[$extension] } else { 'application/octet-stream' }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $header = [System.Text.Encoding]::ASCII.GetBytes("HTTP/1.1 200 OK`r`nContent-Type: $contentType`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n")
    $stream.Write($header,0,$header.Length); $stream.Write($bytes,0,$bytes.Length); $client.Close()
  } catch { if ($running) { Write-Warning $_.Exception.Message } }
}
