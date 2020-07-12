jQuery(document).ready(function($) {
  function get_post_content(db_version=false) {
    if (db_version) {
      var post_content = wp.data.select( "core/editor" ).getCurrentPost().content;
    } else {
      var post_content = wp.data.select( "core/editor" ).getEditedPostContent();
    }
    return post_content
  }
  function get_actual_categories() {
    var category_objs = wp.data.select('core').getEntityRecords(
      'taxonomy', 'category'
    );
    var actual_categories = []
    category_objs.forEach((cat_obj, i) => {
      actual_categories.push(cat_obj['name'])
    });
    return actual_categories
  }
  // Refresh Suggested Category
  function wpat_refresh_suggested_category(event) {
    console.log('wpat_refresh_suggested_category triggered');
  	var data = {
  		'action': 'wpat_refresh_suggested_category',
      'post_content': get_post_content(),
      'category_prior': ajax_object.category_prior,
      'actual_categories': get_actual_categories()
  	};
    console.log(data);
  	jQuery.post(ajax_object.ajax_url, data, function(response) {
      console.log(response);
      $( "#wpat_suggested_category_label" ).text(response);
      $( "#wpat_suggested_category" ).val(response);
  	});
  }
  $( "#wpat_refresh_suggested_category_button" ).on('click', wpat_refresh_suggested_category);
  // $(document).on( "wp.autosave", wpat_refresh_suggested_category);
  // $(document).on( 'tinymce-editor-init.autosave', function() {
  //   console.log('autosave triggered');
  // });
  // const unsubscribe = wp.data.subscribe(function () {

  function wpat_refresh_suggested_category_on_save(event) {
    console.log('wpat_refresh_suggested_category triggered');
    var post_content = get_post_content();
    console.log('checking for changes');
    var post_content_orig = get_post_content(db_version=true);
    if (post_content_orig == post_content) {
      console.log('no changes, returning');
      return;
    }
  	var data = {
  		'action': 'wpat_refresh_suggested_category',
      'post_content': post_content,
      'category_prior': ajax_object.category_prior,
      'actual_categories': get_actual_categories()
  	};
    console.log(data);
  	jQuery.post(ajax_object.ajax_url, data, function(response) {
      console.log(response);
      $( "#wpat_suggested_category_label" ).text(response);
      $( "#wpat_suggested_category" ).val(response);
  	});
  }
  wp.data.subscribe(function (event) {
    var isSavingPost = wp.data.select('core/editor').isSavingPost();
    var isAutosavingPost = wp.data.select('core/editor').isAutosavingPost();
    if (isSavingPost || isAutosavingPost) {
      // unsubscribe();
      wpat_refresh_suggested_category_on_save(event);
    }
  });

  // Assign Suggested Category
  function wpat_assign_suggested_category() {
    console.log('wpat_assign_suggested_category')
  	var data = {
  		'action': 'wpat_assign_suggested_category',
      'assigned_category': $( "#wpat_suggested_category" ).val(),
      'unassign': !this.checked,
      'post_id': wp.data.select( "core/editor" ).getCurrentPostId() //$('#post_ID').val()
  	};
    console.log(data);
    console.log(ajax_object);
  	jQuery.post(ajax_object.ajax_url, data, function(response) {
      console.log('response' + response);
      // $( "#wpat_suggested_category_checkbox" ).prop( "checked", true );
  	});
  }
  $( "#wpat_suggested_category_checkbox" ).change(wpat_assign_suggested_category);

});
