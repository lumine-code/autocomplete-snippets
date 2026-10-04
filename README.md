# autocomplete-snippets

Adds snippets to autocomplete suggestions.

> [!WARNING]
> **This package is deprecated.** Snippet completion now ships with [snippets](https://github.com/lumine-code/snippets). This repository is archived and no longer maintained.

## Features

- **Snippet suggestions**: adds user and language snippets to the autocomplete list.
- **Snippet expansion**: expands the selected snippet with its tab stops in place.

## Migration

Disable or uninstall `autocomplete-snippets` and keep `snippets` enabled. Install `autocomplete` to display suggestions. The `snippets.enableAutocomplete` setting controls suggestions independently of prefix expansion.

## Services

- `autocomplete.provider`: provided to supply snippet suggestions to autocomplete.
- `snippets`: consumed to read the available snippets to build suggestions.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
