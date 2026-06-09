# Zscan Launcher (@eajdias/zscan-run)

O **Zscan Launcher** é um inicializador (bootstrapper) seguro e genérico projetado para o ecossistema Zscan. Ele permite que clientes e LLMs executem produtos privados (como o `zscan-assist`) de forma simplificada, sem a necessidade de gerenciar tokens do GitHub ou clonar repositórios manualmente.

---

## 🚀 Como usar

O launcher é distribuído via NPM público e deve ser executado preferencialmente via `npx`.

### Execução de Produto
Para rodar um produto (ex: `assist`), você deve fornecer a chave de licença via variável de ambiente:

```bash
ZSCAN_ASSIST_LICENSE_KEY="SUA_CHAVE" npx @eajdias/zscan-run assist
```

### Instalação Automática de MCP
Se o produto suportar instalação automática (como o Assist), você pode rodar:

```bash
ZSCAN_ASSIST_LICENSE_KEY="SUA_CHAVE" npx @eajdias/zscan-run assist install
```
O launcher fará o download do produto e delegará o comando de instalação, que configurará automaticamente seus clientes (Claude Desktop, Gemini CLI, etc.) para usar o launcher no futuro.

---

## 🔒 Segurança e Integridade

1.  **Proteção de IP:** O código-fonte dos produtos permanece privado e é baixado apenas após a validação de uma licença legítima.
2.  **Execução em Sandbox:** Por padrão, o launcher isola a execução em diretórios temporários (`/tmp` ou `%TEMP%`).
3.  **Encaminhamento de Ambiente:** O launcher permite controlar quais variáveis de ambiente são passadas para o produto filho via `ZSCAN_FORWARD_ENV`.

---

## 🛠️ Para Desenvolvedores

### Build Local
```bash
npm install
npm run build
```
O binário final será gerado em `bin/run.cjs`.

### Estrutura
- `src/index.ts`: Lógica principal de download, extração e execução.
- `bin/run.cjs`: Bundle compilado pronto para distribuição.

Consulte a documentação detalhada:
- [**Guia de Uso**](docs/usage.md): Configurações avançadas, variáveis de ambiente e segurança.
- [**Guia de Publicação**](docs/publish.md): Como compilar e publicar novas versões.
- [**Quick Start**](docs/quick-start.md): Detalhes de contribuição e desenvolvimento.

---

*Zscan Launcher — Simplificando a distribuição segura de software.*
