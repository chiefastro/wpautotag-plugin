<?php
add_action( 'rest_api_init', 'wpat_suggested_category_api');
function wpat_suggested_category_api(){
  register_rest_route(
    'wpautotag/v1',
    '/category/suggest/',
    array(
      'methods' => 'POST',
      'callback' => 'wpat_get_suggested_category_rest'
    ));
};
function wpat_get_suggested_category_rest( WP_REST_Request $data ) {
  $post_content = isset($data['post_content']) ? $data['post_content'] : '';
  $post_title = isset($data['post_title']) ? $data['post_title'] : '';
  $actual_categories = isset($data['actual_categories']) ? $data['actual_categories'] : array();
  $actual_tags = isset($data['actual_tags']) ? $data['actual_tags'] : array();
  $suggested_category = wpat_get_suggested_category(
    $post_content,
    $post_title,
    $actual_categories,
    $actual_tags
  );
  return $suggested_category;
}
function wpat_get_suggested_category(
  $content, $title, $actual_categories, $actual_tags
) {
  require_once( WPAUTOTAG__PLUGIN_DIR . 'category-api.php' );

  try {
    $suggested_category = wpat_call_category_api(
      $content, $title, $actual_categories, $actual_tags
    );
  } catch (\Exception | \Throwable $e) {
    $suggested_category = array(
      'status_code' => 500, 'response' => $e->getMessage()
    );
  }
  return $suggested_category;
}

?>
