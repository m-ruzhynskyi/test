import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/app/auth";
import { z } from "zod";

const prisma = new PrismaClient();

// Schema for category validation
const categorySchema = z.object({
  name: z.string().min(1, "Назва категорії обов'язкова"),
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build filter conditions
    const where: any = {};
    
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Execute query with filters and sorting
    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        _count: {
          select: {
            equipment: true,
          },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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
      categorySchema.parse(body);
    } catch (validationError) {
      return NextResponse.json(
        { error: "Validation error", details: validationError },
        { status: 400 }
      );
    }

    // Check if category name is unique
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: {
          equals: body.name,
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Категорія з такою назвою вже існує" },
        { status: 400 }
      );
    }

    // Create new category
    const newCategory = await prisma.category.create({
      data: {
        name: body.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
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

    // Get category ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category is in use
    const equipmentCount = await prisma.equipment.count({
      where: { categoryId: id },
    });

    if (equipmentCount > 0) {
      return NextResponse.json(
        { error: "Неможливо видалити категорію, яка використовується в обліку техніки" },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
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
    
    if (!body.id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }
    
    try {
      categorySchema.parse(body);
    } catch (validationError) {
      return NextResponse.json(
        { error: "Validation error", details: validationError },
        { status: 400 }
      );
    }

    // Check if category name is unique (excluding current category)
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: {
          equals: body.name,
          mode: "insensitive",
        },
        id: {
          not: body.id,
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Категорія з такою назвою вже існує" },
        { status: 400 }
      );
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: body.id },
      data: {
        name: body.name,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}