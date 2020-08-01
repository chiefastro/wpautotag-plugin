<?php
if (is_admin()) {
  add_action('wp_ajax_wpat_refresh_suggested_category', 'wpat_refresh_suggested_category');
  add_action('wp_ajax_wpat_assign_suggested_category', 'wpat_assign_suggested_category');
}

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
  $category_prior = isset($data['category_prior']) ? $data['category_prior'] : array();
  $actual_categories = isset($data['actual_categories']) ? $data['actual_categories'] : array();
  $suggested_category = wpat_get_suggested_category(
    $post_content,
    $category_prior,
    $actual_categories
  );
  return $suggested_category;
}
function wpat_get_suggested_category(
  $content, $category_prior, $actual_categories
) {
  require_once( WPAUTOTAG__PLUGIN_DIR . 'category-api.php' );
  return wpat_call_category_api($content, $category_prior, $actual_categories);
}

?>
