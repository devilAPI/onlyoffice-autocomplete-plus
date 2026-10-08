#!/usr/bin/env python3
"""Builds dictionaries/words.txt: German and English words, most frequent first.

A word is kept if it is in a spelling list (which filters typos out of the
frequency data) and frequent enough. German nouns and names keep their capital
letter unless the word is more common in English.

Run from the plugin directory: python3 tools/build_words.py
"""
import re
import urllib.request

SPELLING = {
    "de": "https://gist.github.com/MarvinJWendt/2f4f4154b8ae218600eb091a5706b5f4/raw/36b70dd6be330aa61cd4d4cdfda6234dcb0b8784/wordlist-german.txt",
    "en": "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt",
}
FREQUENCY = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/%s/%s_full.txt"
# minimal number of occurrences in the frequency corpus
MIN_COUNT = {"de": 3, "en": 10}
# the plugin starts suggesting after three typed letters
WORD = re.compile(r"^[a-zäöüß]{4,}$")


def lines(url):
    with urllib.request.urlopen(url) as response:
        return response.read().decode("utf-8").splitlines()


def main():
    forms = {}  # lower-case word -> spellings found in the spelling lists
    score = {"de": {}, "en": {}}  # occurrences per million words
    for lang in ("de", "en"):
        valid = set()
        for line in lines(SPELLING[lang]):
            word = line.strip()
            if WORD.match(word.lower()):
                valid.add(word.lower())
                if lang == "de":
                    forms.setdefault(word.lower(), set()).add(word)

        rows = [line.split() for line in lines(FREQUENCY % (lang, lang))]
        rows = [(row[0], int(row[1])) for row in rows if len(row) == 2]
        total = sum(count for _, count in rows) / 1e6
        for word, count in rows:
            if count >= MIN_COUNT[lang] and word in valid:
                score[lang][word] = count / total

    def display(word):
        de, en = score["de"].get(word, 0), score["en"].get(word, 0)
        if de >= en and word not in forms[word]:
            return sorted(forms[word])[0]
        return word

    words = set(score["de"]) | set(score["en"])
    order = sorted(words, key=lambda w: (-max(score["de"].get(w, 0), score["en"].get(w, 0)), w))
    with open("dictionaries/words.txt", "w", encoding="utf-8") as output:
        output.write("\n".join(display(word) for word in order))
    print("%d words (%d German, %d English)" % (len(order), len(score["de"]), len(score["en"])))


if __name__ == "__main__":
    main()
