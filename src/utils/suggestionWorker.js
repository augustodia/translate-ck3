// Web Worker para processar sugestões
const createSearchIndex = (content) => {
  const index = {};
  const wordMap = new Map();

  // Processa cada arquivo e suas traduções
  for (const [fileName, fileContent] of Object.entries(content)) {
    for (const [key, entry] of Object.entries(fileContent)) {
      if (entry.isTranslated && entry.value) {
        // Normaliza o texto para indexação
        const normalizedValue = entry.value.toLowerCase();

        // Extrai palavras significativas (ignora palavras comuns e códigos)
        const words = normalizedValue.split(/\s+/).filter(
          (word) =>
            word.length > 3 &&
            !word.includes("|") &&
            !word.includes("(") &&
            !word.startsWith("get") &&
            !word.match(/^\d+$/) // ignora números
        );

        // Cria um identificador único para esta tradução
        const translationId = `${fileName}:${key}`;

        // Armazena a tradução completa
        if (!index.translations) {
          index.translations = {};
        }
        index.translations[translationId] = {
          key,
          value: entry.value,
          fileName,
          words: new Set(words),
        };

        // Indexa por palavras
        words.forEach((word) => {
          if (!index.words) {
            index.words = {};
          }
          if (!index.words[word]) {
            index.words[word] = new Set();
          }
          index.words[word].add(translationId);
        });
      }
    }
  }

  return index;
};

const findSimilarTranslations = (searchText, index, maxResults = 3) => {
  if (!searchText?.trim() || !index?.translations || !index?.words) return [];

  const searchWords = new Set(
    searchText
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 &&
          !word.includes("|") &&
          !word.includes("(") &&
          !word.startsWith("get") &&
          !word.match(/^\d+$/)
      )
  );

  if (searchWords.size === 0) return [];

  const scores = new Map();

  // Calcula similaridade usando palavras significativas
  for (const searchWord of searchWords) {
    // Encontra palavras similares no índice
    const similarWords = Object.keys(index.words).filter(
      (indexWord) =>
        indexWord.includes(searchWord) || searchWord.includes(indexWord)
    );

    for (const word of similarWords) {
      const translations = index.words[word];
      if (!translations) continue;

      for (const translationId of translations) {
        const translation = index.translations[translationId];
        if (!translation) continue;

        // Calcula pontuação baseada em vários fatores
        let score = 0;

        // Palavras em comum
        const commonWords = [...searchWords].filter((w) =>
          translation.words.has(w)
        );
        score +=
          (commonWords.length /
            Math.max(searchWords.size, translation.words.size)) *
          3;

        // Bônus para correspondências exatas de palavras
        if (commonWords.length > 0) {
          score += commonWords.length * 0.5;
        }

        // Penalidade para diferenças muito grandes de tamanho
        const lengthDiff = Math.abs(
          searchText.length - translation.value.length
        );
        score -= lengthDiff / 100;

        // Penalidade para traduções com códigos se o texto original não tem
        if (!searchText.includes("|") && translation.value.includes("|")) {
          score -= 1;
        }

        scores.set(translationId, {
          ...translation,
          score: (scores.get(translationId)?.score || 0) + score,
        });
      }
    }
  }

  // Filtra e ordena os resultados
  return Array.from(scores.values())
    .filter((item) => item.score > 1) // Remove sugestões com pontuação muito baixa
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
};

// Escuta mensagens do thread principal
self.addEventListener("message", (e) => {
  const { type, data } = e.data;

  switch (type) {
    case "CREATE_INDEX":
      const index = createSearchIndex(data.content);
      self.postMessage({
        type: "INDEX_CREATED",
        data: { index },
      });
      break;

    case "FIND_SUGGESTIONS":
      const suggestions = findSimilarTranslations(
        data.searchText,
        data.index,
        data.maxResults
      );
      self.postMessage({
        type: "SUGGESTIONS_FOUND",
        data: {
          key: data.key,
          suggestions,
        },
      });
      break;
  }
});
