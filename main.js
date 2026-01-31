"use strict";

var k_Is12Hours = true;
var g_MainLoopId;
var g_Today;
var g_DateForMonth;
var g_ToRender = true;
var g_HolidaysAPI = 'https://holidays-jp.github.io/api/v1/date.json';
var g_Holidays = {};
var g_Mode = 'analogclock'; // 'calendar' or 'analogclock'

//======================================================================
// entry point
//======================================================================

document.addEventListener("DOMContentLoaded", init, false);

//======================================================================
// event handlers
//======================================================================

function init()
{
	g_Today = now();
	g_DateForMonth = new Date(g_Today.getTime());
	mainLoop();
	loadHolidays(function () {
		g_ToRender = true;
		mainLoop();
	});
}

function movePrev()
{
	g_DateForMonth = toLocalDate(new Date(
		g_DateForMonth.getFullYear(),
		g_DateForMonth.getMonth() - 1,
		1));
	g_ToRender = true;
	mainLoop();
}

function moveToday()
{
	g_DateForMonth = toLocalDate(new Date(
		g_Today.getFullYear(),
		g_Today.getMonth(),
		1));
	g_ToRender = true;
	mainLoop();
}

function moveNext()
{
	g_DateForMonth = toLocalDate(new Date(
		g_DateForMonth.getFullYear(),
		g_DateForMonth.getMonth() + 1,
		1));
	g_ToRender = true;
	mainLoop();
}

function switchMode()
{
	if (g_Mode === 'analogclock') {
		g_Mode = 'calendar';

		// カレンダーを表示
		//calendar.style.display = 'table';
		//eventElement.style.display = 'block';
	} else if (g_Mode === 'calendar') {
		g_Mode = 'analogclock';

		// カレンダーを非表示
		//calendar.style.display = 'none';
		//eventElement.style.display = 'none';
	}
	g_ToRender = true;
	mainLoop();
}

//======================================================================
// internal functions
//======================================================================

function toLocalDate(date)
{
	var offset = 9*60*60*1000; // for Kindle Paperwhite in Japan
	return new Date(date.getTime() + offset);
}

// ex. 2012-05-05
function toHyphenedDate(year, month, date)
{
	month = ('0' + month).slice(-2);
	date = ('0' + date).slice(-2);
	return year + '-' + month + '-' + date;
}

function now()
{
	return toLocalDate(new Date());
}

function loadHolidays(nextAction)
{
	var request = new XMLHttpRequest();
	request.open('GET', g_HolidaysAPI);
	request.responseType = '';
	request.onload = function() {
		if ( request.status === 200 ) {
			g_Holidays = JSON.parse(request.response);
			nextAction();
		} else {
			console.log(request.status);
		}
	}
	request.send();
}

function mainLoop()
{
	if ( g_MainLoopId != undefined ) {
		window.clearTimeout(g_MainLoopId);
	}
	var today = now();
	if ( today.getDate() !== g_Today.getDate() ) {
		g_DateForMonth = new Date(today.getTime());
		g_ToRender = true;
	}
	g_Today = today;

	var calendar = document.getElementById('calendar');
	var clock = document.getElementById('clock');
	var eventElement = document.getElementById('event');

	if (g_Mode === 'analogclock') {
		showAnalogClock(g_DateForMonth, g_Today);
		showRelativeCalendar(g_DateForMonth, g_Today, 2);
	} else if ( g_ToRender ) {
		showCalendar(g_DateForMonth, g_Today);
	}
	g_ToRender = false;
	g_MainLoopId = window.setTimeout(mainLoop, (60 - g_Today.getSeconds()) * 1000);
}

function showDateTime(dateForManth, today)
{
	var month = (' ' + (dateForManth.getMonth()+1)).slice(-2);
	var numHours = today.getHours();
	if ( k_Is12Hours && numHours >= 13 ) {
		numHours = numHours % 12;
	}
	var hours = (' ' + numHours).slice(-2);
	var minutes = ('0' + today.getMinutes()).slice(-2);
	var text = month + 'がつ ' + hours + ':' + minutes;
	var clock = document.getElementById('clock');
	clock.innerHTML = text.replace(/ /g, '&nbsp;');
	document.title = dateForManth.getFullYear() + 'ねん';
}

function showAnalogClock(dateForMonth, today)
{
	var clock = document.getElementById('clock');
	var canvas = document.createElement('canvas');
	canvas.width = 750;
	canvas.height = 750;
	var ctx = canvas.getContext('2d');

	// 時計の中心と半径
	var centerX = canvas.width / 2;
	var centerY = canvas.height / 2;
	var radius = Math.min(centerX, centerY) - 5;

	// 時計の枠を描画
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 10;
	ctx.stroke();

	// 時刻の目盛りを描画
	ctx.font = '96px monospace';
	ctx.textBaseline = 'middle';
	var a=0;
	for (var i = 0; i < 12; i++) {
		var angle = i * Math.PI / 6;
		var x1 = centerX + (radius - 40) * Math.sin(angle);
		var y1 = centerY - (radius - 40) * Math.cos(angle);
		var x2 = centerX + radius * Math.sin(angle);
		var y2 = centerY - radius * Math.cos(angle);

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 10;
		ctx.stroke();


		var n = i ? i : 12;
		var m = ctx.measureText(n);
		var x3 = centerX + (radius - 100) * Math.sin(angle) - m.width / 2;
		var y3 = centerY - (radius - 100) * Math.cos(angle);
		ctx.fillText(i ? i : 12, x3, y3);
	}

	// 時針を描画
	var hours = today.getHours();
	if (k_Is12Hours && hours >= 13) {
		hours = hours % 12;
	}
	var hourAngle = (hours % 12) * Math.PI / 6 + today.getMinutes() * Math.PI / 360;
	var hourX = centerX + (radius * 0.5) * Math.sin(hourAngle);
	var hourY = centerY - (radius * 0.5) * Math.cos(hourAngle);

	ctx.beginPath();
	ctx.moveTo(centerX, centerY);
	ctx.lineTo(hourX, hourY);
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 20;
	ctx.stroke();

	// 分針を描画
	var minuteAngle = today.getMinutes() * Math.PI / 30 + today.getSeconds() * Math.PI / 1800;
	var minuteX = centerX + (radius * 0.8) * Math.sin(minuteAngle);
	var minuteY = centerY - (radius * 0.8) * Math.cos(minuteAngle);

	ctx.beginPath();
	ctx.moveTo(centerX, centerY);
	ctx.lineTo(minuteX, minuteY);
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 10;
	ctx.stroke();

	// 時計の中心を描画
	ctx.beginPath();
	ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
	ctx.fillStyle = '#000';
	ctx.fill();

	// 日付を表示
	var month = (' ' + (dateForMonth.getMonth()+1)).slice(-2);
	var date = (' ' + (dateForMonth.getDate())).slice(-2);
	var dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()];
	var text = month + 'がつ' + date + 'にち' + dayOfWeek + '曜日';
	clock.innerHTML = text.replace(/ /g, '&nbsp;');

	// 時計を追加
	var clockContainer = document.createElement('div');
	clockContainer.style.textAlign = 'center';
	clockContainer.appendChild(canvas);
	clock.appendChild(clockContainer);
}

function showDate(dateForMonth, today)
{
	var month = (' ' + (dateForMonth.getMonth()+1)).slice(-2);
	var date = (' ' + (dateForMonth.getDate())).slice(-2);
	var dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()];
	var text = month + 'がつ ' + date + 'にち ' + dayOfWeek + '曜日';
	var clock = document.getElementById('clock');
	clock.innerHTML = text.replace(/ /g, '&nbsp;');
}

function showCalendar(dateForManth, today)
{
	var days = ['日', '月', '火', '水', '木', '金', '土'];
	var year = dateForManth.getFullYear();
	var month = dateForManth.getMonth() + 1;
	var firstDate = toLocalDate(new Date(year, month - 1, 1));
	var lastDate = toLocalDate(new Date(year, month,  0));
	var prevMonthLastDate = toLocalDate(new Date(year, month - 1, 0));
	var startCol = firstDate.getDay();
	var iDate = new Date(firstDate.getTime());
	var hyphenedToday = toHyphenedDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
	var html = '';
	var holidayName = '';
	var eventText = '';

	// day of weeks
	html += '<tr style="background-color: lightgray">';
	for (var i = 0; i < days.length; i++) {
		html += '<td>' + days[i] + '</td>';
	}
	html += '<tr>';
	// 6 days
	for ( var row = 0; row < 6; row++ ) {
		html += '<tr>';
		// 7 days
		for ( var col = 0; col < 7; col++ ) {
			if ( row == 0 && col < startCol ) {
				var num = prevMonthLastDate.getDate() - startCol + col + 1;
				html += '<td style="color: gray">' + num + '</td>';
				continue;
			}

			if ( lastDate < iDate ) {
				var num = (iDate - lastDate) / (24*60*60*1000);
				html += '<td style="color: gray">' + num + '</td>';
			} else if ( hyphenedToday === toHyphenedDate(year, month, iDate.getDate()) ) {
				html += '<td style="background-color: black; color: white;">' + iDate.getDate() + '</td>';
				if ( g_Holidays[hyphenedToday] ) {
					eventText = (iDate.getMonth() + 1) + '/' + iDate.getDate() + ':' + g_Holidays[hyphenedToday];
				}
			} else if ( holidayName = g_Holidays[toHyphenedDate(year, month, iDate.getDate())] ) {
				// holiday
				html += '<td style="background-color: lightgray">' + iDate.getDate() + '</td>';
				if ( ! eventText && today < iDate ) {
					eventText = (iDate.getMonth() + 1) + '/' + iDate.getDate() + ':' + holidayName;
				}
			} else {
				html += '<td>' + iDate.getDate() + '</td>';
			}
			iDate.setDate(iDate.getDate() + 1);
		}
		html += '</tr>';
	}
	// buttons
	html += '<tr>';
	html += '<td colspan="2" onclick="movePrev()" style="text-align: center">＜</td>';
	html += '<td colspan="3" onclick="moveToday()" style="text-align: center">きょう</td>';
	html += '<td colspan="2" onclick="moveNext()" style="text-align: center">＞</td>';
	html += '</tr>';

	var calendar = document.getElementById('calendar');
	calendar.innerHTML = html;
	var eventElement = document.getElementById('event');
	eventElement.innerHTML = eventText;
}

function showRelativeCalendar(dateForManth, today, numWeeks)
{
	var days = ['日', '月', '火', '水', '木', '金', '土'];
	var year = dateForManth.getFullYear();
	var month = dateForManth.getMonth() + 1;
	var firstDateOfMonth = toLocalDate(new Date(year, month - 1, 1));
	var lastDateOfMonth = toLocalDate(new Date(year, month,  0));
	var prevMonthLastDate = toLocalDate(new Date(year, month - 1, 0));
	var dayMs = 24 * 3600 * 1000;
	var firstDateOfWeek = toLocalDate(new Date(Math.floor((today.getTime() + 4*dayMs) / (7*dayMs)) * 7*dayMs - 4*dayMs));
	var startCol = firstDateOfWeek.getDay();
	var iDate = new Date(firstDateOfWeek.getTime());
	var hyphenedToday = toHyphenedDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
	var html = '';
	var holidayName = '';
	var eventText = '';

	// day of weeks
	//html += '<tr style="background-color: lightgray">';
	//for (var i = 0; i < days.length; i++) {
	//	html += '<td>' + days[i] + '</td>';
	//}
	//html += '<tr>';
	// 6 days
	for ( var row = 0; row < numWeeks; row++ ) {
		html += '<tr>';
		// 7 days
		for ( var col = 0; col < 7; col++ ) {
			if ( row == 0 && iDate < firstDateOfMonth ) {
				// prev month
				var num = prevMonthLastDate.getDate() - startCol + col + 1;
				html += '<td style="color: gray">' + num + '</td>';
				continue;
			}

			if ( lastDateOfMonth < iDate ) {
				// next month
				var num = (iDate - lastDateOfMonth) / (24*60*60*1000);
				html += '<td style="color: gray">' + num + '</td>';
			} else if ( hyphenedToday === toHyphenedDate(year, month, iDate.getDate()) ) {
				html += '<td style="background-color: black; color: white;">' + iDate.getDate() + '</td>';
				if ( g_Holidays[hyphenedToday] ) {
					eventText = (iDate.getMonth() + 1) + '/' + iDate.getDate() + ':' + g_Holidays[hyphenedToday];
				}
			} else if ( holidayName = g_Holidays[toHyphenedDate(year, month, iDate.getDate())] ) {
				// holiday
				html += '<td style="background-color: lightgray">' + iDate.getDate() + '</td>';
				if ( ! eventText && today < iDate ) {
					eventText = (iDate.getMonth() + 1) + '/' + iDate.getDate() + ':' + holidayName;
				}
			} else {
				html += '<td>' + iDate.getDate() + '</td>';
			}
			iDate.setDate(iDate.getDate() + 1);
		}
		html += '</tr>';
	}

	var calendar = document.getElementById('calendar');
	calendar.innerHTML = html;
	var eventElement = document.getElementById('event');
	eventElement.innerHTML = eventText;
}
