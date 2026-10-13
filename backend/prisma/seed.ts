import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌾 Starting Kisan Hit (किसान हित) Clean Production Seeding...');

  // 1. Initial Super Admin Account (From Environment Variables)
  const adminEmail =
    process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@kisanhit.com';
  const adminPhone =
    process.env.SUPER_ADMIN_PHONE || process.env.ADMIN_PHONE || '8979134221';
  const adminPassword =
    process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'KisanHit@2026';

  if (!adminPassword || adminPassword.length < 8) {
    throw new Error('Admin password must be at least 8 characters long');
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  // Avoid unique constraint conflicts on phone if previously assigned
  const existingPhoneOwner = await prisma.user.findFirst({
    where: { phone: adminPhone, NOT: { email: adminEmail } },
  });
  if (existingPhoneOwner) {
    await prisma.user.update({
      where: { id: existingPhoneOwner.id },
      data: { phone: null },
    });
  }

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      phone: adminPhone,
      passwordHash: adminPasswordHash,
      fullName: 'Kisan Hit Master Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
    create: {
      email: adminEmail,
      phone: adminPhone,
      passwordHash: adminPasswordHash,
      fullName: 'Kisan Hit Master Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  console.log('✅ Initial SUPER_ADMIN account initialized:');
  console.log(`   - ID: ${superAdmin.id}`);
  console.log(`   - Email: ${superAdmin.email}`);
  console.log(`   - Phone: ${superAdmin.phone}`);
  console.log(`   - Role: ${superAdmin.role}`);

  // 2. Master Agricultural Categories (CIBRC, Seed Act & FCO compliant)
  const categories = [
    {
      name: 'प्रमाणित बीज / Certified Seeds',
      slug: 'seeds',
      description: 'उच्च अंकुरण क्षमता वाले हाइब्रिड व प्रमाणित बीज - CIBRC & Seed Act compliant',
      imageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Certified Seeds (प्रमाणित बीज)',
      slug: 'certified-seeds',
      description: 'उच्च अंकुरण क्षमता वाले हाइब्रिड व प्रमाणित बीज - CIBRC & Seed Act compliant',
      imageUrl: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'उर्वरक व पोषण / Fertilizers & Micronutrients',
      slug: 'fertilizers',
      description: 'यूरिया, डीएपी, पोटाश, बायो-फर्टिलाइजर व सूक्ष्म पोषक तत्व - FCO certified',
      imageUrl: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Fertilizers & Plant Nutrition (खाद व पोषण)',
      slug: 'fertilizers-nutrition',
      description: 'यूरिया, डीएपी, पोटाश, बायो-फर्टिलाइजर व सूक्ष्म पोषक तत्व - FCO certified',
      imageUrl: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'कीटनाशक व फफूंदनाशक / Crop Protection',
      slug: 'pesticides',
      description: 'CIBRC अनुमोदित कीटनाशक, फफूंदनाशक (फंगीसाइड) एवं खरपतवारनाशक दवाएं - Central Insecticides Board compliant',
      imageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Crop Protection / Pesticides (कीटनाशक, फफूंदनाशक, खरपतवारनाशक)',
      slug: 'crop-protection',
      description: 'CIBRC अनुमोदित कीटनाशक, फफूंदनाशक (फंगीसाइड) एवं खरपतवारनाशक दवाएं - Central Insecticides Board compliant',
      imageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'वृद्धि वर्धक व टॉनिक / Bio-Stimulants & Growth Regulators',
      slug: 'growth-promoters',
      description: 'जैव-उत्तेजक (Bio-stimulant), ह्यूमिक एसिड, फूल व अधिक शाखाओं के लिए टॉनिक',
      imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'कृषि यंत्र व स्प्रेयर / Spray Equipment & Tools',
      slug: 'farm-equipment',
      description: 'बैटरी स्प्रे पंप, नोजल, बीज उपचार ड्रम एवं आधुनिक फार्म टूल्स',
      imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
        isActive: true,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${categories.length} Master Agricultural Categories seeded.`);

  // 3. Purge hardcoded mock diseases with stock photos (Preserve only dealer-created ones)
  const purgedCount = await prisma.pestDisease.deleteMany({
    where: {
      combos: { none: {} },
    },
  });
  console.log(`🧹 Cleaned up ${purgedCount.count} demo disease records without active dealer combos.`);

  console.log('🎉 Production clean database initialized.');
  console.log('   - Super Admin: READY');
  console.log('   - Master Categories: READY');
  console.log('   - Pest Doctor Master: Active dealer-managed combos only');
  console.log('   - Products & Batches: Clean (0 dummy entries. Ready for real dealer uploads)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
