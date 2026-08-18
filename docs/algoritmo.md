# Algoritmo — recomendação e roteamento

> **Fundamentação.** Os parâmetros abaixo foram confirmados contra o código do
> núcleo (`recommend.ts`, `dijkstra.ts`, `poiDistance.ts`, `ports.ts`), salvo
> onde marcado `[confirmar contra <arquivo ainda não lido>]`.

O motor resolve dois problemas sobre um grafo dirigido ponderado
`{ nodes, edges }`: **recomendar** a melhor vaga (`candidate`) e **rotear** até
ela. A ocupação **não** vive no grafo — entra por requisição.

## Entradas (`recommend`)

`{ graph, vehicle, occupancy, poiId, entranceId?, radiusFactor? }`

- `poiId` — **obrigatório**; sempre entra no cálculo (distância a POI).
- `entranceId` — **opcional**; a presença liga o modo check-in (fator de dirigir
  + descarte de inalcançáveis). Ausência = standby.
- `occupancy` — conjunto (`Set`) de ids indisponíveis (ocupadas + reservadas,
  RN-17). No wire, trafega como array de ids e reidrata pra `Set`.
- `radiusFactor` — opcional, default `2`.

`recommend` devolve **uma** vaga (`SlotNode`) ou `null` — não uma lista ranqueada.

## Modos

- **Check-in** (com `entranceId`): custo = POI + ocupação + dirigir. Vagas sem
  caminho a partir da entrada são descartadas.
- **Standby** (sem `entranceId`): custo = POI + ocupação. Sem dirigir, sem rota.

## Custo (minimizado)

Para cada vaga elegível, três componentes normalizados **min-max** sobre as candidatas:

```
cost = poiNorm(poi) + occWeight · occNorm(occ) + (checkin ? 0.1 · driveNorm(drive) : 0)
```

- **POI** — distância **euclidiana** slot→POI (`Math.hypot` sobre `position`).
  Coeficiente `1`. (Depende de `position` em todo nó — obrigatório no wire.)
- **Ocupação** — ocupação da vizinhança; raio = `radiusFactor` × comprimento da
  vaga. Coeficiente `occWeight`.
- **Dirigir** — `totalWeight` do caminho entrada→vaga (Dijkstra). Coeficiente `0.1`.

Menor custo = recomendada (RN-04). `occWeight = occupancyWeight(vehicle)`:
baseline `1`, cresce para veículos grandes — por isso o "1:1:0,1" é a **base**, e
o termo de ocupação escala com o tamanho do veículo (RN-14).
`[fórmula RN-14: 1 + k·max(0, w/W0−1, l/L0−1), com W0=1,85, L0=4,5, k=2 —
confirmar contra sizeBias.ts]`

## Elegibilidade

Filtro rígido de dimensão: vaga que não comporta o veículo nunca entra (RN-13).
Vaga ocupada nunca entra (RN-01). `[confirmar detalhe contra eligibility.ts]`

## Normalização e desempate

Min-max por componente. Empate: menor custo → menor ocupação da vizinhança →
`id` ascendente (determinístico).

## Roteamento (`dijkstra`)

Dijkstra sobre arestas dirigidas com `weight`. `Path = { nodes: NodeId[],
totalWeight }`. Mão dupla = duas arestas (o consumidor modela; o motor honra).

## Refactor pendente (decidido, a implementar pós-port)

Hoje o check-in roda um Dijkstra **completo por vaga elegível** — N vagas ⇒ N
buscas a partir da mesma entrada, cada uma reconstruindo a adjacência e varrendo
o grafo inteiro (seleção do mínimo em scan linear, O(V²)). Desperdício: Dijkstra
de fonte única já calcula a distância da entrada para **todos** os nós numa
passada só.

Trocar por **uma** busca de fonte única a partir da entrada, lendo a distância
de cada vaga e reconstruindo a rota da escolhida do mesmo resultado (`previous`).
Colapsa N buscas em 1 e entrega a rota do check-in como subproduto grátis.

Vira um primitivo — `shortestPathsFrom(graph, from)` — por baixo de três usos: o
fator de dirigir do `recommend`, a rota do check-in, e o `/reachability`
(alcançável = fonte única a partir de cada entrada). O `shortestPath`
ponto-a-ponto atual passa a ser um caso dele.

Fazer **depois** do port mecânico do núcleo (primeiro os 20 testes verdes
idênticos, provando que o port não quebrou nada; só então o refactor, em
red-green próprio). A troca do scan linear por heap binário é ganho separado e
posterior — não misturar.
