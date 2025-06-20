import Link from "next/link";
import { Printer, Monitor, Laptop, Database, Users, FileSpreadsheet } from "lucide-react";
import { auth } from "./auth";

export default async function Home() {
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Система обліку оргтехніки</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Централізований облік та контроль за розміщенням та станом оргтехніки на підприємстві
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="text-center py-8">
          <p className="mb-4">Для доступу до системи необхідно авторизуватися</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Увійти в систему
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/equipment"
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h2 className="text-xl font-semibold">Перегляд оргтехніки</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Перегляд списку всієї оргтехніки з можливістю фільтрації та сортування
            </p>
          </Link>

          {isAdmin && (
            <>
              <Link
                href="/equipment/new"
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mr-4">
                    <Printer className="h-6 w-6 text-green-600 dark:text-green-300" />
                  </div>
                  <h2 className="text-xl font-semibold">Додати техніку</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Додавання нової одиниці техніки до системи обліку
                </p>
              </Link>

              <Link
                href="/categories"
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mr-4">
                    <Database className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <h2 className="text-xl font-semibold">Категорії</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Управління категоріями оргтехніки
                </p>
              </Link>

              <Link
                href="/admin"
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full mr-4">
                    <Users className="h-6 w-6 text-red-600 dark:text-red-300" />
                  </div>
                  <h2 className="text-xl font-semibold">Адміністрування</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Управління користувачами та налаштуваннями системи
                </p>
              </Link>

              <Link
                href="/equipment/export"
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full mr-4">
                    <FileSpreadsheet className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                  </div>
                  <h2 className="text-xl font-semibold">Експорт даних</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Експорт списку оргтехніки у форматі Excel
                </p>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
