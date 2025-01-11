export const findSimilarTranslations = (
  currentKey,
  currentValue,
  allContent
) => {
  const suggestions = [];
  const threshold = 0.7; // Limiar de similaridade

  // Função para calcular a similaridade entre duas strings
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const costs = new Array(shorter.length + 1);
    for (let i = 0; i <= shorter.length; i++) {
      costs[i] = i;
    }

    let currentValue;
    for (let i = 1; i <= longer.length; i++) {
      let previousValue = i;
      costs[0] = i;

      for (let j = 1; j <= shorter.length; j++) {
        if (longer[i - 1] === shorter[j - 1]) {
          currentValue = costs[j - 1];
        } else {
          currentValue = Math.min(
            costs[j - 1] + 1, // substituição
            costs[j] + 1, // inserção
            previousValue + 1 // deleção
          );
        }
        costs[j - 1] = previousValue;
        previousValue = currentValue;
      }
      costs[shorter.length] = currentValue;
    }

    return (longer.length - currentValue) / parseFloat(longer.length);
  };

  // Percorre todos os arquivos e suas traduções
  for (const [fileName, fileContent] of Object.entries(allContent)) {
    for (const [key, entry] of Object.entries(fileContent)) {
      // Pula a entrada atual
      if (key === currentKey) continue;

      // Verifica apenas entradas já traduzidas
      if (entry.isTranslated) {
        const similarity = calculateSimilarity(currentValue, entry.value);

        if (similarity >= threshold) {
          suggestions.push({
            key,
            value: entry.value,
            similarity,
            fileName,
          });
        }
      }
    }
  }

  // Ordena as sugestões por similaridade (mais similares primeiro)
  return suggestions.sort((a, b) => b.similarity - a.similarity);
};

export const getSuggestions = (
  currentKey,
  currentValue,
  allContent,
  maxSuggestions = 3
) => {
  const suggestions = findSimilarTranslations(
    currentKey,
    currentValue,
    allContent
  );
  return suggestions.slice(0, maxSuggestions);
};
