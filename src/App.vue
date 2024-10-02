<!-- src/App.vue -->
<template>
  <div id="app">
    <h1>Tradutor CK3</h1>
    <div v-if="!filesLoaded" class="file-inputs">
      <div>
        <label for="prevTranslationZip">Tradução Anterior (desatualizada):</label>
        <span style="font-size:14px; width: 280px; display: block; line-height: 18px; color: #6f6f6f;">
          .zip da tradução não original. Compacte a pasta dalíngua desejada que está emlocalization/replace
        </span>
        <input type="file" id="prevTranslationZip" @change="handlePrevTranslationUpload" accept=".zip"
          style="margin-top: 8px;" />
      </div>
      <div>
        <label for="updatedOriginalZip">Tradução Original do jogo (atualizada):</label>
        <span style="font-size:14px; width: 280px; display: block; line-height: 18px; color: #6f6f6f;">
          .zip da tradução original do jogo para comparação. Compacte a pasta da língua desejada que está em
          localization
        </span>
        <input type="file" id="updatedOriginalZip" @change="handleUpdatedOriginalUpload" accept=".zip"
          style="margin-top: 8px;" />
      </div>
    </div>

    <div v-if="loading" style="display: flex; justify-content: center; align-items: center;">
      <div class="lds-dual-ring"></div>
    </div>

    <div v-if="filesLoaded" class="main-content">
      <Sidebar :rootNode="rootNode" @select-file="selectFile" />
      <div class="content-area">
        <button @click="exportFiles"
          style="right: 50px;position: absolute; background-color: #16915e; color: white; padding: 8px;">Exportar
          Arquivos
          Traduzidos</button>
        <div v-if="selectedFile">
          <TranslationForm :fileName="selectedFile" :content="mergedContent[selectedFile]"
            @update-content="updateContent" />
        </div>
        <div v-else>
          <p>Selecione um arquivo na barra lateral para começar a traduzir.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Resto do script permanece o mesmo -->

<script>
import { nextTick, ref, watch } from "vue";
import JSZip from "jszip";
import TreeNode from "./utils/TreeNode";
import { saveAs } from "file-saver";
import TranslationForm from "./components/TranslationForm.vue";
import Sidebar from "./components/Sidebar.vue"; // Novo componente

export default {
  name: "App",
  components: {
    TranslationForm,
    Sidebar,
  },
  setup() {
    const prevTranslationContent = ref({});
    const updatedOriginalContent = ref({});
    const mergedContent = ref({});
    const rootNode = ref(new TreeNode('/', '', true));
    const prevTranslationZipName = ref('arquivos_traduzidos.zip');
    const filesLoaded = ref(false);
    const selectedFile = ref(null);
    const languageCode = ref('');
    const loading = ref(false);

    const handlePrevTranslationUpload = async (event) => {
      const file = event.target.files[0];
      if (file && file.name.endsWith('.zip')) {
        loading.value = true
        const zip = await JSZip.loadAsync(file);
        prevTranslationZipName.value = file.name; // Armazenar o nome do arquivo ZIP
        await extractFiles(zip, prevTranslationContent);
        // Após extrair os arquivos, obtenha o código da língua
        extractLanguageCodeFromPrevTranslation();
        checkIfBothFilesLoaded();
        loading.value = false
      } else {
        alert('Por favor, selecione um arquivo ZIP válido para a Tradução Anterior.');
      }
    };

    const extractLanguageCodeFromPrevTranslation = () => {
      for (const content of Object.values(prevTranslationContent.value)) {
        if (content && content.languageCode) {
          languageCode.value = content.languageCode;
          break;
        }
      }

      if (!languageCode.value) {
        prevTranslationContent.value = {}; // Limpar o conteúdo da tradução anterior
        alert('Não foi possível encontrar o código da língua na tradução atual (desatualizada).');
      }
    };


    const handleUpdatedOriginalUpload = async (event) => {
      const file = event.target.files[0];
      if (file && file.name.endsWith('.zip')) {
        loading.value = true
        const zip = new JSZip();
        const content = await file.arrayBuffer();
        const zipContent = await zip.loadAsync(content);
        await extractFiles(zipContent, updatedOriginalContent);
        checkIfBothFilesLoaded();
        loading.value = false
      } else {
        alert('Por favor, selecione um arquivo ZIP válido para a Tradução Original Atualizada.');
      }
    };

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (file && file.name.endsWith(".zip")) {
        const zip = new JSZip();
        const content = await file.arrayBuffer();
        const zipContent = await zip.loadAsync(content);
        await buildFileTree(zipContent);
        filesLoaded.value = true;
      } else {
        alert("Por favor, selecione um arquivo ZIP válido.");
      }
    };

    const checkIfBothFilesLoaded = () => {
      if (
        Object.keys(prevTranslationContent.value).length > 0 &&
        Object.keys(updatedOriginalContent.value).length > 0
      ) {
        mergeContents();
        buildFileTree();
        filesLoaded.value = true;
      }
    };

    const extractFiles = async (zip, contentObj) => {
      const filePromises = [];

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir && zipEntry.name.endsWith('.yml')) {
          const promise = zipEntry.async('string').then((data) => {
            const parsedData = parseTranslationFileStream(data);
            const normalizedFilename = normalizeFilename(zipEntry.name);
            contentObj.value[normalizedFilename] = {
              entries: parsedData.entries,
              languageCode: parsedData.languageCode,
            };
          });
          filePromises.push(promise);
        }
      });

      await Promise.all(filePromises);
    };

    const mergeContents = () => {
      mergedContent.value = {}; // Reiniciar o conteúdo mesclado

      // Obter todos os nomes de arquivos normalizados presentes em ambas as traduções
      const allFileNames = new Set([
        ...Object.keys(prevTranslationContent.value),
        ...Object.keys(updatedOriginalContent.value),
      ]);

      for (const fileName of allFileNames) {
        const prevFileContent = prevTranslationContent.value[fileName]?.entries || {};
        const originalFileContent = updatedOriginalContent.value[fileName]?.entries || {};

        const mergedFileContent = {};

        const allKeys = new Set([
          ...Object.keys(prevFileContent),
          ...Object.keys(originalFileContent),
        ]);

        for (const key of allKeys) {
          const prevValue = prevFileContent[key];
          const originalValue = originalFileContent[key];

          const isNew = prevValue === undefined && originalValue !== undefined;

          // Usar a tradução anterior se disponível, caso contrário, string vazia
          const value = prevValue !== undefined ? prevValue : originalValue;

          mergedFileContent[key] = {
            value,
            isTranslated: !isNew,
          };
        }

        mergedContent.value[fileName] = mergedFileContent;
      }
    };

    const buildFileTree = () => {
      rootNode.value = new TreeNode('/', '', true); // Reiniciar a árvore

      for (const fileName in mergedContent.value) {
        const pathParts = fileName.split('/');
        let currentNode = rootNode.value;

        for (let i = 0; i < pathParts.length; i++) {
          const part = pathParts[i];
          const isDirectory = i < pathParts.length - 1;
          let existingNode = currentNode.children.find(
            (child) => child.name === part && child.isDirectory === isDirectory
          );

          if (!existingNode) {
            existingNode = new TreeNode(
              part,
              pathParts.slice(0, i + 1).join('/'),
              isDirectory
            );
            currentNode.children.push(existingNode);
          }

          currentNode = existingNode;
        }

        // Adicionar contador de novas chaves e verificar pendências
        if (!currentNode.isDirectory) {
          const { newKeysCount, hasPending } = countNewKeysInFile(mergedContent.value[fileName]);
          currentNode.newKeysCount = newKeysCount;
          currentNode.hasPending = hasPending;
        }
      }

      // Função recursiva corrigida para propagar hasPending para pastas
      const updateFolderPendingStatus = (node) => {
        if (node.isDirectory) {
          // Primeiro, atualize hasPending para todos os filhos
          node.children.forEach((child) => {
            updateFolderPendingStatus(child);
          });
          // Em seguida, defina node.hasPending com base no hasPending dos filhos
          node.hasPending = node.children.some((child) => child.hasPending);
        }
      };

      updateFolderPendingStatus(rootNode.value);
    };



    const countNewKeysInFile = (fileContent) => {
      let newKeysCount = 0;
      let hasPending = false;

      for (const key in fileContent) {
        if (!fileContent[key].isTranslated) {
          newKeysCount++;
          if (!fileContent[key].isTranslated) {
            hasPending = true;
          }
        }
      }

      return { newKeysCount, hasPending };
    };


    const normalizeFilename = (filename) => {
      // Dividir o nome do arquivo em partes
      const parts = filename.split('/');
      // Remover o diretório de língua se estiver presente
      if (parts.length > 1 && parts[0].match(/^[a-z]+$/)) {
        parts.shift();
      }
      // Obter o nome do arquivo
      let basename = parts.pop();
      // Remover '_l_' seguido por qualquer sequência de letras
      basename = basename.replace(/_l_[a-z]+/, '');
      parts.push(basename);
      return parts.join('/');
    };


    const parseTranslationFileStream = (data) => {
      const lines = data.split(/\r?\n/);
      const result = { entries: {}, languageCode: '' };
      let insideRootKey = false;

      for (let line of lines) {
        line = line.trim();

        // Ignorar linhas vazias
        if (!line) {
          continue;
        }

        // Ignorar linhas que começam com '#' (comentários)
        if (line.startsWith('#')) {
          continue;
        }

        // Verificar se é a chave raiz (ex: l_english:)
        const rootKeyMatch = line.match(/^l_(\w+):$/);
        if (rootKeyMatch) {
          result.languageCode = rootKeyMatch[1];
          insideRootKey = true;
          continue;
        }

        if (!insideRootKey) {
          continue
        }

        // Dividir a linha no primeiro dois pontos
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
          console.warn(`Linha ${lineNumber}: Não foi encontrado ':' - ${line}`);
          continue;
        }

        const keyPart = line.substring(0, colonIndex).trim();
        let rest = line.substring(colonIndex + 1).trim();

        // Extrair número opcional após os dois pontos
        const numberMatch = rest.match(/^(\d+)\s*/);
        if (numberMatch) {
          rest = rest.substring(numberMatch[0].length).trim();
        }

        // Verificar se o restante começa com aspas
        if (rest.startsWith('"')) {
          // Verificar se há uma aspa de fechamento na mesma linha
          const closingQuoteIndex = rest.indexOf('"', 1); // Iniciar a busca a partir do índice 1
          if (closingQuoteIndex !== -1) {
            // Capturar o valor até a aspa de fechamento
            const value = rest.substring(1, closingQuoteIndex);
            result.entries[keyPart] = value;
            // Ignorar qualquer coisa após a aspa de fechamento
          } else {
            // Erro: Não foi encontrada a aspa de fechamento na mesma linha
            console.warn(`Linha ${lineNumber}: Não foi encontrada a aspa de fechamento para a chave '${keyPart}'`);
          }
        } else if (rest === '') {
          // Valor vazio
          result.entries[keyPart] = '';
        } else {
          // Valor sem aspas
          result.entries[keyPart] = rest;
        }
      }

      return result;
    };


    const reconstructFilename = (normalizedFilename, languageCode) => {
      // Adicionar o diretório de língua no início
      const parts = normalizedFilename.split('/');
      parts.unshift(languageCode); // Adicionar o código da língua no início

      // Obter o nome do arquivo
      let basename = parts.pop();

      // Adicionar '_l_languagecode' ao nome do arquivo
      const newBasename = basename.replace(/\.yml$/, `_l_${languageCode}.yml`);

      parts.push(newBasename);

      return parts.join('/');
    };

    const stringifyTranslationFile = (content, languageCode) => {
      let result = `l_${languageCode}:\n`;
      for (const [key, entry] of Object.entries(content)) {
        if (entry.isTranslated) {
          result += ` ${key}:0 "${entry.value}"\n`;
        }
      }
      return result;
    };

    const exportFiles = async () => {
      loading.value = true
      try {
        const zip = new JSZip();

        for (const [normalizedFilename, content] of Object.entries(mergedContent.value)) {
          // Reconstruir o nome do arquivo com o código da língua extraído
          const outputFilename = reconstructFilename(normalizedFilename, languageCode.value);

          const fileContent = stringifyTranslationFile(content, languageCode.value);
          zip.file(outputFilename, fileContent);
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, prevTranslationZipName.value); // Usar o mesmo nome do arquivo ZIP original
      } finally {
        loading.value = false
      }
    };


    const selectFile = (filePath) => {
      selectedFile.value = filePath;
    };

    const updateContent = (newContent) => {
      mergedContent.value[selectedFile.value] = newContent;
      buildFileTree()
    };




    return {
      rootNode,
      filesLoaded,
      handleFileUpload,
      exportFiles,
      selectFile,
      selectedFile,
      mergedContent,
      updateContent,
      handleUpdatedOriginalUpload,
      handlePrevTranslationUpload,
      loading
    };
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  padding: 0 10px;
}

h1 {
  color: #2c3e50;
}

.lds-dual-ring {
  display: inline-block;
  width: 40px;
  height: 40px;
  position: absolute;
}

.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 32px;
  height: 32px;
  margin: 8px;
  border-radius: 50%;
  border: 6px solid #16915e;
  border-color: #16915e transparent #16915e transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}

@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

input[type="file"] {
  margin-bottom: 20px;
}

button {
  margin-top: 20px;
}

.main-content {
  display: flex;
}

.content-area {
  flex: 1;
  padding-left: 20px;
  border: 1px solid #7d7d7d;
  margin: 0 12px;
}

.file-inputs {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.file-inputs label {
  display: block;
  margin-bottom: 5px;
}

.file-inputs input[type='file'] {
  display: block;
}
</style>
