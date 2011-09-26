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
  }

  
  $.fn.instantTokenInput = function(o) {
    var $input = this;
    // Set options and defaults
    var o = $.extend({
      data : {},
      width: 300
    }, o);

    // If a number is passed through, convert it to px
    if(typeof o.width === "number") {
      o.width += 'px'
    }

    // Modify DOM
    var $list = $("<ul>")
      .addClass('instant-token-list')
      .attr('id', $input.attr('id'))
      .css('width', o.width);
          
    var $inputItem = $("<li>")
      .addClass('instant-token-item instant-token-item-input');

    var $background = $input
      .clone()
      .removeClass('instant-token-input')
      .removeAttr('id')
      .removeAttr('placeholder')
      .addClass('instant-token-background-input');
      
    var $hidden = $('<input>')
      .attr('type', 'hidden')
      .val('{}')
      .attr('name', $input.attr('id'))

    $input
      .addClass('instant-token-input')
      .attr("maxlength", 20)
      .removeAttr('id')
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
    for(var i = 0, len = o.data.length; i < len; i++) {
      d = o.data[i];
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
          }
        } else {
          $prev = $inputItem.prev('li');
          $prev.addClass('selected');
        }
      },
      
      selectRight : function() {
        $item = $list.find('.selected');
        if($item.length) {
          $next = $item.next('li');
          if($next) {
            if($next.hasClass('instant-token-item-input')) {
              $item.removeClass("selected");
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
        var color = $background.data('result')['background'];
        var id = $background.data('result')['id'];

        $item = $("<li>").addClass('instant-token-item').text(value).css("background-color", color).data('tokenID', id);
        tokens.push($item);
        
        
        $inputItem.before($item);
        $input.val('');
        $input.width('');
        $background.val('');
        $input.removeAttr('placeholder');
        $input.width(20);
        $background.trigger("background.change");
        
        API.updateHiddenInput();
      },
      
      clear : function() {
        $background.val('');
        $background.trigger("background.change");
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

    }

  
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
          $background.trigger("background.change");
        }
        else {
          $background.val("");
          $background.data('result', false);
          $background.trigger("background.change");
        }
      }
    });
    
    // Allow any part of the <ul> to focus on the textarea
    $list.bind("click", function(e) {
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
// 
//   var initialize = function($input) {
//     // Add style to the input
//     $input.addClass('instant-token-input');
//     $input.attr('maxlength', 20);
//     
//     // Add style and wrap input with <ul> list
//     var $list = $('<ul>').addClass('instant-token-list');
//     $input.wrap($list);
//     $list = $input.parent();
//     
//     // Add style and wrap input with <li> item
//     var $item = $('<li>').addClass('instant-token-input-item');
//     $input.wrap($item);
//     
//     // Add style and add the background input
//     var $background = $input
//       .clone()
//       .removeClass("instant-token-input")
//       .addClass("instant-token-background-input");
//       
//     $input.after($background);
//     
//     return $list;
//   };
//   
//   var addToken = function($background, $input_item, options) {
//     var value = $background.val();
//     var color = $background.data('result')['background'];
//     $item = $("<li>").addClass('instant-token-item').text(value).css("background-color", color);
//     $input_item.before($item);
//   }
// 
//   $.fn.instantTokenInput = function (options) {
//     var data = options.data || {};
//     var idKey = options.idKey || "id";
//     var searchKey = options.searchKey || "name";
//     
//     // Create required elements
//     var $input = this;
//     $outer = initialize(this);
//     
//     // jQuery can be annoying...
//     var $list = $outer;
//     var $input_item = $outer.find(".instant-token-input-item");
//     var $input_wrapper = $outer.find(".instant-token-input-wrapper");
//     var $background = $outer.find(".instant-token-background-input");
// 
//     $input.add($background).autoGrowInput({
//       maxWidth : 200,
//       minWidth : 0,
//       comfortZone : 20
//     });
// 
//     var originalThreshold = threshold = 2;
//     var originalWidth = $input.width();
// 
//     var Trie = trie();
//     var Index = {};
// 
//     var d, key;
//     for(var i = 0, len = data.length; i < len; i++) {
//       d = data[i];
//       key = d[searchKey].toLowerCase();
//       Index[key] = d;
//       Trie.add(key);
//     }
// 
// 
//     // console.log("Index: ", Index);
//     // console.log("Trie: ", Trie.data);
//         
//     // Bind to input's key event
//     $list.bind("click", function(e) {
//       $input.focus();
//     });
//     /*
//       Current Issues: 
//     */
// 
//     
//     /*
//       Goal: Get all keyup's into keydown
//       -- BACKSPACE cleans up after selections
//     */
//     $input.bind('keyup', function(e) {
//       var key = keyCodes[e.keyCode];
//       if(!key) return;
//       
//       switch(key) {
//         case "BACKSPACE" :
//           if($input.val().length != $background.val().length) {
//             $background.val($input.val());
//           }
//           break;
//       }
//     });
//     
//     $input.bind('keydown', function(e) {
//       var key = keyCodes[e.keyCode];
//       if(!key) return;
// 
//       switch(key) {
//         case "TAB" :
//         case "RETURN" :
//         case "RIGHT" :
//           e.preventDefault();
//           if(!$input.val()) {
//             submitInput();
//           }
//           
//           if ($background.val()) {
//             addToken($background, $input_item, {});
//             $input.val('');
//             $background.val('');
//             $background.trigger("background.change");
//           }
//           break;
//           
//         case "BACKSPACE" :
//           if($input.val() === "") {
//             $input_item.prev(".instant-token-item").remove();
//           } else {
//             // Need to get textRange here...
//             $background.val($background.val().slice(0,-1));
//             $background.trigger("background.change");
//           }
//           break;
//           
//         case "LEFT" :
//           e.preventDefault();
//           $list.find(".instant-token-item.selected").removeClass().prev()
//           $input_item.prev(".instant-token-item").addClass('.selected');
//       }
//     });
//   
//   }
// 
// 
// })(jQuery);