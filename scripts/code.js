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

	var g_dictionary = null; // lower-case words, sorted for the prefix search
	var g_words = {};        // lower-case word -> { rank, text, lang }, rank 0 is the most frequent

	var g_settingsKey = "onlyoffice_autocomplete_settings";
	var g_settings = {
		german : true,
		english : true,
		capitalize : true, // suggest German nouns with a capital letter
		minLength : 3,     // typed letters before the suggestions appear
		maxItems : 30
	};
	var g_settingsWindow = null;
	var g_settingsDraft = null;

	// the user's own words, suggested before the word list and written as entered
	var g_personalKey = "onlyoffice_autocomplete_personal";
	var g_personal = [];
	var g_personalMax = 5000;
	var g_personalWindow = null;
	var g_personalDraft = null;

	function checkSettings(settings)
	{
		var result = {};
		for (var name in g_settings)
		{
			var value = (settings && typeof settings[name] === typeof g_settings[name]) ? settings[name] : g_settings[name];
			result[name] = value;
		}
		result.minLength = Math.min(6, Math.max(1, Math.round(result.minLength) || 3));
		result.maxItems = Math.min(100, Math.max(1, Math.round(result.maxItems) || 30));
		return result;
	}

	function loadSettings()
	{
		try
		{
			g_settings = checkSettings(JSON.parse(window.localStorage.getItem(g_settingsKey)));
		}
		catch (err)
		{
		}
	}

	function saveSettings(settings)
	{
		g_settings = checkSettings(settings);
		try
		{
			window.localStorage.setItem(g_settingsKey, JSON.stringify(g_settings));
		}
		catch (err)
		{
		}
	}

	function parsePersonal(text)
	{
		var words = String(text || "").split(/[\s,;]+/);
		var result = [];
		var used = {};
		for (var i = 0; i < words.length && result.length < g_personalMax; i++)
		{
			var key = words[i].toLowerCase();
			if (!key || used[key])
				continue;
			used[key] = true;
			result.push(words[i]);
		}
		return result;
	}

	function loadPersonal()
	{
		try
		{
			g_personal = parsePersonal(window.localStorage.getItem(g_personalKey));
		}
		catch (err)
		{
		}
	}

	function savePersonal(text)
	{
		g_personal = parsePersonal(text);
		try
		{
			window.localStorage.setItem(g_personalKey, g_personal.join("\n"));
		}
		catch (err)
		{
		}
	}

	// the file lists one word per line, most frequent first;
	// "\td" or "\te" after the word marks it as only German or only English
	function loadDictionary(url) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				var dictionary = [];
				if (xhr.status === 200 || xhr.status === 0) {
					var lines = xhr.responseText.split(/\r?\n/);
					for (var i = 0; i < lines.length; i++) {
						var parts = lines[i].split("\t");
						var key = parts[0].toLowerCase();
						if (!key || g_words[key])
							continue;
						g_words[key] = { rank : i, text : parts[0], lang : parts[1] || "" };
						dictionary.push(key);
					}
					dictionary.sort();
				}
				g_dictionary = dictionary;
			}
		};
		xhr.onerror = function() {
			g_dictionary = [];
		};
		xhr.send();
	}

	loadSettings();
	loadPersonal();
	loadDictionary("./dictionaries/words.txt");

	function closeSettings()
	{
		if (g_settingsWindow)
		{
			g_settingsWindow.close();
			g_settingsWindow = null;
		}
		g_settingsDraft = null;
	}

	function openSettings()
	{
		if (g_settingsWindow)
			return;

		var variation = {
			url : "settings.html",
			description : window.Asc.plugin.tr("Autocomplete settings"),
			isVisual : true,
			isModal : true,
			buttons : [
				{ text : window.Asc.plugin.tr("OK"), primary : true },
				{ text : window.Asc.plugin.tr("Cancel"), primary : false }
			],
			EditorsSupport : ["word", "slide", "cell", "pdf"],
			size : [320, 300]
		};

		g_settingsDraft = null;
		g_settingsWindow = new window.Asc.PluginWindow();
		g_settingsWindow.attachEvent("onInit", function() {
			if (g_settingsWindow)
			{
				g_settingsWindow.command("onSettings", g_settings);
				g_settingsWindow.command("onPersonalCount", g_personal.length);
			}
		});
		g_settingsWindow.attachEvent("onEditPersonal", openPersonal);
		g_settingsWindow.attachEvent("onChange", function(settings) {
			g_settingsDraft = settings;
		});
		g_settingsWindow.show(variation);
	}

	function closePersonal()
	{
		if (g_personalWindow)
		{
			g_personalWindow.close();
			g_personalWindow = null;
		}
		g_personalDraft = null;
	}

	function openPersonal()
	{
		if (g_personalWindow)
			return;

		var variation = {
			url : "personal.html",
			description : window.Asc.plugin.tr("Personal dictionary"),
			isVisual : true,
			isModal : true,
			buttons : [
				{ text : window.Asc.plugin.tr("OK"), primary : true },
				{ text : window.Asc.plugin.tr("Cancel"), primary : false }
			],
			EditorsSupport : ["word", "slide", "cell", "pdf"],
			size : [320, 340]
		};

		g_personalDraft = null;
		g_personalWindow = new window.Asc.PluginWindow();
		g_personalWindow.attachEvent("onInit", function() {
			if (g_personalWindow)
				g_personalWindow.command("onPersonal", g_personal.join("\n"));
		});
		g_personalWindow.attachEvent("onChange", function(text) {
			g_personalDraft = text;
		});
		g_personalWindow.show(variation);
	}

	// a button on the Plugins tab and an item in the context menu open the settings
	function registerMenus()
	{
		window.Asc.plugin.executeMethod("AddToolbarMenuItem", [{
			guid : window.Asc.plugin.guid,
			tabs : [{
				id : "plugins",
				items : [{
					id : "autocompleteSettings",
					type : "button",
					text : window.Asc.plugin.tr("Autocomplete"),
					hint : window.Asc.plugin.tr("Autocomplete settings"),
					icons : "resources/img/icon%scale%(default).png",
					lockInViewMode : false,
					enableToggle : false,
					separator : true
				}]
			}]
		}]);
	}

	window.Asc.plugin.event_onContextMenuShow = function(options)
	{
		window.Asc.plugin.executeMethod("AddContextMenuItem", [{
			guid : window.Asc.plugin.guid,
			items : [{
				id : "autocompleteSettingsMenu",
				text : window.Asc.plugin.tr("Autocomplete settings")
			}]
		}]);
	};

	function isPdfEditor()
	{
		return !!window.Asc.plugin.info && window.Asc.plugin.info.editorType === "pdf";
	}

	window.isInit = false;

	window.Asc.plugin.init = function(text)
	{
		if (!window.isInit)
		{
			window.isInit = true;

			window.Asc.plugin.currentText = "";
			window.Asc.plugin.createInputHelper();
			window.Asc.plugin.getInputHelper().createWindow();

			window.Asc.plugin.attachToolbarMenuClickEvent("autocompleteSettings", openSettings);
			window.Asc.plugin.attachContextMenuClickEvent("autocompleteSettingsMenu", openSettings);
			registerMenus();
		}
	};

	window.Asc.plugin.onTranslate = function()
	{
		// update the button caption once the translations are loaded
		if (window.isInit)
			registerMenus();
	};

	window.Asc.plugin.button = function(id, windowId)
	{
		if (windowId)
		{
			if (g_personalWindow && g_personalWindow.id === windowId)
			{
				if (id === 0 && g_personalDraft !== null)
				{
					savePersonal(g_personalDraft);
					if (g_settingsWindow)
						g_settingsWindow.command("onPersonalCount", g_personal.length);
				}
				closePersonal();
			}
			else if (g_settingsWindow && g_settingsWindow.id === windowId)
			{
				if (id === 0 && g_settingsDraft)
				{
					saveSettings(g_settingsDraft);
					window.Asc.plugin.currentText = "";
					window.Asc.plugin.getInputHelper().unShow();
				}
				closePersonal();
				closeSettings();
			}
			return;
		}

		this.executeCommand("close", "");
	};
	
	window.Asc.plugin.inputHelper_onSelectItem = function(item)
	{
		if (!item || !window.Asc.plugin.ih.isVisible)
			return;

		if (isPdfEditor())
		{
			// InputText does nothing in the PDF editor, so the typed letters
			// cannot be replaced: add the rest of the word instead
			var rest = item.text.substr(window.Asc.plugin.currentText.length);
			if (rest)
				window.Asc.plugin.executeMethod("PasteText", [rest]);
			window.Asc.plugin.currentText = "";
		}
		else
		{
			window.Asc.plugin.executeMethod("InputText", [item.text, window.Asc.plugin.currentText]);
		}
		window.Asc.plugin.getInputHelper().unShow();
	};

	window.Asc.plugin.event_onInputHelperClear = function()
	{
		window.Asc.plugin.currentText = "";
		window.Asc.plugin.getInputHelper().unShow();
	};

	window.Asc.plugin.event_onInputHelperInput = function(data)
	{
		if (data.add)
			window.Asc.plugin.currentText += data.text;
		else
			window.Asc.plugin.currentText = data.text;

		// correct by space
		var lastIndexSpace = window.Asc.plugin.currentText.lastIndexOf(" ");
		if (lastIndexSpace >= 0)
		{
			if (lastIndexSpace == (window.Asc.plugin.currentText.length - 1))
				window.Asc.plugin.currentText = "";
			else
				window.Asc.plugin.currentText = window.Asc.plugin.currentText.substr(lastIndexSpace + 1);
		}

		if (window.Asc.plugin.currentText.length < g_settings.minLength)
		{
			window.Asc.plugin.getInputHelper().unShow();
			return;
		}
		
		var variants = window.getAutoComplete(window.Asc.plugin.currentText);
		if (variants.length == 0)
		{
			window.Asc.plugin.getInputHelper().unShow();
		}
		else
		{
			var items = [];
			for (var i = 0; i < variants.length; i++)
			{
				items.push({ text : variants[i] });
			}

			window.Asc.plugin.getInputHelper().setItems(items);
			var _sizes = getInputHelperSize();
			window.Asc.plugin.getInputHelper().show(_sizes.w, _sizes.h, false);
		}
	};

	function getInputHelperSize()
	{
		var _size = window.Asc.plugin.getInputHelper().getScrollSizes();
		var _width = 150;// _size.w
		var _height = _size.h;
		var _heightMin = window.Asc.plugin.getInputHelper().getItemsHeight(Math.min(5, window.Asc.plugin.getInputHelper().getItems().length));

		if (_width > 400)
			_width = 400;
		if (_height > _heightMin)
			_height = _heightMin;

		_width += 30;

		return { w: _width, h : _height };
	}

	window.isAutoCompleteReady = false;
	window.getAutoComplete = function(text)
	{
		if (!g_dictionary)
			return [];

		window.isAutoCompleteReady = true;

		var textFound = text.toLowerCase();

		// first word >= textFound
		var start = 0;
		var end = g_dictionary.length;
		while (start < end)
		{
			var middle = (start + end) >> 1;
			if (g_dictionary[middle] < textFound)
				start = middle + 1;
			else
				end = middle;
		}

		// personal words come first, in the order they were entered
		var ret = [];
		var personal = {};
		for (var p = 0; p < g_personal.length && ret.length < g_settings.maxItems; p++)
		{
			var key = g_personal[p].toLowerCase();
			if (key.indexOf(textFound) != 0 || key == textFound)
				continue;
			personal[key] = true;
			// written as entered, unless it is all lower case or the typed letters cannot be replaced
			if (g_personal[p] != key && !isPdfEditor())
				ret.push(g_personal[p]);
			else
				ret.push(text + g_personal[p].substr(textFound.length));
		}

		var found = [];
		for (var index = start; index < g_dictionary.length; index++)
		{
			if (g_dictionary[index].indexOf(textFound) != 0)
				break;

			if (personal[g_dictionary[index]])
				continue;
			var record = g_words[g_dictionary[index]];
			if ((record.lang == "d" && !g_settings.german) || (record.lang == "e" && !g_settings.english))
				continue;
			if (record.lang == "" && !g_settings.german && !g_settings.english)
				continue;
			found.push(record);
		}

		found.sort(function(a, b) { return a.rank - b.rank; });

		for (var i = 0; i < found.length && ret.length < g_settings.maxItems; i++)
		{
			var word = found[i].text;
			// nouns and names keep their capital letter, everything else follows the typed text
			// (not in the PDF editor, where the typed letters cannot be replaced)
			if (g_settings.capitalize && g_settings.german && !isPdfEditor() && word.charAt(0) != word.charAt(0).toLowerCase())
				ret.push(word);
			else
				ret.push(text + word.substr(textFound.length));
		}

		return ret;
	};

})(window, undefined);
