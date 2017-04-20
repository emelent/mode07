(function($) {
  'use strict';


  function onInputSubmit(event){
    if(event.keyCode == 13){
      var text = event.target.value;
      if(shellMode) return sendInputToShell(text);
      filterResults(text);
    }else if(!shellMode && submitTimer === null){
      submitTimer = setTimeout(function(){
        var text = event.target.value;
        if(shellMode) return sendInputToShell(text);
        filterResults(text);
        submitTimer = null;
      }, submitCoolDown); 
    }
  }

  function sendInputToShell(text){
    if(socket)  socket.emit('message', text + '\n');
    $input.val('');
  }

  function filterResults(text){
    console.log('filtering =>', text);
    var parts = text.toLowerCase().split(' ');
    var len = parts.length;

    var filtered = uploads.filter(function(result){
      //there are 3 searchable columns(module, type, name)
      //each separated by space
      switch(len){
        case 3:
          if(parts[2] && !result[columns[2]].startsWith(parts[2])) break;
        case 2:
          if(parts[1] && !result[columns[1]].startsWith(parts[1])) break;
        case 1:
          return (result[columns[0]].startsWith(parts[0]) || !parts[0]);
      }
      return false;
    });
    renderSearchResults(filtered);
  }

  function renderMain(b){
    shellMode = b;
    if(shellMode) return renderShellMode();
    renderSearchMode();
  }

  function renderSearchMode(){
    if(socket)
      socket.close();
    $main.children().remove();
    var columns = ['module', 'type', 'name', 'mark'];

    var table = '<table class="content" id="table"><tr>';
    columns.forEach(function(k){
      table += '<th>' + k +  '</th>';
    });
    table += '</tr>';
    table += '</table>';
    $main.append(table);

    renderSearchResults(uploads);
  }

  function renderShellMode(){
    socket = io();


		socket.on('message', function(msg){
			var $txt = $('#textarea');
			$txt.val($txt.val() + msg);
		});
    $main.children().remove();
    $main.append('<textarea id="textarea"></textarea>');
  }

  function renderSearchResults(results){
    window.results = results;
    $('.result').remove();
    var rows = '';
    results.forEach(function(result){
      var row = '<tr class="result" data-id="' + result.id + '">';
      columns.forEach(function(col){
        row += '<td>' + result[col] + '</td>';
      });
      rows += row + '</tr>';
    });
    $('#table').append(rows);
    $('.result').on('click', (event) =>{
      let id = event.target.parentElement.dataset.id;
      renderMain(true); 
      sendInputToShell(id);
    });
  }

  var shellMode;
  var socket;
  var binary;
  var columns = ['module', 'type', 'name', 'price'];
  var $input = $('#input');
  var $main = $('#main');
  var uploads = $main.data('uploads');
  var submitCoolDown = 400;
  var submitTimer = null;

  $('#input').on('keyup', onInputSubmit);
  renderMain(false);
})(jQuery);
