// Serviços de tradução automática
export const TRANSLATION_SERVICES = {
  LIBRE: "libre",
  LINGVA: "lingva",
};

export async function translateText(
  text,
  targetLanguage = "pt",
  service = TRANSLATION_SERVICES.LINGVA
) {
  const libreTranslateUrl = "https://libretranslate.de";
  const lingvaTranslateUrl = "https://lingva.ml";

  async function translateWithLibre(text, targetLanguage) {
    try {
      const response = await fetch(`${libreTranslateUrl}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: text,
          source: "en",
          target: targetLanguage,
          format: "text",
        }),
      });

      const data = await response.json();
      if (data.translatedText) {
        return {
          value: data.translatedText,
          isAutoTranslated: true,
        };
      }
      throw new Error("Falha ao traduzir texto");
    } catch (error) {
      console.error("Erro na tradução (Libre):", error);
      return null;
    }
  }

  async function translateWithLingva(text, targetLanguage) {
    try {
      const response = await fetch(
        `${lingvaTranslateUrl}/api/v1/en/${targetLanguage}/${encodeURIComponent(
          text
        )}`
      );

      const data = await response.json();
      if (data.translation) {
        return {
          value: data.translation,
          isAutoTranslated: true,
        };
      }
      throw new Error("Falha ao traduzir texto");
    } catch (error) {
      console.error("Erro na tradução (Lingva):", error);
      return null;
    }
  }

  // Tenta primeiro o serviço configurado
  let result = null;

  if (service === TRANSLATION_SERVICES.LIBRE) {
    result = await translateWithLibre(text, targetLanguage);
    if (!result) {
      result = await translateWithLingva(text, targetLanguage);
    }
  } else {
    result = await translateWithLingva(text, targetLanguage);
    if (!result) {
      result = await translateWithLibre(text, targetLanguage);
    }
  }

  return result;
}
