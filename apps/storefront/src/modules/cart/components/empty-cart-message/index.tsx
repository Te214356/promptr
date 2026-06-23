'use client'
import { useLanguage } from '@lib/context/language-context'
import InteractiveLink from '@modules/common/components/interactive-link'

const EmptyCartMessage = () => {
  const { lang } = useLanguage()

  return (
    <div className="py-48 px-2 flex flex-col justify-center items-start" data-testid="empty-cart-message">
      <h1 className="text-3xl font-semibold text-white mb-4">
        {lang === 'ar' ? 'السلة' : 'Cart'}
      </h1>
      <p className="text-white/50 text-base mt-4 mb-6 max-w-[32rem]">
        {lang === 'ar'
          ? 'سلتك فارغة. تصفح منتجاتنا للبدء.'
          : "You don't have anything in your cart. Let's change that, use the link below to start browsing our products."}
      </p>
      <div>
        <InteractiveLink href="/store">
          {lang === 'ar' ? 'استكشف المنتجات' : 'Explore products'}
        </InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
