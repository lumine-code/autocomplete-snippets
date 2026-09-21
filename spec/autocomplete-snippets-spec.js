const path = require("path");

const WORKSPACE_ROOT = path.join(__dirname, "..", "..");
const packagePath = (name) => path.join(WORKSPACE_ROOT, name);

describe("AutocompleteSnippets", () => {
  let [autocompleteSnippetsMainModule, completionDelay, editor, editorView, snippetsMainModule] =
    [];

  beforeEach(async () => {
    lumine.config.set("autocomplete.enableAutoActivation", true);
    completionDelay = 100;
    lumine.config.set("autocomplete.autoActivationDelay", completionDelay);
    completionDelay += 100; // Rendering delay

    const workspaceElement = lumine.views.getView(lumine.workspace);
    jasmine.attachToDOM(workspaceElement);

    autocompleteSnippetsMainModule = null;
    snippetsMainModule = null;

    await Promise.all([
      lumine.workspace.open("sample.js").then((e) => {
        editor = e;
        editorView = lumine.views.getView(editor);
      }),

      lumine.packages.activatePackage(packagePath("language-javascript")),
      lumine.packages
        .activatePackage(packagePath("autocomplete-snippets"))
        .then(({ mainModule }) => (autocompleteSnippetsMainModule = mainModule)),

      lumine.packages.activatePackage(packagePath("autocomplete")),
      lumine.packages.activatePackage(packagePath("snippets")).then(({ mainModule }) => {
        snippetsMainModule = mainModule;
      }),
    ]);

    await conditionPromise(
      () => autocompleteSnippetsMainModule.provider != null,
      "snippets provider to be registered",
    );

    // Package activation readiness includes the complete async snippet scan and
    // publication of the snippets service to this consumer.
    expect(snippetsMainModule.loaded).toBe(true);
    expect(autocompleteSnippetsMainModule.provider.snippetsSource).not.toBe(
      autocompleteSnippetsMainModule.provider.defaultSnippetsSource,
    );
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
