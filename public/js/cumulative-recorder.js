$(document).ready(function() {

	var timer;
	var dataRecorder;

	var timerId;
	var dataRecorderId;

	var chart = new Chart(); // Show a blank chart upon page load.

	$('#start').click(function() {
		$('#start').hide();
		$('#stop').show();
		$('#reinforcer').show();
		$('#response').show();
		$('#reinforcer').prop('disabled', true);

		timer = new Timer();
		dataRecorder = new DataRecorder(timer);

		timerId = setInterval(timer.displayTime, 100);
		dataRecorderId = setInterval(dataRecorder.updateDataPoints, 1000);
	});

	$('#stop').click(function() {
		$('button').prop('disabled', true);
		dataRecorder.updateDataPoints();
		clearInterval(timerId);
		clearInterval(dataRecorderId);
	});

	$('#response').click(function() {
		dataRecorder.recordResponseTime();
		dataRecorder.updateDataPoints();
		dataRecorder.incrementResponseCount();
	});

});

var DataRecorder = function(timer) {
	
	var responseTimes = [];
	var dataPoints = [];
	var responseCount = 0;
	var xAxisTime = 0;
	var eventCount = 1;
	var chart = new Chart();

	var displayEvent = function(type, timestamp) {
		$('#timestamps tbody').prepend('<tr><td>'+eventCount+'</td><td>'+type+'</td><td>'+timestamp+'</td></tr>');
		eventCount = eventCount + 1;
	}

	this.recordResponseTime = function(){
		var responseTime = timer.formatTime();
		responseTimes.push(responseTime);
		displayEvent('Response', responseTime);
	}

	this.updateDataPoints = function(){
		var nowDataPointTotal = dataPointAudit();
		for (var i=dataPoints.length; i<nowDataPointTotal; i++) {
			dataPoints.push({x: xAxisTime, y: responseCount});
			xAxisTime = xAxisTime + 0.5;
		};
		chart.setDataPoints(dataPoints);
		chart.updateChart();
	}

	this.incrementResponseCount = function() {
		responseCount = responseCount + 1;
	}

	var dataPointAudit = function(){
		return Math.ceil((performance.now() - timer.getStartTime()) / 500);
	}

}

var Timer = function () {
	var startTime = performance.now();
	var parent = this;

	this.formatTime = function() {
		return msToTime(parent.getElapsedTime());
	}

	this.displayTime = function() {
		$('#timer').text(parent.formatTime());
	}

	this.getElapsedTime = function() {
		var now = performance.now();
		return now - startTime;
	}

	this.getStartTime = function(){
		return startTime;
	}

	var msToTime = function(ms) {
		var s = ms / 1000;
		var secs = s % 60;
		s = (s - secs) / 60;
		var mins = s % 60;
		var hrs = (s - mins) / 60;

		var time = zeroPad(hrs, 2) + ':' + zeroPad(mins, 2) + ':' + zeroPad(secs, 2) + '.' + ms;
		return time.substring(0,10);
	}

	var zeroPad = function(num, numZeros) {
		var n = Math.abs(num);
		var zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
		var zeroString = Math.pow(10,zeros).toString().substr(1);
		if( num < 0 ) {
			zeroString = '-' + zeroString;
		}

		return zeroString+n;
	}
}

var Chart = function(){
	var dps = [];
	var xAxisMax = 300;

	var chart = new CanvasJS.Chart("cumulative-recorder",
	{
		zoomEnabled: true,
		title :{
			text: "Cumulative Recorder Demo",
			fontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
			fontSize: 30,
		},
		axisX:{
			maximum: xAxisMax,
			title: "Time in Seconds",
			interval: 30,
			intervalType: "seconds",
			titleFontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
			titleFontSize: 22
		},
		axisY:{
			title: "Response Count",
			interval: 10,
			titleFontFamily: "Helvetica Neue,Helvetica,Arial,sans-serif",
			titleFontSize: 22
		},
		data: [{
			type: "line",
			dataPoints: dps,
			lineThickness: 1,
			lineDashType: "solid"
		}]
	});
	chart.render();

	this.setDataPoints = function(data) {
		if (data.length > (xAxisMax * 2)){
			data.splice(0, data.length - (xAxisMax * 2));
			delete chart.options.axisX.maximum;
		}
		console.log(data.length);
		dps = data;
	}

	this.updateChart = function() {
		//console.log(dps);
		chart.options.data[0].dataPoints = dps;
		chart.render();
	}

/*
	function updateChart(){
		dps.push({x: index,y: 1});
		if (index > xAxisMax){
			dps.shift();
			delete chart.options.axisX.maximum;
		}
		chart.render();
	}
*/
}

window.performance = window.performance || {};
performance.now = (function() {
	return	performance.now       ||
					performance.mozNow    ||
					performance.msNow     ||
					performance.oNow      ||
					performance.webkitNow ||
					function() { return new Date().getTime(); };
})();