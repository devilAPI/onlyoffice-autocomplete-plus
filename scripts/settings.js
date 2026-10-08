/*
 * (c) Copyright Ascensio System SIA 2010
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-6 Ernesta Birznieka-Upish
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */
(function(window, undefined){

	var g_checks = ["german", "english", "capitalize", "learn"];
	var g_numbers = ["minLength", "maxItems"];
	var g_listCounts = { personal : 0, ignored : 0, learned : 0 };

	function readSettings()
	{
		var settings = {};
		g_checks.forEach(function(id) {
			settings[id] = document.getElementById(id).checked;
		});
		g_numbers.forEach(function(id) {
			settings[id] = parseInt(document.getElementById(id).value);
		});
		return settings;
	}

	function showListCounts()
	{
		for (var name in g_listCounts)
			document.getElementById(name + "Count").innerText = g_listCounts[name];
	}

	function onChange()
	{
		window.Asc.plugin.sendToPlugin("onChange", readSettings());
	}

	window.Asc.plugin.init = function()
	{
		window.Asc.plugin.attachEvent("onSettings", function(settings) {
			g_checks.forEach(function(id) {
				document.getElementById(id).checked = settings[id];
			});
			g_numbers.forEach(function(id) {
				document.getElementById(id).value = settings[id];
			});
			onChange();
		});

		window.Asc.plugin.attachEvent("onListCounts", function(counts) {
			g_listCounts = counts;
			showListCounts();
		});
		document.getElementById("editPersonal").addEventListener("click", function() {
			window.Asc.plugin.sendToPlugin("onEditList", "personal");
		});
		document.getElementById("editIgnored").addEventListener("click", function() {
			window.Asc.plugin.sendToPlugin("onEditList", "ignored");
		});
		document.getElementById("viewLearned").addEventListener("click", function() {
			window.Asc.plugin.sendToPlugin("onEditList", "learned");
		});
		document.getElementById("resetLearned").addEventListener("click", function() {
			window.Asc.plugin.sendToPlugin("onResetLearned");
		});

		g_checks.concat(g_numbers).forEach(function(id) {
			document.getElementById(id).addEventListener("change", onChange);
			document.getElementById(id).addEventListener("input", onChange);
		});

		window.Asc.plugin.sendToPlugin("onInit");
	};

	window.Asc.plugin.onTranslate = function()
	{
		var elements = document.querySelectorAll(".i18n");
		for (var i = 0; i < elements.length; i++)
			elements[i].innerText = window.Asc.plugin.tr(elements[i].innerText);
	};

	window.Asc.plugin.onThemeChanged = function(theme)
	{
		window.Asc.plugin.onThemeChangedBase(theme);
	};

})(window, undefined);
