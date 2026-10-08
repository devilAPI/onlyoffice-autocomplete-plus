# Autocomplete plugin

This plugin is an example of an input assistant for ONLYOFFICE editors.

The plugin is compatible with [self-hosted](https://github.com/ONLYOFFICE/DocumentServer) and [desktop](https://github.com/ONLYOFFICE/DesktopEditors) versions of ONLYOFFICE editors. It can be added to ONLYOFFICE instances manually.

## How to use

1. Start typing and the plugin will suggest German and English variants for you, the most common words first. 
2. Click on the variant you want to be inserted into your doc.

Please note that it is the system plugin so that's OK that you can't see it in the Plugins tab. 

## How to install

Detailed instructions can be found in [ONLYOFFICE API documentation](https://api.onlyoffice.com/docs/plugin-and-macros/tutorials/installing/onlyoffice-docs-on-premises/).

## Documentation

Plugins structure and installation https://api.onlyoffice.com/docs/plugin-and-macros/get-started/overview/.

Plugins code and methods https://api.onlyoffice.com/docs/document-builder/get-started/overview/.

## Third-party

- [FrequencyWords](https://github.com/hermitdave/FrequencyWords) - Word frequency lists built from OpenSubtitles 2018 (content CC BY-SA 4.0)
- [wordlist-german](https://gist.github.com/MarvinJWendt/2f4f4154b8ae218600eb091a5706b5f4) - A text file containing 1.9 million German words
- [english-words](https://github.com/dwyl/english-words) - A text file containing 370k+ English words (Unlicense)

`dictionaries/words.txt` is built from these lists with `tools/build_words.py`.

## User feedback and support

To ask questions and share feedback, use Issues in this repository.
