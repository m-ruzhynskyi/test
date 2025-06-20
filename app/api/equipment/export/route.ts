import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/app/auth";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || undefined;
    const room = searchParams.get("room") || undefined;
    const sortBy = searchParams.get("sortBy") || "dateAdded";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build filter conditions
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { inventoryNumber: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (category) {
      where.categoryId = category;
    }
    
    if (room) {
      where.room = room;
    }

    // Fetch all equipment matching the filters
    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // Format data for Excel
    const formattedData = equipment.map(item => ({
      "Назва": item.name,
      "Інвентарний номер": item.inventoryNumber,
      "Категорія": item.category.name,
      "Кабінет": item.room,
      "Дата обліку": format(new Date(item.dateAdded), "dd.MM.yyyy", { locale: uk }),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Назва
      { wch: 20 }, // Інвентарний номер
      { wch: 20 }, // Категорія
      { wch: 15 }, // Кабінет
      { wch: 15 }, // Дата обліку
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Оргтехніка");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Create filename with current date
    const currentDate = format(new Date(), "yyyy-MM-dd", { locale: uk });
    const filename = `equipment_export_${currentDate}.xlsx`;

    // Return Excel file as response
    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting equipment:", error);
    return NextResponse.json(
      { error: "Failed to export equipment data" },
      { status: 500 }
    );
  }
}