// userService.ts - Acesso totalmente gratuito para todos os usuários

export const userService = {
    /**
     * Acesso liberado para todos os usuários.
     * A verificação de whitelist e contagem de uso foi removida.
     * Todos têm acesso ilimitado.
     */
    checkAccess: async (_email: string): Promise<boolean> => {
        // Acesso liberado para todos - sem verificação de Pix/pagamento
        return true;
    },

    /**
     * Função desabilitada - não incrementa mais o uso.
     * O app é totalmente gratuito.
     */
    incrementUsage: async (_email: string): Promise<void> => {
        // Não faz nada - uso ilimitado para todos
        return;
    }
};
