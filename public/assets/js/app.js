(function($) {
  "use strict";


  function onInputSubmit(event){
    if(event.keyCode !== 13) return;
    var text = event.target.value;

    if(shellMode) return sendInputToShell(text);
    searchQuery(text);
  }

  function sendInputToShell(text){
    console.log("sending to shell");
  }

  function searchQuery(text){
    console.log("searching =>", text);
  }

  function renderMain(b){
    shellMode = b;
    if(shellMode) return renderShellMode();
    renderSearchMode();
  }

  function renderSearchMode(){
    $main.children().remove();
    var table = "<table class='content' id='table'><tr>";
    ["module", "type", "name", "price"].forEach(function(k){
      table += "<th>" + k +  "</th>";
    });
    table += "</tr></table>";
    $main.append(table);
  }

  function renderShellMode(){
    $main.children().remove();
    $main.append("<textarea id='textarea'></textarea>");
  }

  var shellMode;
  var $input = $("#input");
  var $main = $("#main");

  $("#input").on("keyup", onInputSubmit);
  renderMain(false);
})(jQuery);
