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
      'callback' => 'wpat_get_suggested_category_rest',
      // 'args'     => array(
			// 		'post_content' => array(
			// 			'required'          => false
			// 		),
			// 		'category_prior'     => array(
			// 			'required'          => false
			// 		),
			// 		'actual_categories'   => array(
			// 			'required'          => false
			// 		),
			// 	),
    ));
};
function wpat_get_suggested_category_rest( WP_REST_Request $data ) {
  error_log(print_r($data, true));
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
add_action( 'rest_api_init', 'wpat_add_category_api');
function wpat_add_category_api(){
  register_rest_route(
    'wpautotag/v1',
    '/category/add/',
    array(
      'methods' => 'POST',
      'callback' => 'wpat_add_category_rest',
      'permission_callback' => function () {
        return current_user_can( 'manage_categories' );
      }
    ));
};
function wpat_add_category_rest( WP_REST_Request $data ) {
  if (file_exists (ABSPATH.'/wp-admin/includes/taxonomy.php')) {
    require_once (ABSPATH.'/wp-admin/includes/taxonomy.php');
  }
  $category_name = isset($data['category_name']) ? $data['category_name'] : '';
  return intval(wp_create_category($category_name));
}

function wpat_refresh_suggested_category() {
  $suggested_category = wpat_get_suggested_category(
    $_POST['post_content'],
    $_POST['category_prior'],
    $_POST['actual_categories']
  );
  echo $suggested_category;
  wp_die();
}
function wpat_get_suggested_category(
  $content, $category_prior, $actual_categories
) {
  require_once( WPAUTOTAG__PLUGIN_DIR . 'category-api.php' );
  return wpat_call_category_api($content, $category_prior, $actual_categories);
}
function wpat_display_suggested_category($suggested_category) {
  echo $suggested_category;
}
function wpat_assign_suggested_category() {
    $assigned_category = $_POST['assigned_category'];
    $post_id = intval($_POST['post_id']);
    $unassign = $_POST['unassign'] === 'true';
    $category_id = intval(wp_create_category($assigned_category));
    if ($unassign) {
      wp_remove_object_terms($post_id, $category_id, 'category');
    } else {
      wp_set_post_categories($post_id, $category_id, $append=True);
    }

    wp_die();
}

?>
