<?php
namespace AudicalServices\Services;

use AudicalServices\Models\OrderRepository;
use AudicalServices\Services\InventoryService;
use Stripe\Stripe;
use Stripe\Webhook;

class PaymentService
{
    public function __construct(private OrderRepository $orders, private InventoryService $inventory) {}

    public function handleWebhook(string $payload, string $sigHeader): void
    {
        $secret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '';
        if (!$secret) {
            Response::json(['error' => 'Webhook secret missing'], 500);
        }

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (\Exception $e) {
            Response::json(['error' => 'Invalid signature', 'details' => $e->getMessage()], 400);
        }

        switch ($event->type) {
            case 'payment_intent.succeeded':
                $paymentIntent = $event->data->object;
                $order = $this->orders->findByPaymentIntent($paymentIntent->id);
                if ($order) {
                    $this->orders->markPaid($order['id']);
                    $items = $paymentIntent->metadata['items'] ?? '[]';
                    $this->inventory->adjustStock(json_decode($items, true) ?? []);
                }
                break;
            case 'charge.dispute.created':
                $paymentIntent = $event->data->object->payment_intent ?? null;
                if ($paymentIntent && ($order = $this->orders->findByPaymentIntent($paymentIntent))) {
                    $this->orders->markDispute($order['id']);
                }
                break;
            case 'charge.refunded':
                $paymentIntent = $event->data->object->payment_intent ?? null;
                if ($paymentIntent && ($order = $this->orders->findByPaymentIntent($paymentIntent))) {
                    $this->orders->markRefunded($order['id']);
                }
                break;
        }

        Response::json(['received' => true]);
    }
}
