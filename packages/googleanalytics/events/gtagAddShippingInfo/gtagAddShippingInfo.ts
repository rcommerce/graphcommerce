import { GtagAddShippingInfoFragment } from './GtagAddShippingInfo.gql'

export function gtagAddShippingInfo<C extends GtagAddShippingInfoFragment>(cart?: C | null) {
  if (process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS) {
    globalThis.gtag?.('event', 'add_shipping_info', {
      currency: cart?.prices?.grand_total?.currency,
      value: cart?.prices?.grand_total?.value,
      coupon: cart?.applied_coupons?.map((coupon) => coupon?.code),
      items: cart?.items?.map((item) => ({
        item_id: item?.product.sku,
        item_name: item?.product.name,
        currency: item?.prices?.price.currency,
        discount: item?.prices?.discounts?.reduce(
          (sum, discount) => sum + (discount?.amount?.value ?? 0),
          0,
        ),
        item_variant:
          item?.__typename === 'ConfigurableCartItem' ? item.configured_variant.sku : '',
        price: item?.prices?.price.value,
        quantity: item?.quantity,
      })),
    })
  }
}
