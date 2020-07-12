<?php
if (is_admin()) {
  add_action('wp_ajax_wpat_refresh_suggested_category', 'wpat_refresh_suggested_category');
  add_action('wp_ajax_wpat_assign_suggested_category', 'wpat_assign_suggested_category');
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
