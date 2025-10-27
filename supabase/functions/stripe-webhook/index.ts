import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature or secret missing', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;

        if (!userId || !planType) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Atualizar subscription do usuário
        await fetch(
          `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              plan_type: planType,
              status: 'active',
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
            }),
          }
        );

        console.log(`Subscription updated for user ${userId} to ${planType}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Buscar user_id pelo customer_id
        const userResponse = await fetch(
          `${supabaseUrl}/rest/v1/user_subscriptions?stripe_customer_id=eq.${customerId}&select=user_id`,
          {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
          }
        );

        const users = await userResponse.json();
        if (!users[0]) {
          console.error('User not found for customer:', customerId);
          break;
        }

        const userId = users[0].user_id;

        // Atualizar status da subscription
        await fetch(
          `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            }),
          }
        );

        console.log(`Subscription status updated for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Buscar user_id pelo customer_id
        const userResponse = await fetch(
          `${supabaseUrl}/rest/v1/user_subscriptions?stripe_customer_id=eq.${customerId}&select=user_id`,
          {
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
          }
        );

        const users = await userResponse.json();
        if (!users[0]) {
          console.error('User not found for customer:', customerId);
          break;
        }

        const userId = users[0].user_id;

        // Voltar para plano free
        await fetch(
          `${supabaseUrl}/rest/v1/user_subscriptions?user_id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              plan_type: 'free',
              status: 'canceled',
              stripe_subscription_id: null,
            }),
          }
        );

        console.log(`Subscription canceled for user ${userId}, reverted to free plan`);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
