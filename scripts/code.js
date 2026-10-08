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
		learn : true,      // suggest the words that were chosen before first
		minLength : 3,     // typed letters before the suggestions appear
		maxItems : 30
	};
	var g_settingsWindow = null;
	var g_settingsDraft = null;

	// word lists edited by the user
	var g_lists = {
		// suggested before the word list and written as entered
		personal : {
			key : "onlyoffice_autocomplete_personal",
			title : "Personal dictionary",
			description : "Your own words, one per line. They are suggested first and written exactly as entered.",
			hint : "A word cannot contain spaces. Delete a line to remove the word.",
			words : []
		},
		// never suggested
		ignored : {
			key : "onlyoffice_autocomplete_ignored",
			title : "Ignored words",
			description : "Words that are never suggested, one per line.",
			hint : "Right-click a suggestion while typing to add it here. Delete a line to have the word suggested again.",
			words : []
		}
	};
	var g_ignored = {}; // lower-case ignored words

	// how often each suggestion was chosen: lower-case word -> count
	var g_usageKey = "onlyoffice_autocomplete_usage";
	var g_usage = {};
	var g_usageMax = 3000;
	var g_listMax = 5000;
	var g_listWindow = null;
	var g_listName = "";
	var g_listDraft = null;

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

	function parseList(text)
	{
		var words = String(text || "").split(/[\s,;]+/);
		var result = [];
		var used = {};
		for (var i = 0; i < words.length && result.length < g_listMax; i++)
		{
			var key = words[i].toLowerCase();
			if (!key || used[key])
				continue;
			used[key] = true;
			result.push(words[i]);
		}
		return result;
	}

	function setList(name, text)
	{
		g_lists[name].words = parseList(text);
		if (name == "ignored")
		{
			g_ignored = {};
			for (var i = 0; i < g_lists.ignored.words.length; i++)
				g_ignored[g_lists.ignored.words[i].toLowerCase()] = true;
		}
	}

	function loadLists()
	{
		for (var name in g_lists)
		{
			try
			{
				setList(name, window.localStorage.getItem(g_lists[name].key));
			}
			catch (err)
			{
			}
		}
	}

	function saveList(name, text)
	{
		setList(name, text);
		try
		{
			window.localStorage.setItem(g_lists[name].key, g_lists[name].words.join("\n"));
		}
		catch (err)
		{
		}
		if (g_settingsWindow)
			g_settingsWindow.command("onListCounts", getListCounts());
	}

	function getListCounts()
	{
		return {
			personal : g_lists.personal.words.length,
			ignored : g_lists.ignored.words.length,
			learned : Object.keys(g_usage).length
		};
	}

	function loadUsage()
	{
		try
		{
			var usage = JSON.parse(window.localStorage.getItem(g_usageKey));
			g_usage = {};
			for (var word in usage)
			{
				if (typeof usage[word] === "number" && usage[word] > 0)
					g_usage[word] = usage[word];
			}
		}
		catch (err)
		{
		}
	}

	function saveUsage()
	{
		try
		{
			window.localStorage.setItem(g_usageKey, JSON.stringify(g_usage));
		}
		catch (err)
		{
		}
	}

	function recordUse(word)
	{
		if (!g_settings.learn || !word)
			return;

		var key = word.toLowerCase();
		g_usage[key] = (g_usage[key] || 0) + 1;

		// forget the least used words when there are too many
		var words = Object.keys(g_usage);
		if (words.length > g_usageMax)
		{
			words.sort(function(a, b) { return g_usage[b] - g_usage[a]; });
			for (var i = Math.round(g_usageMax * 0.9); i < words.length; i++)
			{
				if (words[i] != key)
					delete g_usage[words[i]];
			}
		}
		saveUsage();
	}

	function resetUsage()
	{
		g_usage = {};
		saveUsage();
		if (g_settingsWindow)
			g_settingsWindow.command("onListCounts", getListCounts());
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
	loadLists();
	loadUsage();
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
			size : [320, 390]
		};

		g_settingsDraft = null;
		g_settingsWindow = new window.Asc.PluginWindow();
		g_settingsWindow.attachEvent("onInit", function() {
			if (g_settingsWindow)
			{
				g_settingsWindow.command("onSettings", g_settings);
				g_settingsWindow.command("onListCounts", getListCounts());
			}
		});
		g_settingsWindow.attachEvent("onEditList", openList);
		g_settingsWindow.attachEvent("onResetLearned", resetUsage);
		g_settingsWindow.attachEvent("onChange", function(settings) {
			g_settingsDraft = settings;
		});
		g_settingsWindow.show(variation);
	}

	function closeList()
	{
		if (g_listWindow)
		{
			g_listWindow.close();
			g_listWindow = null;
		}
		g_listDraft = null;
	}

	// the learned words with the number of times they were chosen, most chosen first
	function getLearnedText()
	{
		var words = Object.keys(g_usage);
		words.sort(function(a, b) { return (g_usage[b] - g_usage[a]) || (a < b ? -1 : 1); });
		for (var i = 0; i < words.length; i++)
		{
			var record = g_words[words[i]];
			words[i] = (record ? record.text : words[i]) + "  (" + g_usage[words[i]] + ")";
		}
		return words.join("\n");
	}

	// keeps the words that are still listed, each as "word" or "word (count)"
	function setLearnedText(text)
	{
		var lines = String(text || "").split(/\r?\n/);
		g_usage = {};
		for (var i = 0; i < lines.length; i++)
		{
			var match = /^\s*(\S+)\s*(?:\((\d+)\))?\s*$/.exec(lines[i]);
			if (!match)
				continue;
			g_usage[match[1].toLowerCase()] = Math.max(1, parseInt(match[2]) || 1);
		}
		saveUsage();
		if (g_settingsWindow)
			g_settingsWindow.command("onListCounts", getListCounts());
	}

	function openList(name)
	{
		if (g_listWindow)
			return;

		var list = (name == "learned") ? {
			title : "Learned words",
			description : "The words you have chosen, most chosen first.",
			hint : "The number in brackets is how often you chose the word; a higher number moves it up. Delete a line to forget the word."
		} : g_lists[name];
		if (!list)
			return;

		var variation = {
			url : "wordlist.html",
			description : window.Asc.plugin.tr(list.title),
			isVisual : true,
			isModal : true,
			buttons : [
				{ text : window.Asc.plugin.tr("OK"), primary : true },
				{ text : window.Asc.plugin.tr("Cancel"), primary : false }
			],
			EditorsSupport : ["word", "slide", "cell", "pdf"],
			size : [320, 380]
		};

		g_listName = name;
		g_listDraft = null;
		g_listWindow = new window.Asc.PluginWindow();
		g_listWindow.attachEvent("onInit", function() {
			if (g_listWindow)
			{
				g_listWindow.command("onList", {
					description : window.Asc.plugin.tr(list.description),
					hint : window.Asc.plugin.tr(list.hint),
					text : (name == "learned") ? getLearnedText() : list.words.join("\n")
				});
			}
		});
		g_listWindow.attachEvent("onChange", function(text) {
			g_listDraft = text;
		});
		g_listWindow.show(variation);
	}

	// a right click on a suggestion adds it to the ignored words
	function onSuggestionContextMenu(e)
	{
		var target = e.target;
		if (!target || target.tagName != "LI")
			return;

		e.preventDefault();
		e.stopPropagation();

		var word = (target.innerText || "").replace(/\s+/g, "");
		if (!word || g_ignored[word.toLowerCase()])
			return;

		saveList("ignored", g_lists.ignored.words.concat([word.toLowerCase()]).join("\n"));
		window.Asc.plugin.event_onInputHelperInput({ text : window.Asc.plugin.currentText, add : false });
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
		// the PDF editor is built on the document editor and reports itself as "word" with the sub type "pdf"
		var info = window.Asc.plugin.info;
		return !!info && (info.editorType === "pdf" || info.editorSubType === "pdf");
	}

	// The editor API of the PDF editor, if the plugin can reach it (it can in the
	// desktop editors, where the plugin and the editor are loaded from files).
	function getPdfApi()
	{
		try
		{
			var api = window.parent.Asc.editor;
			if (api && typeof api.asc_correctEnterText === "function" && typeof api.asc_enterText === "function")
				return api;
		}
		catch (err)
		{
		}
		return null;
	}

	// whether choosing a suggestion can change the letters that are already typed
	function canReplaceTyped()
	{
		return !isPdfEditor() || null !== getPdfApi();
	}

	function getCodePoints(text)
	{
		var result = [];
		for (var i = 0; i < text.length; i++)
		{
			var code = text.codePointAt(i);
			result.push(code);
			if (code > 0xFFFF)
				i++;
		}
		return result;
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
			document.addEventListener("contextmenu", onSuggestionContextMenu);

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
			if (g_listWindow && g_listWindow.id === windowId)
			{
				if (id === 0 && g_listDraft !== null)
				{
					if (g_listName == "learned")
						setLearnedText(g_listDraft);
					else
						saveList(g_listName, g_listDraft);
				}
				closeList();
			}
			else if (g_settingsWindow && g_settingsWindow.id === windowId)
			{
				if (id === 0 && g_settingsDraft)
				{
					saveSettings(g_settingsDraft);
					window.Asc.plugin.currentText = "";
					window.Asc.plugin.getInputHelper().unShow();
				}
				closeList();
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

		recordUse(item.text);

		if (isPdfEditor())
		{
			// InputText does nothing in the PDF editor
			var typed = window.Asc.plugin.currentText;
			var rest = item.text.substr(typed.length);
			var api = getPdfApi();
			if (api)
			{
				if (false === api.asc_correctEnterText(getCodePoints(typed), getCodePoints(item.text)) && rest)
					api.asc_enterText(getCodePoints(rest));
			}
			else if (rest)
			{
				// the typed letters cannot be replaced: add the rest of the word
				window.Asc.plugin.executeMethod("PasteText", [rest]);
			}
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
		var words = g_lists.personal.words;
		for (var p = 0; p < words.length && ret.length < g_settings.maxItems; p++)
		{
			var key = words[p].toLowerCase();
			if (key.indexOf(textFound) != 0 || key == textFound || g_ignored[key])
				continue;
			personal[key] = true;
			// written as entered, unless it is all lower case or the typed letters cannot be replaced
			if (words[p] != key && canReplaceTyped())
				ret.push(words[p]);
			else
				ret.push(text + words[p].substr(textFound.length));
		}

		var found = [];
		for (var index = start; index < g_dictionary.length; index++)
		{
			if (g_dictionary[index].indexOf(textFound) != 0)
				break;

			if (personal[g_dictionary[index]] || g_ignored[g_dictionary[index]])
				continue;
			var record = g_words[g_dictionary[index]];
			if ((record.lang == "d" && !g_settings.german) || (record.lang == "e" && !g_settings.english))
				continue;
			if (record.lang == "" && !g_settings.german && !g_settings.english)
				continue;
			found.push(record);
		}

		// the words chosen most often first, then the most frequent ones
		var learn = g_settings.learn;
		found.sort(function(a, b) {
			var usedA = learn ? (g_usage[a.text.toLowerCase()] || 0) : 0;
			var usedB = learn ? (g_usage[b.text.toLowerCase()] || 0) : 0;
			return (usedB - usedA) || (a.rank - b.rank);
		});

		for (var i = 0; i < found.length && ret.length < g_settings.maxItems; i++)
		{
			var word = found[i].text;
			// nouns and names keep their capital letter, everything else follows the typed text
			if (g_settings.capitalize && g_settings.german && canReplaceTyped() && word.charAt(0) != word.charAt(0).toLowerCase())
				ret.push(word);
			else
				ret.push(text + word.substr(textFound.length));
		}

		return ret;
	};

})(window, undefined);
