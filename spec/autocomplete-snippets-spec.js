describe("AutocompleteSnippets", () => {
  let [completionDelay, editor, editorView] = [];

  beforeEach(async () => {
    lumine.config.set("autocomplete.enableAutoActivation", true);
    completionDelay = 100;
    lumine.config.set("autocomplete.autoActivationDelay", completionDelay);
    completionDelay += 100; // Rendering delay

    const workspaceElement = lumine.views.getView(lumine.workspace);
    jasmine.attachToDOM(workspaceElement);

    let autocompleteSnippetsMainModule = null;
    let snippetsMainModule = null;

    await Promise.all([
      lumine.workspace.open("sample.js").then((e) => {
        editor = e;
        editorView = lumine.views.getView(editor);
      }),

      lumine.packages.activatePackage("language-javascript"),
      lumine.packages
        .activatePackage("autocomplete-snippets")
        .then(({ mainModule }) => (autocompleteSnippetsMainModule = mainModule)),

      lumine.packages.activatePackage("autocomplete"),
      lumine.packages.activatePackage("snippets").then(({ mainModule }) => {
        snippetsMainModule = mainModule;
        snippetsMainModule.loaded = false;
      }),
    ]);

    await conditionPromise(
      () => autocompleteSnippetsMainModule.provider != null,
      "snippets provider to be registered",
    );

    await conditionPromise(() => snippetsMainModule.loaded, "all snippets to load");
  });

  describe("when autocomplete is enabled", () => {
    it("shows autocompletions when there are snippets available", async () => {
      expect(editorView.querySelector(".autocomplete")).not.toExist();

      editor.moveToBottom();
      editor.insertText("D");
      editor.insertText("o");

      advanceClock(completionDelay);

      await conditionPromise(
        () => editorView.querySelector(".autocomplete span.word"),
        "autocomplete view to appear",
      );

      expect(editorView.querySelector(".autocomplete span.word")).toHaveText("do");
      expect(editorView.querySelector(".autocomplete span.right-label")).toHaveText("do");
    });

    it("expands the snippet on confirm", async () => {
      expect(editorView.querySelector(".autocomplete")).not.toExist();

      editor.moveToBottom();
      editor.insertText("D");
      editor.insertText("o");

      advanceClock(completionDelay);

      await conditionPromise(
        () => editorView.querySelector(".autocomplete span.word"),
        "autocomplete view to appear",
      );

      lumine.commands.dispatch(editorView, "autocomplete:confirm");
      expect(editor.getText()).toContain("} while (true)");
    });
  });

  describe("when showing suggestions", () =>
    it("sorts them in alphabetical order", () => {
      const unorderedPrefixes = ["", "dop", "do", "dad", "d"];

      const snippets = {};
      for (let x of Array.from(unorderedPrefixes)) {
        snippets[x] = { prefix: x, name: "", description: "", descriptionMoreURL: "" };
      }

      const SnippetsProvider = require("../lib/snippets-provider");
      const sp = new SnippetsProvider();
      sp.setSnippetsSource({
        snippetsForScopes(_scope) {
          return snippets;
        },
      });
      const suggestions = sp.getSuggestions({ scopeDescriptor: "", prefix: "d" });

      const suggestionsText = suggestions.map((x) => x.text);
      expect(suggestionsText).toEqual(["d", "dad", "do", "dop"]);
    }));
});
