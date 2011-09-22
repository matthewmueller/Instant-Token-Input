$(document).ready(function() {
  
  $('#groups').instantTokenInput({
    width: 500,
    data : [
      {background : "purple", name : "Finance", id : 1},
      {background : "blue", name : "Friends", id : 3},
      {background : "red", name : "Javascript", id : 4},
      {background : "orange", name : "Soccer", id : 2},  
      {background : "brown", name : "Football", id : 2},    
    ]
  });
  
  
  
});
