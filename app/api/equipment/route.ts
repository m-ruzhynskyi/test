import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/app/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for equipment validation
const equipmentSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  inventoryNumber: z.string().min(1, "Інвентарний номер обов'язковий"),
  categoryId: z.string().min(1, "Категорія обов'язкова"),
  room: z.string().min(1, "Кабінет обов'язковий"),
});

// Schema for equipment update validation (includes ID)
const equipmentUpdateSchema = equipmentSchema.extend({
  id: z.string().min(1, "ID обов'язковий"),
});

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

    // Check if requesting a single equipment item by ID
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (id) {
      const equipment = await prisma.equipment.findUnique({
        where: { id },
        include: {
          category: true,
        },
      });

      if (!equipment) {
        return NextResponse.json(
          { error: "Equipment not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(equipment);
    }

    // Get query parameters for list view
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || undefined;
    const room = searchParams.get("room") || undefined;
    const sortBy = searchParams.get("sortBy") || "dateAdded";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Calculate pagination
    const skip = (page - 1) * pageSize;

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

    // Execute query with filters, sorting, and pagination
    const [equipment, totalCount] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: pageSize,
      }),
      prisma.equipment.count({ where }),
    ]);

    // Get unique rooms for filtering
    const rooms = await prisma.equipment.findMany({
      select: {
        room: true,
      },
      distinct: ["room"],
    });

    // Get categories for filtering
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      equipment,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        pageCount: Math.ceil(totalCount / pageSize),
      },
      filters: {
        rooms: rooms.map(r => r.room),
        categories,
      },
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    try {
      equipmentSchema.parse(body);
    } catch (validationError) {
      return NextResponse.json(
        { error: "Validation error", details: validationError },
        { status: 400 }
      );
    }

    // Check if inventory number is unique
    const existingEquipment = await prisma.equipment.findUnique({
      where: { inventoryNumber: body.inventoryNumber },
    });

    if (existingEquipment) {
      return NextResponse.json(
        { error: "Інвентарний номер вже використовується" },
        { status: 400 }
      );
    }

    // Create new equipment
    const newEquipment = await prisma.equipment.create({
      data: {
        name: body.name,
        inventoryNumber: body.inventoryNumber,
        categoryId: body.categoryId,
        room: body.room,
        dateAdded: new Date(),
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    });

    // Log the action in history
    await prisma.equipmentHistory.create({
      data: {
        equipmentId: newEquipment.id,
        action: "created",
        userId: session.user.id,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Failed to create equipment" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    try {
      equipmentUpdateSchema.parse(body);
    } catch (validationError) {
      return NextResponse.json(
        { error: "Validation error", details: validationError },
        { status: 400 }
      );
    }

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: body.id },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "Обладнання не знайдено" },
        { status: 404 }
      );
    }

    // Check if inventory number is unique (excluding current equipment)
    const duplicateInventory = await prisma.equipment.findFirst({
      where: { 
        inventoryNumber: body.inventoryNumber,
        id: { not: body.id }
      },
    });

    if (duplicateInventory) {
      return NextResponse.json(
        { error: "Інвентарний номер вже використовується" },
        { status: 400 }
      );
    }

    // Prepare changes for history logging
    const changes: Record<string, any> = {};
    if (existingEquipment.name !== body.name) changes.name = { from: existingEquipment.name, to: body.name };
    if (existingEquipment.inventoryNumber !== body.inventoryNumber) changes.inventoryNumber = { from: existingEquipment.inventoryNumber, to: body.inventoryNumber };
    if (existingEquipment.categoryId !== body.categoryId) changes.categoryId = { from: existingEquipment.categoryId, to: body.categoryId };
    if (existingEquipment.room !== body.room) changes.room = { from: existingEquipment.room, to: body.room };

    // Update equipment
    const updatedEquipment = await prisma.equipment.update({
      where: { id: body.id },
      data: {
        name: body.name,
        inventoryNumber: body.inventoryNumber,
        categoryId: body.categoryId,
        room: body.room,
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    });

    // Log the action in history if there were changes
    if (Object.keys(changes).length > 0) {
      await prisma.equipmentHistory.create({
        data: {
          equipmentId: updatedEquipment.id,
          action: "updated",
          details: JSON.stringify(changes),
          userId: session.user.id,
          timestamp: new Date(),
        },
      });
    }

    return NextResponse.json(updatedEquipment);
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "Failed to update equipment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Get equipment ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Equipment ID is required" },
        { status: 400 }
      );
    }

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: "Обладнання не знайдено" },
        { status: 404 }
      );
    }

    // Log the deletion in history before deleting the equipment
    await prisma.equipmentHistory.create({
      data: {
        equipmentId: id,
        action: "deleted",
        details: JSON.stringify({
          name: existingEquipment.name,
          inventoryNumber: existingEquipment.inventoryNumber,
          category: existingEquipment.category.name,
          room: existingEquipment.room,
        }),
        userId: session.user.id,
        timestamp: new Date(),
      },
    });

    // Delete equipment
    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { error: "Failed to delete equipment" },
      { status: 500 }
    );
  }
}
