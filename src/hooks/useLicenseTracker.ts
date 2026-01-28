import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useLicenseTracker = () => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      setIsActive(true);
      lastActivityRef.current = new Date();
    };

    const handleInactivity = () => {
      setIsActive(false);
    };

    // Configurar listeners de atividade
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Verificar inatividade a cada minuto
    const inactivityTimer = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityRef.current.getTime();
      if (inactiveTime > 5 * 60 * 1000) {
        handleInactivity();
      }
    }, 60000);

    setSessionStartTime(new Date());
    lastActivityRef.current = new Date();
    handleActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(inactivityTimer);
    };
  }, [user]);

  useEffect(() => {
    if (!user || !isActive) return;

    const activityInterval = setInterval(async () => {
      try {
        // Rastrear última atividade na chave de licença - com melhor tratamento de erros
        await supabase
          .from('license_keys')
          .update({ 
            last_activity: new Date().toISOString() 
          })
          .gte('expires_at', new Date().toISOString())
          .eq('used_by', user.id)
          .limit(1);
      } catch (error) {
        // Capturar silenciosamente - não encher logs ao rastrear atividade
        if (process.env.NODE_ENV === 'development') {
          console.debug('Activity tracking error:', error);
        }
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(activityInterval);
  }, [user, isActive]);

  return { isActive, sessionStartTime };
};
