# Autocomplete for ONLYOFFICE - German and English

A plugin for ONLYOFFICE editors that suggests German and English words while you type, most common words first. It works in documents, spreadsheets, presentations and PDFs.

> **This is a fork** of the Autocomplete plugin from [ONLYOFFICE/onlyoffice.github.io](https://github.com/ONLYOFFICE/onlyoffice.github.io/tree/master/sdkjs-plugins/content/autocomplete). The original plugin is the work of Ascensio System SIA and the ONLYOFFICE contributors. This repository keeps its history and adds the features below.

## Fork features

| Feature | Original plugin | This fork |
|---|---|---|
| Languages | English | German and English |
| Word list | 370,000 words, unranked | 258,000 words, most common first |
| German nouns | - | Capitalised (`hau` → `Haus`) |
| Settings window | - | Yes |
| PDF editor | - | Yes |
| Interface languages | English | English and German |

It also fixes two bugs in the original: every second matching word was skipped, and the whole dictionary was sorted again on every keystroke.

## Installation

1. Download `autocomplete.plugin` from the [latest release](https://github.com/devilAPI/onlyoffice-autocomplete-de-en/releases/latest).
2. If the original Autocomplete plugin is installed, remove it first in *Plugins → Plugin Manager*.
3. In the editor, open *Plugins → Plugin Manager → Available plugins → Install plugin manually* and select the downloaded file.
4. Restart the editor.

The plugin is compatible with the [desktop](https://github.com/ONLYOFFICE/DesktopEditors) and [self-hosted](https://github.com/ONLYOFFICE/DocumentServer) versions of ONLYOFFICE editors. For ONLYOFFICE Docs, see the [installation instructions](https://api.onlyoffice.com/docs/plugin-and-macros/tutorials/installing/onlyoffice-docs-on-premises/) in the ONLYOFFICE API documentation.

## Usage

1. Start typing. After three letters a list of suggestions appears.
2. Click the word you want, or keep typing to narrow the list.

The plugin runs in the background. You can switch it on and off in the list of background plugins on the Plugins tab.

In the PDF editor a plugin cannot replace text you have typed, so there the suggestion completes the word in the case you typed it: German nouns are not capitalised for you.

## Settings

Click the **Autocomplete** button on the Plugins tab, or right-click in the document and choose **Autocomplete settings**.

| Setting | Meaning | Default |
|---|---|---|
| German | Suggest German words | On |
| English | Suggest English words | On |
| Capitalise German nouns | Suggest `Haus` when you type `hau` | On |
| Letters before suggesting | Letters you type before the suggestions appear, 1 to 6 | 3 |
| Maximum number of suggestions | 1 to 100 | 30 |

The settings are stored in the editor on your device.

## Development

| Path | Content |
|---|---|
| `scripts/code.js` | The background plugin: word lookup, settings, toolbar button and context menu item |
| `settings.html`, `scripts/settings.js` | The settings window |
| `dictionaries/words.txt` | The word list |
| `translations/` | Interface translations |
| `tools/build_words.py` | Builds the word list |
| `deploy/autocomplete.plugin` | The installable package |

`dictionaries/words.txt` lists one word per line, most frequent first. A tab followed by `d` or `e` marks a word as only German or only English. Rebuild it from the sources listed under Credits with:

```
python3 tools/build_words.py
```

After changing the plugin, repack it from the repository root:

```
rm deploy/autocomplete.plugin
zip -r deploy/autocomplete.plugin . -x 'deploy/*' 'tools/*' '.git/*' '.github/*' '.gitignore' 'LICENSE' 'IDEAS.md'
```

### Releasing

Raise the version in `config.json`, describe the changes in `CHANGELOG.md`, then run the **Release** workflow from the Actions tab. It builds the plugin and publishes it as a GitHub release named after the version.

## Credits

* [ONLYOFFICE](https://github.com/ONLYOFFICE/onlyoffice.github.io) - the original Autocomplete plugin (GNU AGPL v3.0).
* [FrequencyWords](https://github.com/hermitdave/FrequencyWords) by Hermit Dave - word frequencies built from OpenSubtitles 2018 (content licensed CC BY-SA 4.0).
* [wordlist-german](https://gist.github.com/MarvinJWendt/2f4f4154b8ae218600eb091a5706b5f4) by Marvin Wendt - German spelling list used to filter the frequency data.
* [english-words](https://github.com/dwyl/english-words) by dwyl - English spelling list used to filter the frequency data (Unlicense).

## License

Like the original, this plugin is licensed under the GNU Affero General Public License v3.0. See [LICENSE](LICENSE) for more information.
