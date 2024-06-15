<?PHP

require_once('helpers.inc');

// Get base URLs.
$urlScript     = getBaseUrl();
$urlOpensearch = str_replace('index.php', '', $urlScript);
$urlTrovu      = str_replace('opensearch/', '', $urlOpensearch);

// Get environment from GET params.
$env = $_GET;

$title = 'Trovu: ';

if (!empty($env['github'])) {
  $title .=  $env['github'];
}
else if (!empty($env['configUrl'])) {
  $title .=  $env['configUrl'];
}
else {
  // Set fallback values.
  $env['language'] = $env['language'] ?? 'en';
  $env['country']  = $env['country']  ?? 'us';
  $title .=  $env['language'] . '-' . strtoupper($env['country']);
  if ($env['defaultKeyword']) {
    $title .= ' ' . $env['defaultKeyword'];
  }
}

// Build param string.
$paramStr = htmlspecialchars(http_build_query($env));

// Send HTTP header.
header('Content-type: application/opensearchdescription+xml');
// Or this?
// header('Content-type: text/xml'); 

require_once('template.inc');
