function addThroughPoint(e) {
	e.preventDefault();
	
	$('#through-example').show();

	var new_through = $.parseHTML($('#through-template').html());
	
	$('#throughs').append(new_through);
	$(new_through).find('input').focus();
	$(new_through).find('a.remove').click(function(e){
		e.preventDefault();
		$(this).parents('.form-group').remove();
	});

	return false;
}

function submitSearchForm(e) {
	e.preventDefault();

	var start = $('#start').val(),
		throughs = getThroughPoints(),
		end = $('#end').val();

	console.log(start + ', ' + throughs + ', ' + end);
}

function getThroughPoints() {
	var throughs = [];
	$('.through').each(function(){
		var through = $(this).val();		
		if (through !== '') {
			throughs.push({location:through});
		}
	});
	return throughs;
}