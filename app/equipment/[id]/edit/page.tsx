"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Schema for equipment validation
const equipmentSchema = z.object({
  id: z.string().min(1, "ID обов'язковий"),
  name: z.string().min(1, "Назва обов'язкова"),
  inventoryNumber: z.string().min(1, "Інвентарний номер обов'язковий"),
  categoryId: z.string().min(1, "Категорія обов'язкова"),
  room: z.string().min(1, "Кабінет обов'язковий"),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

type Category = {
  id: string;
  name: string;
};

export default function EditEquipmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      id: params.id,
      name: "",
      inventoryNumber: "",
      categoryId: "",
      room: "",
    },
  });

  // Fetch equipment data and form options
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch equipment details
        const equipmentResponse = await fetch(`/api/equipment?id=${params.id}`);
        
        if (equipmentResponse.status === 404) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }
        
        if (!equipmentResponse.ok) {
          throw new Error("Failed to fetch equipment data");
        }
        
        const equipmentData = await equipmentResponse.json();
        
        // Fetch filter options for rooms and categories
        const optionsResponse = await fetch("/api/equipment?page=1&pageSize=1");
        if (!optionsResponse.ok) {
          throw new Error("Failed to fetch form options");
        }
        
        const optionsData = await optionsResponse.json();
        
        // Set form data
        reset({
          id: equipmentData.id,
          name: equipmentData.name,
          inventoryNumber: equipmentData.inventoryNumber,
          categoryId: equipmentData.categoryId,
          room: equipmentData.room,
        });
        
        setCategories(optionsData.filters.categories);
        setRooms(optionsData.filters.rooms);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Помилка завантаження даних. Спробуйте пізніше.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, reset]);

  const onSubmit = async (data: EquipmentFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/equipment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Помилка при оновленні запису");
      }

      // Redirect to equipment list on success
      router.push("/equipment");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Сталася помилка при оновленні запису");
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-2xl font-bold">Редагувати техніку</h1>
        <Link
          href="/equipment"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4 inline" />
          Назад до списку
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register("id")} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Назва техніки *
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="inventoryNumber"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Інвентарний номер *
              </label>
              <input
                id="inventoryNumber"
                type="text"
                {...register("inventoryNumber")}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isSubmitting}
              />
              {errors.inventoryNumber && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.inventoryNumber.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Категорія *
              </label>
              <select
                id="categoryId"
                {...register("categoryId")}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isSubmitting}
              >
                <option value="">Виберіть категорію</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="room"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Кабінет *
              </label>
              <div className="relative">
                <input
                  id="room"
                  type="text"
                  list="roomsList"
                  {...register("room")}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={isSubmitting}
                />
                <datalist id="roomsList">
                  {rooms.map((room) => (
                    <option key={room} value={room} />
                  ))}
                </datalist>
              </div>
              {errors.room && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.room.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/equipment"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Скасувати
            </Link>
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
  );
}