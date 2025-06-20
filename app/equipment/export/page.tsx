"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Loader2, 
  Search, 
  FileDown,
  ArrowLeft
} from "lucide-react";

type Category = {
  id: string;
  name: string;
};

export default function ExportEquipmentPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch("/api/equipment?page=1&pageSize=1");
        if (!response.ok) {
          throw new Error("Failed to fetch filter options");
        }
        const data = await response.json();
        setCategories(data.filters.categories);
        setRooms(data.filters.rooms);
      } catch (err) {
        setError("Помилка завантаження даних фільтрів. Спробуйте пізніше.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Handle export
  const handleExport = () => {
    setIsExporting(true);
    
    // Build query parameters
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedRoom) params.append("room", selectedRoom);
    
    // Create a link to download the file
    const exportUrl = `/api/equipment/export?${params.toString()}`;
    const link = document.createElement("a");
    link.href = exportUrl;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Reset exporting state after a delay
    setTimeout(() => {
      setIsExporting(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Завантаження...</span>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Експорт даних оргтехніки</h1>
        <Link
          href="/equipment"
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад до списку
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Параметри експорту</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Ви можете відфільтрувати дані перед експортом. Залиште поля порожніми, щоб експортувати всі дані.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="searchTerm"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Пошук за назвою або інвентарним номером
            </label>
            <div className="relative">
              <input
                id="searchTerm"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Категорія
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Всі категорії</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="room"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Кабінет
              </label>
              <select
                id="room"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Всі кабінети</option>
                {rooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center py-6">
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
            Натисніть кнопку нижче, щоб експортувати дані у форматі Excel.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Експортування...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-5 w-5" />
                Експортувати в Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}