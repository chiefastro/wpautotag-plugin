// import { Fragment } from '@wordpress/element';
// import { withSelect } from '@wordpress/data';
// import { compose } from '@wordpress/compose';
//
const el = wp.element.createElement;
const { Fragment } = wp.element;
const __ = wp.i18n.__;
const Component = wp.element.Component;
// const useState = wp.element.useState;
const PluginPostStatusInfo = wp.editPost.PluginPostStatusInfo;
const Button = wp.components.Button;
const CheckboxControl = wp.components.CheckboxControl;
const HierarchicalTermSelector = wp.editor.HierarchicalTermSelector;
const registerPlugin = wp.plugins.registerPlugin;
const registerStore = wp.data.registerStore;
const compose = wp.compose.compose;
const withSelect = wp.data.withSelect;
const withDispatch = wp.data.withDispatch;



// Register store for suggested category
// Reducer
const initial_state = {
    'suggestedCategory': ajax_object.suggested_category,
    'addedCatIds': []
};
function reducer( state = initial_state, action ) {
  if ( action.type === 'SET_SUGGESTED_CATEGORY' ) {
    return {
      ...state,
      suggestedCategory: action.suggestedCategory
    };
  } else if (action.type === 'ADD_CATEGORY') {
    newState = {...state};
    newState.addedCatIds.push(action.addedCatId);
    return newState;
  }
  return state;
};
// Selectors
const selectors = {
  getSuggestedCategory( state ) {
    return state.suggestedCategory;
  },
  getAddedCatIds( state ) {
    return state.addedCatIds;
  }

};
// Actions
const actions = {
  setSuggestedCategory( suggestedCategory ) {
    return {
      type: 'SET_SUGGESTED_CATEGORY',
      suggestedCategory: suggestedCategory
    };
  },
  addCatId( catId ) {
    return {
      type: 'ADD_CATEGORY',
      addedCatId: catId
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
function swapKeyValue(obj){
  var ret = {};
  for(var key in obj){
    ret[obj[key]] = key;
  }
  return ret;
}
// Component
class SuggestedCategoryComponent extends Component {
  // init and define subscriptions
  constructor() {
    super( ...arguments );
    this.maybeRefresh = this.maybeRefresh.bind( this );
    this.state = {
        suggestedCategory: this.props.getSuggestedCategory(),
        addedCatIds: this.props.getAddedCatIds()//,
        // isRefreshing: false
    };
    wp.data.subscribe(this.maybeRefresh);
  };
  maybeRefresh(isRefreshing=false) {
    console.log('subscription trigger', isRefreshing);
    if (
      (this.props.newCatId) &&
      !(this.props.getAddedCatIds().includes(this.props.newCatId))
    ) {
      console.log('adding cat id to store');
      this.props.addCatId(this.props.newCatId);
    }
    // refresh suggested category if saving and edited post content
    // different from saved post content
    const catsEqual = arrEqual(
      this.props.actualCategories, this.props.savedActualCategories
    )
    if (
        (this.props.isSavingPost || this.props.isAutosavingPost ||
         isRefreshing
        )
        &&
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
        path: 'wpautotag/v1/category/suggest',
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
                suggestedCategory: newSuggestedCategory
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
  };
  // render
  render() {
    // const [ isChecked, setChecked ] = useState( false );
    const isActualChecked = this.props.actualCategories.includes(this.state.suggestedCategory)
    // console.log(this.props.actualCategories);
    // const catExists = Object.values(this.props.catIdNameMap).includes(this.state.suggestedCategory)
    const catId = parseInt(swapKeyValue(this.props.catIdNameMap)[this.state.suggestedCategory], 10)
    // console.log(this.state);
    return el(
      'div',
      {
        key: 'wpat_suggested_category_container',
        className: 'wpat_suggested_category_container'
      },
      [
        el(
          'p',
          {
            key: 'wpat_suggested_category_header',
            className: 'wpat_suggested_category_header'
          },
          __( 'Suggested Category', 'wpat' )
        ),
        el(
          'div',
          {
            key: 'wpat_suggested_category_actions',
            className: 'wpat_suggested_category_actions'
          },
          [
            el(
              CheckboxControl,
              {
                name: 'wpat_suggested_category_checkbox',
                key:  'wpat_suggested_category_checkbox',
                label: this.state.suggestedCategory,
                // help: __( 'Suggested Category', 'wpat' ),
                checked: isActualChecked,
                onChange: (updateChecked) => {
                  console.log(this.props);

                  console.log(this.props.hierarchicalTermSelector);
                  var newSelectedTerms = JSON.parse(
                    JSON.stringify(this.props.hierarchicalTermSelector.terms)
                  );
                  var suggestedTerm = JSON.parse(
                    JSON.stringify(
                      !catId ? this.state.suggestedCategory : ''
                    )
                  );
                  console.log(newSelectedTerms);
                  const termIdx = newSelectedTerms.indexOf(catId);
                  console.log(termIdx)
                  console.log(catId)

                  if ((termIdx > -1) && !updateChecked) {
                    // term selected and user wants to unassign
                    newSelectedTerms.splice(termIdx, 1);
                  } else if (catId && updateChecked) {
                    // term exists and user wants to assign
                    newSelectedTerms.push(catId);
                  } else if (!catId && updateChecked) {
                    // term doesn't exist and user wants to assign
                    // trigger add new term
                    console.log('add new term');
                    let addTermButton = document.getElementsByClassName(
                      "editor-post-taxonomies__hierarchical-terms-add"
                    )[0]
                    addTermButton.onclick = function prefillNewTerm() {
                      console.log(this);
                      console.log(this.getAttribute('aria-expanded'));
                      if (this.getAttribute('aria-expanded') == 'false') {
                        // form opened, prefill new term
                        // (value is switched later, so trigger this when false)
                        var checkExist = setInterval(function() {
                          console.log('checking existence');
                          var elems = document.getElementsByClassName(
                            "editor-post-taxonomies__hierarchical-terms-input"
                          )
                          if (elems.length) {
                            // can't use the simple commented line below, see article
                            // below for why the complicated code is needed instead
                            // elems[0].value = suggestedTerm;
                            // https://hustle.bizongo.in/simulate-react-on-change-on-controlled-components-baa336920e04
                            var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                              window.HTMLInputElement.prototype, "value"
                            ).set;
                            nativeInputValueSetter.call(elems[0], suggestedTerm);
                            elems[0].dispatchEvent(new Event('input', { bubbles: true }));
                            clearInterval(checkExist);
                          }
                        }, 100); // check every 100ms
                      }
                    }
                    addTermButton.click();
                  }
                  console.log(newSelectedTerms);
                  // set state of suggested category checkbox
                  this.setState( {
                    checked: updateChecked
                  });
                  // set checked state of category in standard list
                  this.props.hierarchicalTermSelector.onUpdateTerms(
                    newSelectedTerms,
                    this.props.hierarchicalTermSelector.taxonomy.rest_base
                  );
                }
              }
            ),
            el(
              Button,
              {
                icon: 'image-rotate',
                label: 'Refresh suggested category',
                key: 'wpat_suggested_category_refresh',
                isSmall: true,
                showTooltip: true,
                className: 'wpat_suggested_category_refresh',
                iconSize: 16,
                onClick: () => {
                  console.log('refresh clicked');
                  this.maybeRefresh(true);
                }
              }
            )
          ]
        )
      ]
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
            getSuggestedCategory,
            getAddedCatIds
        } = select( wpatCategoryNamespace );
        const savedPostContent = select( "core/editor" ).getCurrentPost().content;
        const postContent = select( "core/editor" ).getEditedPostContent();
        // format array of actualCategories
        const savedCatIds = select( 'core/editor' ).getCurrentPostAttribute( 'categories' );
        const catIds = select( 'core/editor' ).getEditedPostAttribute( 'categories' );
        const catObjs = select( 'core' ).getEntityRecords( 'taxonomy', 'category' );
        const addedCatIds = getAddedCatIds();
        var newCatId = false;
        var catIdNameMap = {};
        if (catObjs) {
          catObjs.forEach((catObj, i) => {
            if (catObj.taxonomy === 'category') {
              catIdNameMap[catObj.id] = catObj.name;
            }
          });
        };
        if (addedCatIds.length) {
          addedCatIds.forEach((catId, i) => {
            catObj = select( 'core' ).getEntityRecord(
              'taxonomy', 'category', catId
            );
            if (typeof catObj !== 'undefined') {
              catIdNameMap[catId] = catObj.name;
            }
          });
        }
        var actualCategories = [];
        if (catIds) {
          catIds.forEach((catId, i) => {
            let catName = catIdNameMap[catId];
            if (typeof catName === 'undefined') {
              // getEntityRecords doesn't update cache after adding term
              catObj = select( 'core' ).getEntityRecord(
                'taxonomy', 'category', catId
              );
              if (typeof catObj !== 'undefined') {
                catName = catObj.name;
                // add to catIdNameMap, which is missing this term in this case
                catIdNameMap[catId] = catName;
                // save to store so cat can be unassigned
                console.log('new cat detected');
                newCatId = catId;
              }
            }
            actualCategories.push(catName);
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
            catIdNameMap: catIdNameMap,
            getSuggestedCategory: getSuggestedCategory,
            getAddedCatIds: getAddedCatIds,
            newCatId: newCatId
        };
    } ),
    withDispatch( ( dispatch ) => {
        const {
            setSuggestedCategory,
            addCatId
        } = dispatch( wpatCategoryNamespace );
        console.log('dispatching');
        return {
            setSuggestedCategory: setSuggestedCategory,
            addCatId: addCatId
        };
    } )
])( SuggestedCategoryComponent );

/**
 * Register sidebar plugin with block editor.
 */
registerPlugin( 'wpat-category-plugin', {
	render: SuggestedCategoryComponentHOC
} );

/**
 * Render suggested category within HierarchicalTermSelector
 */
function renderSuggestedCategoryComponent( OriginalComponent ) {
	return function( props ) {
    console.log('filter entered');
    console.log(props);
		if ( props.slug === 'category' ) {
      console.log('category entered');
      return el(
        'div',
        {key: 'wpat_category_container_' + props.instanceId},
        [
          el(
            SuggestedCategoryComponentHOC,
            {
              key: 'wpat_suggested_category_container_' + props.instanceId,
              hierarchicalTermSelector: props
            },
          ),
          el(
            OriginalComponent,
            {
              ...props,
              key: 'wpat_standard_category_container_' + props.instanceId
            }
          )
        ]
      );
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
		}
	}
};
wp.hooks.addFilter(
	'editor.PostTaxonomyType',
	'wpat-category-plugin',
	renderSuggestedCategoryComponent
);
