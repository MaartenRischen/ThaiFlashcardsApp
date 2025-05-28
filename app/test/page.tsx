export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Test Page</h1>
      <p className="mb-4">If you can see this, the deployment is working!</p>
      <div className="space-y-2">
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>Build Time: {new Date().toISOString()}</p>
      </div>
      <a href="/" className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
        Go to Home
      </a>
    </div>
  );
} 