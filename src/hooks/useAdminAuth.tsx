
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  permissions: Record<string, boolean>;
}

export const useAdminAuth = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('=== VERIFICANDO STATUS DE ADMIN ===');
      
      if (!user) {
        console.log('❌ Usuário não logado');
        setIsAdmin(false);
        setAdminData(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Verificando status de admin para usuário:', {
          id: user.id,
          email: user.email
        });
        
        // Tentar primeiro por user_id
        let { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        console.log('📊 Resultado da consulta por user_id:', { data, error });

        // Se não encontrou por user_id, tentar por email
        if ((!data || data.length === 0) && !error) {
          console.log('🔄 Tentando buscar por email...');
          const emailResult = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', user.email)
            .limit(1);
          
          console.log('📊 Resultado da consulta por email:', emailResult);
          data = emailResult.data;
          error = emailResult.error;
        }

        if (error) {
          console.log('⚠️ Erro na consulta:', error.message);
          setIsAdmin(false);
          setAdminData(null);
        } else if (!data || data.length === 0) {
          console.log('❌ Usuário não é admin - nenhum registro encontrado');
          console.log('💡 Para tornar-se admin, execute:');
          console.log(`INSERT INTO admin_users (user_id, email) VALUES ('${user.id}', '${user.email}');`);
          setIsAdmin(false);
          setAdminData(null);
        } else {
          const adminRecord = data[0];
          console.log('✅ USUÁRIO É ADMIN! Dados:', adminRecord);
          setIsAdmin(true);
          setAdminData({
            id: adminRecord.id,
            email: adminRecord.email,
            permissions: (adminRecord.permissions as Record<string, boolean>) || { full_access: true }
          });
        }
      } catch (error) {
        console.error('💥 Erro ao verificar admin:', error);
        setIsAdmin(false);
        setAdminData(null);
      } finally {
        setLoading(false);
        console.log('=== FIM VERIFICAÇÃO ADMIN ===');
      }
    };

    checkAdminStatus();
  }, [user]);

  // Log adicional para debug
  console.log('🔄 Hook useAdminAuth retornando:', {
    isAdmin,
    adminData: adminData?.email,
    loading,
    userId: user?.id,
    userEmail: user?.email
  });

  return { isAdmin, adminData, loading };
};
