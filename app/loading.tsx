export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      <p className="mt-4 text-lg">Loading...</p>
    </div>
  );
} 