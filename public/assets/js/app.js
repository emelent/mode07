(function($) {
  'use strict';


  function onInputSubmit(event){
    if(event.keyCode === 38 || event.keyCode === 40) return;
    if(event.keyCode === 13){
      var text = event.target.value;

      if(shellMode)        return sendInputToShell(text);
      if(hRowIndex === -1) return filterResults(text);

      $('tr.selected').click();  
    }else if(!shellMode && submitTimer === null){
      submitTimer = setTimeout(function(){
        var text = event.target.value;
        if(shellMode) return sendInputToShell(text);
        filterResults(text);
        submitTimer = null;
      }, submitCoolDown); 
    }
  }

  function sendInputToShell(text, init){
    text += '\n';
    if(socket)  socket.emit('message', text);
    if(!init)   $('#textarea')[0].value += text;
    $input.val('');
  }

  function filterResults(text){
    //console.log('filtering =>', text);
    var parts = text.toLowerCase().split(' ');
    var len = parts.length;
    hRowIndex = -1;

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
    $input.val('');
    shellMode = b;
    if(shellMode) return renderShellMode();
    renderSearchMode();
    $input.focus();
  }

  function renderSearchMode(){
    if(socket)
      socket.close();

    $input.removeClass('shell-mode');
    $('#btn-buy').remove();
    $main.removeClass('shell-mode');
    $main.children().remove();

    var table = '<table class="content" id="table"><tr class="table-header">';
    columns.forEach(function(k){
      table += '<th>' + k +  '</th>';
    });
    table += '</tr>';
    table += '</table>';
    $main.append(table);
    $mode.text('SEARCH');
    $help.html(
      "Type to filter search results." +
      "<br/>Use the mouse or 'UP' and 'DOWN' keys to traverse the list." + 
      "<br/>Click or press 'ENTER' to select program.");

    renderSearchResults(uploads);
  }

  function renderShellMode(){
    socket = io();
		socket.on('message', function(msg){
			var $txt = $('#textarea');
			$txt.val($txt.val() + msg);
      $txt.scrollTop($txt.prop('scrollHeight'));
		});

    $input.addClass('shell-mode');
    $main.addClass('shell-mode');
    $main.children().remove();
    var $txt = $('<textarea id="textarea" readonly></textarea>'); 
    $main.append($txt);
    var program = getProgramById(programId);
    $mode.html(`<span>SHELL - ${program.name}</span><br/><span>Price R ${program.price}</span>`);
    $header.append($('<button id="btn-buy">Buy</button>').on('click', buyProgram));
    $help.html(
      "Type in responses to any input requests from the program and press 'ENTER'." +
      "<br/>Click the 'BUY' button to purchase the program." +
      "<br/>Press 'ESC' at any time to exit the program and return to SEARCH mode."
    );
  }

  function buyProgram(event){
    var program = getProgramById(programId);
    createConfirmDialog(
      `Buy ${program.name} for R ${program.price}?`,
      'Yes',
      'No',
      function(){console.log('buying =>', programId);},
      function(){console.log('not buying =>', programId);}
    );
  }

  function createConfirmDialog(query, posText, negText, posCb, negCb){
    var dlg = $('<div class="dialog crt"></div>');
    dlg.append(`<span>${query}</span><br/>`);
    
    dlg.append($(`<button class="dialog-btn-neg">${negText}</button>`).on('click', function(){
      negCb();
      dlg.css({
        animation: 'crt-off 0.4s',
        transform: 'scale(0.5, 0.005)'
      });
      setTimeout(function(){dlg.remove()}, 400);
    }));
    dlg.append($(`<button class="dialog-btn-pos">${posText}</button>`).on('click', function(){
      posCb();
      dlg.css({
        animation: 'crt-off 0.4s',
        transform: 'scale(0.5, 0.005)'
      });
      setTimeout(function(){dlg.remove()}, 400);
    }));
    $('body').append(dlg);
  }

  function renderSearchResults(results){
    numRows = results.length;
    hRowIndex = -1;
    $('.result').remove();
    var rows = '';
    results.forEach(function(result, i){
      var row = `<tr class="result" data-id="${result.id}" data-index="${i}">`;
      columns.forEach(function(col){
        row += '<td>' + result[col] + '</td>';
      });
      rows += row + '</tr>';
    });
    $('#table').append(rows);
    $('.result').on('click', (event) =>{
      renderMain(true); 
      sendInputToShell(programId, true);
      $input.focus();
    }).on('mouseover', (event) => {
      highlightRow(event.target.parentElement.dataset.index);
    });
  }

  function highlightRow(index){
    $('tr.selected').removeClass('selected');
    programId = $(`tr[data-index="${index}"]`).addClass('selected').data('id');
    hRowIndex = index;
  }

  function getProgramById(id){
    for(let upload of uploads){
      if(upload.id.toString() === id.toString())
        return upload;
    }
    return null;
  }

  window.getProgramById = getProgramById;
  var shellMode;
  var socket;
  var binary;
  var submitCoolDown = 400;
  var submitTimer = null;
  var columns = ['module', 'type', 'number', 'content', 'name', 'price'];
  var hRowIndex = -1;
  var numRows = 0;
  var programId;

  var $input = $('#input');
  var $header = $('#main-header');
  var $main = $('#main');
  var $mode = $('#mode');
  var $help = $('#help');
  var uploads = $main.data('uploads');

  $('#input').on('keyup', onInputSubmit);
  $(document).on('keyup', function(event){
    //if(event.keyCode !== 27) return;
    //if(shellMode) renderMain(false);
    switch(event.keyCode){
      case 27: //escape
        if(shellMode) renderMain(false);
        break;
      case 38: //up
        if(hRowIndex > 0) highlightRow(hRowIndex - 1);
        break;
      case 40: //down
        if(hRowIndex < numRows - 1) highlightRow(hRowIndex + 1);
        break;
    }
  });
  $(document).on('click', function(){
    $input.focus();
  });
  renderMain(false);
})(jQuery);
