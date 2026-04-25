# Revenda Digital - SaaS de Gestão de Estoque

Este é um sistema SaaS funcional para revendas de veículos, focado em controle de estoque e geração de conteúdo com IA.

## Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
1. **Git:** Para controle de versão e envio para o GitHub. ([Baixe aqui](https://git-scm.com/downloads))
2. **Node.js:** Para rodar o projeto localmente.

## Como subir este projeto para o GitHub (Passo a Passo)

Siga estas etapas para colocar seu código em um repositório seguro no GitHub:

1.  **Crie um repositório no GitHub:**
    *   Acesse [github.com/new](https://github.com/new).
    *   Dê um nome ao repositório (ex: `revenda-digital-saas`).
    *   Mantenha-o como **Public** ou **Private**.
    *   **Não** inicialize com README, license ou gitignore.
    *   Clique em **Create repository**.

2.  **Configure sua identidade (se for a primeira vez):**
    ```bash
    git config --global user.name "Seu Nome"
    git config --global user.email "seu-email@exemplo.com"
    ```

3.  **Abra o Terminal na pasta do projeto e inicialize o Git:**
    ```bash
    git init
    ```

4.  **Adicione os arquivos e crie o primeiro commit:**
    ```bash
    git add .
    git commit -m "feat: estrutura inicial do SaaS de revenda"
    ```

5.  **Conecte ao seu repositório remoto:**
    *   Copie a URL do repositório (ex: `https://github.com/seu-usuario/revenda-digital-saas.git`).
    ```bash
    git remote add origin https://github.com/seu-usuario/revenda-digital-saas.git
    ```

6.  **Envie o código:**
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
*   **Cadastro Inteligente:** Busca automática de dados do veículo via placa.
*   **Gestão de Status:** Disponível, Vendido, Indisponível.
*   **Marketing com IA:** Geração de legendas para Instagram.
*   **Catálogo Público:** Site gerado automaticamente para os clientes.
