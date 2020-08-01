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
  error_log(print_r($data, true));
  $payload = json_encode($data);
  error_log(print_r($payload, true));
  $header = array();
  $header[] = 'Content-Type: application/json';
  $header[] = 'x-api-key: 6wEZ4Lm3QW1WJMGSterQd7m5QGLoJ39x35qUWxsr';

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
    $result = $body_decode[0]->predicted_category;
  } else {
    $result = '';
  }
  return $result;
}
?>
