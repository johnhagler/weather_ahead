$(function(){
	initMap();
	setCurrentDateTime();
	$('#add-through').click(addThroughPoint);
	$('#search-form').submit(submitSearchForm);
	$('#add-hour').click(addHour);
	$('#sub-hour').click(subHour);
  $('#search').click(jumpToSearchForm);
  $(window).resize(adjustMapSize);
});
