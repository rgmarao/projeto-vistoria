// Garante que o usuário é super_admin (acesso cross-tenant)
export const requireSuperAdmin = (req, res, next) => {
  if (req.userPerfil !== 'super_admin') {
    return res.status(403).json({ error: 'Acesso restrito a super_admin' });
  }
  next();
};

// Garante que o usuário tem um conta_id válido (qualquer perfil exceto super_admin)
// super_admin passa sem conta_id — acesso cross-tenant
export const requireTenant = (req, res, next) => {
  if (req.userPerfil === 'super_admin') return next();
  if (!req.contaId) {
    return res.status(403).json({ error: 'Conta não identificada para este usuário' });
  }
  next();
};
