(function($){
	var text = [
		" I know why you're here, after all... ",
		"I <del>was</del><b>am</b> the one who sent you, ",
		"and I can only hope that you do too."
	];
	var index = 0;
	var fin=!1;

	function getProps(){
		return {
			speed: 150,
			speed_vary: true,
			mistype: 1,
			fin: function(){
				if(fin==!1){
					fin=!!1; //avoids triggering after 'add' cmd
					setTimeout(function(){
						if(index < text.length){
							fin = !1;
							$('#txt').t('add', text[index++]);
						}else{
							$('#txt .t-caret').hide();
							$('#enter').show();
						}
					}, 140);
				}
			}
		}
	}

	$('#txt').t(getProps());
	$('#enter').on('click', function(){
		location.href = '/explore';
	});
})(jQuery);