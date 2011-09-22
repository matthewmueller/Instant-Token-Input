(function($){
  var keyCodes = {
    8 : "BACKSPACE",
    37 : "LEFT",
    39 : "RIGHT",
    13 : "RETURN",
    9 : "TAB"
  };

  var initialize = function($input) {
    // Add style to the input
    $input.addClass('instant-token-input');
    $input.attr('maxlength', 20);
    
    // Add style and wrap input with <ul> list
    var $list = $('<ul>').addClass('instant-token-list');
    $input.wrap($list);
    $list = $input.parent();
    
    // Add style and wrap input with <li> item
    var $item = $('<li>').addClass('instant-token-input-item');
    $input.wrap($item);
    
    // Add style and add the background input
    var $background = $input
      .clone()
      .removeClass("instant-token-input")
      .addClass("instant-token-background-input");
      
    $input.after($background);
    
    return $list;
  };
  
  var addToken = function($background, $input_item, options) {
    var value = $background.val();
    var color = $background.data('result')['background'];
    $item = $("<li>").addClass('instant-token-item').text(value).css("background-color", color);
    $input_item.before($item);
  }

  $.fn.instantTokenInput = function (options) {
    var data = options.data || {};
    var idKey = options.idKey || "id";
    var searchKey = options.searchKey || "name";
    
    // Create required elements
    var $input = this;
    $outer = initialize(this);
    
    // jQuery can be annoying...
    var $list = $outer;
    var $input_item = $outer.find(".instant-token-input-item");
    var $input_wrapper = $outer.find(".instant-token-input-wrapper");
    var $background = $outer.find(".instant-token-background-input");

    $input.add($background).autoGrowInput({
      maxWidth : 200,
      minWidth : 0,
      comfortZone : 20
    });

    var originalThreshold = threshold = 2;
    var originalWidth = $input.width();

    var Trie = trie();
    var Index = {};

    var d, key;
    for(var i = 0, len = data.length; i < len; i++) {
      d = data[i];
      key = d[searchKey].toLowerCase();
      Index[key] = d;
      Trie.add(key);
    }


    // console.log("Index: ", Index);
    // console.log("Trie: ", Trie.data);
        
    // Bind to input's key event
    $list.bind("click", function(e) {
      $input.focus();
    });
    /*
      Current Issues: 
    */
    $input.bind('keypress', function(e) {
      if (!(e.metaKey || e.ctrlKey)) {
        var key = String.fromCharCode(e.which);
        var query = $input.val() + key;
        var result = Trie.find(query.toLowerCase());
        
        if(result) {
          var data = Index[result];
          var whatIDontHave = data[searchKey].substr(query.length);
          $background.val(query + whatIDontHave);
          $background.trigger("background.change");
          $background.data('result', data);
        }
        else {
          $background.val("");
          $background.trigger("background.change");
          $background.data('result', false);
        }
      }
    });
    
    /*
      Goal: Get all keyup's into keydown
      -- BACKSPACE cleans up after selections
    */
    $input.bind('keyup', function(e) {
      var key = keyCodes[e.keyCode];
      if(!key) return;
      
      switch(key) {
        case "BACKSPACE" :
          if($input.val().length != $background.val().length) {
            $background.val($input.val());
          }
          break;
      }
    });
    
    $input.bind('keydown', function(e) {
      var key = keyCodes[e.keyCode];
      if(!key) return;

      switch(key) {
        case "TAB" :
        case "RETURN" :
        case "RIGHT" :
          e.preventDefault();
          if(!$input.val()) {
            submitInput();
          }
          
          if ($background.val()) {
            addToken($background, $input_item, {});
            $input.val('');
            $background.val('');
            $background.trigger("background.change");
          }
          break;
          
        case "BACKSPACE" :
          if($input.val() === "") {
            $input_item.prev(".instant-token-item").remove();
          } else {
            // Need to get textRange here...
            $background.val($background.val().slice(0,-1));
            $background.trigger("background.change");
          }
          break;
          
        case "LEFT" :
          e.preventDefault();
          $list.find(".instant-token-item.selected").removeClass().prev()
          $input_item.prev(".instant-token-item").addClass('.selected');
      }
    });
  
  }


})(jQuery);