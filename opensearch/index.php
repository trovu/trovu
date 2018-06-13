<?PHP

require_once('helpers.inc');

// Get base URLs.
$urlScript     = getBaseUrl();
$urlOpensearch = str_replace('index.php', '', $urlScript);
$urlTrovu      = str_replace('opensearch/', '', $urlOpensearch);

// Get environment from GET params.
$env = $_GET;

// Set defaults for namespaces.
$env['namespaces'] = array_value($env, 'namespaces', 'o,de,.de');

// Build param string.
$paramStr = htmlspecialchars(http_build_query($env));

// Send HTTP header.
header('Content-type: application/opensearchdescription+xml'); 
// Or this?
// header('Content-type: text/xml'); 

require_once('template.inc');
