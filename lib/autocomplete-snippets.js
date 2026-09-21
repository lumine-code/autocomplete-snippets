module.exports = {
  provider: null,

  activate() {
    this.snippetSources = [];
    this.snippets = null;
  },

  deactivate() {
    this.provider = null;
    this.snippetSources = [];
    this.snippets = null;
  },

  provideAutocomplete() {
    if (this.provider == null) {
      const SnippetsProvider = require("./snippets-provider");
      this.provider = new SnippetsProvider();
      if (this.snippets != null) {
        this.provider.setSnippetsSource(this.snippets);
      }
    }

    return this.provider;
  },

  consumeSnippets(snippets) {
    const entry = { snippets };
    this.snippetSources ||= [];
    this.snippetSources.push(entry);
    this.updateSnippetsSource();
    let disposed = false;
    return {
      dispose: () => {
        if (disposed) return;
        disposed = true;
        const index = this.snippetSources.indexOf(entry);
        if (index >= 0) this.snippetSources.splice(index, 1);
        this.updateSnippetsSource();
      },
    };
  },

  updateSnippetsSource() {
    this.snippets = this.snippetSources?.at(-1)?.snippets ?? null;
    if (this.provider) {
      this.provider.setSnippetsSource(this.snippets ?? this.provider.defaultSnippetsSource);
    }
  },
};
