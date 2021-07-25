jQuery(document).ready(function($) {
  // Begin suggested tags section
  var ajax_url=wpat_ajax_object_tags.ajax_url

  // display initial suggestions
  var tag_scores = {}
  wpat_ajax_object_tags.suggested_tags.forEach((tag_score_tup, i) => {
    tag_scores[tag_score_tup[0]] = tag_score_tup[1]
  });
  displaySuggestedTags(Object.keys(tag_scores))

  // Call suggested tags API
  $('a.suggest-action-link').click(function(event) {
    event.preventDefault()

    $('#wpat_ajax_loading').show()

    var payload = {
      'post_content': getContent(),
      'post_title': getTitle(),
      'actual_categories': getCategories(),
      'actual_tags': getTags(),
      'post_id': getPostID(),
      'tag_suggestion_type': $(this).data('ajaxaction')
    }
    console.log(payload)
    wp.apiRequest( {
      path: 'wpautotag/v1/tag/suggest',
      method: 'POST',
      data: payload
    } ).then(
      ( data ) => {
        // display suggestions
        console.log(data)
        var tag_scores = {}
        data['response'].forEach((tag_score_tup, i) => {
          tag_scores[tag_score_tup[0]] = tag_score_tup[1]
        });
        console.log(tag_scores)
        displaySuggestedTags(Object.keys(tag_scores))

        // toggle displays
        $('#wpat_ajax_loading').hide()
        if ($('#wpat_suggested_tags .inside').css('display') != 'block') {
          $('#wpat_suggested_tags').toggleClass('closed')
        }
      },
      ( err ) => {
        var error_msg = 'Error retrieving suggested tags: ' + data['error_msg']
        $('#wpat_suggested_tags .container_clicktags').prepend(error_msg)

        // toggle displays
        $('#wpat_ajax_loading').hide()
        if ($('#wpat_suggested_tags .inside').css('display') != 'block') {
          $('#wpat_suggested_tags').toggleClass('closed')
        }
        console.log(error_msg)
      }
    );
    return false
  })

  function displaySuggestedTags(suggested_tags) {
    // clear container
    $('#wpat_suggested_tags .container_clicktags').empty()
    // add each suggested tag as a span within container
    for(var key in suggested_tags){
      $('#wpat_suggested_tags .container_clicktags').append(
        '<span class="local">' + suggested_tags[key] + '</span>'
      )
    }
    $('#wpat_suggested_tags .container_clicktags').append('<div class="clear"></div>')

    // enable suggested tags to be added to post
    $('#wpat_suggested_tags .container_clicktags span').click(function(event) {
      event.preventDefault()
      console.log('clicked tag with name ' + this.innerHTML)
      addTag(this.innerHTML)
    })
  }

  function getTitle() {
    var data = ''

    try {
      data = wp.data.select('core/editor').getEditedPostAttribute('title')
    } catch (error) {
      data = $('#title').val()
    }

    // Trim data
    data = data.replace(/^\s+/, '').replace(/\s+$/, '')
    if (data !== '') {
      data = strip_tags(data)
    }

    return data
  }

  function getContent() {
    var data = ''

    try { // Gutenberg
      data = wp.data.select('core/editor').getEditedPostAttribute('content')
    } catch (error) {
      try { // TinyMCE
        var ed = tinyMCE.activeEditor
        if ('mce_fullscreen' == ed.id) {
          tinyMCE.get('content').setContent(ed.getContent({
            format: 'raw'
          }), {
            format: 'raw'
          })
        }
        tinyMCE.get('content').save()
        data = $('#content').val()
      } catch (error) {
        try { // Quick Tags
          data = $('#content').val()
        } catch (error) {}
      }
    }

    // Trim data
    data = data.replace(/^\s+/, '').replace(/\s+$/, '')
    if (data !== '') {
      data = strip_tags(data)
    }

    return data
  }

  function getPostID() {
    var data = ''
    try { // Gutenberg
      data = wp.data.select( "core/editor" ).getCurrentPost().id
    } catch (error) {
      data = $('#post_ID').val()
    }
    return data
  }

  function getCategories() {
    // categories
    const catIds = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'categories' );
    const catObjs = wp.data.select( 'core' ).getEntityRecords( 'taxonomy', 'category' );
    // ids to names for categories
    var catIdNameMap = {};
    if (catObjs) {
      catObjs.forEach((catObj, i) => {
        if (catObj.taxonomy === 'category') {
          catIdNameMap[catObj.id] = catObj.name;
        }
      });
    };
    // format array of actualCategories
    var actualCategories = [];
    if (catIds) {
      catIds.forEach((catId, i) => {
        let catName = catIdNameMap[catId];
        if (typeof catName === 'undefined') {
          // getEntityRecords doesn't update cache after adding term
          catObj = wp.data.select( 'core' ).getEntityRecord(
            'taxonomy', 'category', catId
          );
          if (typeof catObj !== 'undefined') {
            catName = catObj.name;
            // add to catIdNameMap, which is missing this term in this case
            catIdNameMap[catId] = catName;
          }
        }
        actualCategories.push(catName);
      });
    };
    return actualCategories
  }

  function getTags() {
    // tags
    const savedTagIds = wp.data.select( 'core/editor' ).getCurrentPostAttribute( 'tags' );
    const tagIds = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'tags' );
    var tagObjs = wp.data.select( 'core' ).getEntityRecords( 'taxonomy', 'post_tag' );
    tagObjs = wp.data.select( 'core' ).getEntityRecords( 'taxonomy', 'post_tag' );
    // ids to names for tags
    var tagIdNameMap = {};
    if (tagObjs) {
      tagObjs.forEach((tagObj, i) => {
        if (tagObj.taxonomy === 'tag') {
          tagIdNameMap[tagObj.id] = tagObj.name;
        }
      });
    };
    // format array of actualTags
    var actualTags = [];
    if (tagIds) {
      tagIds.forEach((tagId, i) => {
        let tagName = tagIdNameMap[tagId];
        if (typeof tagName === 'undefined') {
          // getEntityRecords doesn't update cache after adding term
          tagObj = wp.data.select( 'core' ).getEntityRecord(
            'taxonomy', 'post_tag', tagId
          );
          if (typeof tagObj !== 'undefined') {
            tagName = tagObj.name;
            // add to tagIdNameMap, which is missing this term in this case
            tagIdNameMap[tagId] = tagName;
          }
        }
        actualTags.push(tagName);
      });
    };
    return actualTags
  }

  /**
   * The html_entity_decode() php function on JS :)
   *
   * See : https://github.com/hirak/phpjs
   *
   * @param str
   * @returns {string | *}
   */
  function html_entity_decode(str) {
    var ta = document.createElement('textarea')
    ta.innerHTML = str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    toReturn = ta.value
    ta = null
    return toReturn
  }

  /**
   * The strip_tags() php function on JS :)
   *
   * See : https://github.com/hirak/phpjs
   *
   * @param str
   * @returns {*}
   */
  function strip_tags(str) {
    return str.replace(/&lt;\/?[^&gt;]+&gt;/gi, '')
  }

  // Begin add tags section

  function addTag (tag) {
    console.log('adding tag ' + tag)
    // Trim tag
    tag = tag.replace(/^\s+/, '').replace(/\s+$/, '')

    if (document.getElementById('adv-tags-input')) { // Tags input from TaxoPress
      console.log('adding tag with adv-tags-input')

      var tag_entry = document.getElementById('adv-tags-input')
      if (tag_entry.value.length > 0 && !tag_entry.value.match(/,\s*$/)) {
        tag_entry.value += ', '
      }

      var re = new RegExp(tag + ',')
      if (!tag_entry.value.match(re)) {
        tag_entry.value += tag + ', '
      }

    } else if (document.getElementById('new-tag-post_tag')) {
      console.log('adding tag with legacy WP UI')
      // Default tags input from WordPress

      tag.replace(/\s+,+\s*/g, ',').replace(/,+/g, ',').replace(/,+\s+,+/g, ',')
        .replace(/,+\s*$/g, '').replace(/^\s*,+/g, '')
      if ($('#new-tag-post_tag').val() === '') {
        $('#new-tag-post_tag').val(tag)
      } else {
        $('#new-tag-post_tag').val($('#new-tag-post_tag').val() + ', ' + tag)
      }
      //$('.tagadd').WithSelect()

    } else if (typeof wp.data != 'undefined'
      && typeof wp.data.select('core') != 'undefined'
      && typeof wp.data.select('core/edit-post') != 'undefined'
      && typeof wp.data.select('core/editor') != 'undefined') { // Gutenberg
      console.log('adding tag with Gutenberg')

      // Get current post_tags
      var tags_taxonomy = wp.data.select('core').getTaxonomy('post_tag')
      var tag_rest_base = tags_taxonomy && tags_taxonomy.rest_base
      var tags = tag_rest_base && wp.data.select('core/editor')
        .getEditedPostAttribute(tag_rest_base)

      var newTags = JSON.parse(JSON.stringify(tags));

      var data = {
    		'action': 'wpat_maybe_create_tag',
    		'tag_name': tag,
    	};
      console.log(data)
      $.post(ajax_url, data)
      .done(function(result){
        console.log('add tag ajax success')
        console.log(result)
        if (result.data.term_id > 0) {
          newTags.push(result.data.term_id);
          newTags = newTags.filter(onlyUnique);

          var new_tag = {}
          new_tag[tag_rest_base] = newTags

          wp.data.dispatch('core/editor').editPost( new_tag );

          // open the tags panel
          if (wp.data.select('core/edit-post')
            .isEditorPanelOpened('taxonomy-panel-post_tag') === false) {
            wp.data.dispatch('core/edit-post')
              .toggleEditorPanelOpened('taxonomy-panel-post_tag');
          } else {
            wp.data.dispatch('core/edit-post')
              .toggleEditorPanelOpened('taxonomy-panel-post_tag');
            wp.data.dispatch('core/edit-post')
              .toggleEditorPanelOpened('taxonomy-panel-post_tag');
          }
        }
      }).fail(function () {
        console.log('error when trying to create tag')
      });
    } else {
      console.log('no tags input found...')
    }
  }
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

  // Begin click tags section

  if (wpat_ajax_object_tags.display_vars.state === 'hide') {
    // Display initial link
    $('#wpat-click-tags .inside').html(
      '' + wpat_ajax_object_tags.display_vars.search_box +
      ' <a href="#wpat_click_tags" id="open_clicktags">' +
      wpat_ajax_object_tags.display_vars.show_txt + '</a><span id="close_clicktags">' +
      wpat_ajax_object_tags.display_vars.hide_txt +
      '</span><div class="container_clicktags"></div>')
  } else {
    $('#wpat-click-tags .inside').html(
      '' + wpat_ajax_object_tags.display_vars.search_box +
      ' <a href="#wpat_click_tags" id="open_clicktags">' +
      wpat_ajax_object_tags.display_vars.show_txt + '</a><span id="close_clicktags">' +
      wpat_ajax_object_tags.display_vars.hide_txt +
      '</span><div class="container_clicktags"></div>')
  }

  // Take current post ID
  var current_post_id = getPostID()

  if (wpat_ajax_object_tags.display_vars.state === 'show') {
    load_click_tags()
  }

  // Show click tags
  $('#open_clicktags').click(function (event) {
    event.preventDefault()
    load_click_tags()
    return false
  })

  function load_click_tags(search = '') {
    if (search) {
      $(".click-tag-search-box").css(
        "background", "url(" +
        wpat_ajax_object_tags.display_vars.search_icon + ") no-repeat 99%"
      );
      // filter existing tags in suggested tags container
      $('#wpat_suggested_tags .container_clicktags span')
        .filter(function() {
          return this.val().includes(search);
        })
    }
  }

  //inititiate click tags search when user starts typing
  //setup before functions
  var typingTimer;                //timer identifier
  var doneTypingInterval = 500;  //time in ms

  //on keyup, start the countdown
  $(document).on('keyup', '.click-tag-search-box', function () {
      clearTimeout(typingTimer);
          typingTimer = setTimeout(doneTyping, doneTypingInterval);
  });

  //user is "finished typing," do something
  function doneTyping() {
    load_click_tags($('.click-tag-search-box').val());
  }

})
