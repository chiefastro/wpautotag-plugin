const el = wp.element.createElement;
const __ = wp.i18n.__;
const CheckboxControl = wp.components.CheckboxControl;


jQuery(document).ready(function($) {
  function get_post_content(edited=true) {
    var postContent = '';
    if (edited) {
      postContent = wp.data.select( "core/editor" ).getEditedPostContent();
    } else {
      postContent = wp.data.select( "core/editor" ).getCurrentPost().content;
    }
    return postContent
  }
  function get_actual_categories(edited=true) {
    var catIds = [];
    if (edited) {
      catIds = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'categories' );
    } else {
      catIds = wp.data.select( 'core/editor' ).getCurrentPostAttribute( 'categories' );
    }
    let catObjs = wp.data.select( 'core' ).getEntityRecords( 'taxonomy', 'category' );
    var catIdNameMap = {};
    if (catObjs) {
      catObjs.forEach((catObj, i) => {
        if (catObj.taxonomy === 'category') {
          catIdNameMap[catObj.id] = catObj.name;
        }
      });
    };
    var actualCategories = [];
    if (catIds) {
      catIds.forEach((catId, i) => {
        actualCategories.push(catIdNameMap[catId]);
      });
    };
    return actualCategories
  }
  function arrEqual(a, b) {
    return a.length === b.length && a.every(value => b.includes(value));
  }

  // Refresh Suggested Category
  function wpat_refresh_suggested_category() {
    console.log('wpat_refresh_suggested_category triggered');
    var payload = {
      'post_content': get_post_content(edited=true),
      'category_prior': ajax_object.category_prior,
      'actual_categories': get_actual_categories(edited=true)
    };
    console.log(payload);
    wp.apiRequest( {
      path: 'wpautotag/v1/category',
      method: 'POST',
      data: payload
    } ).then(
      ( response ) => {
        console.log(response);
        $( "#wpat_suggested_category_label" ).text(response);
        $( "#wpat_suggested_category" ).val(response);
      }
    );

  	// jQuery.post(ajax_object.ajax_url, data, function(response) {
    //   console.log(response);
    //   $( "#wpat_suggested_category_label" ).text(response);
    //   $( "#wpat_suggested_category" ).val(response);
  	// });
  }
  $( "#wpat_refresh_suggested_category_button" ).on(
    'click', wpat_refresh_suggested_category
  );
  wp.data.subscribe(function (event) {
    let catsEqual = arrEqual(
      get_actual_categories(edited=true), get_actual_categories(edited=false)
    )
    if (
      (
        wp.data.select('core/editor').isSavingPost() ||
        wp.data.select('core/editor').isAutosavingPost()
      ) && (
        (get_post_content(edited=true) != get_post_content(edited=false)) ||
        catsEqual
      )
    ) {
      wpat_refresh_suggested_category();
    }
  });

  // Assign Suggested Category
  function wpat_assign_suggested_category() {
    console.log('wpat_assign_suggested_category');
  	var data = {
  		'action': 'wpat_assign_suggested_category',
      'assigned_category': $( "#wpat_suggested_category" ).val(),
      'unassign': !this.checked,
      'post_id': wp.data.select( "core/editor" ).getCurrentPostId()
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


/**
 * Render suggested category within HierarchicalTermSelector
 */
function renderSuggestedCategoryComponent( OriginalComponent ) {
	return function( props ) {
    console.log('filter entered');
    console.log(props);
    // return el(
		// 	'div',
		// 	{},
		// 	'Element inserted'
		// );
		if ( props.slug === 'category' ) {
      console.log('category entered');
      return el(
        'div',
        {key: 'wpat_category_container'},
        [
          el(
            OriginalComponent,
            {
              ...props,
              key: 'wpat_standard_category_container'
            }
          ),
          el(
            SuggestedCategoryComponentHOC,
            {key: 'wpat_suggested_category_container'}
          )
        ]
      );
			// 	OriginalComponent,
			// 	props,
      //   el(
      //     TextControl,
      //     {
      //         name: 'wpat_suggested_category',
      //         label: __( 'Suggested Category', 'wpat' ),
      //         help: __( 'Categories suggested by WP Auto Tag', 'wpat' ),
      //         spellCheck: true,
      //         maxLength: 100,
      //         value: 'test value',
      //     }
      //   )
			// );
		} else {
      console.log('tags entered');
      return el(
  			'div',
  			{class_name: 'wpat_test_class'},
        el(
  				OriginalComponent,
  				props
        )
  		);
      // return el(
			// 	OriginalComponent,
			// 	props,
      //   el(
    	// 		'div',
    	// 		{},
    	// 		'Element inserted'
    	// 	)
			// );
		}
	}
};
wp.hooks.addFilter(
	'editor.PostTaxonomyType',
	'wpat-category-plugin',
	renderSuggestedCategoryComponent
);
