import { defineStore } from "pinia";

export const useRecentFilesStore = defineStore("recentFiles", {
  state: () => ({
    recentFiles: [],
    maxFiles: 5,
  }),

  actions: {
    addFile(fileName, content) {
      // Remove o arquivo se já existir para evitar duplicatas
      this.recentFiles = this.recentFiles.filter(
        (file) => file.fileName !== fileName
      );

      // Adiciona o novo arquivo no início da lista
      this.recentFiles.unshift({
        fileName,
        content,
        lastOpened: new Date().toISOString(),
      });

      // Mantém apenas os últimos maxFiles arquivos
      if (this.recentFiles.length > this.maxFiles) {
        this.recentFiles = this.recentFiles.slice(0, this.maxFiles);
      }

      // Salva no localStorage
      this.saveToLocalStorage();
    },

    clearFiles() {
      this.recentFiles = [];
      localStorage.removeItem("recentFiles");
    },

    loadFromLocalStorage() {
      const saved = localStorage.getItem("recentFiles");
      if (saved) {
        this.recentFiles = JSON.parse(saved);
      }
    },

    saveToLocalStorage() {
      localStorage.setItem("recentFiles", JSON.stringify(this.recentFiles));
    },
  },
});
