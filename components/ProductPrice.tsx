import { getProductPrice, hasProductDiscount } from "@/lib/productPricing";

interface ProductPriceProps {
  price: number;
  solde?: number | null;
  currency?: string;
  className?: string;
  regularColor?: string;
}

export default function ProductPrice({
  price,
  solde,
  currency = "TND",
  className,
  regularColor,
}: ProductPriceProps) {
  const product = { price, solde };
  const discounted = hasProductDiscount(product);
  const currentPrice = getProductPrice(product);
  const format = (amount: number) => {
    const formatted = amount.toLocaleString("fr-TN");
    return currency ? `${formatted} ${currency}` : formatted;
  };

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}
    >
      <span
        style={
          discounted
            ? { color: "#c0392b", fontWeight: 700 }
            : regularColor
              ? { color: regularColor }
              : undefined
        }
      >
        {format(currentPrice)}
      </span>
      {discounted && (
        <del style={{ color: "#8B9AB5", fontSize: "0.85em", fontWeight: 400 }}>
          {format(price)}
        </del>
      )}
    </span>
  );
}
