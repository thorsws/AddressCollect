export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Campaign Giveaway System
        </h1>
        <p className="text-gray-600">
          Visit a campaign page at <code className="bg-gray-200 px-2 py-1 rounded">/c/[slug]</code>
        </p>
      </div>
    </div>
  );
}
