# Ideas

Possible features, roughly in order of usefulness.

## Most useful day to day

* **Learn from use** - words you accept move up the ranking, so the list adapts to how you write.
* **Learn from the document** - suggest words that already appear in the open document, which catches technical terms and names the word list does not have.

## Better suggestions

* **Next-word prediction** - after you finish a word, suggest the likely next one ("vielen" → "Dank"). Needs word-pair frequency data, which is a bigger word-list rebuild.
* **Typo tolerance** - still suggest "Geschichte" when you type "Geshci". Needs a fuzzy lookup; the hardest item here.
* **Automatic language detection** - look at the last few typed words and prefer that language instead of mixing both.
* **Formal vocabulary** - the ranking comes from film subtitles, so it leans conversational. Blending in a news or Wikipedia frequency list would suit school and work writing better.

## More settings

* **Minimum word length** - only suggest words that save at least a few keystrokes.
* **Pause shortcut** - a key or toolbar toggle to switch suggestions off temporarily without opening the background-plugins list.
* **More languages** - the build script already takes a language pair; French or Spanish would mostly be new word lists plus a checkbox each.

## Project housekeeping

* **Smaller, faster load** - the word list is about 3 MB and is parsed on every start; a compact prebuilt format would cut the startup delay.
* **Tests in the release workflow** - turn the lookup and settings checks into a test step so a broken build cannot be released.
* **Plugin Manager listing** - offer the fork upstream or host a store entry, so it installs without downloading a file.
