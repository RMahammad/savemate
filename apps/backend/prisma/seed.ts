import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

type SeedCategory = { name: string; slug: string };
type SeedBusiness = {
  email: string;
  password: string;
  name: string;
  nip?: string;
  city: string;
  voivodeship: string;
};

type SeedDealInput = {
  title: string;
  description: string;
  usageTerms: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  categorySlug: string;
  city: string;
  voivodeship: string;
  tags: string[];
  validFrom: Date;
  validTo: Date;
  createdAt: Date;
};

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@savemate.local";
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? "admin123456-change-me";
  const adminPasswordHash = await argon2.hash(adminPassword);

  const ensureCategory = async (c: SeedCategory) => {
    const existing = await prisma.category.findUnique({
      where: { slug: c.slug },
    });
    if (!existing)
      return prisma.category.create({ data: { name: c.name, slug: c.slug } });
    return prisma.category.update({
      where: { slug: c.slug },
      data: { name: c.name },
    });
  };

  const ensureUser = async (input: {
    email: string;
    password: string;
    role: "ADMIN" | "USER" | "BUSINESS";
  }) => {
    const passwordHash = await argon2.hash(input.password);
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!existing) {
      return prisma.user.create({
        data: { email: input.email, passwordHash, role: input.role },
      });
    }
    return prisma.user.update({
      where: { email: input.email },
      data: { role: input.role, passwordHash },
    });
  };

  const ensureBusinessProfile = async (
    userId: string,
    input: Omit<SeedBusiness, "email" | "password">
  ) => {
    const existing = await prisma.businessProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      return prisma.businessProfile.create({
        data: {
          userId,
          name: input.name,
          nip: input.nip,
          city: input.city,
          voivodeship: input.voivodeship,
        },
      });
    }
    return prisma.businessProfile.update({
      where: { userId },
      data: {
        name: input.name,
        nip: input.nip,
        city: input.city,
        voivodeship: input.voivodeship,
      },
    });
  };

  // Avoid `upsert` on MongoDB setups that are not replica sets.
  // (Prisma may require transactions for upsert, which require replica sets.)
  const seedCategories: SeedCategory[] = [
    { name: "Food", slug: "food" },
    { name: "Fitness", slug: "fitness" },
    { name: "Beauty", slug: "beauty" },
    { name: "Electronics", slug: "electronics" },
    { name: "Travel", slug: "travel" },
    { name: "Services", slug: "services" },
  ];

  for (const c of seedCategories) await ensureCategory(c);

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

  const seedBusinesses: SeedBusiness[] = [
    {
      email: process.env.SEED_BUSINESS_EMAIL ?? "business@savemate.local",
      password:
        process.env.SEED_BUSINESS_PASSWORD ?? "business123456-change-me",
      name: "Seed Business (Central)",
      nip: "5210000000",
      city: "Warszawa",
      voivodeship: "MAZOWIECKIE",
    },
    {
      email: "coffee.gdansk@savemate.local",
      password: "business123456-change-me",
      name: "Baltic Coffee Roasters",
      nip: "5830000000",
      city: "Gdańsk",
      voivodeship: "POMORSKIE",
    },
    {
      email: "wellness.krakow@savemate.local",
      password: "business123456-change-me",
      name: "Wellness Studio Kraków",
      nip: "6760000000",
      city: "Kraków",
      voivodeship: "MALOPOLSKIE",
    },
  ];

  const businessProfiles = [] as Array<{
    id: string;
    city: string;
    voivodeship: string;
  }>;
  for (const b of seedBusinesses) {
    const user = await ensureUser({
      email: b.email,
      password: b.password,
      role: "BUSINESS",
    });
    const profile = await ensureBusinessProfile(user.id, {
      name: b.name,
      nip: b.nip,
      city: b.city,
      voivodeship: b.voivodeship,
    });
    businessProfiles.push({
      id: profile.id,
      city: profile.city ?? b.city,
      voivodeship: profile.voivodeship ?? b.voivodeship,
    });
  }
  const categoriesBySlug = new Map(
    (
      await prisma.category.findMany({
        where: { slug: { in: seedCategories.map((c) => c.slug) } },
      })
    ).map((c) => [c.slug, c])
  );

  for (const c of seedCategories) {
    if (!categoriesBySlug.get(c.slug)) {
      throw new Error(`Seed category missing after creation/update: ${c.slug}`);
    }
  }

  const ensureDeal = async (businessId: string, input: SeedDealInput) => {
    const category = categoriesBySlug.get(input.categorySlug);
    if (!category)
      throw new Error(`Unknown categorySlug: ${input.categorySlug}`);

    const discountPercent = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          ((input.originalPrice - input.price) / input.originalPrice) * 100
        )
      )
    );

    const existing = await prisma.deal.findFirst({
      where: { title: input.title, businessId },
    });

    const data = {
      businessId,
      categoryId: category.id,
      title: input.title,
      description: input.description,
      usageTerms: input.usageTerms,
      imageUrl: input.imageUrl,
      price: input.price,
      originalPrice: input.originalPrice,
      discountPercent,
      status: input.status,
      city: input.city,
      voivodeship: input.voivodeship,
      tags: input.tags,
      validFrom: input.validFrom,
      validTo: input.validTo,
      createdAt: input.createdAt,
    };

    if (!existing) {
      await prisma.deal.create({ data });
      return;
    }

    await prisma.deal.update({ where: { id: existing.id }, data });
  };

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  const deals: SeedDealInput[] = [
    {
      title: "Neapolitan pizza 50% off (Tue–Thu)",
      description:
        "Get a classic Neapolitan pizza with fresh mozzarella and basil. Valid for dine-in and takeaway. Perfect for a quick lunch or evening with friends.",
      usageTerms:
        "Valid Tue–Thu 12:00–21:00. One coupon per person per visit. Not combinable with other promotions. Reservation recommended.",
      imageUrl: "/uploads/seed/deal-food-01.svg",
      price: 34.9,
      originalPrice: 69.9,
      status: "APPROVED",
      categorySlug: "food",
      city: "Warszawa",
      voivodeship: "MAZOWIECKIE",
      tags: ["pizza", "italian", "dine-in", "takeaway"],
      validFrom: startOfMonth,
      validTo: nextMonth,
      createdAt: new Date(startOfMonth.getTime() + 2 * day),
    },
    {
      title: "Coffee + croissant combo -35%",
      description:
        "Specialty coffee (espresso-based) plus a buttery croissant. Great morning combo near the old town.",
      usageTerms:
        "Valid every day 07:30–12:00. One combo per coupon. While supplies last.",
      imageUrl: "/uploads/seed/deal-food-02.svg",
      price: 18,
      originalPrice: 28,
      status: "APPROVED",
      categorySlug: "food",
      city: "Gdańsk",
      voivodeship: "POMORSKIE",
      tags: ["coffee", "breakfast", "bakery"],
      validFrom: new Date(startOfMonth.getTime() + 3 * day),
      validTo: new Date(nextMonth.getTime() + 14 * day),
      createdAt: new Date(
        startOfMonth.getTime() + 3 * day + 2 * 60 * 60 * 1000
      ),
    },
    {
      title: "Lunch set: soup + main -25%",
      description:
        "Daily rotating lunch menu featuring seasonal ingredients. Includes soup and a main dish with a side.",
      usageTerms:
        "Valid Mon–Fri 11:00–16:00. Not valid on public holidays. Cannot be combined with student discounts.",
      imageUrl: "/uploads/seed/deal-food-03.svg",
      price: 29,
      originalPrice: 39,
      status: "PENDING",
      categorySlug: "food",
      city: "Kraków",
      voivodeship: "MALOPOLSKIE",
      tags: ["lunch", "daily-menu", "seasonal"],
      validFrom: new Date(now.getTime() - 2 * day),
      validTo: new Date(now.getTime() + 26 * day),
      createdAt: new Date(now.getTime() - 1 * day),
    },
    {
      title: "Premium gym monthly pass -30%",
      description:
        "Access to gym floor + cardio + free introductory trainer session. Includes locker and showers.",
      usageTerms:
        "Valid for new members only. One-time purchase per person. Trainer session must be booked within 14 days.",
      imageUrl: "/uploads/seed/deal-fitness-01.svg",
      price: 139,
      originalPrice: 199,
      status: "APPROVED",
      categorySlug: "fitness",
      city: "Kraków",
      voivodeship: "MALOPOLSKIE",
      tags: ["gym", "membership", "trainer"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 30 * day),
      createdAt: new Date(startOfMonth.getTime() + 1 * day),
    },
    {
      title: "Yoga for beginners (4 classes) -20%",
      description:
        "Four beginner-friendly yoga sessions focusing on mobility and breathing. Small group size.",
      usageTerms:
        "Booking required. Valid for 60 days from first visit. Bring your own mat or rent on-site.",
      imageUrl: "/uploads/seed/deal-fitness-02.svg",
      price: 160,
      originalPrice: 200,
      status: "APPROVED",
      categorySlug: "fitness",
      city: "Warszawa",
      voivodeship: "MAZOWIECKIE",
      tags: ["yoga", "classes", "mobility"],
      validFrom: new Date(startOfMonth.getTime() + 5 * day),
      validTo: new Date(nextMonth.getTime() + 25 * day),
      createdAt: new Date(
        startOfMonth.getTime() + 5 * day + 3 * 60 * 60 * 1000
      ),
    },
    {
      title: "Haircut + styling -40%",
      description:
        "Professional haircut with wash and styling. Includes consultation for face shape and hair type.",
      usageTerms:
        "Valid Mon–Thu. Appointment required. Long hair surcharge may apply.",
      imageUrl: "/uploads/seed/deal-beauty-01.svg",
      price: 90,
      originalPrice: 150,
      status: "APPROVED",
      categorySlug: "beauty",
      city: "Gdańsk",
      voivodeship: "POMORSKIE",
      tags: ["hair", "salon", "styling"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 10 * day),
      createdAt: new Date(startOfMonth.getTime() + 4 * day),
    },
    {
      title: "Manicure + hand care set -30%",
      description:
        "Classic manicure with cuticle care and moisturizing hand treatment.",
      usageTerms: "Appointment required. Not valid for gel extensions.",
      imageUrl: "/uploads/seed/deal-beauty-02.svg",
      price: 70,
      originalPrice: 100,
      status: "PENDING",
      categorySlug: "beauty",
      city: "Warszawa",
      voivodeship: "MAZOWIECKIE",
      tags: ["manicure", "self-care"],
      validFrom: new Date(now.getTime() - 1 * day),
      validTo: new Date(now.getTime() + 45 * day),
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      title: "Smartwatch strap bundle -25%",
      description:
        "Bundle of 2 straps (sport + leather-look) compatible with popular smartwatch sizes.",
      usageTerms:
        "Valid while stock lasts. Exchange within 14 days with receipt.",
      imageUrl: "/uploads/seed/deal-electronics-01.svg",
      price: 89,
      originalPrice: 119,
      status: "APPROVED",
      categorySlug: "electronics",
      city: "Kraków",
      voivodeship: "MALOPOLSKIE",
      tags: ["electronics", "accessories", "smartwatch"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 40 * day),
      createdAt: new Date(startOfMonth.getTime() + 6 * day),
    },
    {
      title: "Laptop cleaning + thermal paste refresh -35%",
      description:
        "Professional internal cleaning and thermal paste replacement to reduce temperatures and fan noise.",
      usageTerms:
        "Drop-off required. Turnaround 24–48h. Not valid for liquid damage.",
      imageUrl: "/uploads/seed/deal-services-01.svg",
      price: 129,
      originalPrice: 199,
      status: "APPROVED",
      categorySlug: "services",
      city: "Warszawa",
      voivodeship: "MAZOWIECKIE",
      tags: ["laptop", "service", "maintenance"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 20 * day),
      createdAt: new Date(startOfMonth.getTime() + 7 * day),
    },
    {
      title: "Weekend city break: hotel -20%",
      description:
        "One-night stay for two in a centrally located hotel, breakfast included.",
      usageTerms:
        "Reservation required. Valid Fri–Sun only. Subject to availability.",
      imageUrl: "/uploads/seed/deal-travel-01.svg",
      price: 399,
      originalPrice: 499,
      status: "APPROVED",
      categorySlug: "travel",
      city: "Kraków",
      voivodeship: "MALOPOLSKIE",
      tags: ["hotel", "weekend", "breakfast"],
      validFrom: new Date(startOfMonth.getTime() + 10 * day),
      validTo: new Date(nextMonth.getTime() + 60 * day),
      createdAt: new Date(startOfMonth.getTime() + 8 * day),
    },
    {
      title: "Car interior detailing -30%",
      description:
        "Complete interior cleaning: vacuuming, plastics, windows, and fabric shampoo.",
      usageTerms:
        "Appointment required. Service time 2–4h depending on vehicle size.",
      imageUrl: "/uploads/seed/deal-services-02.svg",
      price: 210,
      originalPrice: 300,
      status: "APPROVED",
      categorySlug: "services",
      city: "Gdańsk",
      voivodeship: "POMORSKIE",
      tags: ["car", "detailing", "cleaning"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 25 * day),
      createdAt: new Date(startOfMonth.getTime() + 9 * day),
    },
    {
      title: "Sushi set for two -15%",
      description:
        "Set of 40 pieces including maki and nigiri. Freshly prepared and packed for takeaway.",
      usageTerms: "Pre-order recommended. Not valid on Dec 31 and Jan 1.",
      imageUrl: "/uploads/seed/deal-food-04.svg",
      price: 169,
      originalPrice: 199,
      status: "APPROVED",
      categorySlug: "food",
      city: "Warszawa",
      voivodeship: "MAZOWIECKIE",
      tags: ["sushi", "takeaway", "dinner"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 15 * day),
      createdAt: new Date(startOfMonth.getTime() + 11 * day),
    },
    {
      title: "Massage (60 min) -25%",
      description:
        "Relaxing full-body massage focused on back and shoulders. Great after a long week.",
      usageTerms:
        "Appointment required. Please arrive 10 minutes early. Contraindications apply.",
      imageUrl: "/uploads/seed/deal-beauty-03.svg",
      price: 150,
      originalPrice: 200,
      status: "APPROVED",
      categorySlug: "beauty",
      city: "Kraków",
      voivodeship: "MALOPOLSKIE",
      tags: ["massage", "relax", "wellness"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 35 * day),
      createdAt: new Date(startOfMonth.getTime() + 12 * day),
    },
    {
      title: "Dental checkup + hygiene -20%",
      description: "Comprehensive dental checkup plus basic hygiene cleaning.",
      usageTerms: "Appointment required. Not valid for complex procedures.",
      imageUrl: "/uploads/seed/deal-services-03.svg",
      price: 240,
      originalPrice: 300,
      status: "PENDING",
      categorySlug: "services",
      city: "Warszawa",
      voivodeship: "MAZOWIECKIE",
      tags: ["health", "dental", "hygiene"],
      validFrom: now,
      validTo: new Date(now.getTime() + 90 * day),
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      title: "Basic website audit -50%",
      description:
        "Quick audit covering SEO basics, performance, accessibility, and top 10 actionable fixes.",
      usageTerms:
        "Remote service. Delivery within 5 business days. Includes one follow-up call (20 min).",
      imageUrl: "/uploads/seed/deal-services-04.svg",
      price: 249,
      originalPrice: 499,
      status: "APPROVED",
      categorySlug: "services",
      city: "Kraków",
      voivodeship: "MALOPOLSKIE",
      tags: ["seo", "audit", "digital"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 60 * day),
      createdAt: new Date(startOfMonth.getTime() + 13 * day),
    },
    {
      title: "Electric scooter tune-up -30%",
      description:
        "Tune-up includes brake adjustment, tire pressure check, and safety inspection.",
      usageTerms: "Drop-off required. Parts not included. Service time 1–2h.",
      imageUrl: "/uploads/seed/deal-electronics-02.svg",
      price: 119,
      originalPrice: 169,
      status: "APPROVED",
      categorySlug: "electronics",
      city: "Gdańsk",
      voivodeship: "POMORSKIE",
      tags: ["scooter", "service", "mobility"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 45 * day),
      createdAt: new Date(startOfMonth.getTime() + 14 * day),
    },
    {
      title: "Premium headphones -15% (limited stock)",
      description:
        "Over-ear wireless headphones with active noise cancelling and 30h battery.",
      usageTerms: "In-store pickup only. While stock lasts. Warranty included.",
      imageUrl: "/uploads/seed/deal-electronics-03.svg",
      price: 849,
      originalPrice: 999,
      status: "REJECTED",
      categorySlug: "electronics",
      city: "Warszawa",
      voivodeship: "MAZOWIECKIE",
      tags: ["headphones", "audio", "anc"],
      validFrom: now,
      validTo: new Date(now.getTime() + 30 * day),
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    },
    {
      title: "Spa day package -20%",
      description:
        "Includes sauna access, jacuzzi session, and herbal tea set. A full afternoon reset.",
      usageTerms:
        "Booking required. Adults only. Bring your own towel or rent on-site.",
      imageUrl: "/uploads/seed/deal-beauty-04.svg",
      price: 240,
      originalPrice: 300,
      status: "REJECTED",
      categorySlug: "beauty",
      city: "Kraków",
      voivodeship: "MALOPOLSKIE",
      tags: ["spa", "sauna", "relax"],
      validFrom: now,
      validTo: new Date(now.getTime() + 60 * day),
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      title: "Old deal example (expired) -60%",
      description:
        "This is an intentionally expired deal used to test EXPIRED status handling in admin and consumer views.",
      usageTerms:
        "Expired example. Should not be visible in active deal lists.",
      imageUrl: "/uploads/seed/deal-travel-02.svg",
      price: 40,
      originalPrice: 100,
      status: "EXPIRED",
      categorySlug: "travel",
      city: "Gdańsk",
      voivodeship: "POMORSKIE",
      tags: ["expired", "test"],
      validFrom: new Date(now.getTime() - 90 * day),
      validTo: new Date(now.getTime() - 60 * day),
      createdAt: new Date(now.getTime() - 95 * day),
    },
    {
      title: "Seasonal pastry box -30%",
      description:
        "Box of 6 seasonal pastries. Mix of fruit tarts and cream-filled classics.",
      usageTerms: "Pre-order 24h ahead. Pickup only.",
      imageUrl: "/uploads/seed/deal-food-05.svg",
      price: 49,
      originalPrice: 69,
      status: "APPROVED",
      categorySlug: "food",
      city: "Gdańsk",
      voivodeship: "POMORSKIE",
      tags: ["bakery", "dessert", "seasonal"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 20 * day),
      createdAt: new Date(startOfMonth.getTime() + 15 * day),
    },
    {
      title: "Personal training (3 sessions) -25%",
      description:
        "Three 60-minute 1:1 sessions tailored to your goals. Includes a simple nutrition checklist.",
      usageTerms:
        "Valid for new clients only. Sessions must be used within 45 days.",
      imageUrl: "/uploads/seed/deal-fitness-03.svg",
      price: 299,
      originalPrice: 399,
      status: "APPROVED",
      categorySlug: "fitness",
      city: "Warszawa",
      voivodeship: "MAZOWIECKIE",
      tags: ["trainer", "strength", "goals"],
      validFrom: startOfMonth,
      validTo: new Date(nextMonth.getTime() + 40 * day),
      createdAt: new Date(startOfMonth.getTime() + 16 * day),
    },
  ];

  // Ensure we have exactly 20 deals by adding a few variations.
  while (deals.length < 20) {
    const n = deals.length + 1;
    deals.push({
      title: `Seed deal #${n}: Local service bundle -${10 + (n % 5) * 5}%`,
      description:
        "Practical local offer for testing pagination, sorting, and status management. Includes a clear description, realistic tags, and valid dates.",
      usageTerms:
        "Appointment required. One coupon per person. Not combinable with other promos.",
      imageUrl: "/uploads/seed/deal-services-05.svg",
      price: 100 + n * 3,
      originalPrice: 140 + n * 3,
      status: n % 7 === 0 ? "PENDING" : "APPROVED",
      categorySlug: n % 2 === 0 ? "services" : "food",
      city: n % 2 === 0 ? "Warszawa" : "Kraków",
      voivodeship: n % 2 === 0 ? "MAZOWIECKIE" : "MALOPOLSKIE",
      tags: [
        "seed",
        "pagination",
        "testing",
        n % 2 === 0 ? "services" : "food",
      ],
      validFrom: new Date(now.getTime() - 3 * day),
      validTo: new Date(now.getTime() + 60 * day),
      createdAt: new Date(now.getTime() - (n % 10) * day),
    });
  }

  for (let i = 0; i < deals.length; i++) {
    const business = businessProfiles[i % businessProfiles.length];
    const d = deals[i];
    await ensureDeal(business.id, d);
  }
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
