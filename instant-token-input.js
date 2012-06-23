/*
  TODO:

  * Merge dependencencies
  * Place in another closure with module.exports support
    and var $ = jQuery || require('jquery');

*/

(function($){
  // Keycodes
  var keyCodes = {
    8 : "BACKSPACE",
    37 : "LEFT",
    39 : "RIGHT",
    13 : "RETURN",
    9 : "TAB"
  };
  
  var state,
      selected = -1,
      tokens = [];

  
  /*
    Utilities
  */
  getKey = function(e) {
    key = keyCodes[e.keyCode];
    if(key) {
      return key;
    } else {
      return false;
    }
  };

  
  $.fn.instantTokenInput = function(data, format) {
    data = data || {};
    format = format || function() {};

    var $input = this;

    // Modify DOM
    var $wrapper = $("<div>")
      .attr("id", $input.attr('id'))
      .addClass($input.attr('class'));
    
    var $list = $("<ul>")
      .addClass('instant-token-list');
          
    var $inputItem = $("<li>")
      .addClass('instant-token-item-input');

    var $background = $input
      .clone()
      .removeClass('instant-token-input')
      .removeAttr('id')
      .removeAttr('placeholder')
      .addClass('instant-token-background-input');
      
    var $hidden = $('<input>')
      .attr('type', 'hidden')
      .val('{}')
      .addClass("instant-token-hidden")
      .attr('name', $input.attr('id'));

    $input
      .addClass('instant-token-input')
      .attr("maxlength", 20)
      .removeAttr('id')
      .wrap($wrapper)
      .wrap($list)
      .wrap($inputItem)
      .after($hidden)
      .after($background);
        
    var placeholder = $input.attr('placeholder');
    
    // Wrap doesn't keep variables
    $inputItem = $input.parent('.instant-token-item-input');
    $list = $inputItem.parent('.instant-token-list');
        
    $(null)
      .add($input)
      .add($background)
      .autoGrowInput({
        minWidth: 20,
        comfortZone : 20
      });
    

    // Build data trie and index
    var Trie = trie();
    var Index = {};

    var d, key;
    for(var i = 0, len = data.length; i < len; i++) {
      d = data[i];
      key = d["name"].toLowerCase();
      Index[key] = d;
      Trie.add(key);
    }
    
    /*
      API:
        submit, select, delete, complete, clear
    */
    var API = {
      selectLeft : function() {
        $item = $list.find('.selected');
        if($item.length) {
          $prev = $item.prev('li');
          if($prev.length) {
            $item.removeClass('selected');
            $prev.addClass('selected');
          } else {
            $input.show();
          }
        } else {
          $prev = $inputItem.prev('li');
          if($prev.length) {
            $prev.addClass('selected');
            $input.hide();
          }
        }
      },
      
      selectRight : function() {
        $item = $list.find('.selected');
        if($item.length) {
          $next = $item.next('li');
          if($next) {
            if($next.hasClass('instant-token-item-input')) {
              $item.removeClass("selected");
              $input.show();
            } else {
              $item.removeClass('selected');
              $next.addClass('selected');
            }
          }
        }
      },
      
      del : function() {
        var toDelete = $list.find('.selected');
        API.selectLeft();
        toDelete.remove();
        
        API.updateHiddenInput();
      },
      
      complete : function() {
        var value = $background.val();

        $item = $("<li>")
                  .addClass('instant-token-item')
                  .text(value);

        format($background.data('result'), $item);
        
        tokens.push($item);
        
        $inputItem.before($item);
        $input.val('');
        $input.width('');
        $background.val('');
        $input.removeAttr('placeholder');
        $input.width(20);
        
        API.updateHiddenInput();
      },
      
      clear : function() {
        $background.val('');
      },
      
      updateHiddenInput : function() {
        var out = {};
        $list.find('.instant-token-item').not('.instant-token-item-input').each(function() {
          var key = $(this).text();
          var id = $(this).data('tokenID');
          out[key] = id;
        });
        
        if(JSON) {
          var value = JSON.stringify(out);
          $hidden.val(value);
        }
        
      },
      
      noop : function() {}
      
    };

    /*
      Actions
    */
    state = {
      initial : {
        'RIGHT' : ['noop'],
        'LEFT' : ['selectLeft'],
        'BACKSPACE' : ['selectLeft']
      },

      suggested : {
        'LEFT' : ['clear'],
        'RIGHT' : ['complete'],
        'TAB' : ['complete'],
        'RETURN' : ['complete'],
        'BACKSPACE' : ['clear']
      },

      selected : {
        'RIGHT' : ['selectRight'],
        'LEFT' : ['selectLeft'],
        'BACKSPACE' : ['del'],
        'TAB' : ['selectRight']
      }

    };
  
    var setState = function(s) {
      var commands = state[s],
          key,
          action;
    
      return {
        respond : function(e) {
          key = getKey(e);
          action = commands[key];
          if (action) {
            API[action[0]].apply(null, action.slice(1));
          } else {
            return false;
          }
        }
      };
    };

    /*
      Bindings for action items
    */
    var bindings = {

      keyup : function(e) {

      },
      
      keydown : function(e) {
        var key = getKey(e);
        if(!key) return;
        
        if (key === 'TAB' || key === 'RETURN') {
          e.preventDefault();
        }
        
        if(!$input.val()) {
          if($list.find('.selected').length) {
            setState('selected').respond(e);
          } else {
            setState('initial').respond(e);
          }
        } else if ($background.val()) {
          setState('suggested').respond(e);
        }
        
      }
      
    };
    
    /*
      Initialize the bindings
    */
    $input.bind(bindings);
    
    // Bind the non-action keys
    $input.bind('keypress', function(e) {
      if (!(e.metaKey || e.ctrlKey)) {
        var key = String.fromCharCode(e.which);
        var query = $input.val() + key;
        var result = Trie.find(query.toLowerCase());
        
        if(result) {
          var data = Index[result];
          var whatIDontHave = data['name'].substr(query.length);
          $background.val(query + whatIDontHave);
          $background.data('result', data);
        }
        else {
          $background.val("");
          $background.data('result', false);
        }
      }
    });
    
    // Allow any part of the <ul> to focus on the textarea
    $list.bind("click", function(e) {
      if($(e.target).hasClass('instant-token-item')) {
        $(e.target).addClass('selected');
      }

      $input.focus();
    });


    $input.bind('blur', function(e) {
      var items = $list.find('.instant-token-item').not('.instant-token-item-input');
      
      if($input.val() === '' && items.length === 0) {
        $input.attr('placeholder', placeholder);
      }
    });
    
  };
  
  
  
})(jQuery);