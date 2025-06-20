"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Edit,
  Trash,
  Loader2
} from "lucide-react";

type Equipment = {
  id: string;
  name: string;
  inventoryNumber: string;
  room: string;
  dateAdded: string;
  category: {
    id: string;
    name: string;
  };
};

type Category = {
  id: string;
  name: string;
};

type PaginationInfo = {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type FilterOptions = {
  rooms: string[];
  categories: Category[];
};

export default function EquipmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 10,
    pageCount: 0,
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    rooms: [],
    categories: [],
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedRoom, setSelectedRoom] = useState(searchParams.get("room") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "dateAdded");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "desc");

  // Fetch equipment data
  const fetchEquipment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedRoom) params.append("room", selectedRoom);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("page", pagination.page.toString());
      params.append("pageSize", pagination.pageSize.toString());

      const response = await fetch(`/api/equipment?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch equipment data");
      }

      const data = await response.json();
      setEquipment(data.equipment);
      setPagination(data.pagination);
      setFilterOptions(data.filters);
    } catch (err) {
      setError("Помилка завантаження даних. Спробуйте пізніше.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchEquipment();
  }, [pagination.page, sortBy, sortOrder]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pagination.page = 1; // Reset to first page on new search
    fetchEquipment();
  };

  // Handle filter changes
  const handleFilterChange = () => {
    pagination.page = 1; // Reset to first page on filter change
    fetchEquipment();
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.pageCount) return;
    setPagination({ ...pagination, page: newPage });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy", { locale: uk });
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Облік оргтехніки</h1>

      {/* Search and filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Пошук за назвою або інвентарним номером"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Пошук
          </button>
        </form>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Категорія
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                handleFilterChange();
              }}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Всі категорії</option>
              {filterOptions.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Кабінет
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value);
                handleFilterChange();
              }}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Всі кабінети</option>
              {filterOptions.rooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Equipment table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Завантаження...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500 text-center">{error}</div>
        ) : equipment.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Не знайдено жодної одиниці техніки за вказаними критеріями
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Назва
                        {sortBy === "name" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("inventoryNumber")}
                    >
                      <div className="flex items-center">
                        Інвентарний номер
                        {sortBy === "inventoryNumber" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Категорія
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("room")}
                    >
                      <div className="flex items-center">
                        Кабінет
                        {sortBy === "room" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("dateAdded")}
                    >
                      <div className="flex items-center">
                        Дата обліку
                        {sortBy === "dateAdded" && (
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {equipment.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.inventoryNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {item.room}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDate(item.dateAdded)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/equipment/${item.id}/edit`)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/equipment/${item.id}/delete`)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pageCount > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    Попередня
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pageCount}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    Наступна
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Показано <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span> по{" "}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                      </span>{" "}
                      з <span className="font-medium">{pagination.total}</span> результатів
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                      >
                        <span className="sr-only">Попередня</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: pagination.pageCount }, (_, i) => i + 1)
                        .filter(
                          (page) =>
                            page === 1 ||
                            page === pagination.pageCount ||
                            Math.abs(page - pagination.page) <= 1
                        )
                        .map((page, index, array) => {
                          // Add ellipsis
                          if (index > 0 && page - array[index - 1] > 1) {
                            return (
                              <span
                                key={`ellipsis-${page}`}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                              >
                                ...
                              </span>
                            );
                          }
                          
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pagination.page === page
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pageCount}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                      >
                        <span className="sr-only">Наступна</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}