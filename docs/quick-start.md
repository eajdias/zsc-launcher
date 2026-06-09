# Quick Start — Zscan Launcher

Guia técnico para o desenvolvimento do launcher público.

---

## 🏗️ Fluxo de Operação

1.  **Entrada:** Usuário executa `npx @eajdias/zscan-run <product> [args]`.
2.  **Auth:** Launcher busca a licença em `ZSCAN_<PRODUCT>_LICENSE_KEY`.
3.  **Download:** Faz uma requisição GET ao Hub (`zscan.eajdias.com/api/v1/download`) passando o token e o produto.
4.  **Streaming:** O Hub valida a licença e retorna um stream do `.tgz` (tarball) do GitHub Packages privado.
5.  **Extração:** Launcher descompacta o conteúdo em um diretório temporário isolado.
6.  **Execução:** Launcher inicia o processo via `child_process.execSync` e encaminha os argumentos e o ambiente seguro.

---

## 🛠️ Desenvolvimento

### Pré-requisitos
- Node.js 24+
- Acesso ao repositório `zsc-launcher`.

### Comandos
```bash
npm install          # Instala dependências (tar, esbuild)
npm run build        # Compila src/index.ts -> bin/run.cjs
```

### Testando localmente
Para testar o launcher sem publicar no NPM, você pode usar o binário compilado diretamente:

```bash
ZSCAN_ASSIST_LICENSE_KEY="xyz" node bin/run.cjs assist
```

---

## 📦 Distribuição

O launcher é um pacote público. Para publicar uma nova versão:

1. Atualize a versão no `package.json`.
2. `npm run build`
3. `npm publish --access public`

*Nota: O launcher nunca deve conter segredos ou IP privado. Ele é apenas o condutor.*
