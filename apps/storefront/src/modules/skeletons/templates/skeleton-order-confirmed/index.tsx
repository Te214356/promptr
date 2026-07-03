import SkeletonOrderConfirmedHeader from "@modules/skeletons/components/skeleton-order-confirmed-header"
import SkeletonOrderInformation from "@modules/skeletons/components/skeleton-order-information"
import SkeletonOrderItems from "@modules/skeletons/components/skeleton-order-items"

const SkeletonOrderConfirmed = () => {
  return (
    <div className="bg-[#080810] py-6 min-h-[calc(100vh-64px)] animate-pulse">
      <div className="content-container flex justify-center px-4">
        <div className="max-w-4xl h-full bg-[#0d0d1f] border border-white/10 rounded-2xl w-full p-10">
          <SkeletonOrderConfirmedHeader />

          <SkeletonOrderItems />

          <SkeletonOrderInformation />
        </div>
      </div>
    </div>
  )
}

export default SkeletonOrderConfirmed
