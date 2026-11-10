# Remix of Masonry Artist Portfolio

Quero que você crie um novo template de site de portfólio para um designer gráfico, seguindo fielmente as referências visuais das imagens anexadas (estilo Daniel Triendl). Este template deve ser extremamente visual, direto e com forte presença das artes na interface. Siga TODAS as diretrizes abaixo sem desviar.

# 🎨 DIREÇÃO DE ARTE E ESTILO
- O site deve ser **majoritariamente branco**, quase editorial, com **tipografia preta** como elemento principal.
- A tipografia deve ser **serifada elegante e grande** (como no site do Triendl) para headlines e **sans serif simples** para elementos secundários.
- O layout precisa ser **minimalista**, porém com **peças visuais grandes** ocupando o viewport.
- Nada de colunas estreitas ou margens exageradas. O grid é fluido e quase encostado na lateral (máx. 48–64px de margem).
- Priorize **impacto visual**: as imagens dos projetos devem parecer obras expostas.

# 🖼️ HOME — ESTRUTURA OBRIGATÓRIA
1. **Navbar super minimalista**  
   - Logo + nome do designer no canto esquerdo.  
   - Explore / Work / About / Contact no canto direito.  
   - Tudo em preto, fundo branco.

2. **Hero de impacto**  
   - Um mosaico com os **primeiros 3 a 5 projetos**, GRANDES, tomando quase toda a tela.  
   - As imagens devem ser **ilustrações digitais, posters, editoriais, projetos de branding e magazines** (insira imagens fake seguindo esse estilo).
   - Os cards devem ter formato vertical e horizontal, variando dinamicamente, assim como no Triendl.
   - As imagens devem estar organizadas em um grid fluido, não em colunas rígidas.

3. **Titulo e bio curta ao rolar**
   - Após o mosaico inicial, colocar um grande título serifado:  
     **"Designer gráfico explorando cores, formas e narrativa visual."**
   - Subheadline menor explicando áreas de atuação: ilustração, editorial, identidade visual, posters, etc.

# 🧩 LISTAGEM DE PROJETOS
- Cada projeto deve aparecer como **um card com imagem dominante** (80% imagem, 20% texto).
- Embaixo da imagem, coloque:  
  Nome do projeto + hashtags (#illustration #magazine #branding etc).  
- Os cards devem ocupar boa largura da tela (máx. 2 a 3 colunas em desktop), igual ao Triendl.

# 📄 PÁGINA DE PROJETO
A página do projeto deve seguir o mesmo estilo editorial das referências:

- Hero com **imagem enorme** do projeto (quase largura total).
- Título serifado grande.
- Subheadline com tags ou cliente.
- Bloco de texto grande e confortável, alinhado à esquerda, similar ao estilo editorial do Triendl.
- Galeria com imagens em escala grande e respiração generosa.

# ℹ️ SOBRE / ABOUT PAGE
- Texto grande serifado dizendo quem é o designer.
- Bio curta logo abaixo.
- Coluna com:  
  - Clientes selecionados  
  - Contatos  
  - Localização  
  - Links de redes  
- Tudo extremamente branco e limpo.

# 🧭 FOOTER
- Minimalista com poucas opções: Work · About · Contact.

# 📌 INSTRUÇÕES ESPECIAIS
- Insira imagens fake de ilustrações digitais, posters, capas de revista, projetos editoriais, e identidades visuais coloridas — **CORES FORTES E ESTILO ARTY**, como no Triendl.
- Não use imagens corporativas, UI design ou fotos.  
- O foco é **arte gráfica, ilustração e editorial**.
- Tenha certeza absoluta de que os projetos são o **elemento mais chamativo** d

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://little-masonry-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/00b1a9b1-3328-457a-ba76-13eb75395571).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploy to GitHub Pages

The site is deployed from the `main` branch to
<https://al3xalb.github.io/Portofolio/> by the GitHub Actions workflow
in `.github/workflows/deploy-pages.yml`. The workflow builds the static frontend
and publishes it to Pages; Supabase/Lovable continues to provide authentication,
database, storage, and Edge Functions.

### One-time GitHub setup

1. In the repository, open **Settings → Pages** and set the source to **GitHub Actions**.
2. Under **Settings → Secrets and variables → Actions**, add:
   - Repository variable `VITE_SUPABASE_URL`: the existing Supabase project URL.
   - Repository secret `VITE_SUPABASE_PUBLISHABLE_KEY`: the project's publishable/anon key.
3. Push to `main` or run **Deploy to GitHub Pages** from the **Actions** tab.

The publishable key is included in the browser bundle by design. Never put a
Supabase secret or service-role key in a `VITE_*` variable.

### One-time Supabase and Google OAuth setup

In Supabase **Authentication → URL Configuration**, set the Site URL to
`https://al3xalb.github.io/Portofolio/` and add
`https://al3xalb.github.io/Portofolio/admin` to the allowed redirect URLs.
Enable the Google provider in Supabase Auth with your Google OAuth client ID and
secret. In Google Cloud Console, authorize this callback URI, replacing
`<project-ref>` with the project reference from the Supabase project URL:
`https://<project-ref>.supabase.co/auth/v1/callback`.

The app sends users to Supabase Auth for Google sign-in and returns them to the
Pages `/admin` route. The Lovable preview sign-in broker is not used on GitHub
Pages.

The build uses `/Portofolio/` as its asset and router base. For local
development, the default remains `/`. To build locally with the Pages base path:

```sh
VITE_BASE_PATH=/Portofolio/ \
VITE_SUPABASE_URL=https://your-project.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key \
npm run build
```
