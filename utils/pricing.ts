import { ProductSummary } from '../pages/products.page';

export function sumOfPrices(products: ProductSummary[]): number {
    let total = 0;
    for (const product of products) {
        total += product.price;
    }
    return total;
}
