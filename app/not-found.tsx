import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 text-white">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="mb-4">Could not find the requested resource</p>
      <Link
        href="/"
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Return Home
      </Link>
    </div>
  );
} 