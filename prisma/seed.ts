import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting DhabaOS seed...');

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.valetRequest.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.footfallRecord.deleteMany();

  // 1. Users
  console.log('👤 Seeding users...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@dhabaos.com',
      name: 'DhabaOS Admin',
      role: 'ADMIN',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR5DzqIxPWlcpvLS5fZ3JbX9dn0zsjaBrOYWoDZHAp4GcCgrAyMeJeesxvQviwDFXfecWCxnahGCa9kToc9m4Jq4cCnosyDGlluPWPjX3wGEU8LclxllQixtRSyO4clqbg-pxSJ-j-oBc8It3dIb_hWQeTelxPNm8mbdlOF1SnTWPVJ_GmHALmTCbY7QxZjDJtYAfhrk-bJ58wwAx2Z-rfpy9c92Ugdv_dnlU8dt8DMn-w2naJOhs',
    },
  });

  await prisma.user.createMany({
    data: [
      {
        email: 'chef@dhabaos.com',
        name: 'Head Chef Gurpreet',
        role: 'KITCHEN_STAFF',
      },
      {
        email: 'valet@dhabaos.com',
        name: 'Valet Lead Rajesh',
        role: 'VALET_STAFF',
      },
      {
        email: 'customer@dhabaos.com',
        name: 'Dine-In Guest',
        role: 'CUSTOMER',
      },
    ],
  });

  // 2. Tables
  console.log('🪑 Seeding tables...');
  const tableNumbers = [
    'T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08',
    'T-09', 'T-10', 'T-11', 'T-12', 'T-13', 'T-14', 'T-15', 'T-16',
    'T-17', 'T-18', 'T-19', 'T-20'
  ];

  const tableMap: Record<string, string> = {};

  for (const num of tableNumbers) {
    const table = await prisma.table.create({
      data: {
        number: num,
        name: `Highway Courtyard ${num.replace('T-', '')}`,
        capacity: num === 'T-12' || num === 'T-04' ? 6 : 4,
        qrCode: `DHABA-QR-${num}`,
        status: ['T-12', 'T-04', 'T-08'].includes(num) ? 'OCCUPIED' : 'AVAILABLE',
      },
    });
    tableMap[num] = table.id;
  }

  // 3. Categories
  console.log('📋 Seeding categories & menu items...');
  const starters = await prisma.category.create({
    data: { name: 'Starters', slug: 'starters', displayOrder: 1 },
  });
  const mains = await prisma.category.create({
    data: { name: 'Mains', slug: 'mains', displayOrder: 2 },
  });
  const tandoor = await prisma.category.create({
    data: { name: 'Tandoor', slug: 'tandoor', displayOrder: 3 },
  });
  const breads = await prisma.category.create({
    data: { name: 'Breads', slug: 'breads', displayOrder: 4 },
  });
  const beverages = await prisma.category.create({
    data: { name: 'Beverages', slug: 'beverages', displayOrder: 5 },
  });

  // 4. Menu Items (with authentic images from Stitch screens)
  const menuMap: Record<string, string> = {};

  // Starters
  const paneerTikka = await prisma.menuItem.create({
    data: {
      name: 'Paneer Tikka',
      description: 'Charred cubes of spiced cottage cheese with mint chutney and roasted onions',
      price: 280,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkD44gfJ5hvca8AvJsTogZf5xcYwXCsI1YcFLzCbv_mf-a3CyHnGmL7sNH5DRoqs8KlxplfgoZn2xnqTuyk6kJvTB6a_0hiNV6i52McxeQgQRdEmwMZl_RGazRoX9Bf5q7A1-owHgxap2lWkXkEZGf5do-LslfDAL-2WvoitfErPkB944IhLhVkbFEqtpAFXt6oCsamp3ZBiwtNgsv-kwqi6adZQwcb59hI0Qz5d5oWUe7HZj_gIk',
      isVeg: true,
      categoryId: starters.id,
      prepTimeMinutes: 12,
    },
  });
  menuMap['Paneer Tikka'] = paneerTikka.id;

  const seekhKebab = await prisma.menuItem.create({
    data: {
      name: 'Chicken Seekh Kebab',
      description: 'Minced chicken seasoned with fresh herbs and spices, chargrilled on skewers',
      price: 320,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBE5RZr5KpLNLJnc0R1YUd6lSvQalAM8XpcQbGifi5_TDgAItK0iWSo0wAKU9NvywSz_bW5fNtCeaMx4UQLhaleneZ2FnoSNvtSymaxz3PgC1RL7cdCcuigpp9foJuw9PoVsNaY2T8cVPsRbILozT6S17iCBRvzxD7-UUT8UJxhlXQacL6TGobuhH1SghZMOJgaZqytbblpo6Jh6VouXdsFK7tJXMCptGlul9Mq1CP7YmLDWY-NSm4',
      isVeg: false,
      categoryId: starters.id,
      prepTimeMinutes: 15,
    },
  });
  menuMap['Chicken Seekh Kebab'] = seekhKebab.id;

  const dahiKebab = await prisma.menuItem.create({
    data: {
      name: 'Dahi Ke Kebab',
      description: 'Crispy fried hung curd patties with green chilies, coriander, and crushed pepper',
      price: 240,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80',
      isVeg: true,
      categoryId: starters.id,
      prepTimeMinutes: 10,
    },
  });
  menuMap['Dahi Ke Kebab'] = dahiKebab.id;

  // Mains
  const butterChicken = await prisma.menuItem.create({
    data: {
      name: 'Butter Chicken (Full)',
      description: 'Tender tandoori chicken cooked in an iconic rich, velvety tomato and butter gravy',
      price: 550,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsddVw2x1OywIRF_9aNDZpzWupqwW9Y6xtbRCTjO6EXfyYHTO5tD1TEUDoIG9VsdlBzb_ewJAnXQGABPwL-bcL-LzyPWEok8fh1aZXizMgTRcEWoPCkfgmoWVo8EkXCj9DopT6T_vK5DdbmRaSuVs2CBHLRMa1gCCDHn93N6I-Tt9kdXOW-GjIVtFmlBE7tQpvAEUSQUIcsim_okms_3Iz9sVYj8RnWEpKEGRHFqGX--6K3G4Bmps',
      isVeg: false,
      categoryId: mains.id,
      prepTimeMinutes: 18,
    },
  });
  menuMap['Butter Chicken'] = butterChicken.id;

  const dalMakhani = await prisma.menuItem.create({
    data: {
      name: 'Dal Makhani',
      description: 'Slow-cooked whole black lentils and kidney beans simmered overnight with butter and fresh cream',
      price: 260,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
      isVeg: true,
      categoryId: mains.id,
      prepTimeMinutes: 10,
    },
  });
  menuMap['Dal Makhani'] = dalMakhani.id;

  const chickenCurry = await prisma.menuItem.create({
    data: {
      name: 'Chicken Curry',
      description: 'Rustic highway-dhaba style chicken curry with whole roasted spices and fresh coriander',
      price: 420,
      imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=400&q=80',
      isVeg: false,
      categoryId: mains.id,
      prepTimeMinutes: 16,
    },
  });
  menuMap['Chicken Curry'] = chickenCurry.id;

  const vegBiryani = await prisma.menuItem.create({
    data: {
      name: 'Veg Biryani',
      description: 'Fragrant basmati rice layered with seasonal vegetables, saffron, caramelized onions, and kewra',
      price: 290,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
      isVeg: true,
      categoryId: mains.id,
      prepTimeMinutes: 15,
    },
  });
  menuMap['Veg Biryani'] = vegBiryani.id;

  // Tandoor
  const tandooriChicken = await prisma.menuItem.create({
    data: {
      name: 'Tandoori Chicken (Half)',
      description: 'Classic bone-in chicken marinated overnight in hung curd and Kashmiri chili, roasted in a clay tandoor',
      price: 340,
      imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80',
      isVeg: false,
      categoryId: tandoor.id,
      prepTimeMinutes: 18,
    },
  });
  menuMap['Tandoori Chicken (Half)'] = tandooriChicken.id;

  const achariPaneerTikka = await prisma.menuItem.create({
    data: {
      name: 'Achari Paneer Tikka',
      description: 'Chargrilled cottage cheese cubes marinated in pickled mustard spices with roasted peppers and onions',
      price: 300,
      imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&q=80',
      isVeg: true,
      categoryId: tandoor.id,
      prepTimeMinutes: 14,
    },
  });
  menuMap['Achari Paneer Tikka'] = achariPaneerTikka.id;

  const chickenMalaiTikka = await prisma.menuItem.create({
    data: {
      name: 'Chicken Malai Tikka',
      description: 'Creamy boneless chicken morsels infused with green cardamom, cashew paste, and white butter',
      price: 360,
      imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=400&q=80',
      isVeg: false,
      categoryId: tandoor.id,
      prepTimeMinutes: 16,
    },
  });
  menuMap['Chicken Malai Tikka'] = chickenMalaiTikka.id;

  const tandooriMushroom = await prisma.menuItem.create({
    data: {
      name: 'Tandoori Stuffed Mushroom',
      description: 'Button mushrooms stuffed with spiced paneer and herbs, blistered crisp over glowing charcoal',
      price: 270,
      imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80',
      isVeg: true,
      categoryId: tandoor.id,
      prepTimeMinutes: 14,
    },
  });
  menuMap['Tandoori Stuffed Mushroom'] = tandooriMushroom.id;

  // Breads
  const garlicNaan = await prisma.menuItem.create({
    data: {
      name: 'Garlic Naan',
      description: 'Leavened flatbread brushed with crushed garlic and butter, cooked in clay tandoor',
      price: 60,
      imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=400&q=80',
      isVeg: true,
      categoryId: breads.id,
      prepTimeMinutes: 6,
    },
  });
  menuMap['Garlic Naan'] = garlicNaan.id;

  const tandooriRoti = await prisma.menuItem.create({
    data: {
      name: 'Tandoori Roti',
      description: 'Whole wheat round bread baked to perfection in a clay oven',
      price: 25,
      imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=400&q=80',
      isVeg: true,
      categoryId: breads.id,
      prepTimeMinutes: 5,
    },
  });
  menuMap['Tandoori Roti'] = tandooriRoti.id;

  // Beverages
  const sweetLassi = await prisma.menuItem.create({
    data: {
      name: 'Sweet Lassi',
      description: 'Traditional creamy yogurt churned with sugar, topped with rich malai and pistachios',
      price: 90,
      imageUrl: '/assets/menu/sweet_lassi.jpg',
      isVeg: true,
      categoryId: beverages.id,
      prepTimeMinutes: 4,
    },
  });
  menuMap['Sweet Lassi'] = sweetLassi.id;

  const masalaChai = await prisma.menuItem.create({
    data: {
      name: 'Masala Chai',
      description: 'Strong roadside tea brewed with fresh ginger, crushed cardamom, cloves, and milk in a kulhad',
      price: 40,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
      isVeg: true,
      categoryId: beverages.id,
      prepTimeMinutes: 5,
    },
  });
  menuMap['Masala Chai'] = masalaChai.id;

  // 5. Active Orders matching Stitch KDS Board
  console.log('🥘 Seeding active orders for KDS...');
  const now = new Date();

  // Order 1: T-12 (Pending, ~2.5 mins ago - Fresh Green)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'T-12',
      source: 'DINE_IN',
      status: 'PENDING',
      tableId: tableMap['T-12'],
      totalAmount: 660,
      paymentStatus: 'PENDING',
      customerName: 'VIP Guest',
      createdAt: new Date(now.getTime() - 2.5 * 60 * 1000), // 2m 30s ago
      items: {
        create: [
          { menuItemId: menuMap['Garlic Naan'], quantity: 2, unitPrice: 60 },
          { menuItemId: menuMap['Dal Makhani'], quantity: 1, unitPrice: 260, customInstructions: 'No butter' },
          { menuItemId: menuMap['Paneer Tikka'], quantity: 1, unitPrice: 280 },
        ],
      },
    },
  });

  // Order 2: Z-842 (Pending, ~11.75 mins ago - Amber 10m+ warning)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'Z-842',
      source: 'ZOMATO',
      status: 'PENDING',
      totalAmount: 495,
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE_ZOMATO',
      customerName: 'Aakash V.',
      customerPhone: '+91 98765 43210',
      createdAt: new Date(now.getTime() - 11.75 * 60 * 1000), // 11m 45s ago
      items: {
        create: [
          { menuItemId: menuMap['Tandoori Roti'], quantity: 3, unitPrice: 25 },
          { menuItemId: menuMap['Chicken Curry'], quantity: 1, unitPrice: 420, customInstructions: 'Spicy' },
        ],
      },
    },
  });

  // Order 3: T-04 (Preparing, ~18.35 mins ago - Red Late warning)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'T-04',
      source: 'DINE_IN',
      status: 'PREPARING',
      tableId: tableMap['T-04'],
      totalAmount: 970,
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      customerName: 'Rohan Sharma',
      createdAt: new Date(now.getTime() - 18.35 * 60 * 1000), // 18m 22s ago
      items: {
        create: [
          { menuItemId: menuMap['Butter Chicken'], quantity: 1, unitPrice: 550, isPrepared: true },
          { menuItemId: menuMap['Garlic Naan'], quantity: 4, unitPrice: 60, isPrepared: false },
          { menuItemId: menuMap['Sweet Lassi'], quantity: 2, unitPrice: 90, isPrepared: false },
        ],
      },
    },
  });

  // Order 4: S-112 (Preparing, ~8.25 mins ago - Normal Blue/Yellow)
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'S-112',
      source: 'SWIGGY',
      status: 'PREPARING',
      totalAmount: 290,
      paymentStatus: 'PAID',
      paymentMethod: 'ONLINE_SWIGGY',
      customerName: 'Priya K.',
      createdAt: new Date(now.getTime() - 8.25 * 60 * 1000), // 8m 15s ago
      items: {
        create: [
          { menuItemId: menuMap['Veg Biryani'], quantity: 1, unitPrice: 290, isPrepared: false },
        ],
      },
    },
  });

  // Order 5: T-08 (Ready, ~24 mins ago)
  const order5 = await prisma.order.create({
    data: {
      orderNumber: 'T-08',
      source: 'DINE_IN',
      status: 'READY',
      tableId: tableMap['T-08'],
      totalAmount: 320,
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      customerName: 'Harpreet Singh',
      createdAt: new Date(now.getTime() - 24 * 60 * 1000),
      items: {
        create: [
          { menuItemId: menuMap['Garlic Naan'], quantity: 2, unitPrice: 60, isPrepared: true },
          { menuItemId: menuMap['Masala Chai'], quantity: 1, unitPrice: 40, isPrepared: true },
        ],
      },
    },
  });

  // 6. Valet Requests matching Stitch Valet Interface
  console.log('🚗 Seeding Valet requests...');
  await prisma.valetRequest.createMany({
    data: [
      {
        ticketNumber: '#V-8480',
        vehicleModel: 'Black Mahindra Thar',
        vehicleNumber: 'DL-01-XY-9876',
        parkingSpot: 'Zone A VIP',
        guestName: 'VIP Guest - Table 12',
        tableId: tableMap['T-12'],
        orderId: order1.id,
        status: 'REQUESTED',
        priority: 'HIGH',
        estimatedMins: 6,
        requestedAt: new Date(now.getTime() - 7 * 60 * 1000), // 7 mins waiting
      },
      {
        ticketNumber: '#V-8492',
        vehicleModel: 'White Toyota Innova',
        vehicleNumber: 'MH-12-AB-1234',
        parkingSpot: 'Zone B Parking',
        guestName: 'Table 12 Guest',
        tableId: tableMap['T-12'],
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        estimatedMins: 4,
        requestedAt: new Date(now.getTime() - 3 * 60 * 1000), // 3 mins waiting
      },
      {
        ticketNumber: '#V-8495',
        vehicleModel: 'Red Hyundai Creta',
        vehicleNumber: 'KA-05-MN-5678',
        parkingSpot: 'Valet Lot 2',
        guestName: 'Table 04 Guest',
        tableId: tableMap['T-04'],
        status: 'REQUESTED',
        priority: 'LOW',
        estimatedMins: 5,
        requestedAt: new Date(now.getTime() - 45 * 1000), // Just requested
      },
    ],
  });

  // 7. Base Ingredients & Batches (Matching Admin Dashboard gauges)
  console.log('📦 Seeding Ingredients & Stock Batches...');
  const maida = await prisma.ingredient.create({
    data: {
      name: 'Refined Flour (Maida)',
      unit: 'kg',
      currentStock: 80,
      maxCapacity: 100,
      reorderLevel: 20,
      costPerUnit: 42,
    },
  });

  const oil = await prisma.ingredient.create({
    data: {
      name: 'Cooking Oil',
      unit: 'L',
      currentStock: 45,
      maxCapacity: 100,
      reorderLevel: 30,
      costPerUnit: 140,
    },
  });

  const paneer = await prisma.ingredient.create({
    data: {
      name: 'Fresh Paneer',
      unit: 'kg',
      currentStock: 6, // 12% -> URGENT ALERT
      maxCapacity: 50,
      reorderLevel: 15,
      costPerUnit: 340,
    },
  });

  const chicken = await prisma.ingredient.create({
    data: {
      name: 'Marinated Chicken',
      unit: 'kg',
      currentStock: 60,
      maxCapacity: 100,
      reorderLevel: 25,
      costPerUnit: 220,
    },
  });

  // Batches
  await prisma.stockBatch.createMany({
    data: [
      {
        ingredientId: paneer.id,
        batchNumber: 'BAT-PAN-889',
        quantity: 6,
        supplier: 'Verka Dairy Punjab',
        expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // expires in 2 days
      },
      {
        ingredientId: chicken.id,
        batchNumber: 'BAT-CHK-412',
        quantity: 60,
        supplier: 'Highway Poultry Fresh',
        expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        ingredientId: maida.id,
        batchNumber: 'BAT-FL-102',
        quantity: 80,
        supplier: 'Aashirvaad Mills',
        expiresAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 8. Footfall & Forecasting Data (14 historical days)
  console.log('📈 Seeding Footfall & Forecasting records...');
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const baseDayFootfalls: Record<string, { act: number; pred: number }> = {
    Mon: { act: 910, pred: 850 },
    Tue: { act: 880, pred: 900 },
    Wed: { act: 1020, pred: 950 },
    Thu: { act: 1080, pred: 1100 },
    Fri: { act: 1380, pred: 1300 },
    Sat: { act: 1650, pred: 1550 },
    Sun: { act: 1580, pred: 1500 },
  };

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayName = daysOfWeek[d.getDay()];
    const base = baseDayFootfalls[dayName];
    const variance = (i % 3 - 1) * 25;
    const actual = Math.max(500, base.act + variance);
    const predicted = Math.max(500, base.pred + (i % 2 === 0 ? 20 : -15));
    const revenue = actual * 68.5;

    await prisma.footfallRecord.create({
      data: {
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        dayOfWeek: dayName,
        actualFootfall: actual,
        predictedFootfall: predicted,
        revenue: Math.round(revenue),
        weather: i % 4 === 0 ? 'Pleasant' : 'Sunny',
        notes: i === 0 ? 'Today peak service' : undefined,
      },
    });
  }

  console.log('✅ DhabaOS database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
