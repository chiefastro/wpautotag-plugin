const el = wp.element.createElement;
const __ = wp.i18n.__;
const Component = wp.element.Component;
const PluginPostStatusInfo = wp.editPost.PluginPostStatusInfo;
const TextControl = wp.components.TextControl;
const registerPlugin = wp.plugins.registerPlugin;
const registerStore = wp.data.registerStore;
const compose = wp.compose.compose;
const withSelect = wp.data.withSelect;
const withDispatch = wp.data.withDispatch;

// Register store for suggested category
// Reducer
const initial_state = {
    'suggestedCategory': ajax_object.suggested_category
};
function reducer( state = initial_state, action ) {
  if ( action.type === 'SET_SUGGESTED_CATEGORY' ) {
    return {
      ...state,
      suggestedCategory: action.suggestedCategory
    };
  };
  return state;
};
// Selectors
const selectors = {
  getSuggestedCategory( state ) {
    return state.suggestedCategory;
  }
};
// Actions
const actions = {
  setSuggestedCategory( suggestedCategory ) {
    return {
      type: 'SET_SUGGESTED_CATEGORY',
      suggestedCategory: suggestedCategory
    };
  }
};
// Register
const wpatCategoryNamespace = 'wpautotag-plugin/suggested-category'
registerStore( wpatCategoryNamespace, {
  reducer,
  actions,
  selectors
} );

// Component
class SuggestedCategoryComponent extends Component {
  // init and define subscriptions
  constructor() {
    super( ...arguments );
    this.state = initial_state
    console.log(this.state);
    wp.data.subscribe(() => {
      console.log('subscription trigger');
      // refresh suggested category if saving and edited post content
      // different from saved post content
      if (
        (this.props.isSavingPost || this.props.isAutosavingPost) &&
        (this.props.postContent != this.props.savedPostContent)
      ) {
        console.log('saving condition met');
        // console.log(this.props);
        // this.predictCategory(
        //   this.props.postContent, this.props.actualCategories
        // )
        var data = {
          'action': 'wpat_refresh_suggested_category',
          'post_content': this.props.postContent,
          'category_prior': ajax_object.category_prior,
          'actual_categories': this.props.actualCategories
        };
        console.log(data);
        jQuery.post(ajax_object.ajax_url, data, function(response) {
          console.log(response);
          console.log(this);
          if (this.props.getSuggestedCategory() !== response) {
            // prevent infinite loop while saving
            this.props.setSuggestedCategory(response);
          }
        });

        // console.log('newSuggestedCategory:');
        // console.log(newSuggestedCategory);
        // if (this.props.getSuggestedCategory() !== newSuggestedCategory) {
        //   // prevent infinite loop while saving
        //   this.props.setSuggestedCategory(newSuggestedCategory);
        // }
      };
    } );
  };
  // Get new suggested categories from API
  predictCategory(postContent, actualCategories) {
    var data = {
      'action': 'wpat_refresh_suggested_category',
      'post_content': postContent,
      'category_prior': ajax_object.category_prior,
      'actual_categories': actualCategories
    };
    console.log(data);
    jQuery.post(ajax_object.ajax_url, data, function(response) {
      console.log(response);
      if (this.props.getSuggestedCategory() !== response) {
        // prevent infinite loop while saving
        this.props.setSuggestedCategory(response);
      }
    });
  };
  // render
  render() {
    return el(
        PluginPostStatusInfo,
        {
            className: 'wpat-suggested-category-panel'
        },
        el(
            TextControl,
            {
                name: 'wpat_suggested_category',
                label: __( 'Suggested Category', 'wpat' ),
                help: __( 'Categories suggested by WP Auto Tag', 'wpat' ),
                spellCheck: true,
                maxLength: 100,
                value: this.state.suggestedCategory,
                onChange: ( value ) => {
                    // update text
                    this.setState( {
                        suggestedCategory: value
                    });

                    // set message in datastore
                    this.props.setSuggestedCategory( value );
                }
            }
        )
    );
  };
};

// Higher-order component to detect changes in post content, actual categories,
// and saving status
const SuggestedCategoryComponentHOC = compose( [
    withSelect( ( select ) => {
        const {
            isSavingPost,
            isAutosavingPost,
        } = select( 'core/editor' );
        const {
            getSuggestedCategory
        } = select( wpatCategoryNamespace );
        const postContent = select( "core/editor" ).getCurrentPost().content;
        const savedPostContent = select( "core/editor" ).getEditedPostContent();
        // format array of actualCategories
        const catObjs = select( 'core' ).getEntityRecords( 'taxonomy', 'category' );
        var actualCategories = [];
        if (catObjs) {
          catObjs.forEach((catObj, i) => { actualCategories.push(catObj['name']) });
        };

        return {
            isSavingPost: isSavingPost(),
            isAutosavingPost: isAutosavingPost(),
            postContent: postContent,
            savedPostContent: savedPostContent,
            actualCategories: actualCategories,
            getSuggestedCategory: getSuggestedCategory,
        };
    } ),
    withDispatch( ( dispatch ) => {
        const {
            setSuggestedCategory
        } = dispatch( wpatCategoryNamespace );
        console.log('dispatching');
        return {
            setSuggestedCategory: setSuggestedCategory,
        };
    } )
])( SuggestedCategoryComponent );

/**
 * Register sidebar plugin with block editor.
 */
registerPlugin( 'wpat-category-plugin', {
	render: SuggestedCategoryComponentHOC
} );
