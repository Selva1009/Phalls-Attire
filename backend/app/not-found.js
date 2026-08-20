import Image from "next/image";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      {/* 404 Image */}
      <Image 
        src="/notfound.jpg" 
        alt="404 Not Found" 
        width={250} 
        height={250} 
        className="mb-4"
      />

      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-900">Page not found!</h1>

      {/* Message */}
      <p className="text-gray-500 mt-2">The page you are looking for is not found.</p>

      {/* Okay Button */}
      <Link href="/">
        <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700">
          Okay
        </button>
      </Link>
    </div>
  );
}
