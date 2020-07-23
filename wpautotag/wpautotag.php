<?php
   /*
   Plugin Name: WP Auto Tag
   Plugin URI: http://wpautotag.com
   Description: Automatically tag and categorize your posts.
   Version: 0.0.1
   Author: Jared Rand
   Author URI: http://jrandblog.com
   License: GPLv3
   */
?>

<?php

// $plugin_data = get_plugin_data( __FILE__ );
$plugin_data = get_file_data(__FILE__, array('Version' => 'Version'), false);
$plugin_version = $plugin_data['Version'];

define( 'WPAUTOTAG__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'WPAUTOTAG__PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'WPAUTOTAG__PLUGIN_VER', $plugin_version );
require WPAUTOTAG__PLUGIN_DIR . 'callbacks.php';

add_action( 'admin_print_styles', 'wpat_enqueue_styles');
function wpat_enqueue_styles() {
  wp_enqueue_style(
    'wpautotag_style',
    WPAUTOTAG__PLUGIN_URL . 'style.css',
    $ver=WPAUTOTAG__PLUGIN_VER
  );
}

function wpat_get_category_prior() {
  // $category_prior = wp_list_categories(array('show_count' => True));
  $raw_category_list = get_categories(array('count' => True));
  $category_prior = array();
  foreach ($raw_category_list as $category_obj) {
    $category_prior[$category_obj->name] = $category_obj->count;
  }
  return $category_prior;
}
function wpat_get_actual_categories($post_id) {
  $raw_category_list = get_the_category($post_id);
  $actual_categories = array();
  foreach ($raw_category_list as $category_obj) {
    $actual_categories[] = $category_obj->name;
  }
  return $actual_categories;
}
add_action( 'admin_enqueue_scripts', 'wpat_script_enqueue_edit_post' );
function wpat_script_enqueue_edit_post($hook) {
  global $post;
  if ( $hook == 'post-new.php' || $hook == 'post.php' ) {
  	wp_enqueue_script(
      'ajax-script-wpat-edit-post',
      // plugins_url( '/js/wpat-edit-post.js', __FILE__ ),
      plugins_url( '/js/wpat-edit-post-v2.js', __FILE__ ),
      array('jquery') //, 'wp-element', 'wp-i18n', 'wp-editor')
      // ['wp-element']
    );
    $category_prior = wpat_get_category_prior();
    $actual_categories = wpat_get_actual_categories($post->ID);
    $suggested_category = wpat_get_suggested_category(
      $post->post_content, $category_prior, $actual_categories
    );
  	wp_localize_script(
      'ajax-script-wpat-edit-post', 'ajax_object',
      array(
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'category_prior' => $category_prior,
        'actual_categories' => $actual_categories,
        'suggested_category' => $suggested_category
      )
    );
  }
}
function wpat_add_suggested_category_box()
{
    $screens = ['post'];
    foreach ($screens as $screen) {
        add_meta_box(
            'wpat_suggested_category_box',
            'Suggested Category',
            'wpat_suggested_category_html',
            $screen,
            'side',
            'high'
        );
    }
}
add_action('add_meta_boxes', 'wpat_add_suggested_category_box');
function wpat_suggested_category_html() {
  global $post;
  $category_prior = wpat_get_category_prior();
  $actual_categories = wpat_get_actual_categories($post->ID);
  $suggested_category = wpat_get_suggested_category(
    $post->post_content, $category_prior, $actual_categories
  );
  ?>
  <p>Categories suggested by WP Auto Tag - testing</p>
  <input
    type="checkbox"
    id="wpat_suggested_category_checkbox"
    name="wpat_suggested_category_checkbox"
  >
  <label id='wpat_suggested_category_label' for="wpat_suggested_category_checkbox">
    <?php echo $suggested_category ?>
  </label>
  <input type="hidden" id="wpat_suggested_category" name="wpat_suggested_category" value="<?php echo $suggested_category ?>">
  <!-- <button id="wpat_assign_suggested_category_button" class="wpat_category_actions">Assign Suggested Category</button> -->
  <button id="wpat_refresh_suggested_category_button" class="wpat_category_actions">Refresh Suggested Category</button>
  <?php
}
?>
