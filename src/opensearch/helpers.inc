<?PHP

/**
 * Return the value of an array given the key.
 * If the key it not set, return a default value.
 *
 * @param array $array
 *    The array to return the value from.
 * @param string $key
 *    The key of the array.
 * @param mixed $default_value
 *    (optional) The default value to return if the key not exists.
 * @return mixed
 *    The returned value.
 */
function array_value($array, $key, $default_value = null) {
  if (isset($array[$key])) {
    return $array[$key];
  }
  return $default_value;
}

function getBaseUrl() {

 $baseUrl = 'http';

 // Check if https.
 if (!empty($_SERVER["HTTPS"])) {
   $baseUrl .= "s";
 }

 // Add separator and domain.
 $baseUrl .= "://";
 $baseUrl .= $_SERVER["SERVER_NAME"];

 // Add path.
 $baseUrl .= $_SERVER["SCRIPT_NAME"];

 return $baseUrl;
}
