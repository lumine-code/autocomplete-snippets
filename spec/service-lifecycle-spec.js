describe("autocomplete-snippets service lifecycle", () => {
  let mainModule;

  beforeEach(async () => {
    await lumine.packages.deactivatePackage("autocomplete-snippets");
    const pack = await lumine.packages.activatePackage("autocomplete-snippets");
    mainModule = pack.mainModule;
  });

  afterEach(async () => {
    await lumine.packages.deactivatePackage("autocomplete-snippets");
  });

  it("restores the previous snippets source when its edge disappears", () => {
    const provider = mainModule.provideAutocomplete();
    const previousSource = provider.snippetsSource;
    const snippets = { snippetsForScopes() {} };
    const disposable = mainModule.consumeSnippets(snippets);

    expect(provider.snippetsSource).toBe(snippets);
    disposable.dispose();
    expect(provider.snippetsSource).toBe(previousSource);
  });

  it("does not resurrect a provider whose edge was disposed out of order", () => {
    const provider = mainModule.provideAutocomplete();
    const defaultSource = provider.snippetsSource;
    const first = { snippetsForScopes() {} };
    const second = { snippetsForScopes() {} };
    const firstEdge = mainModule.consumeSnippets(first);
    const secondEdge = mainModule.consumeSnippets(second);

    expect(provider.snippetsSource).toBe(second);
    firstEdge.dispose();
    expect(provider.snippetsSource).toBe(second);
    secondEdge.dispose();
    expect(provider.snippetsSource).toBe(defaultSource);
  });

  it("restores the remaining provider when the newest edge disappears first", () => {
    const provider = mainModule.provideAutocomplete();
    const defaultSource = provider.snippetsSource;
    const first = { snippetsForScopes() {} };
    const second = { snippetsForScopes() {} };
    const firstEdge = mainModule.consumeSnippets(first);
    const secondEdge = mainModule.consumeSnippets(second);

    secondEdge.dispose();
    expect(provider.snippetsSource).toBe(first);
    firstEdge.dispose();
    expect(provider.snippetsSource).toBe(defaultSource);
  });
});
