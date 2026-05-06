# Planta Viva - Diretrizes de Desenvolvimento e Design

Este documento organiza as regras de comportamento e identidade visual do Planta Viva para garantir consistência em futuras iterações.

## 🎨 Identidade Visual

### Cores e Tema
- **Tema:** Dark Mode Botânico.
- **Fundo (Background):** `#1F1F1F` (Cinza escuro profundo).
- **Texto do Corpo:** `#D4D4D4` (Cinza claro para legibilidade).
- **Cor Primária:** `#4ade80` (Verde menta vibrante para destaques e botões).
- **Alertas de Problemas:** Tons de Vermelho (`#ef4444` / `text-red-400`) devem ser usados em **todo o site** sempre que uma planta apresentar doenças ou anomalias.

### Tipografia
- **Títulos (Headings):** Fonte `Outfit` (Moderna, geométrica, peso bold).
- **Corpo de Texto:** Fonte `Plus Jakarta Sans` (Contemporânea, alta legibilidade).

## 🧠 Comportamento da IA (Gemini)

### Diagnóstico de Saúde
- **Plantas Saudáveis:** Se nenhum problema (doença, praga ou deficiência) for encontrado, a IA **deve** declarar explicitamente que a planta está saudável.
- **Interface:** O aplicativo deve exibir o selo "PLANTA SAUDÁVEL" em verde quando o array de doenças estiver vazio.
- **Tratamento:** Fornecer dicas de manutenção preventiva mesmo para plantas saudáveis.

### Detecção de Doenças
- Qualquer anomalia detectada deve ser listada com:
  - Nome do problema.
  - Tipo (Fungo, Praga, Nutricional, etc).
  - Gravidade (Baixa, Média, Alta).
  - Recomendação de tratamento clara.

## 🛠️ Regras Técnicas
- **Câmera:** Sempre solicitar permissão e oferecer fallback para upload de arquivos.
- **Responsividade:** Design focado em dispositivos móveis (uso em jardins/campo) mas polido para desktop.
- **Feedback:** Mostrar estados de carregamento ("Analisando...") durante a chamada à API.
