export interface DiscountableProduct {
  price: number;
  solde?: number | null;
}

export function hasProductDiscount(product: DiscountableProduct): boolean {
  return (
    typeof product.solde === "number" &&
    Number.isFinite(product.solde) &&
    product.solde > 0 &&
    product.solde < product.price
  );
}

export function getProductPrice(product: DiscountableProduct): number {
  return hasProductDiscount(product) ? Number(product.solde) : product.price;
}
