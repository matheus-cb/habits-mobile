/**
 * Canal de sessão entre a camada de rede e a store de autenticação — INV-21.
 *
 * Substitui um `await import('@/store/auth.store')` que ficava dentro do
 * tratamento de 401. O import dinâmico existia para quebrar o ciclo (a store
 * importa esta camada de rede), e funcionava no bundle do Metro — mas ele
 * **lança** em qualquer runtime que não habilite módulos ES dinâmicos, e o
 * `catch` genérico do `apiClient` engolia a falha: o 401 virava
 * "Erro de conexão" e a sessão não caía. Um defeito silencioso, dependente de
 * ambiente, no caminho de segurança.
 *
 * Com um registro simples não há import dinâmico, não há ciclo, e o mesmo padrão
 * vale no dashboard — que é o que torna INV-21 uma regra só, e não duas parecidas.
 */
type UnauthorizedHandler = () => void | Promise<void>;

let handler: UnauthorizedHandler | null = null;

/** Registra quem derruba a sessão. Devolve a função de desinscrição. */
export function onUnauthorized(callback: UnauthorizedHandler): () => void {
  handler = callback;
  return () => {
    if (handler === callback) handler = null;
  };
}

/**
 * Avisa que o servidor recusou a credencial, e **espera** a limpeza terminar.
 *
 * O `await` importa: apagar o token do SecureStore é assíncrono. Sem esperar, o
 * erro subiria para a tela enquanto o token ainda estava no cofre, e uma
 * requisição em voo poderia reusá-lo.
 */
export async function notifyUnauthorized(): Promise<void> {
  await handler?.();
}
