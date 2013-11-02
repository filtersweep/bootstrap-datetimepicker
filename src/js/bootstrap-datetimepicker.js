"use strict";

/*global window:false*/

/**
 * @license
 * =========================================================
 * bootstrap-datetimepicker.js
 * =========================================================
 * Copyright 2012 Stefan Petre
 *
 * Contributions:
 *  - Andrew Rowls
 *  - Thiago de Arruda
 *  - Michael Burke
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================================================
 */

(function (window, document, $) {

	var dpgId = 0,
		DEFAULT_LANGUAGE = "en",
		dateFormatComponents = null,
		formatComponent = null,
		formatReplacer = null,
		DPGlobal = null,
		TPGlobal = null;

	DPGlobal = (function () {
		var headTemplate = '<thead>' +
				'<tr>' +
				'<th class="prev">&lsaquo;</th>' +
				'<th colspan="5" class="switch"></th>' +
				'<th class="next">&rsaquo;</th>' +
				'</tr>' +
				'</thead>',
			contTemplate = '<tbody><tr><td colspan="7"></td></tr></tbody>',
			template = '<div class="datepicker-days">' +
				'<table class="table-condensed">' +
				headTemplate +
				'<tbody></tbody>' +
				'</table>' +
				'</div>' +
				'<div class="datepicker-months">' +
				'<table class="table-condensed">' +
				headTemplate +
				contTemplate +
				'</table>' +
				'</div>' +
				'<div class="datepicker-years">' +
				'<table class="table-condensed">' +
				headTemplate +
				contTemplate +
				'</table>' +
				'</div>';

		return {
			modes: [{
				clsName: 'days',
				navFnc: 'UTCMonth',
				navStep: 1
			}, {
				clsName: 'months',
				navFnc: 'UTCFullYear',
				navStep: 1
			}, {
				clsName: 'years',
				navFnc: 'UTCFullYear',
				navStep: 10
			}],

			isLeapYear: function (year) {
				return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
			},

			getDaysInMonth: function (year, month) {
				return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
			},

			headTemplate: headTemplate,

			contTemplate: contTemplate,

			template: template
		};
	}());

	TPGlobal = (function () {
		var hourTemplate = '<span data-action="showHours" data-time-component="hours" class="timepicker-hour"></span>',
			minuteTemplate = '<span data-action="showMinutes" data-time-component="minutes" class="timepicker-minute"></span>',
			secondTemplate = '<span data-action="showSeconds" data-time-component="seconds" class="timepicker-second"></span>';

		return {
			hourTemplate: hourTemplate,
			minuteTemplate: minuteTemplate,
			secondTemplate: secondTemplate,
			getTemplate: function (is12Hours, showSeconds) {
				return ('<div class="timepicker-picker">' +
						'<table class="table-condensed"' +
						(is12Hours ? ' data-hour-format="12"' : '') +
						'>' +
						'<tr>' +
						'<td><a href="#" class="btn" data-action="incrementHours"><i class="icon-chevron-up"></i></a></td>' +
						'<td class="separator"></td>' +
						'<td><a href="#" class="btn" data-action="incrementMinutes"><i class="icon-chevron-up"></i></a></td>' +
						(showSeconds ?
								'<td class="separator"></td>' +
								'<td><a href="#" class="btn" data-action="incrementSeconds"><i class="icon-chevron-up"></i></a></td>' : '') +
						(is12Hours ? '<td class="separator"></td>' : '') +
						'</tr>' +
						'<tr>' +
						'<td>' + TPGlobal.hourTemplate + '</td> ' +
						'<td class="separator">:</td>' +
						'<td>' + TPGlobal.minuteTemplate + '</td> ' +
						(showSeconds ?
								'<td class="separator">:</td>' +
								'<td>' + TPGlobal.secondTemplate + '</td>' : '') +
						(is12Hours ?
								'<td class="separator"></td>' +
								'<td>' +
								'<button type="button" class="btn btn-primary" data-action="togglePeriod"></button>' +
								'</td>' : '') +
						'</tr>' +
						'<tr>' +
						'<td><a href="#" class="btn" data-action="decrementHours"><i class="icon-chevron-down"></i></a></td>' +
						'<td class="separator"></td>' +
						'<td><a href="#" class="btn" data-action="decrementMinutes"><i class="icon-chevron-down"></i></a></td>' +
						(showSeconds ?
								'<td class="separator"></td>' +
								'<td><a href="#" class="btn" data-action="decrementSeconds"><i class="icon-chevron-down"></i></a></td>' : '') +
						(is12Hours ? '<td class="separator"></td>' : '') +
						'</tr>' +
						'</table>' +
						'</div>' +
						'<div class="timepicker-hours" data-action="selectHour">' +
						'<table class="table-condensed">' +
						'</table>' +
						'</div>' +
						'<div class="timepicker-minutes" data-action="selectMinute">' +
						'<table class="table-condensed">' +
						'</table>' +
						'</div>' +
						(showSeconds ?
								'<div class="timepicker-seconds" data-action="selectSecond">' +
								'<table class="table-condensed">' +
								'</table>' +
								'</div>' : '')
					   );
			}
		};
	}());

	function buildFormatter(dates, lang) {
		var k = null,
			keys = [],
			makeDateFormatComponent = function (prop, pattern) {
				return {
					property: prop,
					getPattern: function () {
						return pattern + "\\b";
					}
				};
			};

		dateFormatComponents = (function () {
			var result = null,
				longDays = dates[lang].days.join("|"),
				shortDays = dates[lang].daysShort.join("|"),
				longMonths = dates[lang].months.join("|"),
				shortMonths = dates[lang].monthsShort.join("|");

			result = {
				dd: makeDateFormatComponent('UTCDate', '(0?[1-9]|[1-2][0-9]|3[0-1])'),
				MM: makeDateFormatComponent('UTCMonth', '(0?[1-9]|1[0-2])'),
				yy: makeDateFormatComponent('UTCYear', '(\\d{2})'),
				yyyy: makeDateFormatComponent('UTCFullYear', '(\\d{4})'),
				hh: makeDateFormatComponent('UTCHours', '(0?[0-9]|1[0-9]|2[0-3])'),
				mm: makeDateFormatComponent('UTCMinutes', '(0?[0-9]|[1-5][0-9])'),
				ss: makeDateFormatComponent('UTCSeconds', '(0?[0-9]|[1-5][0-9])'),
				ms: makeDateFormatComponent('UTCMilliseconds', '([0-9]{1,3})'),
				HH: makeDateFormatComponent('Hours12', '(0?[1-9]|1[0-2])'),
				PP: makeDateFormatComponent('Period12', '(AM|PM)'),
				LD: makeDateFormatComponent('LongDay', '(' + longDays + ')'),
				SD: makeDateFormatComponent('ShortDay', '(' + shortDays + ')'),
				LM: makeDateFormatComponent('LongMonth', '(' + longMonths + ')'),
				SM: makeDateFormatComponent('ShortMonth', '(' + shortMonths + ')')
			};

			/* mysql format strings */
			result["%d"] = result["%e"] = result.dd;
			result["%H"] = result["%k"] = result.hh;
			result["%h"] = result["%I"] = result["%l"] = result.HH;
			result["%i"] = result.mm;
			result["%S"] = result["%s"] = result.ss;
			result["%M"] = result.LM;
			result["%b"] = result.SM;
			result["%m"] = result["%c"] = result.MM;
			result["%p"] = result.PP;
			result["%r"] = [result.HH, ":", result.mm, ":", result.ss, " ", result.PP];
			result["%T"] = [result.hh, ":", result.mm, ":", result.ss];
			result["%a"] = result.SD;
			result["%W"] = result.LD;
			result["%Y"] = result.yyyy;
			result["%y"] = result.yy;

			return result;
		}());

		for (k in dateFormatComponents) {
			if (dateFormatComponents.hasOwnProperty(k)) {
				keys.push(k);
			}
		}
		keys[keys.length - 1] += '\\b';
		keys.push('.');

		formatComponent = new RegExp(keys.join('\\b|'));
		keys.pop();
		formatReplacer = new RegExp(keys.join('\\b|'), 'gi');
	}

	function getUTCDate(arg) {
		return new Date(Date.UTC.apply(Date, arguments));
	}

	function getTemplate(timeIcon, pickDate, pickTime, is12Hours, showSeconds, collapse) {
		if (pickDate && pickTime) {
			return (
				'<div class="bootstrap-datetimepicker-widget dropdown-menu pull-right">' +
					'<ul>' +
					'<li' + (collapse ? ' class="collapse in"' : '') + '>' +
					'<div class="datepicker">' +
					DPGlobal.template +
					'</div>' +
					'</li>' +
					'<li class="picker-switch accordion-toggle"><a><i class="' + timeIcon + '"></i></a></li>' +
					'<li' + (collapse ? ' class="collapse"' : '') + '>' +
					'<div class="timepicker">' +
					TPGlobal.getTemplate(is12Hours, showSeconds) +
					'</div>' +
					'</li>' +
					'</ul>' +
					'</div>'
			);
		}

		if (pickTime) {
			return (
				'<div class="bootstrap-datetimepicker-widget dropdown-menu">' +
					'<div class="timepicker">' +
					TPGlobal.getTemplate(is12Hours, showSeconds) +
					'</div>' +
					'</div>'
			);
		}

		return (
			'<div class="bootstrap-datetimepicker-widget dropdown-menu">' +
				'<div class="datepicker">' +
				DPGlobal.template +
				'</div>' +
				'</div>'
		);
	}

	function escapeRegExp(str) {
		// http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	function padLeft(s, l, c) {
		var result = null;

		if (typeof s.length === "undefined") {
			s = s.toString();
		}

		if (l < s.length) {
			return s;
		}

		result = [];
		result.length = l - s.length + 1;
		return result.join(c || ' ') + s;
	}

	function toMySQLDateString(date) {
		return date.getUTCFullYear() + "-" +
			padLeft(date.getUTCMonth() + 1, 2, "0") + "-" +
			padLeft(date.getUTCDate(), 2, "0") + " " +
			padLeft(date.getUTCHours(), 2, "0") + ":" +
			padLeft(date.getUTCMinutes(), 2, "0") + ":" +
			padLeft(date.getUTCSeconds(), 2, "0");
	}

	function DateTimePicker(element, options) {
		this.id = (dpgId += 1);
		this.init(element, options);
	}

	DateTimePicker.prototype = {
		constructor: DateTimePicker,

		init: function (element, options) {
			var icon,
				initial = "",
				pickDate = false,
				pickTime = false,
				language = DEFAULT_LANGUAGE,
				findData = function(isInput, $el, key) {
					if (isInput) {
						return $el.data(key);
					} 
					return $el.find('input[type="text"]').data(key);
				};

			this.options = options;
			this.$element = $(element);
			this.isInput = this.$element.is('input[type="text"]');

			language = findData(this.isInput, this.$element, "language");
			if (!language) {
				language = options.language;
			}
			this.language = this.options.dates.hasOwnProperty(language) ? language : DEFAULT_LANGUAGE;
			buildFormatter(this.options.dates, this.language);

			this.closeOnSelect = findData(this.isInput, this.$element, "close-on-select") || options.closeOnSelect;

			pickDate = findData(this.isInput, this.$element, "pick-date");
			if (pickDate) {
				this.pickDate = (pickDate != "disabled");
			} else {
				this.pickDate = options.pickDate;
			}
			pickTime = findData(this.isInput, this.$element, "pick-time");
			if (pickTime) {
				this.pickTime = (pickTime != "disabled");
			} else {
				this.pickTime = options.pickTime;
			}
			this.component = false;
			if (this.$element.find('.input-append') || this.$element.find('.input-prepend')) {
				this.component = this.$element.find('.add-on');
			}
			this.format = options.format;
			if (!this.format) {
				this.format = findData(this.isInput, this.$element, "format");
				if (!this.format) {
					this.format = 'MM/dd/yyyy';
				}
			}
			this.priv_compileFormat();
			if (this.component) {
				icon = this.component.find('i');
			}
			if (this.pickTime) {
				if (icon && icon.length) {
					this.timeIcon = icon.data('time-icon');
				}
				if (!this.timeIcon) {
					this.timeIcon = 'icon-time';
				}
				icon.addClass(this.timeIcon);
			}
			if (this.pickDate) {
				if (icon && icon.length) {
					this.dateIcon = icon.data('date-icon');
				}
				if (!this.dateIcon) {
					this.dateIcon = 'icon-calendar';
				}
				icon.removeClass(this.timeIcon);
				icon.addClass(this.dateIcon);
			}
			this.$widget = $(getTemplate(this.timeIcon, this.pickDate, this.pickTime, options.pick12HourFormat, options.pickSeconds, options.collapse)).appendTo("body");
			this.minViewMode = options.minViewMode || this.$element.data('date-minviewmode') || 0;
			if (typeof this.minViewMode === 'string') {
				switch (this.minViewMode) {
				case 'months':
					this.minViewMode = 1;
					break;
				case 'years':
					this.minViewMode = 2;
					break;
				default:
					this.minViewMode = 0;
					break;
				}
			}
			this.viewMode = options.viewMode || this.$element.data('date-viewmode') || 0;
			if (typeof this.viewMode === 'string') {
				switch (this.viewMode) {
				case 'months':
					this.viewMode = 1;
					break;
				case 'years':
					this.viewMode = 2;
					break;
				default:
					this.viewMode = 0;
					break;
				}
			}
			this.startViewMode = this.viewMode;
			this.weekStart = options.weekStart || this.$element.data('date-weekstart') || 0;
			this.weekEnd = (this.weekStart === 0) ? 6 : this.weekStart - 1;
			this.setStartDate(options.startDate || this.$element.data('date-startdate'));
			this.setEndDate(options.endDate || this.$element.data('date-enddate'));
			this.fillDow();
			this.fillMonths();
			this.fillHours();
			this.fillMinutes();
			this.fillSeconds();
			this.update();
			this.showMode();
			this.priv_attachDatePickerEvents();

			initial = findData(this.isInput, this.$element, "initial-value") || options.initialValue;
			if (initial) {
				initial = new Date(Date.parse(initial));
				this.setDate(getUTCDate(
					initial.getUTCFullYear(),
					initial.getUTCMonth(),
					initial.getUTCDate(),
					initial.getUTCHours(),
					initial.getUTCMinutes(),
					initial.getUTCSeconds(),
					initial.getUTCMilliseconds()
				));
			}
		},

		show: function (e) {
			this.$widget.show();
			this.height = this.component ? this.component.outerHeight() : this.$element.outerHeight();
			this.place();
			this.$element.trigger({
				type: 'show',
				date: this.priv_date
			});
			this.priv_attachDatePickerGlobalEvents();
			this.stopEvent(e);
		},

		disable: function () {
			this.$element.find('input[type="text"]').prop('disabled', true);
			this.priv_detachDatePickerEvents();
		},

		enable: function () {
			this.$element.find('input[type="text"]').prop('disabled', false);
			this.priv_attachDatePickerEvents();
		},

		hide: function () {
			// Ignore event if in the middle of a picker transition
			var collapse = this.$widget.find('.collapse'),
				i = 0,
				collapseData = null;

			for (i = 0; i < collapse.length; i += 1) {
				collapseData = collapse.eq(i).data('collapse');
				if (collapseData && collapseData.transitioning) {
					return;
				}
			}
			this.$widget.hide();
			this.viewMode = this.startViewMode;
			this.showMode();
			this.set();
			this.$element.trigger({
				type: 'hide',
				date: this.priv_date
			});
			this.priv_detachDatePickerGlobalEvents();
		},

		set: function () {
			var formatted = '',
				input = null;

			if (!this.priv_unset) {
				formatted = this.formatDate(this.priv_date);
			}
			if (!this.isInput) {
				if (this.component) {
					input = this.$element.find('input[type="text"]');
					input.val(formatted);
					this.priv_resetMaskPos(input);
				}
				this.$element.data('date', formatted);
			} else {
				this.$element.val(formatted);
				this.priv_resetMaskPos(this.$element);
			}
			this.$element.find("input[type='hidden']").val(toMySQLDateString(this.priv_date));
		},

		setValue: function (newDate) {
			this.priv_unset = !newDate;
			if (typeof newDate === 'string') {
				this.priv_date = this.parseDate(newDate);
			} else if (newDate) {
				this.priv_date = new Date(newDate);
			}
			this.set();
			this.viewDate = getUTCDate(this.priv_date.getUTCFullYear(), this.priv_date.getUTCMonth(), 1, 0, 0, 0, 0);
			this.fillDate();
			this.fillTime();
		},

		getDate: function () {
			if (this.priv_unset) {
				return null;
			}
			return new Date(this.priv_date.valueOf());
		},

		setDate: function (date) {
			if (!date) {
				this.setValue(null);
			} else {
				this.setValue(date.valueOf());
			}
		},

		priv_setDateBound: function (date, boundary, defaultValue) {
			if (date instanceof Date) {
				this[boundary + "Date"] = date;
			} else if (typeof date === 'string') {
				this[boundary + "Date"] = getUTCDate(date);
				if (!this[boundary + "Date"].getUTCFullYear()) {
					this[boundary + "Date"] = defaultValue;
				}
			} else {
				this[boundary + "Date"] = defaultValue;
			}
			if (this.viewDate) {
				this.update();
			}
		},

		setStartDate: function (date) {
			return this.priv_setDateBound(date, "start", -Infinity);
		},

		setEndDate: function (date) {
			return this.priv_setDateBound(date, "end", Infinity);
		},

		getLocalDate: function () {
			var d = this.priv_date;

			if (this.priv_unset) {
				return null;
			}

			return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(),
							d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
		},

		setLocalDate: function (localDate) {
			if (!localDate) {
				this.setValue(null);
			} else {
				this.setValue(
					Date.UTC(
						localDate.getFullYear(),
						localDate.getMonth(),
						localDate.getDate(),
						localDate.getHours(),
						localDate.getMinutes(),
						localDate.getSeconds(),
						localDate.getMilliseconds()
					)
				);
			}
		},

		place: function () {
			var position = 'absolute',
				offset = this.component ? this.component.offset() : this.$element.offset(),
				$window = null;

			this.width = this.component ? this.component.outerWidth() : this.$element.outerWidth();
			offset.top = offset.top + this.height;

			$window = $(window);

			if (this.options.width !== undefined) {
				this.$widget.width(this.options.width);
			}

			if (this.options.orientation === 'left') {
				this.$widget.addClass('left-oriented');
				offset.left   = offset.left - this.$widget.width() + 20;
			}

			if (this.priv_isInFixed()) {
				position = 'fixed';
				offset.top -= $window.scrollTop();
				offset.left -= $window.scrollLeft();
			}

			if ($window.width() < offset.left + this.$widget.outerWidth()) {
				offset.right = $window.width() - offset.left - this.width;
				offset.left = 'auto';
				this.$widget.addClass('pull-right');
			} else {
				offset.right = 'auto';
				this.$widget.removeClass('pull-right');
			}

			this.$widget.css({
				position: position,
				top: offset.top,
				left: offset.left,
				right: offset.right
			});
		},

		notifyChange: function () {
			this.$element.trigger({
				type: 'changeDate',
				date: this.getDate(),
				localDate: this.getLocalDate()
			});
		},

		update: function (newDate) {
			var dateStr = newDate,
				tmp = null;

			if (!dateStr) {
				if (this.isInput) {
					dateStr = this.$element.val();
				} else {
					dateStr = this.$element.find('input[type="text"]').val();
				}
				if (dateStr) {
					this.priv_date = this.parseDate(dateStr);
				}
				if (!this.priv_date) {
					tmp = new Date();
					this.priv_date = getUTCDate(tmp.getFullYear(),
										 tmp.getMonth(),
										 tmp.getDate(),
										 tmp.getHours(),
										 tmp.getMinutes(),
										 tmp.getSeconds(),
										 tmp.getMilliseconds());
				}
			}
			this.viewDate = getUTCDate(this.priv_date.getUTCFullYear(), this.priv_date.getUTCMonth(), 1, 0, 0, 0, 0);
			this.fillDate();
			this.fillTime();
		},

		fillDow: function () {
			var i = 0,
				html = $('<tr>');

			for (i = this.weekStart; i < this.weekStart + 7; i += 1) {
				html.append('<th class="dow">' + this.options.dates[this.language].daysMin[i % 7] + '</th>');
			}
			this.$widget.find('.datepicker-days thead').append(html);
		},

		fillMonths: function () {
			var html = '',
				i = 0;

			for (i = 0; i < 12; i += 1) {
				html += '<span class="month">' + this.options.dates[this.language].monthsShort[i] + '</span>';
			}
			this.$widget.find('.datepicker-months td').append(html);
		},

		fillDate: function () {
			var year = this.viewDate.getUTCFullYear(),
				month = this.viewDate.getUTCMonth(),
				currentDate = getUTCDate(
					this.priv_date.getUTCFullYear(),
					this.priv_date.getUTCMonth(),
					this.priv_date.getUTCDate(),
					0,
					0,
					0,
					0
				),
				startYear  = (typeof this.startDate === 'object') ? this.startDate.getUTCFullYear() : -Infinity,
				startMonth = (typeof this.startDate === 'object') ? this.startDate.getUTCMonth() : -Infinity,
				endYear  = (typeof this.endDate === 'object') ? this.endDate.getUTCFullYear() : Infinity,
				endMonth = (typeof this.endDate === 'object') ? this.endDate.getUTCMonth() : 12,
				prevMonth = null,
				day = null,
				nextMonth,
				html = [],
				row = null,
				clsName = null,
				currentYear = null,
				months = null,
				yearCont = null,
				i = 0;

			this.$widget.find('.datepicker-days').find('.disabled').removeClass('disabled');
			this.$widget.find('.datepicker-months').find('.disabled').removeClass('disabled');
			this.$widget.find('.datepicker-years').find('.disabled').removeClass('disabled');
			this.$widget.find('.datepicker-days th:eq(1)').text(this.options.dates[this.language].months[month] + ' ' + year);

			prevMonth = getUTCDate(year, month - 1, 28, 0, 0, 0, 0);
			day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
			prevMonth.setUTCDate(day);
			prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.weekStart + 7) % 7);
			if ((year === startYear && month <= startMonth) || year < startYear) {
				this.$widget.find('.datepicker-days th:eq(0)').addClass('disabled');
			}
			if ((year === endYear && month >= endMonth) || year > endYear) {
				this.$widget.find('.datepicker-days th:eq(2)').addClass('disabled');
			}

			nextMonth = new Date(prevMonth.valueOf());
			nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
			nextMonth = nextMonth.valueOf();

			while (prevMonth.valueOf() < nextMonth) {
				if (prevMonth.getUTCDay() === this.weekStart) {
					row = $('<tr>');
					html.push(row);
				}
				clsName = '';
				if (prevMonth.getUTCFullYear() < year || (prevMonth.getUTCFullYear() === year && prevMonth.getUTCMonth() < month)) {
					clsName += ' old';
				} else if (prevMonth.getUTCFullYear() > year || (prevMonth.getUTCFullYear() === year && prevMonth.getUTCMonth() > month)) {
					clsName += ' new';
				}
				if (prevMonth.valueOf() === currentDate.valueOf()) {
					clsName += ' active';
				}
				if ((prevMonth.valueOf() + 86400000) <= this.startDate) {
					clsName += ' disabled';
				}
				if (prevMonth.valueOf() > this.endDate) {
					clsName += ' disabled';
				}
				row.append('<td class="day' + clsName + '">' + prevMonth.getUTCDate() + '</td>');
				prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
			}
			this.$widget.find('.datepicker-days tbody').empty().append(html);

			currentYear = this.priv_date.getUTCFullYear();
			months = this.$widget.find('.datepicker-months').find('th:eq(1)').text(year).end().find('span').removeClass('active');
			if (currentYear === year) {
				months.eq(this.priv_date.getUTCMonth()).addClass('active');
			}
			if (currentYear - 1 < startYear) {
				this.$widget.find('.datepicker-months th:eq(0)').addClass('disabled');
			}
			if (currentYear + 1 > endYear) {
				this.$widget.find('.datepicker-months th:eq(2)').addClass('disabled');
			}
			for (i = 0; i < 12; i += 1) {
				if ((year === startYear && startMonth > i) || (year < startYear)) {
					$(months[i]).addClass('disabled');
				} else if ((year === endYear && endMonth < i) || (year > endYear)) {
					$(months[i]).addClass('disabled');
				}
			}

			html = '';
			year = parseInt(year / 10, 10) * 10;
			yearCont = this.$widget.find('.datepicker-years').find('th:eq(1)').text(year + '-' + (year + 9)).end().find('td');
			this.$widget.find('.datepicker-years').find('th').removeClass('disabled');
			if (startYear > year) {
				this.$widget.find('.datepicker-years').find('th:eq(0)').addClass('disabled');
			}
			if (endYear < year + 9) {
				this.$widget.find('.datepicker-years').find('th:eq(2)').addClass('disabled');
			}
			year -= 1;
			for (i = -1; i < 11; i += 1) {
				html += '<span class="year' + (i === -1 || i === 10 ? ' old' : '') + (currentYear === year ? ' active' : '') + ((year < startYear || year > endYear) ? ' disabled' : '') + '">' + year + '</span>';
				year += 1;
			}
			yearCont.html(html);
		},

		fillHours: function () {
			var table = this.$widget.find('.timepicker .timepicker-hours table'),
				html = '',
				current = 1,
				i = 0,
				j = 0,
				c = "";

			table.parent().hide();
			if (this.options.pick12HourFormat) {
				for (i = 0; i < 3; i += 1) {
					html += '<tr>';
					for (j = 0; j < 4; j += 1) {
						c = current.toString();
						html += '<td class="hour">' + padLeft(c, 2, '0') + '</td>';
						current += 1;
					}
					html += '</tr>';
				}
			} else {
				current = 0;
				for (i = 0; i < 6; i += 1) {
					html += '<tr>';
					for (j = 0; j < 4; j += 1) {
						c = current.toString();
						html += '<td class="hour">' + padLeft(c, 2, '0') + '</td>';
						current += 1;
					}
					html += '</tr>';
				}
			}
			table.html(html);
		},

		fillMinutes: function () {
			var table = this.$widget.find('.timepicker .timepicker-minutes table'),
				html = '',
				current = 0,
				i = 0,
				j = 0,
				c = "";

			table.parent().hide();
			for (i = 0; i < 5; i += 1) {
				html += '<tr>';
				for (j = 0; j < 4; j += 1) {
					c = current.toString();
					html += '<td class="minute">' + padLeft(c, 2, '0') + '</td>';
					current += 3;
				}
				html += '</tr>';
			}
			table.html(html);
		},

		fillSeconds: function () {
			var table = this.$widget.find('.timepicker .timepicker-seconds table'),
				html = '',
				current = 0,
				i = 0,
				j = 0,
				c = "";

			table.parent().hide();
			for (i = 0; i < 5; i += 1) {
				html += '<tr>';
				for (j = 0; j < 4; j += 1) {
					c = current.toString();
					html += '<td class="second">' + padLeft(c, 2, '0') + '</td>';
					current += 3;
				}
				html += '</tr>';
			}
			table.html(html);
		},

		fillTime: function () {
			var timeComponents = null,
				table = null,
				is12HourFormat = false,
				hour = 0,
				period = 'AM',
				minute = "",
				second = "";

			if (!this.priv_date) {
				return;
			}
			timeComponents = this.$widget.find('.timepicker span[data-time-component]');
			table = timeComponents.closest('table');
			is12HourFormat = this.options.pick12HourFormat;
			hour = this.priv_date.getUTCHours();

			if (is12HourFormat) {
				if (hour >= 12) {
					period = 'PM';
				}
				if (hour === 0) {
					hour = 12;
				} else if (hour !== 12) {
					hour = hour % 12;
				}
				this.$widget.find('.timepicker [data-action=togglePeriod]').text(period);
			}
			hour = padLeft(hour.toString(), 2, '0');
			minute = padLeft(this.priv_date.getUTCMinutes().toString(), 2, '0');
			second = padLeft(this.priv_date.getUTCSeconds().toString(), 2, '0');
			timeComponents.filter('[data-time-component=hours]').text(hour);
			timeComponents.filter('[data-time-component=minutes]').text(minute);
			timeComponents.filter('[data-time-component=seconds]').text(second);
		},

		click: function (e) {
			var target = null,
				vd = null,
				navFnc = null,
				step = null,
				month = 0,
				year = 0,
				day = 0;

			this.stopEvent(e);
			this.priv_unset = false;
			target = $(e.target).closest('span, td, th');
			if (target.length === 1) {
				if (!target.is('.disabled')) {
					switch (target[0].nodeName.toLowerCase()) {
					case 'th':
						switch (target[0].className) {
						case 'switch':
							this.showMode(1);
							break;
						case 'prev':
						case 'next':
							vd = this.viewDate;
							navFnc = DPGlobal.modes[this.viewMode].navFnc;
							step = DPGlobal.modes[this.viewMode].navStep;
							if (target[0].className === 'prev') {
								step = step * -1;
							}
							vd['set' + navFnc](vd['get' + navFnc]() + step);
							this.fillDate();
							this.set();
							break;
						}
						break;
					case 'span':
						if (target.is('.month')) {
							month = target.parent().find('span').index(target);
							this.viewDate.setUTCMonth(month);
						} else {
							year = parseInt(target.text(), 10) || 0;
							this.viewDate.setUTCFullYear(year);
						}
						if (this.viewMode !== 0) {
							this.priv_date = getUTCDate(
								this.viewDate.getUTCFullYear(),
								this.viewDate.getUTCMonth(),
								this.viewDate.getUTCDate(),
								this.priv_date.getUTCHours(),
								this.priv_date.getUTCMinutes(),
								this.priv_date.getUTCSeconds(),
								this.priv_date.getUTCMilliseconds()
							);
							this.notifyChange();
						}
						this.showMode(-1);
						this.fillDate();
						this.set();
						break;

					case 'td':
						if (target.is('.day')) {
							day = parseInt(target.text(), 10) || 1;
							month = this.viewDate.getUTCMonth();
							year = this.viewDate.getUTCFullYear();

							if (target.is('.old')) {
								if (month === 0) {
									month = 11;
									year -= 1;
								} else {
									month -= 1;
								}
							} else if (target.is('.new')) {
								if (month === 11) {
									month = 0;
									year += 1;
								} else {
									month += 1;
								}
							}
							this.priv_date = getUTCDate(
								year,
								month,
								day,
								this.priv_date.getUTCHours(),
								this.priv_date.getUTCMinutes(),
								this.priv_date.getUTCSeconds(),
								this.priv_date.getUTCMilliseconds()
							);
							this.viewDate = getUTCDate(year, month, Math.min(28, day), 0, 0, 0, 0);
							this.fillDate();
							this.set();
							this.notifyChange();
							if (this.closeOnSelect) {
								this.hide();
							}						
						}
						break;
					}
				}
			}
		},

		actions: {
			incrementHours: function (e) {
				this.priv_date.setUTCHours(this.priv_date.getUTCHours() + 1);
			},

			incrementMinutes: function (e) {
				this.priv_date.setUTCMinutes(this.priv_date.getUTCMinutes() + 1);
			},

			incrementSeconds: function (e) {
				this.priv_date.setUTCSeconds(this.priv_date.getUTCSeconds() + 1);
			},

			decrementHours: function (e) {
				this.priv_date.setUTCHours(this.priv_date.getUTCHours() - 1);
			},

			decrementMinutes: function (e) {
				this.priv_date.setUTCMinutes(this.priv_date.getUTCMinutes() - 1);
			},

			decrementSeconds: function (e) {
				this.priv_date.setUTCSeconds(this.priv_date.getUTCSeconds() - 1);
			},

			togglePeriod: function (e) {
				var hour = this.priv_date.getUTCHours();
				if (hour >= 12) {
					hour -= 12;
				} else {
					hour += 12;
				}
				this.priv_date.setUTCHours(hour);
			},

			showPicker: function () {
				this.$widget.find('.timepicker > div:not(.timepicker-picker)').hide();
				this.$widget.find('.timepicker .timepicker-picker').show();
			},

			showHours: function () {
				this.$widget.find('.timepicker .timepicker-picker').hide();
				this.$widget.find('.timepicker .timepicker-hours').show();
			},

			showMinutes: function () {
				this.$widget.find('.timepicker .timepicker-picker').hide();
				this.$widget.find('.timepicker .timepicker-minutes').show();
			},

			showSeconds: function () {
				this.$widget.find('.timepicker .timepicker-picker').hide();
				this.$widget.find('.timepicker .timepicker-seconds').show();
			},

			selectHour: function (e) {
				var tgt = $(e.target),
					value = parseInt(tgt.text(), 10),
					current = null;

				if (this.options.pick12HourFormat) {
					current = this.priv_date.getUTCHours();
					if (current >= 12) {
						if (value !== 12) {
							value = (value + 12) % 24;
						}
					} else {
						if (value === 12) {
							value = 0;
						} else {
							value = value % 12;
						}
					}
				}
				this.priv_date.setUTCHours(value);
				this.actions.showPicker.call(this);
			},

			selectMinute: function (e) {
				var tgt = $(e.target),
					value = parseInt(tgt.text(), 10);

				this.priv_date.setUTCMinutes(value);
				this.actions.showPicker.call(this);
			},

			selectSecond: function (e) {
				var tgt = $(e.target),
					value = parseInt(tgt.text(), 10);

				this.priv_date.setUTCSeconds(value);
				this.actions.showPicker.call(this);
			}
		},

		doAction: function (e) {
			var action = null,
				rv = null;

			this.stopEvent(e);
			if (!this.priv_date) {
				this.priv_date = getUTCDate(1970, 0, 0, 0, 0, 0, 0);
			}
			action = $(e.currentTarget).data('action');
			rv = this.actions[action].apply(this, arguments);
			this.set();
			this.fillTime();
			this.notifyChange();
			return rv;
		},

		stopEvent: function (e) {
			if (e) {
				e.stopPropagation();
				e.preventDefault();
			}
		},

		// part of the following code was taken from
		// http://cloud.github.com/downloads/digitalBush/jquery.maskedinput/jquery.maskedinput-1.3.js
		keydown: function (e) {
			var self = this,
				k = e.which,
				input = $(e.target);

			if (k === 8 || k === 46) {
				// backspace and delete cause the maskPosition
				// to be recalculated
				setTimeout(function () {
					self.priv_resetMaskPos(input);
				});
			}
		},

		keypress: function (e) {
			var k = e.which,
				input = null,
				c = "",
				val = "",
				mask = "";

			if (k === 8 || k === 46) {
				// For those browsers which will trigger
				// keypress on backspace/delete
				return;
			}
			input = $(e.target);
			c = String.fromCharCode(k);
			val = input.val() || '';
			val += c;
			mask = this.priv_mask[this.priv_maskPos];
			if (!mask) {
				return false;
			}

			if (mask.end !== val.length) {
				return;
			}

			if (!mask.pattern.test(val.slice(mask.start))) {
				val = val.slice(0, val.length - 1);
				mask = this.priv_mask[this.priv_maskPos];

				while (mask && mask.character) {
					val += mask.character;
					// advance mask position past static
					// part
					this.priv_maskPos += 1;
					mask = this.priv_mask[this.priv_maskPos];
				}
				val += c;
				if (mask.end !== val.length) {
					input.val(val);
					return false;
				}

				if (!mask.pattern.test(val.slice(mask.start))) {
					input.val(val.slice(0, mask.start));
					return false;
				}

				input.val(val);
				this.priv_maskPos += 1;
				return false;
			}

			this.priv_maskPos += 1;
		},

		change: function (e) {
			var input = $(e.target),
				val = input.val();

			if (this.priv_formatPattern.test(val)) {
				this.update();
				this.setValue(this.priv_date.getTime());
				this.notifyChange();
				this.set();

			} else if (val && val.trim()) {
				this.setValue(this.priv_date.getTime());
				if (this.priv_date) {
					this.set();
				} else {
					input.val('');
				}

			} else {
				if (this.priv_date) {
					this.setValue(null);
					// unset the date when the input is
					// erased
					this.notifyChange();
					this.priv_unset = true;
				}
			}
			this.priv_resetMaskPos(input);
		},

		showMode: function (dir) {
			if (dir) {
				this.viewMode = Math.max(this.minViewMode, Math.min(2, this.viewMode + dir));
			}
			this.$widget.find('.datepicker > div').hide().filter('.datepicker-' + DPGlobal.modes[this.viewMode].clsName).show();
		},

		destroy: function () {
			this.priv_detachDatePickerEvents();
			this.priv_detachDatePickerGlobalEvents();
			this.$widget.remove();
			this.$element.removeData('datetimepicker');
			this.component.removeData('datetimepicker');
		},

		formatDate: function (d) {
			var self = this;

			return this.format.replace(formatReplacer, function (match) {
				var component = null,
					property = null,
					len = match.length,
					i = 0,
					result = "",
					formatProperty = function (property, len) {
						var methodName = null,
							rv = "";

						if (property === 'Period12') {
							if (d.getUTCHours() >= 12) {
								return 'PM';
							}
							return 'AM';
						}

						if (property === 'Hours12') {
							rv = d.getUTCHours();
							if (rv === 0) {
								rv = 12;
							} else if (rv !== 12) {
								rv = rv % 12;
							}

						} else if (property === 'UTCYear') {
							rv = d.getUTCFullYear();
							rv = rv.toString().substr(2);

						} else if (property === 'LongDay') {
							rv = self.options.dates[self.language].days[d.getUTCDay()];

						} else if (property === 'ShortDay') {
							rv = self.options.dates[self.language].daysShort[d.getUTCDay()];

						} else if (property === 'LongMonth') {
							rv = self.options.dates[self.language].months[d.getUTCMonth()];

						} else if (property === 'ShortMonth') {
							rv = self.options.dates[self.language].monthsShort[d.getUTCMonth()];

						} else {
							methodName = 'get' + property;
							rv = d[methodName]();

							if (methodName === 'getUTCMonth') {
								rv = rv + 1;
							}
						}

						return padLeft(rv.toString(), len, '0');
					};

				if (match === 'ms') {
					len = 1;
				}

				component = dateFormatComponents[match];

				if ($.isArray(component)) {
					for (i = 0; i < component.length; i += 1) {
						if (component[i].property) {
							result += formatProperty(component[i].property, len);
						} else {
							result += component[i];
						}
					}
					return result;
				}

				if (typeof component === "object") {
					return formatProperty(component.property, len);
				}

				return "";
			});
		},

		parseDate: function (str) {
			var match = null,
				i = 0,
				property = null,
				methodName = null,
				value = "",
				parsed = {};

			match = this.priv_formatPattern.exec(str);
			if (!match) {
				return null;
			}

			for (i = 1; i < match.length; i += 1) {
				property = this.priv_propertiesByIndex[i];
				if (property) {
					value = match[i];
					if (/^\d+$/.test(value)) {
						value = parseInt(value, 10);
					}
					parsed[property] = value;
				}
			}
			return this.priv_finishParsingDate(parsed);
		},

		priv_resetMaskPos: function (input) {
			var val = input.val(),
				i = 0;

			for (i = 0; i < this.priv_mask.length; i += 1) {
				if (this.priv_mask[i].end > val.length) {
					// If the mask has ended then jump to
					// the next
					this.priv_maskPos = i;
					break;

				} else if (this.priv_mask[i].end === val.length) {
					this.priv_maskPos = i + 1;
					break;
				}
			}
		},

		priv_finishParsingDate: function (parsed) {
			var year = 0,
				month = 0,
				weekday = -1,
				date = 0,
				hours = 0,
				minutes = 0,
				seconds = 0,
				milliseconds = 0,
				result = null;

			year = parsed.UTCFullYear;
			if (parsed.UTCYear) {
				year = 2000 + parsed.UTCYear;
			}
			if (!year) {
				year = 1970;
			}

			if (parsed.UTCMonth) {
				month = parsed.UTCMonth - 1;
			} else if (parsed.ShortMonth) {
				month = this.options.dates[this.language].monthsShort.indexOf(parsed.ShortMonth);
			} else if (parsed.LongMonth) {
				month = this.options.dates[this.language].months.indexOf(parsed.LongMonth);
			}
			if (month < 0) {
				month = 0;
			}

			date = parsed.UTCDate || 1;

			hours = parsed.UTCHours || 0;
			minutes = parsed.UTCMinutes || 0;
			seconds = parsed.UTCSeconds || 0;
			milliseconds = parsed.UTCMilliseconds || 0;
			if (parsed.Hours12) {
				hours = parsed.Hours12;
			}
			if (parsed.Period12) {
				if (/pm/i.test(parsed.Period12)) {
					if (hours !== 12) {
						hours = (hours + 12) % 24;
					}
				} else {
					hours = hours % 12;
				}
			}

			result = getUTCDate(year, month, date, hours, minutes, seconds, milliseconds);

			if (parsed.ShortDay) {
				weekday = this.options.dates[this.language].daysShort.indexOf(parsed.ShortDay);
			}
			if (parsed.LongDay) {
				weekday = this.options.dates[this.language].days.indexOf(parsed.LongDay);
			}
			if (weekday >= 0) {
				date += (weekday - result.getDay());
				result.setUTCDate(date);
			}

			return result;
		},

		priv_compileFormat: function () {
			var match = null,
				componentString = "",
				component = null,
				components = [],
				mask = [],
				str = this.format,
				propertiesByIndex = {},
				i = 0,
				j = 0,
				pos = 0,
				addPattern = function (index, property, pattern, wrapPattern, pos, componentString) {
					if (i >= 0) {
						propertiesByIndex[index] = property;
					}
					components.push((wrapPattern) ? ('\\s*' + pattern + '\\s*') : pattern);
					mask.push({
						pattern: new RegExp(pattern),
						property: property,
						start: pos,
						end: pos += componentString.length
					});
				};

			match = formatComponent.exec(str);
			while (match) {
				componentString = match[0];
				if (dateFormatComponents.hasOwnProperty(componentString)) {
					i += 1;

					component = dateFormatComponents[componentString];
					if ($.isArray(component)) {
						for (j = 0; j < component.length; j += 1) {
							if (component[j].property) {
								addPattern(i, component[j].property, component[j].getPattern(this), true, pos, componentString);
								i += 1;

							} else {
								addPattern(-1, null, escapeRegExp(component[j]), false, pos, component[j]);
							}
						}

					} else if (typeof component === "object") {
						addPattern(i, component.property, component.getPattern(this), true, pos, componentString);
					}

				} else {
					addPattern(-1, null, escapeRegExp(componentString), false, pos, componentString);
				}

				str = str.slice(componentString.length);
				match = formatComponent.exec(str);
			}
			this.priv_mask = mask;
			this.priv_maskPos = 0;
			this.priv_formatPattern = new RegExp('^\\s*' + components.join('') + '\\s*$');
			this.priv_propertiesByIndex = propertiesByIndex;
		},

		priv_attachDatePickerEvents: function () {
			var self = this,
				$self = null,
				$parent = null,
				expanded = null,
				closed = null,
				collapseData = null;

			// this handles date picker clicks
			this.$widget.on('click', '.datepicker *', $.proxy(this.click, this));
			// this handles time picker clicks
			this.$widget.on('click', '[data-action]', $.proxy(this.doAction, this));
			this.$widget.on('mousedown', $.proxy(this.stopEvent, this));
			if (this.pickDate && this.pickTime) {
				this.$widget.on('click.togglePicker', '.accordion-toggle', function (e) {
					e.stopPropagation();
					$self = $(this);
					$parent = $self.closest('ul');
					expanded = $parent.find('.collapse.in');
					closed = $parent.find('.collapse:not(.in)');

					if (expanded && expanded.length) {
						collapseData = expanded.data('collapse');
						if (collapseData && collapseData.transitioning) {
							return;
						}
						expanded.collapse('hide');
						closed.collapse('show');
						$self.find('i').toggleClass(self.timeIcon + ' ' + self.dateIcon);
						self.$element.find('.add-on i').toggleClass(self.timeIcon + ' ' + self.dateIcon);
					}
				});
			}
			if (this.isInput) {
				this.$element.on({
					'focus': $.proxy(this.show, this),
					'change': $.proxy(this.change, this)
				});
				if (this.options.maskInput) {
					this.$element.on({
						'keydown': $.proxy(this.keydown, this),
						'keypress': $.proxy(this.keypress, this)
					});
				}
			} else {
				this.$element.on({
					'change': $.proxy(this.change, this)
				}, 'input[type="text"]');
				if (this.options.maskInput) {
					this.$element.on({
						'keydown': $.proxy(this.keydown, this),
						'keypress': $.proxy(this.keypress, this)
					}, 'input[type="text"]');
				}
				if (this.component) {
					this.component.on('click', $.proxy(this.show, this));
				} else {
					this.$element.on('click', $.proxy(this.show, this));
				}
			}
		},

		priv_attachDatePickerGlobalEvents: function () {
			$(window).on('resize.datetimepicker' + this.id, $.proxy(this.place, this));
			if (!this.isInput) {
				$(document).on('mousedown.datetimepicker' + this.id, $.proxy(this.hide, this));
			}
		},

		priv_detachDatePickerEvents: function () {
			this.$widget.off('click', '.datepicker *', this.click);
			this.$widget.off('click', '[data-action]');
			this.$widget.off('mousedown', this.stopEvent);
			if (this.pickDate && this.pickTime) {
				this.$widget.off('click.togglePicker');
			}
			if (this.isInput) {
				this.$element.off({
					'focus': this.show,
					'change': this.change
				});
				if (this.options.maskInput) {
					this.$element.off({
						'keydown': this.keydown,
						'keypress': this.keypress
					});
				}
			} else {
				this.$element.off({
					'change': this.change
				}, 'input[type="text"]');
				if (this.options.maskInput) {
					this.$element.off({
						'keydown': this.keydown,
						'keypress': this.keypress
					}, 'input[type="text"]');
				}
				if (this.component) {
					this.component.off('click', this.show);
				} else {
					this.$element.off('click', this.show);
				}
			}
		},

		priv_detachDatePickerGlobalEvents: function () {
			$(window).off('resize.datetimepicker' + this.id);
			if (!this.isInput) {
				$(document).off('mousedown.datetimepicker' + this.id);
			}
		},

		priv_isInFixed: function () {
			var parents = null,
				inFixed = false,
				i = 0;

			if (this.$element) {
				parents = this.$element.parents();
				inFixed = false;

				for (i = 0; i < parents.length; i += 1) {
					if ($(parents[i]).css('position') === 'fixed') {
						inFixed = true;
						break;
					}
				}

				return inFixed;
			}

			return false;
		}
	};

	$.fn.datetimepicker = function (option, val) {
		return this.each(function () {
			var $self = $(this),
				data = $self.data('datetimepicker'),
				options = (typeof option === 'object') && option;

			if (!data) {
				data = new DateTimePicker(this, $.extend({}, $.fn.datetimepicker.defaults, options));
				$self.data('datetimepicker', data);
			}
			if (typeof option === 'string') {
				data[option](val);
			}
		});
	};

	$.fn.datetimepicker.defaults = {
		maskInput: false,
		pickDate: true,
		pickTime: true,
		pick12HourFormat: false,
		pickSeconds: true,
		startDate: -Infinity,
		endDate: Infinity,
		collapse: true,
		closeOnSelect: true,
		dates: {
			"en": {
				days: [
					"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
					"Friday", "Saturday", "Sunday"
				],
				daysShort: [
					"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
				],
				daysMin: [
					"Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"
				],
				months: [
					"January", "February", "March", "April", "May", "June",
					"July", "August", "September", "October", "November", "December"
				],
				monthsShort: [
					"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
					"Aug", "Sep", "Oct", "Nov", "Dec"
				]
			}
		}
	};

	$.fn.datetimepicker.Constructor = DateTimePicker;

}(window, window.document, window.jQuery));
