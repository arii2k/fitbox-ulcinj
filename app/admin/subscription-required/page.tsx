export default function SubscriptionRequiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 border border-gray-800 p-10 rounded-2xl text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-red-400">
          Subscription Required
        </h1>

        <p className="text-gray-400 mb-6">
          Your subscription is inactive or expired.
          Please upgrade your plan to continue using the admin panel.
        </p>

        <a
          href="/admin/plans"
          className="inline-block bg-blue-600 hover:bg-blue-700 transition px-6 py-3 rounded-lg"
        >
          View Plans
        </a>
      </div>
    </div>
  );
}