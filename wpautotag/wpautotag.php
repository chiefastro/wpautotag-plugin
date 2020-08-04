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

/* Styles */
add_action( 'admin_print_styles', 'wpat_enqueue_styles');
function wpat_enqueue_styles() {
  wp_enqueue_style(
    'wpautotag_style',
    WPAUTOTAG__PLUGIN_URL . 'style.css',
    $ver=WPAUTOTAG__PLUGIN_VER
  );
}

/* Helpers for suggested category */
function wpat_get_category_prior() {
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
function wpat_strcase($str, $case='lower') {
  switch ($case) {
    case 'lower':
      return strtolower($str);
      break;
    case 'upper':
      return strtoupper($str);
      break;
    case 'title':
      return ucwords($str);
      break;
    case 'sentence':
      return ucfirst($str);
      break;
    default:
      return $str;
      break;
  }
}

/* JS for edit post */
add_action( 'admin_enqueue_scripts', 'wpat_script_enqueue_edit_post' );
function wpat_script_enqueue_edit_post($hook) {
  global $post;
  if ( $hook == 'post-new.php' || $hook == 'post.php' ) {
  	wp_enqueue_script(
      'ajax-script-wpat-edit-post',
      plugins_url( '/js/wpat-edit-post.js', __FILE__ ),
      array('jquery')
    );
    $category_prior = wpat_get_category_prior();
    $actual_categories = wpat_get_actual_categories($post->ID);
    $suggested_category_response = wpat_get_suggested_category(
      $post->post_content, $category_prior, $actual_categories
    );
    $suggested_category = $suggested_category_response['status_code'] == 200 ?
      $suggested_category_response['response'] : 'Error';
    $error_msg = $suggested_category_response['status_code'] == 200 ?
      '' : $suggested_category_response['response'];

  	wp_localize_script(
      'ajax-script-wpat-edit-post', 'ajax_object',
      array(
        'ajax_url' => admin_url( 'admin-ajax.php' ),
        'category_prior' => $category_prior,
        'actual_categories' => $actual_categories,
        'suggested_category' => $suggested_category,
        'error_msg' => $error_msg,
      )
    );
  }
}

/* Admin page */
add_action('admin_menu', 'wpat_add_settings_page');
function wpat_add_settings_page() {
  add_options_page(
    'WP Auto Tag Settings', 'WP Auto Tag',
    'manage_options', 'wpautotag-settings', 'wpat_settings_page'
  );
}
function wpat_settings_page() {
  //must check that the user has the required capability
  if (!current_user_can('manage_options'))
  {
    wp_die( 'You do not have sufficient permissions to access this page.' );
  }

  // variables for the field and option names
  $api_key_name = 'wpat_api_key';
  $hidden_field_name = 'wpat_submit_hidden';
  $capital_strategy_name = 'wpat_capital_strategy';

  // Read in existing option value from database
  $api_key_val = get_option( $api_key_name );
  $capital_strategy_val = get_option( $capital_strategy_name );

  // See if the user has posted us some information
  // If they did, this hidden field will be set to 'Y'
  if( isset($_POST[ $hidden_field_name ]) && $_POST[ $hidden_field_name ] == 'Y' ) {
      // Read their posted value
      $api_key_val = $_POST[ $api_key_name ];
      $capital_strategy_val = $_POST[ $capital_strategy_name ];
      // Save the posted value in the database
      update_option( $api_key_name, $api_key_val );
      update_option( $capital_strategy_name, $capital_strategy_val );
      // Put a "settings saved" message on the screen
      ?>
      <div class="updated"><p><strong>
        Settings saved.
      </strong></p></div>
      <?php
  }

  // Now display the settings editing screen
  ?>
  <div class="wrap">
    <h2>WP Auto Tag Settings</h2>
    <h3>Initial Setup</h3>
    <p>
      To receive category suggestions from this plugin, follow the steps below
      to get your free API key.
    </p>
    <ol>
      <li>
        Register on
        <a href="http://wpautotag.com/registration/" target="_blank">
          wpautotag.com</a>.
      </li>
      <li>
        Verify your email address.
      </li>
      <li>
        Find your API key on your
        <a href="http://wpautotag.com/my-account/api-key-item/" target="_blank
        ">
          profile page</a>.
      </li>
      <li>
        Copy and paste your API key into the box below and click "Save Changes."
      </li>
    </ol>
    <form name="wpat_admin" method="post" action="">
      <input type="hidden" name="<?php echo $hidden_field_name; ?>" value="Y">
      <label for="<?php echo $api_key_name; ?>">API Key</label>
      <input type="text" name="<?php echo $api_key_name; ?>"
        value="<?php echo $api_key_val; ?>" size="35">

      <h3>Options</h3>
      <label for="<?php echo $capital_strategy_name; ?>">
        How would you like suggested categories to be displayed?
      </label>
      <select name="<?php echo $capital_strategy_name; ?>">
        <option value="lower"
          <?php echo $capital_strategy_val == "lower" ? "selected" : ""; ?>
        >lower case</option>
        <option value="upper"
          <?php echo $capital_strategy_val == "upper" ? "selected" : ""; ?>
        >UPPER CASE</option>
        <option value="title"
          <?php echo $capital_strategy_val == "title" ? "selected" : ""; ?>
        >Capitalize First Letter Of Each Word</option>
        <option value="sentence"
          <?php echo $capital_strategy_val == "sentence" ? "selected" : ""; ?>
        >Capitalize first letter of first word</option>
      </select>
      <p class="submit">
        <input type="submit" name="Submit" class="button-primary"
          value="<?php esc_attr_e('Save Changes') ?>" />
      </p>
    </form>
  </div>
  <?php
}

?>
