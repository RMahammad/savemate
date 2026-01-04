function formatPln(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PriceBlock({
  price,
  originalPrice,
  discountPercent,
}: {
  price: number;
  originalPrice: number;
  discountPercent?: number;
}) {
  const discount =
    typeof discountPercent === "number"
      ? discountPercent
      : originalPrice > 0
        ? Math.max(
            0,
            Math.round(((originalPrice - price) / originalPrice) * 100)
          )
        : 0;

  return (
    <div className="text-right">
      <div className="text-base font-semibold tracking-tight">
        {formatPln(price)}
      </div>
      <div className="text-sm text-slate-500 line-through">
        {formatPln(originalPrice)}
      </div>
      <div className="text-xs font-medium text-slate-700">{discount}% off</div>
    </div>
  );
}
