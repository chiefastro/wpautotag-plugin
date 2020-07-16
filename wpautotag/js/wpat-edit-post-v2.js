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

// Functions
function arrEqual(a, b) {
  return a.length === b.length && a.every(value => b.includes(value));
}

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
      console.log((this.props.isSavingPost || this.props.isAutosavingPost));
      console.log((this.props.postContent != this.props.savedPostContent));
      const catsEqual = arrEqual(
        this.props.actualCategories, this.props.savedActualCategories
      )
      console.log(!catsEqual);
      if (
          (this.props.isSavingPost || this.props.isAutosavingPost) &&
          (
            (this.props.postContent != this.props.savedPostContent) ||
            (!catsEqual)
          )
      ) {
        // Get new suggested categories from API
        console.log('saving condition met');
        console.log(this.props);
        var payload = {
          'post_content': this.props.postContent,
          'category_prior': ajax_object.category_prior,
          'actual_categories': this.props.actualCategories
        };
        console.log(payload);
        wp.apiRequest( {
          path: 'wpautotag/v1/category',
          method: 'POST',
          data: payload
        } ).then(
          ( data ) => {
            console.log('response');
            console.log(data);
            const newSuggestedCategory = data;
            if (this.props.getSuggestedCategory() !== newSuggestedCategory) {
              // prevent infinite loop while saving
              // update rendered value
              this.setState( {
                  suggestedCategory: data
              });
              // set in datastore
              this.props.setSuggestedCategory(newSuggestedCategory);
            }
          },
          ( err ) => {
            console.log('error');
            console.log(err);
            return err;
          }
        );
      };
    } );
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
                    // // update rendered value
                    // this.setState( {
                    //     suggestedCategory: value
                    // });
                    //
                    // // set in datastore
                    // this.props.setSuggestedCategory( value );
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
            hasChangedContent
        } = select( 'core/editor' );
        const {
            getSuggestedCategory
        } = select( wpatCategoryNamespace );
        const savedPostContent = select( "core/editor" ).getCurrentPost().content;
        const postContent = select( "core/editor" ).getEditedPostContent();
        // format array of actualCategories
        const savedCatIds = select( 'core/editor' ).getCurrentPostAttribute( 'categories' );
        const catIds = select( 'core/editor' ).getEditedPostAttribute( 'categories' );
        const catObjs = select( 'core' ).getEntityRecords( 'taxonomy', 'category' );
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
        var savedActualCategories = [];
        if (savedCatIds) {
          savedCatIds.forEach((catId, i) => {
            savedActualCategories.push(catIdNameMap[catId]);
          });
        };

        return {
            isSavingPost: isSavingPost(),
            isAutosavingPost: isAutosavingPost(),
            // triggers subscription 3 times if used instead of checking content
            // hasChangedContent: hasChangedContent(),
            postContent: postContent,
            savedPostContent: savedPostContent,
            actualCategories: actualCategories,
            savedActualCategories: savedActualCategories,
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
