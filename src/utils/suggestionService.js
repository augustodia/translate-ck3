class SuggestionService {
  constructor() {
    this.worker = new Worker(
      new URL("./suggestionWorker.js", import.meta.url),
      { type: "module" }
    );
    this.index = null;
    this.callbacks = new Map();

    this.worker.onmessage = (e) => {
      const { type, data } = e.data;

      switch (type) {
        case "INDEX_CREATED":
          this.index = data.index;
          const callback = this.callbacks.get("indexCreated");
          if (callback) callback();
          break;

        case "SUGGESTIONS_FOUND":
          const suggestionsCallback = this.callbacks.get(
            `suggestions:${data.key}`
          );
          if (suggestionsCallback) {
            suggestionsCallback(data.suggestions);
            this.callbacks.delete(`suggestions:${data.key}`);
          }
          break;
      }
    };
  }

  createIndex(content) {
    const serializedContent = {};
    for (const [fileName, fileContent] of Object.entries(content)) {
      serializedContent[fileName] = {};
      for (const [key, entry] of Object.entries(fileContent)) {
        serializedContent[fileName][key] = {
          value: entry.value,
          isTranslated: entry.isTranslated,
        };
      }
    }

    return new Promise((resolve) => {
      this.callbacks.set("indexCreated", resolve);
      this.worker.postMessage({
        type: "CREATE_INDEX",
        data: { content: serializedContent },
      });
    });
  }

  getSuggestions(key, searchText, maxResults = 3) {
    if (!this.index) return Promise.resolve([]);

    return new Promise((resolve) => {
      this.callbacks.set(`suggestions:${key}`, resolve);
      this.worker.postMessage({
        type: "FIND_SUGGESTIONS",
        data: {
          key,
          searchText,
          index: this.index,
          maxResults,
        },
      });
    });
  }
}

// Singleton instance
export const suggestionService = new SuggestionService();
