"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, LogOut, User, Settings } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isAuthenticated = status === "authenticated";
  const isLoginPage = pathname === "/login";

  // Don't show navbar on login page
  if (isLoginPage) return null;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  const navLinks = [
    { href: "/", label: "Головна", show: true },
    { href: "/equipment", label: "Оргтехніка", show: isAuthenticated },
    { href: "/categories", label: "Категорії", show: isAdmin },
    { href: "/admin", label: "Адміністрування", show: isAdmin },
  ].filter((link) => link.show);

  return (
    <nav className="bg-white shadow dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold text-gray-800 dark:text-white"
            >
              Облік оргтехніки
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    pathname === link.href
                      ? "bg-gray-900 text-white dark:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && (
                <div className="relative ml-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {session.user.name || session.user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Вийти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="sr-only">Відкрити меню</span>
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  pathname === link.href
                    ? "bg-gray-900 text-white dark:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <User className="inline-block mr-2 h-4 w-4" />
                    {session.user.name || session.user.email}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <LogOut className="inline-block mr-2 h-4 w-4" />
                    Вийти
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}