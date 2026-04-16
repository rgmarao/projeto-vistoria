import { supabase } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: error?.message || 'Invalid token' });
    }

    // Busca perfil para injetar role e conta_id em todas as rotas
    const { data: perfil } = await supabase
      .from('perfis')
      .select('perfil, conta_id')
      .eq('id', user.id)
      .single();

    req.user       = user;
    req.userPerfil = perfil?.perfil  || null;
    req.contaId    = perfil?.conta_id || null;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
