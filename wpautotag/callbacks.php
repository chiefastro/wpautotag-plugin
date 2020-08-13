<?php
add_action( 'rest_api_init', 'wpat_suggested_category_api');
function wpat_suggested_category_api(){
  register_rest_route(
    'wpautotag/v1',
    '/category/suggest/',
    array(
      'methods' => WP_REST_Server::EDITABLE,//'POST', //
      'callback' => 'wpat_get_suggested_category_rest',
      'args' => array(
        'post_content' => array(
          'default' => '',
          'required' => true,
          'sanitize_callback' => function($param, $request, $key) {
            return wp_kses_post( $param );
          },
        ),
        'post_title' => array(
          'default' => '',
          'required' => true,
          'sanitize_callback' => function($param, $request, $key) {
            return sanitize_title( $param );
          },
        ),
        'actual_categories' => array(
          'default' => array(),
          'required' => true,
          'validate_callback' => function($param, $request, $key) {
            return is_array( $param );
          },
          'sanitize_callback' => function($param, $request, $key) {
            $cleaned = array();
            foreach ($param as $val) {
              $cleaned[] = sanitize_text_field( $val );
            }
            return $cleaned;
          },
        ),
        'actual_tags' => array(
          'default' => array(),
          'required' => true,
          'validate_callback' => function($param, $request, $key) {
            return is_array( $param );
          },
          'sanitize_callback' => function($param, $request, $key) {
            $cleaned = array();
            foreach ($param as $val) {
              $cleaned[] = sanitize_text_field( $val );
            }
            return $cleaned;
          },
        ),
        'post_id' => array(
          'default' => '',
          'required' => false,
          'validate_callback' => function($param, $request, $key) {
            return is_numeric( $param );
          },
        ),
      ),
    ));
};
function wpat_get_suggested_category_rest( WP_REST_Request $data ) {
  $suggested_category = wpat_get_suggested_category(
    $data['post_content'], $data['post_title'], $data['actual_categories'],
    $data['actual_tags'], $data['post_id']
  );
  return $suggested_category;
}
function wpat_get_suggested_category(
  $content, $title, $actual_categories, $actual_tags, $post_id
) {
  require_once( WPAUTOTAG__PLUGIN_DIR . 'category-api.php' );

  try {
    $suggested_category = wpat_call_category_api(
      $content, $title, $actual_categories, $actual_tags, $post_id
    );
  } catch (\Exception | \Throwable $e) {
    $suggested_category = array(
      'status_code' => 500, 'response' => $e->getMessage()
    );
  }
  return $suggested_category;
}

?>
