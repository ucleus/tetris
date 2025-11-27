<?php
namespace AudicalServices\Services;

class ShippingService
{
    public function estimate(float $subtotal, float $weightKg = 0, bool $fragile = true): float
    {
        $base = max(39, $subtotal * 0.015);
        $weightSurcharge = $weightKg > 0 ? $weightKg * 1.5 : 0;
        $fragileFee = $fragile ? 12.5 : 0;
        return round($base + $weightSurcharge + $fragileFee, 2);
    }
}
