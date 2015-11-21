function addThroughPoint(e) {
	e.preventDefault();
	
	$('#through-example').show();

	var new_through = $.parseHTML($('#through-template').html());
	
	$('#throughs').append(new_through);
	$(new_through).find('input').focus();
	$(new_through).find('a.remove').click(function(e){
		e.preventDefault();
		$(this).parents('.form-group').remove();
		if ($('.through').length == 0) {
			$('#through-example').hide();
		}
	});

	return false;
}

function initMap() {

}

function setCurrentDateTime() {
	var current_time = (new Date()).getTime();
	// round off to minutes;
	current_time = current_time - (current_time % 60000);
	var current_time_tmz = current_time - (new Date()).getTimezoneOffset() * 60000;
    document.getElementById('time').valueAsNumber = Math.round(current_time_tmz / 1000) * 1000;
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