describe("AutocompleteSnippets", () => {
  let [completionDelay, editor, editorView] = [];

  beforeEach(() => {
    lumine.config.set("autocomplete.enableAutoActivation", true);
    completionDelay = 100;
    lumine.config.set("autocomplete.autoActivationDelay", completionDelay);
    completionDelay += 100; // Rendering delay

    const workspaceElement = lumine.views.getView(lumine.workspace);
    jasmine.attachToDOM(workspaceElement);

    let autocompleteSnippetsMainModule = null;
    let snippetsMainModule = null;

    waitsForPromise(() =>
      Promise.all([
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
      ]),
    );

    waitsFor(
      "snippets provider to be registered",
      1000,
      () => autocompleteSnippetsMainModule.provider != null,
    );

    waitsFor("all snippets to load", 3000, () => snippetsMainModule.loaded);
  });

  describe("when autocomplete is enabled", () => {
    it("shows autocompletions when there are snippets available", () => {
      runs(() => {
        expect(editorView.querySelector(".autocomplete")).not.toExist();

        editor.moveToBottom();
        editor.insertText("D");
        editor.insertText("o");

        advanceClock(completionDelay);
      });

      waitsFor("autocomplete view to appear", 1000, () =>
        editorView.querySelector(".autocomplete span.word"),
      );

      runs(() => {
        expect(editorView.querySelector(".autocomplete span.word")).toHaveText("do");
        expect(editorView.querySelector(".autocomplete span.right-label")).toHaveText("do");
      });
    });

    it("expands the snippet on confirm", () => {
      runs(() => {
        expect(editorView.querySelector(".autocomplete")).not.toExist();

        editor.moveToBottom();
        editor.insertText("D");
        editor.insertText("o");

        advanceClock(completionDelay);
      });

      waitsFor("autocomplete view to appear", 1000, () =>
        editorView.querySelector(".autocomplete span.word"),
      );

      runs(() => {
        lumine.commands.dispatch(editorView, "autocomplete:confirm");
        expect(editor.getText()).toContain("} while (true)");
      });
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
