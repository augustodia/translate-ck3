export default class TreeNode {
  constructor(name, path, isDirectory = false) {
    this.name = name;
    this.path = path; // Caminho completo
    this.isDirectory = isDirectory;
    this.children = []; // Para diretórios
    this.content = null; // Para arquivos
    this.newKeysCount = 0; // Para diretórios
    this.hasPending = false; // Nova propriedade
  }
}
