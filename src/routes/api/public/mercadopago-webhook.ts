import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/public/mercadopago-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = process.env['MERCADOPAGO_ACCESS_TOKEN'];
          if (!token) return new Response('Not configured', { status: 200 });

          const body = (await request.json().catch(() => null)) as any;
          const url = new URL(request.url);

          const type = body?.type ?? body?.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
          const paymentId = body?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id');

          if (type !== 'payment' || !paymentId) {
            return new Response('Ignored', { status: 200 });
          }

          // Consulta o pagamento no Mercado Pago para confirmar a autenticidade e o status
          const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            console.error('MP payment lookup failed:', res.status);
            return new Response('Lookup failed', { status: 200 });
          }

          const payment = (await res.json()) as {
            status: string;
            external_reference?: string | null;
          };

          if (payment.status !== 'approved' || !payment.external_reference) {
            return new Response('OK', { status: 200 });
          }

          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
          const { error } = await supabaseAdmin
            .from('checkout_sessions')
            .update({
              status: 'completed',
              external_checkout_id: String(paymentId),
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.external_reference);

          if (error) console.error('Failed to update checkout session:', error);

          return new Response('OK', { status: 200 });
        } catch (error) {
          console.error('Error processing Mercado Pago webhook:', error);
          return new Response('Internal Server Error', { status: 500 });
        }
      },
    },
  },
});
