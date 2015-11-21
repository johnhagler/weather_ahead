$(function(){
	initMap();
	setCurrentDateTime();
	$('#add-through').click(addThroughPoint);
	$('#search-form').submit(submitSearchForm);
});
