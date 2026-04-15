/**
 * semaforos.js — Utilitário para resolução de configuração de semáforos
 *
 * Herança: defaults ← empresa ← unidade
 * Qualquer nível pode sobrescrever label e/ou visibilidade de cada status.
 */

export const SEMAFOROS_CHAVES = ['ok', 'atencao', 'critico'];

export const SEMAFOROS_DEFAULT = {
  ok:      { label: 'OK',      visivel: true },
  atencao: { label: 'Atenção', visivel: true },
  critico: { label: 'Crítico', visivel: true }
};

/**
 * Resolve a configuração efetiva de semáforos para uma unidade.
 * @param {object|null} empresaConfig  - configuracao_semaforos da empresa
 * @param {object|null} unidadeConfig  - configuracao_semaforos da unidade
 * @returns {{ ok, atencao, critico }}
 */
export function resolveSemaforos(empresaConfig, unidadeConfig) {
  const result = {};
  for (const key of SEMAFOROS_CHAVES) {
    result[key] = {
      ...SEMAFOROS_DEFAULT[key],
      ...(empresaConfig?.[key] || {}),
      ...(unidadeConfig?.[key] || {})
    };
  }
  return result;
}

/**
 * Retorna apenas as chaves de semáforos visíveis.
 * @param {object} semaforos - resultado de resolveSemaforos()
 * @returns {string[]}
 */
export function semaforosVisiveis(semaforos) {
  return SEMAFOROS_CHAVES.filter(k => semaforos[k]?.visivel !== false);
}
