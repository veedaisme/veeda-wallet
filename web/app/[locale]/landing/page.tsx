import React from 'react';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navigation Header */}
      <nav className="w-full p-4 bg-white shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center px-4 sm:px-6 lg:px-8">
          <div className="text-2xl font-bold text-primary"> {/* Changed from text-tangerine-600 */}
            <Link href="/" aria-label="Clair Home">Clair</Link>
          </div>
          <div className="mt-2 sm:mt-0">
            <Link href="/auth/login" passHref>
              <button
                className="text-gray-600 hover:text-primary font-medium mr-2 sm:mr-4 px-3 py-2 sm:px-4 rounded-md transition duration-300 ease-in-out" /* Changed hover from hover:text-tangerine-500 */
                aria-label="Login to your account"
              >
                Login
              </button>
            </Link>
            <Link href="/auth/signup" passHref>
              <button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-3 sm:px-4 rounded-md shadow-sm transition duration-300 ease-in-out" /* Changed from bg-tangerine-500 hover:bg-tangerine-600 and text-white */
                aria-label="Sign up for a new account"
              >
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="text-center p-8 flex-grow flex flex-col items-center justify-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4">
          Gain financial clairvoyance and conquer your spending.
        </h1>
        <p className="text-md sm:text-lg text-gray-600 mb-8 max-w-xl sm:max-w-2xl px-4">
          Clair helps you understand your financial future with simplicity and aggregation. Effortlessly track your spending and make informed decisions for a brighter financial future.
        </p>
        <Link href="/auth/login" passHref>
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-lg text-lg shadow-md transition duration-300 ease-in-out" /* Changed from bg-tangerine-500 hover:bg-tangerine-600 and text-white */
            aria-label="Get started with Clair by logging in or creating an account"
          >
            Get Started
          </button>
        </Link>
      </header>

      {/* Bento Grid Section */}
      <main className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Simplicity */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4" aria-hidden="true"> {/* Changed from bg-tangerine-100 */}
                <span className="text-primary text-2xl font-bold">S</span> {/* Changed from text-tangerine-500 */}
              </div>
              <h2 id="simplicity-heading" className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Simplicity</h2>
              <p className="text-gray-600" aria-labelledby="simplicity-heading">
                Effortlessly track your spending with our intuitive interface.
              </p>
            </div>

            {/* Aggregation */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4" aria-hidden="true"> {/* Changed from bg-tangerine-100 */}
                <span className="text-primary text-2xl font-bold">A</span> {/* Changed from text-tangerine-500 */}
              </div>
              <h2 id="aggregation-heading" className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Aggregation</h2>
              <p className="text-gray-600" aria-labelledby="aggregation-heading">
                See all your financial data in one place for a clear overview.
              </p>
            </div>

            {/* Financial Clarity */}
            <div className="bg-gray-50 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4" aria-hidden="true"> {/* Changed from bg-tangerine-100 */}
                <span className="text-primary text-2xl font-bold">C</span> {/* Changed from text-tangerine-500 */}
              </div>
              <h2 id="clarity-heading" className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Financial Clarity</h2>
              <p className="text-gray-600" aria-labelledby="clarity-heading">
                Understand your spending habits and make informed decisions for a brighter financial future.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center p-4 sm:p-6 text-gray-600 bg-gray-200">
        <p>&copy; {new Date().getFullYear()} Clair. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
