"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft, Trash } from "lucide-react";
import Link from "next/link";

type Equipment = {
  id: string;
  name: string;
  inventoryNumber: string;
  room: string;
  category: {
    name: string;
  };
};

export default function DeleteEquipmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Fetch equipment data
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch(`/api/equipment?id=${params.id}`);
        
        if (response.status === 404) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error("Failed to fetch equipment data");
        }
        
        const data = await response.json();
        setEquipment(data);
      } catch (err) {
        console.error("Error fetching equipment:", err);
        setError("Помилка завантаження даних. Спробуйте пізніше.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEquipment();
  }, [params.id]);

  // Handle delete
  const handleDelete = async () => {
    if (!equipment) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/equipment?id=${equipment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Помилка при видаленні запису");
      }

      // Redirect to equipment list on success
      router.push("/equipment");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Сталася помилка при видаленні запису");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Завантаження...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Обладнання не знайдено</h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Запис з вказаним ідентифікатором не існує або був видалений.
          </p>
          <Link
            href="/equipment"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Повернутися до списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Видалення техніки</h1>
        <Link
          href="/equipment"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4 inline" />
          Назад до списку
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start mb-6">
          <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
          <div>
            <h2 className="text-lg font-medium mb-2">Підтвердження видалення</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ви впевнені, що хочете видалити цю техніку? Ця дія не може бути скасована.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        {equipment && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md dark:bg-gray-700">
            <h3 className="font-medium mb-2">Інформація про техніку:</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Назва:</dt>
                <dd className="font-medium">{equipment.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Інвентарний номер:</dt>
                <dd className="font-medium">{equipment.inventoryNumber}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Категорія:</dt>
                <dd className="font-medium">{equipment.category.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Кабінет:</dt>
                <dd className="font-medium">{equipment.room}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Link
            href="/equipment"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Скасувати
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !equipment}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800 flex items-center"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Видалення...
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" />
                Видалити
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}