# Guia de Uso do Zscan Launcher

O Zscan Launcher (`@eajdias/zscan-run`) é um inicializador (bootstrapper) seguro e genérico projetado para baixar e executar produtos privados do ecossistema Zscan (como o `assist`) nas máquinas dos clientes, sem expor o código-fonte ou credenciais do GitHub.

Este guia explica como configurar e executar o launcher corretamente.

## Uso Básico

Para executar um produto Zscan, você precisa fornecer o ID do Produto como argumento para o launcher e fornecer sua chave de licença válida através de uma variável de ambiente.

O launcher procura dinamicamente por uma chave de licença que corresponda ao nome do produto: `ZSCAN_<NOME_DO_PRODUTO>_LICENSE_KEY`.

### Exemplo: Executando o produto `assist`

**1. Execução única (Terminal):**

```bash
export ZSCAN_ASSIST_LICENSE_KEY="sua-chave-de-licenca-secreta"
npx @eajdias/zscan-run assist
```

**2. Passando argumentos para o produto:**

Quaisquer argumentos passados após o ID do Produto são repassados diretamente para o aplicativo baixado.

```bash
export ZSCAN_ASSIST_LICENSE_KEY="sua-chave-de-licenca-secreta"
npx @eajdias/zscan-run assist --port 8080 --debug
```

## Configuração em Produção

Em um ambiente de produção (como Docker, PM2 ou um serviço Systemd), você deve definir as variáveis em seu ambiente ou em um arquivo `.env`.

**Exemplo de arquivo `.env`:**
```env
# Obrigatório: A chave de licença para o produto específico
ZSCAN_ASSIST_LICENSE_KEY="sua-chave-de-licenca-secreta"

# Opcional: Variáveis padrão da aplicação que o produto filho possa precisar
PORT=8080
NODE_ENV=production
DATABASE_URL="postgres://usuario:senha@localhost:5432/db"
```

**Execução:**
Certifique-se de que o seu ambiente carregue o arquivo `.env` e, em seguida, execute:
```bash
npx @eajdias/zscan-run assist
```

*Nota: Por padrão, o launcher repassa todo o ambiente (`process.env`) para o produto baixado, permitindo que ele se comporte nativamente.*

## Segurança Avançada: Isolamento de Ambiente (Sandboxing)

Se você estiver executando o launcher em um ambiente altamente sensível que contém segredos (como chaves da AWS ou chaves SSH) dos quais o produto Zscan baixado não precisa, você pode habilitar o **Isolamento de Ambiente (Sandboxing)**.

Ao definir a variável `ZSCAN_FORWARD_ENV`, você instrui o launcher a bloquear todas as variáveis de ambiente do sistema de chegarem ao produto baixado, exceto aquelas que você permitir explicitamente.

**Exemplo: Lista de permissões estrita**

```bash
export ZSCAN_ASSIST_LICENSE_KEY="sua-chave-de-licenca-secreta"

# Permitir que apenas PORT e DATABASE_URL sejam vistas pelo produto baixado
export ZSCAN_FORWARD_ENV="PORT,DATABASE_URL"

# O produto NÃO verá variáveis como AWS_ACCESS_KEY_ID
export AWS_ACCESS_KEY_ID="super-secreto-nao-compartilhe"

npx @eajdias/zscan-run assist
```

**O que é repassado quando o isolamento (sandboxing) está ativo?**
1. Essenciais do sistema: `PATH` e `NODE_ENV`.
2. A chave de licença específica usada para iniciar o processo.
3. Qualquer variável com o prefixo `ZSCAN_`.
4. Quaisquer nomes exatos de variáveis listados em `ZSCAN_FORWARD_ENV` (separados por vírgula).

## Sobrescrevendo a URL do Hub

Para testes ou implantações privadas, você pode sobrescrever a URL que o launcher usa para baixar a carga útil do produto:

```bash
export ZSCAN_HUB_URL="http://localhost:3001/api/v1/download"
npx @eajdias/zscan-run assist
```
