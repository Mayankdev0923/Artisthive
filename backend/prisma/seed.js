import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed demo users: admin, an artist (verified), and a buyer
  const admin = await prisma.user.upsert({
    where: { email: 'admin@artisthive.test' },
    update: {},
    create: { email: 'admin@artisthive.test', name: 'Admin', role: 'ADMIN' },
  });

  const artistUser = await prisma.user.upsert({
    where: { email: 'artist@artisthive.test' },
    update: {},
    create: { email: 'artist@artisthive.test', name: 'Maya the Painter', role: 'ARTIST' },
  });

  const artist = await prisma.artistProfile.upsert({
    where: { userId: artistUser.id },
    update: {},
    create: {
      userId: artistUser.id,
      category: 'PAINTER',
      displayName: 'Maya the Painter',
      bio: 'Contemporary painter. Commissions open.',
      verificationStatus: 'VERIFIED',
      verificationCode: 'AV-SEED01',
      verifiedAt: new Date(),
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@artisthive.test' },
    update: {},
    create: { email: 'buyer@artisthive.test', name: 'Buyer User' },
  });

  const product = await prisma.product.upsert({
    where: { id: 'seed-product-1' },
    update: {},
    create: {
      id: 'seed-product-1',
      artistId: artist.id,
      title: 'Abstract canvas print',
      description: 'Signed giclee print, 40x50cm.',
      type: 'PRINT',
      price: 120,
      status: 'ACTIVE',
    },
  });

  // A pending application for the admin queue demo
  await prisma.artistProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      category: 'MUSICIAN',
      displayName: 'Pending Musician',
      bio: 'Applying.',
      verificationStatus: 'PENDING',
      verificationCode: 'AV-PEND99',
    },
  });

  // Demo protected order in progress with evidence
  const order = await prisma.order.upsert({
    where: { id: 'seed-order-1' },
    update: {},
    create: {
      id: 'seed-order-1',
      buyerId: buyer.id,
      artistId: artist.id,
      productId: product.id,
      title: 'Abstract canvas print',
      amount: 120,
      paymentStatus: 'DEMO_CONFIRMED',
      status: 'IN_PROGRESS',
    },
  });

  const timeline = await prisma.orderTimeline.findFirst({ where: { orderId: order.id } });
  if (!timeline) {
    await prisma.orderTimeline.createMany({
      data: [
        { orderId: order.id, event: 'ORDER_CREATED', actorId: buyer.id },
        { orderId: order.id, event: 'PAYMENT_DEMO_CONFIRMED', actorId: buyer.id, note: 'Simulated payment — no real money moved' },
      ],
    });
  }

  const evidence = await prisma.evidence.findFirst({ where: { orderId: order.id } });
  if (!evidence) {
    await prisma.evidence.create({
      data: {
        orderId: order.id,
        uploaderId: artistUser.id,
        phase: 'BEFORE_DELIVERY',
        mediaUrls: ['https://example.com/packing.jpg'],
        description: 'Packing video captured.',
      },
    });
  }

  console.log('Seed complete.');
  console.log('Admin:', admin.email);
  console.log('Artist:', artistUser.email, '(verified)');
  console.log('Buyer:', buyer.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());