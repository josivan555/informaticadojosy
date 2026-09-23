# Métricas de downloads no painel

## Objetivo
Transformar a página **Downloads** do painel em uma visão de desempenho dos programas, mantendo também o histórico detalhado atual.

## O que será feito
- Registrar cada download de programa no momento em que o link é liberado, incluindo programas gratuitos e pagos.
- Permitir o registro de downloads de visitantes sem conta, sem expor escrita direta no banco.
- Adicionar filtros rápidos por período: **7 dias**, **30 dias**, **90 dias** e **Todo o período**.
- Mostrar indicadores do período selecionado:
  - total de downloads;
  - quantidade de programas que receberam downloads;
  - programa mais baixado.
- Adicionar uma lista ordenada dos programas mais baixados, com posição, nome, total e participação no período.
- Aplicar o mesmo filtro ao histórico detalhado, mantendo programa, usuário/visitante e data.
- Incluir estados de carregamento e vazio para períodos sem downloads.

## Experiência no painel
- Os filtros ficarão no topo da página **Downloads**.
- Os indicadores aparecerão logo abaixo.
- A classificação dos mais baixados virá antes do histórico recente, facilitando a leitura.
- A página continuará adaptada a computador, tablet e celular.

## Detalhes técnicos
- Ajustar `download_history.user_id` para aceitar visitantes anônimos; `software_id` continuará obrigatório.
- O registro será feito somente no servidor após validar que o programa está publicado e que o download pode ser liberado.
- A consulta administrativa aceitará apenas os períodos permitidos e continuará protegida por autenticação e verificação de administrador.
- A agregação será feita a partir de `download_history`, relacionando cada registro ao respectivo programa.
- Downloads anteriores já existentes serão preservados; as novas métricas passam a refletir corretamente os próximos downloads.

## Validação
- Confirmar que downloads gratuitos e pagos de programas geram um registro.
- Confirmar que cada filtro atualiza indicadores, classificação e histórico.
- Conferir estados sem dados e a apresentação em desktop e celular.
