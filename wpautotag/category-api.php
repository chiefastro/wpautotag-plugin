<?php
function wpat_call_category_api($content, $category_prior, $actual_categories) {
  $endpoint_url = 'https://4wsks8oul5.execute-api.us-east-2.amazonaws.com/preprod/category-model';
  // cast to int
  if ($category_prior) {
    $category_prior = array_map('intval', $category_prior);
  } else {
    // if empty, cast to stdClass so empty dict will be passed to API
    $category_prior = new stdClass();
  }
  $data = array(
    'data' => [
      array(
        "text" => $content,
        "prior" => $category_prior,
        "actual_categories" => $actual_categories
      )
    ]
  );
  $payload = json_encode($data);
  error_log(print_r($payload, true));
  $header = array();
  $header[] = 'Content-Type: application/json';
  $wpat_api_key = get_option('wpat_api_key');
  $null_api_key_msg = 'API key required, please add one on the <a href="' .
    menu_page_url('wpautotag-settings', false) .
    '" target="_blank">settings page</a>.';
  if (!$wpat_api_key) {
    // api call will fail, return before even trying
    return array('status_code' => 403, 'response' => $null_api_key_msg);
  }
  $header[] = 'x-api-key: ' . $wpat_api_key;

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $endpoint_url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
  curl_setopt($ch, CURLOPT_HTTPHEADER, $header);

  $raw_body = curl_exec($ch);
  $body_decode = json_decode($raw_body);
  $status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  error_log(print_r($body_decode, true));
  if ($status_code == 200) {
    $result = wpat_strcase(
      $body_decode[0]->predicted_category,
      get_option('wpat_capital_strategy')
    );
  } elseif ($status_code == 403) {
    if ($wpat_api_key) {
      $result = 'Invalid API key';
    } else {
      $result = $null_api_key_msg;
    }
  } elseif ($status_code == 429) {
    $result = 'Too many requests. If this error persists, you may be over your
      monthly quota of API calls. Please contact
      <a href="mailto:hi@wpautotag.com">hi@wpautotag.com</a>.';
  } else {
    $result = 'Error code: ' . $status_code . '<br>' . $body_decode->message;
  }
  return array('status_code' => $status_code, 'response' => $result);
}
?>
