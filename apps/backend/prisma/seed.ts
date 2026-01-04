import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@savemate.local";
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "admin123456-change-me";
  const adminPasswordHash = await argon2.hash(adminPassword);

  const businessEmail =
    process.env.SEED_BUSINESS_EMAIL ?? "business@savemate.local";
  const businessPassword =
    process.env.SEED_BUSINESS_PASSWORD ?? "business123456-change-me";
  const businessPasswordHash = await argon2.hash(businessPassword);

  // Avoid `upsert` on MongoDB setups that are not replica sets.
  // (Prisma may require transactions for upsert, which require replica sets.)
  const existingCategory = await prisma.category.findUnique({
    where: { slug: "food" },
  });

  if (!existingCategory) {
    await prisma.category.create({
      data: { name: "Food", slug: "food" },
    });
  } else {
    await prisma.category.update({
      where: { slug: "food" },
      data: { name: "Food" },
    });
  }

  const fitnessCategory = await prisma.category.findUnique({
    where: { slug: "fitness" },
  });

  if (!fitnessCategory) {
    await prisma.category.create({
      data: { name: "Fitness", slug: "fitness" },
    });
  } else {
    await prisma.category.update({
      where: { slug: "fitness" },
      data: { name: "Fitness" },
    });
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "ADMIN",
      },
    });
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN", passwordHash: adminPasswordHash },
    });
  }

  const existingBusiness = await prisma.user.findUnique({
    where: { email: businessEmail },
  });

  const businessUser = existingBusiness
    ? await prisma.user.update({
        where: { email: businessEmail },
        data: { role: "BUSINESS", passwordHash: businessPasswordHash },
      })
    : await prisma.user.create({
        data: {
          email: businessEmail,
          passwordHash: businessPasswordHash,
          role: "BUSINESS",
        },
      });

  const existingProfile = await prisma.businessProfile.findUnique({
    where: { userId: businessUser.id },
  });

  const businessProfile = existingProfile
    ? await prisma.businessProfile.update({
        where: { userId: businessUser.id },
        data: {
          name: "Seed Business",
          city: "Warszawa",
          voivodeship: "MAZOWIECKIE",
        },
      })
    : await prisma.businessProfile.create({
        data: {
          userId: businessUser.id,
          name: "Seed Business",
          city: "Warszawa",
          voivodeship: "MAZOWIECKIE",
        },
      });

  const food = await prisma.category.findUnique({ where: { slug: "food" } });
  const fitness = await prisma.category.findUnique({
    where: { slug: "fitness" },
  });

  if (!food || !fitness) {
    throw new Error("Seed categories missing after creation/update");
  }

  const ensureDeal = async (input: {
    title: string;
    description: string;
    price: number;
    originalPrice: number;
    categoryId: string;
    city: string;
    voivodeship: string;
    tags: string[];
    validFrom: Date;
    validTo: Date;
    createdAt: Date;
  }) => {
    const discountPercent = Math.round(
      ((input.originalPrice - input.price) / input.originalPrice) * 100
    );

    const existing = await prisma.deal.findFirst({
      where: { title: input.title, businessId: businessProfile.id },
    });

    if (!existing) {
      await prisma.deal.create({
        data: {
          businessId: businessProfile.id,
          categoryId: input.categoryId,
          title: input.title,
          description: input.description,
          price: input.price,
          originalPrice: input.originalPrice,
          discountPercent,
          status: "APPROVED",
          city: input.city,
          voivodeship: input.voivodeship,
          tags: input.tags,
          validFrom: input.validFrom,
          validTo: input.validTo,
          createdAt: input.createdAt,
        },
      });
      return;
    }

    await prisma.deal.update({
      where: { id: existing.id },
      data: {
        categoryId: input.categoryId,
        description: input.description,
        price: input.price,
        originalPrice: input.originalPrice,
        discountPercent,
        status: "APPROVED",
        city: input.city,
        voivodeship: input.voivodeship,
        tags: input.tags,
        validFrom: input.validFrom,
        validTo: input.validTo,
        createdAt: input.createdAt,
      },
    });
  };

  const now = new Date();
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  await ensureDeal({
    title: "50% off pizza",
    description: "Large pizza promo for this month only.",
    price: 29.99,
    originalPrice: 59.99,
    categoryId: food.id,
    city: "Warszawa",
    voivodeship: "MAZOWIECKIE",
    tags: ["food"],
    validFrom: startOfMonth,
    validTo: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    createdAt: new Date(startOfMonth.getTime() + 2 * 60 * 60 * 1000),
  });

  await ensureDeal({
    title: "Gym membership -30%",
    description: "Annual plan discounted. Limited slots.",
    price: 699,
    originalPrice: 999,
    categoryId: fitness.id,
    city: "Kraków",
    voivodeship: "MALOPOLSKIE",
    tags: ["fitness"],
    validFrom: startOfMonth,
    validTo: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1)),
    createdAt: new Date(startOfMonth.getTime() + 3 * 60 * 60 * 1000),
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
