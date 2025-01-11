export class ValidationError extends Error {
  constructor(message, type) {
    super(message);
    this.name = "ValidationError";
    this.type = type;
  }
}

export const validateZipFile = async (file) => {
  // Validação básica do arquivo ZIP
  if (!file) {
    throw new ValidationError("Nenhum arquivo selecionado.", "NO_FILE");
  }

  if (!file.name.endsWith(".zip")) {
    throw new ValidationError(
      "O arquivo deve ser do tipo ZIP.",
      "INVALID_TYPE"
    );
  }

  if (file.size > 50 * 1024 * 1024) {
    // 50MB
    throw new ValidationError(
      "O arquivo é muito grande. Limite de 50MB.",
      "FILE_TOO_LARGE"
    );
  }

  return true;
};

export const validateYamlContent = (content) => {
  try {
    // No nosso caso, o conteúdo já está no formato correto
    // Não precisamos validar a estrutura YAML pois estamos lidando
    // com o objeto já processado
    if (typeof content !== "object" || content === null) {
      throw new ValidationError(
        "Conteúdo inválido: deve ser um objeto.",
        "INVALID_CONTENT_STRUCTURE"
      );
    }

    return true;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      `Erro ao validar conteúdo: ${error.message}`,
      "CONTENT_VALIDATION_ERROR"
    );
  }
};

export const createBackup = async (content, fileName) => {
  const now = new Date();
  const timestamp = now.toISOString();
  const backupData = {
    content,
    timestamp,
    fileName,
    version: "1.0",
  };

  try {
    // Salva no localStorage com rotação de backups (mantém últimos 5)
    const backupKey = `translation_backup_${fileName}_${now.getTime()}`;
    const backupsList = JSON.parse(
      localStorage.getItem("translation_backups") || "[]"
    );

    // Adiciona novo backup
    backupsList.unshift(backupKey);

    // Mantém apenas os últimos 5 backups por arquivo
    const fileBackups = backupsList.filter((key) => key.includes(fileName));
    if (fileBackups.length > 5) {
      const toRemove = fileBackups.slice(5);
      await Promise.all(
        toRemove.map(async (key) => {
          localStorage.removeItem(key);
          const index = backupsList.indexOf(key);
          if (index > -1) {
            backupsList.splice(index, 1);
          }
        })
      );
    }

    // Salva o backup e a lista atualizada
    await Promise.all([
      localStorage.setItem(backupKey, JSON.stringify(backupData)),
      localStorage.setItem("translation_backups", JSON.stringify(backupsList)),
    ]);

    return backupKey;
  } catch (error) {
    console.error("Erro ao criar backup:", error);
    throw new ValidationError(
      "Não foi possível criar o backup.",
      "BACKUP_ERROR"
    );
  }
};

export const restoreBackup = async (key) => {
  try {
    const backupData = localStorage.getItem(key);
    if (!backupData) {
      throw new Error("Backup não encontrado");
    }

    const parsedData = JSON.parse(backupData);
    console.log("Dados do backup recuperados:", parsedData);

    if (!parsedData?.content) {
      throw new Error("Dados do backup inválidos");
    }

    return parsedData.content;
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    throw error;
  }
};

export const listBackups = async (fileName) => {
  try {
    const backupsList = JSON.parse(
      localStorage.getItem("translation_backups") || "[]"
    );
    const backups = await Promise.all(
      backupsList
        .filter((key) => key.includes(fileName))
        .map(async (key) => {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          return {
            key,
            timestamp: data.timestamp,
            fileName: data.fileName,
          };
        })
    );

    return backups.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  } catch (error) {
    console.error("Erro ao listar backups:", error);
    return [];
  }
};
