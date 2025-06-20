"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { 
  Loader2, 
  Plus, 
  Search, 
  Edit, 
  Trash, 
  X, 
  Check,
  AlertCircle
} from "lucide-react";

// Schema for category validation
const categorySchema = z.object({
  name: z.string().min(1, "Назва категорії обов'язкова"),
});

type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    equipment: number;
  };
};

export default function CategoriesPage() {
  const router = useRouter();
  
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalError, setModalError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/categories?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError("Помилка завантаження даних. Спробуйте пізніше.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCategories();
  };

  // Open modal for adding a new category
  const openAddModal = () => {
    setModalMode("add");
    setCategoryName("");
    setEditingCategoryId(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing a category
  const openEditModal = (category: Category) => {
    setModalMode("edit");
    setCategoryName(category.name);
    setEditingCategoryId(category.id);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      // Validate input
      const result = categorySchema.safeParse({ name: categoryName });
      if (!result.success) {
        setModalError("Назва категорії обов'язкова");
        return;
      }

      const method = modalMode === "add" ? "POST" : "PUT";
      const body = modalMode === "add" 
        ? JSON.stringify({ name: categoryName })
        : JSON.stringify({ id: editingCategoryId, name: categoryName });

      const response = await fetch("/api/categories", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Помилка при збереженні категорії");
      }

      // Close modal and refresh categories
      closeModal();
      fetchCategories();
    } catch (err: any) {
      setModalError(err.message || "Сталася помилка при збереженні категорії");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirm = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };

  // Close delete confirmation
  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
    setDeleteError(null);
  };

  // Handle category deletion
  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/categories?id=${categoryToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Помилка при видаленні категорії");
      }

      // Close confirmation and refresh categories
      closeDeleteConfirm();
      fetchCategories();
    } catch (err: any) {
      setDeleteError(err.message || "Сталася помилка при видаленні категорії");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Категорії оргтехніки</h1>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Додати категорію
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Пошук за назвою категорії"
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
      </div>

      {/* Categories table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Завантаження...</span>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500 text-center">{error}</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Не знайдено жодної категорії
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Назва категорії
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Кількість техніки
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
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {category._count.equipment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(category)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(category)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        disabled={category._count.equipment > 0}
                        title={category._count.equipment > 0 ? "Неможливо видалити категорію, яка використовується" : ""}
                        className={`${category._count.equipment > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium">
                {modalMode === "add" ? "Додати категорію" : "Редагувати категорію"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-4">
                {modalError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-200">
                    {modalError}
                  </div>
                )}
                
                <div>
                  <label
                    htmlFor="categoryName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Назва категорії *
                  </label>
                  <input
                    id="categoryName"
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 p-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  disabled={isSubmitting}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                      Збереження...
                    </>
                  ) : (
                    "Зберегти"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center">
                <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-medium">Підтвердження видалення</h3>
              </div>
            </div>
            
            <div className="p-4">
              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-200">
                  {deleteError}
                </div>
              )}
              
              <p className="text-gray-700 dark:text-gray-300">
                Ви впевнені, що хочете видалити категорію "{categoryToDelete.name}"?
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 p-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={isDeleting}
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                    Видалення...
                  </>
                ) : (
                  "Видалити"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}