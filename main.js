"use strict";

var k_Is12Hours = true;
var g_MainLoopId;
var g_Today;
var g_DateForMonth;
var g_ToRender = true;
var g_HolidaysAPI = 'https://holidays-jp.github.io/api/v1/date.json';
var g_Holidays = {};

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
	g_MainLoopId = mainLoop();
	loadHolidays(function () {
		window.clearTimeout(g_MainLoopId);
		g_ToRender = true;
		g_MainLoopId = mainLoop();
	});
}

function movePrev()
{
	g_DateForMonth = toLocalDate(new Date(
		g_DateForMonth.getFullYear(),
		g_DateForMonth.getMonth() - 1,
		1));
	window.clearTimeout(g_MainLoopId);
	g_ToRender = true;
	g_MainLoopId = mainLoop();
}

function moveToday()
{
	g_DateForMonth = toLocalDate(new Date(
		g_Today.getFullYear(),
		g_Today.getMonth(),
		1));
	window.clearTimeout(g_MainLoopId);
	g_ToRender = true;
	g_MainLoopId = mainLoop();
}

function moveNext()
{
	g_DateForMonth = toLocalDate(new Date(
		g_DateForMonth.getFullYear(),
		g_DateForMonth.getMonth() + 1,
		1));
	window.clearTimeout(g_MainLoopId);
	g_ToRender = true;
	g_MainLoopId = mainLoop();
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
	var today = now();
	if ( today.getDate() !== g_Today.getDate() ) {
		g_DateForMonth = new Date(today.getTime());
		g_ToRender = true;
	}
	g_Today = today;
	showDateTime(g_DateForMonth, g_Today);
	if ( g_ToRender ) {
		showCalendar(g_DateForMonth, g_Today);
	}
	g_ToRender = false;
	return window.setTimeout(mainLoop, (60 - g_Today.getSeconds()) * 1000);
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
