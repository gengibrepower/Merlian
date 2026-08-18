# Merlian

Motor **stateless** de recomendação de posicionamento e roteamento sobre grafos
dirigidos ponderados. Recebe a topologia inteira por requisição, computa e
devolve. Sem estado, sem banco, agnóstico de domínio.

O AMPS (recomendação de vagas de estacionamento) é o **consumidor de exemplo**.
O mesmo motor serve qualquer problema de "escolher o melhor ponto num grafo e
rotear até ele" — pátio de maquinário, doca de carga, etc.

## Filosofia

- **Sem estado.** A topologia vem no request; o motor não tem banco.
- **Agnóstico de domínio.** Raciocina sobre *papéis funcionais*, não sobre nomes
  de domínio (ver role/label/kind).
- **Núcleo puro.** A lógica é livre de I/O; a borda HTTP é casca fina.
- **Contrato como fronteira.** `{ nodes, edges }` publicado e versionado (OpenAPI).

## Vocabulário de nó: role / label / kind

Três conceitos deliberadamente distintos — a colisão de nomes é uma armadilha:

- **`role`** — externo, funcional, **fixo do motor**: `candidate`, `attractor`,
  `source`, `transit`. É o que o algoritmo entende.
- **`label`** — externo, cosmético, do domínio do consumidor (opcional): "Slot",
  "Bay", "LoadingDock". Ecoado de volta na resposta; o motor **não** o usa no cálculo.
- **`kind`** — interno, estrutural do núcleo: `slot`, `poi`, `entrance`,
  `waypoint`. O mapeamento traduz `role → kind` na entrada.

O consumidor manda `role` (+ `label` opcional); o motor mapeia pra `kind` por dentro.

## Endpoints (visão geral)

Versionados em path (`/v1`). Breaking change ⇒ `/v2`.

- `POST /v1/recommendations` — recomenda a vaga. Check-in (com entrada) devolve a
  rota junto; standby (sem entrada) devolve só a vaga.
- `POST /v1/paths` — rota pura entre dois nós.
- `POST /v1/reachability` — vagas alcançáveis por entrada; valida conectividade
  do layout (serve a RN-11 do AMPS, que decide o que é "publicável").

`graphVersion` opcional no wire: hash de conteúdo da topologia, usado como chave
de cache do grafo já hidratado. Otimização, **nunca** fonte de verdade — ausente
ou errado, o motor só paga o parse de novo.

> Forma exata de request/response: `docs/api.md` (a escrever) + OpenAPI gerado do Zod.

## O que o motor **não** faz

Não autora nem edita mapas. Não renderiza. Não persiste. Não faz auth nem
multi-tenant. Não guarda histórico nem gera relatório — isso é do consumidor.

## Stack

TypeScript (strict, ESM, NodeNext) · Express (casca fina) · Zod (contrato) ·
Vitest (testes). Núcleo puro sem dependência de I/O.

## Roadmap

- Publicar OpenAPI + subir mock server (consumidores trabalham em paralelo).
- Reescrita do núcleo em Rust — transparente pro consumidor, já que o contrato
  trafega em HTTP/JSON agnóstico de linguagem. Não construir nada pra isso agora.