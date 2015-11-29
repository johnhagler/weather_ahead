DataPoint.prototype = Object.create(DataPoint.prototype);

DataPoint.prototype.constructor = DataPoint;
function DataPoint() {
	console.log('DataPoint init');
	this.p = 'a';
}