// These are some selectors
function setPostContent() {
  if (db_version) {
    var postContent = wp.data.select( "core/editor" ).getCurrentPost().content;
  } else {
    var postContent = wp.data.select( "core/editor" ).getEditedPostContent();
  }
  return {
    type: 'SET_',
    postContent: postContent
  };
  return post_content;
}
function setActualCategories() {
  var category_objs = wp.data.select('core').getEntityRecords(
    'taxonomy', 'category'
  );
  var actual_categories = [];
  category_objs.forEach((cat_obj, i) => {
    actual_categories.push(cat_obj['name'])
  });
  return actual_categories;
}
var data = {
  'action': 'wpat_refresh_suggested_category',
  'post_content': state.postContent,
  'category_prior': state.ajax_object.category_prior,
  'actual_categories': state.actualCategories
};
console.log(data);
jQuery.post(state.ajax_object.ajax_url, data, function(response) {
  var suggestedCategory = response;
  console.log(response);
  $( "#wpat_suggested_category_label" ).text(suggestedCategory);
  $( "#wpat_suggested_category" ).val(suggestedCategory);
});

jQuery(document).ready(function($) {
  $( "#wpat_refresh_suggested_category_button" ).on(
    'click',
    wp.data.dispatch( wpatNamespace ).getSuggestedCategory()
  );
});
