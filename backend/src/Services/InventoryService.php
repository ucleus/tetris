<?php
namespace AudicalServices\Services;

use AudicalServices\Models\ProductRepository;

class InventoryService
{
    public function __construct(private ProductRepository $products) {}

    public function adjustStock(array $items): void
    {
        foreach ($items as $item) {
            $product = $this->products->find($item['product_id']);
            if (!$product) {
                continue;
            }
            $newStock = max(0, ((int)$product['stock']) - $item['quantity']);
            $this->products->updateStock($item['product_id'], $newStock);
        }
    }
}
