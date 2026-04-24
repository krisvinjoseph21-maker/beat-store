export interface AnalyticsItem {
  id: string
  name: string
  category?: string
  price: number
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    ttq?: {
      track: (event: string, data?: Record<string, unknown>) => void
      page: () => void
    }
  }
}

export function trackViewItem(item: AnalyticsItem) {
  if (typeof window === 'undefined') return

  window.gtag?.('event', 'view_item', {
    currency: 'USD',
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, item_category: item.category, price: item.price, quantity: 1 }],
  })

  window.fbq?.('track', 'ViewContent', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency: 'USD',
  })

  window.ttq?.track('ViewContent', {
    content_id: item.id,
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency: 'USD',
  })
}

export function trackAddToCart(item: AnalyticsItem) {
  if (typeof window === 'undefined') return

  window.gtag?.('event', 'add_to_cart', {
    currency: 'USD',
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, item_category: item.category, price: item.price, quantity: 1 }],
  })

  window.fbq?.('track', 'AddToCart', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency: 'USD',
  })

  window.ttq?.track('AddToCart', {
    content_id: item.id,
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency: 'USD',
  })
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number) {
  if (typeof window === 'undefined') return

  window.gtag?.('event', 'begin_checkout', {
    currency: 'USD',
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, item_category: i.category, price: i.price, quantity: 1 })),
  })

  window.fbq?.('track', 'InitiateCheckout', {
    content_ids: items.map((i) => i.id),
    content_type: 'product',
    num_items: items.length,
    value,
    currency: 'USD',
  })

  window.ttq?.track('InitiateCheckout', {
    content_ids: items.map((i) => ({ content_id: i.id })),
    value,
    currency: 'USD',
  })
}

export function trackPurchase(transactionId: string, items: AnalyticsItem[], value: number) {
  if (typeof window === 'undefined') return

  window.gtag?.('event', 'purchase', {
    transaction_id: transactionId,
    currency: 'USD',
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, item_category: i.category, price: i.price, quantity: 1 })),
  })

  window.fbq?.('track', 'Purchase', {
    content_ids: items.map((i) => i.id),
    content_type: 'product',
    value,
    currency: 'USD',
  })

  window.ttq?.track('CompletePayment', {
    content_ids: items.map((i) => ({ content_id: i.id })),
    value,
    currency: 'USD',
  })
}

// Fires when cart drawer closes with items but no checkout was initiated.
// Use this in Meta/TikTok Ads to build retargeting audiences.
export function trackCartAbandonment(items: AnalyticsItem[], value: number) {
  if (typeof window === 'undefined') return

  window.gtag?.('event', 'cart_abandonment', {
    currency: 'USD',
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: 1 })),
  })

  window.fbq?.('trackCustom', 'CartAbandonment', {
    content_ids: items.map((i) => i.id),
    value,
    currency: 'USD',
  })

  window.ttq?.track('CartAbandonment', {
    content_ids: items.map((i) => ({ content_id: i.id })),
    value,
    currency: 'USD',
  })
}
