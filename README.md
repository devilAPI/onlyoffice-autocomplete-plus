# Autocomplete plugin (German and English)

An input assistant for ONLYOFFICE editors that suggests German and English words while you type.

> **This is a fork** of the Autocomplete plugin from [ONLYOFFICE/onlyoffice.github.io](https://github.com/ONLYOFFICE/onlyoffice.github.io/tree/master/sdkjs-plugins/content/autocomplete). The original plugin is the work of Ascensio System SIA and the ONLYOFFICE contributors; this repository keeps its history and adds the changes described below.

## Fork features

* **German and English suggestions** from one combined word list of about 258,000 words (189,000 German, 78,000 English).
* **Most common words first.** Suggestions are ranked by how often a word is used instead of alphabetically, and the list is limited to the 30 best matches.
* **German capitalisation.** Nouns and names are suggested with their capital letter (typing `hau` offers `Haus`); other words follow what you typed.
* **PDF editor support.** The plugin is also offered in the PDF editor.
* **Fixes.** The original lookup skipped every second matching word and sorted the whole dictionary again on every keystroke.

## How to use

1. Start typing and the plugin will suggest variants for you once you have typed three letters.
2. Click on the variant you want to be inserted into your doc.

The plugin runs in the background, so it has no button of its own. You can switch it on and off in the list of background plugins on the Plugins tab.

## How to install

Download [autocomplete.plugin](deploy/autocomplete.plugin) and add it in the editor via *Plugins → Plugin Manager → Available plugins → Install plugin manually*. If the original Autocomplete plugin is installed, remove it first.

The plugin is compatible with [self-hosted](https://github.com/ONLYOFFICE/DocumentServer) and [desktop](https://github.com/ONLYOFFICE/DesktopEditors) versions of ONLYOFFICE editors. Instructions for ONLYOFFICE Docs can be found in the [ONLYOFFICE API documentation](https://api.onlyoffice.com/docs/plugin-and-macros/tutorials/installing/onlyoffice-docs-on-premises/).

## Rebuilding the word list

`dictionaries/words.txt` lists one word per line, most frequent first. It is built from the sources below with:

```
python3 tools/build_words.py
```

After changing the plugin, repack it from the repository root:

```
rm deploy/autocomplete.plugin
zip -r deploy/autocomplete.plugin . -x 'deploy/*' 'tools/*' '.git/*' '.gitignore' 'LICENSE'
```

## Credits

* [ONLYOFFICE](https://github.com/ONLYOFFICE/onlyoffice.github.io) - the original Autocomplete plugin (GNU AGPL v3.0).
* [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave - word frequencies built from OpenSubtitles 2018 (content licensed CC BY-SA 4.0).
* [wordlist-german](https://gist.github.com/MarvinJWendt/2f4f4154b8ae218600eb091a5706b5f4) by Marvin Wendt - German spelling list used to filter the frequency data.
* [english-words](https://github.com/dwyl/english-words) by dwyl - English spelling list used to filter the frequency data (Unlicense).

## License

Like the original, this plugin is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE) for more information.
