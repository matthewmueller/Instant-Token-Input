(function($){
  var keyCodes = {
    8 : "BACKSPACE",
    37 : "LEFT",
    39 : "RIGHT",
    13 : "RETURN",
    9 : "TAB"
  };
  
  $.fn.setCursorPosition = function(pos) {
    this.each(function(index, elem) {
      if (elem.setSelectionRange) {
        elem.setSelectionRange(pos, pos);
      } else if (elem.createTextRange) {
        var range = elem.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
      }
    });
    return this;
  };

  $.fn.instantTokenInput = function (options) {
    var $input = this;
    var data = options.data || {};
    var idKey = options.idKey || "id";
    var searchKey = options.searchKey || "name";
    
    this.addClass("instant-token-input");

    // Wrap the element in position-relative DIV
    $wrapper = $("<div>").addClass("instant-token-wrapper");
    $wrapper.width(this.outerWidth());
    $wrapper.height(this.outerHeight());
    this.wrap($wrapper);

    // Add the background DIV
    $background = this.clone();
    $background.removeClass("instant-token-input").addClass("instant-token-background");
    // $background.css(elemStyle)
    this.after($background);
  
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
    /*
      Current Issues: 
    */
    this.bind('keypress', function(e) {
      if (!(e.metaKey || e.ctrlKey)) {
        var key = String.fromCharCode(e.which);
        var query = $input.val() + key;
        var result = Trie.find(query.toLowerCase());
        
        if(result) {
          var whatIDontHave = Index[result][searchKey].substr(query.length);
          $background.val(query + whatIDontHave);
        }
        else {
          $background.val($input.val() + key);
        }
      }
    });
    
    /*
      Goal: Get all keyup's into keydown
      -- BACKSPACE cleans up after selections
    */
    this.bind('keyup', function(e) {
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
    
    this.bind('keydown', function(e) {
      var key = keyCodes[e.keyCode];
      if(!key) return;
      
      switch(key) {
        case "TAB" :
          e.preventDefault();
          $input.val($background.val());
          break;
        case "RETURN" :
        case "RIGHT" :
          e.preventDefault();
          $input.val($background.val());
          break;
          
        case "BACKSPACE" :
          // Need to get textRange here...
          $background.val($background.val().slice(0,-1));  
          break;
          // $background.val($background.val())
      }
    });
  
  }


})(jQuery);