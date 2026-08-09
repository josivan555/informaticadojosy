# Corrigir o erro do formulário e as capas que não aparecem

## O erro que apareceu
O erro `useFormField should be used within <FormField>` acontece porque, na tela de Softwares, os rótulos "Capa" e "Arquivo" (os campos de upload) usam um componente de rótulo que só funciona dentro de um campo de formulário controlado. Eles estão fora, então o React quebra a tela quando o diálogo é aberto/salvo.

Correção: trocar esses dois rótulos por rótulos simples (`<label>`), como já é feito na tela de Cursos. Isso elimina o erro sem mudar o visual.

## Por que a capa não aparece
Verifiquei o endereço da imagem gravada no banco: ele responde "Bucket não encontrado". Os buckets de armazenamento `softwares` e `courses` existem, mas **não são públicos**, e o workspace está bloqueando a criação/ativação de buckets públicos (política de privacidade da conta). Como o site monta a URL como se o bucket fosse público, a imagem nunca carrega.

Existem dois caminhos:

**A) Você libera buckets públicos** (Configurações → Privacidade e Segurança, precisa ser admin/dono da conta). Aí eu marco os buckets como públicos e as capas passam a aparecer sem mais nenhuma mudança de código.

**B) Manter privado e usar links assinados** (não depende de você mexer em configuração). Nesse caso eu:
- gravo apenas o caminho do arquivo (ex.: `covers/abc.png`) em vez da URL completa;
- crio um pequeno componente de imagem que pede ao backend um link temporário assinado e exibe a capa;
- uso esse componente na home, na lista de softwares, na página de detalhes e no painel admin;
- converto automaticamente os registros antigos que já têm URL pública salva.

## Detalhes técnicos
- `src/routes/admin/softwares.tsx`: substituir `FormLabel` por `label` nos blocos de upload (linhas ~305 e ~334).
- Caminho B: novo helper `src/lib/storage.functions.ts` com `createSignedUrl` (server fn), componente `src/components/StorageImage.tsx`, e ajuste em `handleFileUpload` para salvar o path; leitura em `index.tsx`, `softwares.tsx`, `softwares.$softwareId.tsx`, `admin/softwares.tsx` e `admin/courses.tsx`.
