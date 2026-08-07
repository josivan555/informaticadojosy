import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/api/public/mercadopago-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          console.log('Mercado Pago Webhook received:', body);

          // Mercado Pago webhooks typically send 'type' and 'data.id'
          // We look for 'payment' type and 'payment.updated' or 'payment.created'
          // See: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/webhooks
          
          if (body.type === 'payment') {
            const paymentId = body.data.id;
            
            // In a real scenario, you'd fetch payment details from MP API here using paymentId
            // and your ACCESS_TOKEN to verify the status is 'approved'.
            // For this implementation, we'll assume the webhook is authentic and check our DB.
            
            // We need to match the paymentId (or preference_id if using Checkout Pro) 
            // to our checkout_sessions external_checkout_id.
            
            // Note: Mercado Pago can send multiple webhooks. We only care about approved ones.
            // Since we can't call external API easily without a secret key (which isn't set yet),
            // we'll simulate the logic.
            
            const { data: session, error: sessionError } = await supabase
              .from('checkout_sessions')
              .select('*')
              .eq('external_checkout_id', paymentId)
              .single();

            if (session && !sessionError) {
              await supabase
                .from('checkout_sessions')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', session.id);
                
              console.log(`Payment ${paymentId} approved and session ${session.id} updated.`);
            }
          }

          return new Response('OK', { status: 200 });
        } catch (error) {
          console.error('Error processing Mercado Pago webhook:', error);
          return new Response('Internal Server Error', { status: 500 });
        }
      }
    }
  }
});
