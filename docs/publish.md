# Guia de Publicação e Deploy

Este guia detalha os passos necessários para compilar e publicar o `@eajdias/zscan-run` no registro público do npm.

## Pré-requisitos

1.  Ter uma conta criada em [npmjs.com](https://www.npmjs.com/).
2.  Ter permissões de publicação no escopo `@eajdias`.

## Passo a Passo

### 1. Autenticação (Apenas uma vez)

Antes de publicar, seu terminal precisa estar autenticado com sua conta npm:

```bash
npm login
```

*   O comando abrirá o navegador.
*   Faça login e confirme a autorização.
*   Verifique se funcionou com `npm whoami`.

### 2. Build do Projeto

O launcher usa TypeScript e precisa ser transpilado para um único arquivo executável em `bin/run.cjs`:

```bash
npm run build
```

Este comando executa o script `scripts/build.mjs`, que utiliza o `esbuild` para gerar o bundle final.

### 3. Publicação

Para publicar uma nova versão, certifique-se de que o campo `version` no `package.json` foi incrementado e então execute:

```bash
npm publish --access public
```

---

## Dicas de Manutenção

### Otimização do Pacote
O arquivo `package.json` está configurado com o campo `files` para garantir que apenas os arquivos essenciais sejam publicados:
- `bin/run.cjs` (O executável)
- `README.md`
- `docs/` (Documentação de uso)

Isso evita que o código-fonte (`src/`) e scripts de desenvolvimento sejam enviados desnecessariamente.

### Teste de Publicação (Dry Run)
Para ver exatamente o que será enviado sem realizar a publicação real, use:
```bash
npm publish --access public --dry-run
```
