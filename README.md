# Revenda Digital - SaaS de Gestão de Estoque

Este é um sistema SaaS funcional para revendas de veículos, focado em controle de estoque e geração de conteúdo com IA.

## Como subir este projeto para o GitHub (Passo a Passo)

Siga estas etapas para colocar seu código em um repositório seguro no GitHub:

1.  **Crie um repositório no GitHub:**
    *   Acesse [github.com/new](https://github.com/new).
    *   Dê um nome ao repositório (ex: `revenda-digital-saas`).
    *   Mantenha-o como **Public** ou **Private**, conforme sua preferência.
    *   **Não** inicialize com README, license ou gitignore (pois já temos estes arquivos).
    *   Clique em **Create repository**.

2.  **Abra o Terminal no seu ambiente de desenvolvimento:**
    *   Certifique-se de estar na pasta raiz do projeto.

3.  **Inicialize o Git localmente:**
    ```bash
    git init
    ```

4.  **Adicione os arquivos ao controle de versão:**
    ```bash
    git add .
    ```

5.  **Crie o primeiro commit:**
    ```bash
    git commit -m "feat: estrutura inicial do SaaS de revenda"
    ```

6.  **Conecte ao seu repositório remoto:**
    *   Copie a URL do repositório que você criou no GitHub (algo como `https://github.com/seu-usuario/revenda-digital-saas.git`).
    ```bash
    git remote add origin https://github.com/seu-usuario/revenda-digital-saas.git
    ```

7.  **Defina a branch principal e envie o código:**
    ```bash
    git branch -M main
    git push -u origin main
    ```

---

## Tecnologias Utilizadas

*   **Next.js 15 (App Router)**
*   **Firebase** (Authentication, Firestore, Storage)
*   **Tailwind CSS & Shadcn UI**
*   **Genkit** (Para integração com IA Gemini)
*   **Lucide React** (Ícones)

## Funcionalidades Principais

*   **Dashboard Administrativo:** Controle total do estoque.
*   **Cadastro Inteligente:** Busca automática de dados do veículo via placa (Placas de teste: `BRA2E19`, `ABC1234`, `GDV2F53`).
*   **Gestão de Status:** Disponível, Vendido, Indisponível.
*   **Marketing com IA:** Geração de legendas para Instagram baseadas nos dados do veículo.
*   **Catálogo Público:** Site gerado automaticamente para os clientes visualizarem o estoque.

## Configuração do Ambiente

Este projeto utiliza variáveis de ambiente para o Firebase. Certifique-se de configurar as chaves no seu ambiente local ou nas configurações do repositório (Secrets) caso use CI/CD.

O arquivo `.env` (não enviado ao GitHub) deve conter suas credenciais do Firebase se você optar por não usar o arquivo `src/firebase/config.ts` diretamente.
