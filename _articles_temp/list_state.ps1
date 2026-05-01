$key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrY3RzbndyaWhyYnF2Y2tvaml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyMjQ0NiwiZXhwIjoyMDkyNzk4NDQ2fQ.Y2dOM7vhnQaQ5opWX_GFxCb12cqt59K97-AROk7g0I0'
$h = @{ apikey = $key; Authorization = "Bearer $key" }

Write-Host '=== Categorias ==='
$cats = Invoke-RestMethod -Uri 'https://xkctsnwrihrbqvckojix.supabase.co/rest/v1/blog_categories?select=slug,name&order=display_order' -Headers $h
foreach ($c in $cats) { Write-Host ("  {0,-12} -> {1}" -f $c.slug, $c.name) }

Write-Host ''
Write-Host '=== Posts publicados ==='
$p = Invoke-RestMethod -Uri 'https://xkctsnwrihrbqvckojix.supabase.co/rest/v1/blog_posts?select=slug,title,category_slug,published_at,status&status=eq.published&order=published_at.desc' -Headers $h
Write-Host ("Total publicados: {0}" -f $p.Count)
foreach ($x in $p) {
    $cat = if ($x.category_slug) { $x.category_slug } else { '(none)' }
    $title = if ($x.title) { $x.title } else { '(no title)' }
    Write-Host ("  [{0,-12}] {1}" -f $cat, $x.slug)
    Write-Host ("       {0}" -f $title)
}

Write-Host ''
Write-Host '=== Posts en otros estados ==='
$d = Invoke-RestMethod -Uri 'https://xkctsnwrihrbqvckojix.supabase.co/rest/v1/blog_posts?select=slug,title,category_slug,status&status=neq.published' -Headers $h
Write-Host ("Total no publicados: {0}" -f $d.Count)
foreach ($x in $d) {
    $cat = if ($x.category_slug) { $x.category_slug } else { '(none)' }
    Write-Host ("  [{0}] [{1}] {2}" -f $x.status, $cat, $x.slug)
}
