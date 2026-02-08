/**
 * User Utilities - Funções auxiliares relacionadas ao usuário
 */

/**
 * Gera iniciais a partir do nome e sobrenome do usuário
 * @param {Object} user - Objeto do usuário (deve conter nome e sobrenome)
 * @returns {string} Iniciais formatadas (ex: "HS", "GO")
 */
export const getUserInitials = (user) => {
    if (!user) return 'SM';

    // Prioriza iniciais se já existirem (algumas rotas futuras podem ter)
    if (user.initials) return user.initials.toUpperCase();

    // Fallback: Gerar a partir do nome e sobrenome
    const first = user.nome ? user.nome.charAt(0) : '';
    const last = user.sobrenome ? user.sobrenome.charAt(0) : '';

    const initials = (first + last).toUpperCase();

    // Se não conseguiu gerar, retorna padrão SalesMasters
    return initials || 'SM';
};
