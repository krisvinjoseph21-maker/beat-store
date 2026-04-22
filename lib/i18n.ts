'use client'

import { useLocaleStore } from './locale'

const translations = {
  en: {
    nav: {
      beats: 'Beats',
      services: 'Services',
      customBeats: 'Custom Beats',
      mixingMastering: 'Mixing & Mastering',
      samplePacks: 'Sample Packs',
      licensing: 'Licensing',
      contact: 'Contact',
      shopBeats: 'Shop Beats',
      cart: 'Cart',
    },
    cart: {
      title: 'Cart',
      empty: 'Your cart is empty',
      emptyDesc: 'Find your sound in the catalog.',
      browseBeats: 'Browse Beats →',
      chooseLicense: 'Choose License & Checkout',
    },
    license: {
      title: 'Choose Your License',
      standardLease: 'Basic Lease',
      premiumLease: 'Premium Lease',
      unlimitedLease: 'Unlimited Lease',
      beatQty: 'Beat Quantity',
      checkout: 'Checkout',
      discountCode: 'Discount code',
      apply: 'Apply',
      remove: 'Remove',
      limitedOffer: 'Limited Offer',
      secure: 'Powered by Stripe · Secure checkout',
    },
    beat: {
      from: 'From',
      addToCart: 'Add to Cart',
      addedToCart: 'Added to Cart',
      inCart: 'In Cart',
      inquire: 'Inquire →',
      select: 'Select →',
    },
    locale: {
      language: 'Language',
      currency: 'Currency',
    },
  },
  es: {
    nav: {
      beats: 'Beats',
      services: 'Servicios',
      customBeats: 'Beats Personalizados',
      mixingMastering: 'Mezcla y Mastering',
      samplePacks: 'Sample Packs',
      licensing: 'Licencias',
      contact: 'Contacto',
      shopBeats: 'Comprar Beats',
      cart: 'Carrito',
    },
    cart: {
      title: 'Carrito',
      empty: 'Tu carrito está vacío',
      emptyDesc: 'Encuentra tu sonido en el catálogo.',
      browseBeats: 'Ver Beats →',
      chooseLicense: 'Elegir Licencia y Pagar',
    },
    license: {
      title: 'Elige Tu Licencia',
      standardLease: 'Licencia Básica',
      premiumLease: 'Licencia Premium',
      unlimitedLease: 'Licencia Ilimitada',
      beatQty: 'Cantidad de Beats',
      checkout: 'Pagar',
      discountCode: 'Código de descuento',
      apply: 'Aplicar',
      remove: 'Eliminar',
      limitedOffer: 'Oferta Limitada',
      secure: 'Pagos seguros con Stripe',
    },
    beat: {
      from: 'Desde',
      addToCart: 'Agregar al Carrito',
      addedToCart: 'Agregado al Carrito',
      inCart: 'En Carrito',
      inquire: 'Consultar →',
      select: 'Seleccionar →',
    },
    locale: {
      language: 'Idioma',
      currency: 'Moneda',
    },
  },
  fr: {
    nav: {
      beats: 'Beats',
      services: 'Services',
      customBeats: 'Beats Personnalisés',
      mixingMastering: 'Mixage & Mastering',
      samplePacks: 'Sample Packs',
      licensing: 'Licences',
      contact: 'Contact',
      shopBeats: 'Acheter des Beats',
      cart: 'Panier',
    },
    cart: {
      title: 'Panier',
      empty: 'Votre panier est vide',
      emptyDesc: 'Trouvez votre son dans le catalogue.',
      browseBeats: 'Voir les Beats →',
      chooseLicense: 'Choisir une Licence & Payer',
    },
    license: {
      title: 'Choisissez Votre Licence',
      standardLease: 'Licence Basique',
      premiumLease: 'Licence Premium',
      unlimitedLease: 'Licence Illimitée',
      beatQty: 'Quantité de Beats',
      checkout: 'Payer',
      discountCode: 'Code de réduction',
      apply: 'Appliquer',
      remove: 'Supprimer',
      limitedOffer: 'Offre Limitée',
      secure: 'Paiement sécurisé par Stripe',
    },
    beat: {
      from: 'À partir de',
      addToCart: 'Ajouter au Panier',
      addedToCart: 'Ajouté au Panier',
      inCart: 'Dans le Panier',
      inquire: 'Renseignez-vous →',
      select: 'Sélectionner →',
    },
    locale: {
      language: 'Langue',
      currency: 'Devise',
    },
  },
} as const

export function useT() {
  const language = useLocaleStore((s) => s.language)
  return translations[language]
}
