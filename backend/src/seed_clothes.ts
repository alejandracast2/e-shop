import 'dotenv/config';
import { AppDataSource } from './data-source';
import { Store } from './modules/tenancy/entities/store.entity';
import { Product } from './modules/catalog/entities/product.entity';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const seedClothes = async () => {
  await AppDataSource.initialize();

  const storeRepo = AppDataSource.getRepository(Store);
  const productRepo = AppDataSource.getRepository(Product);

  const defaultStoreSlug = process.env.DEFAULT_STORE_SLUG ?? 'default';
  const store =
    (await storeRepo.findOne({ where: { slug: defaultStoreSlug } })) ??
    (await storeRepo.findOne({ where: {} }));

  if (!store) {
    throw new Error('No store found. Run seed.ts first.');
  }

  const productSeed: Array<Pick<Product, 'title' | 'description'>> = [
    {
      title: 'Camiseta Basica Algodon',
      description: 'Camiseta unisex de algodon suave, corte regular.',
    },
    {
      title: 'Sudadera Oversize',
      description: 'Sudadera de felpa con capucha y bolsillo canguro.',
    },
    {
      title: 'Jeans Slim Azul',
      description: 'Jeans slim fit con elastano para mayor comodidad.',
    },
    {
      title: 'Chaqueta Denim Clasica',
      description: 'Chaqueta de mezclilla con bolsillos frontales.',
    },
    {
      title: 'Vestido Midi Floral',
      description: 'Vestido midi ligero con estampado floral.',
    },
    {
      title: 'Zapatillas Urbanas',
      description: 'Zapatillas ligeras con suela de goma.',
    },
    {
      title: 'Camisa Lino Manga Larga',
      description: 'Camisa de lino fresca, ideal para dias calidos.',
    },
    {
      title: 'Falda Plisada',
      description: 'Falda midi plisada con caida ligera.',
    },
    {
      title: 'Pantalon Chino Beige',
      description: 'Pantalon chino slim con tejido elastico.',
    },
    {
      title: 'Abrigo Largo Lana',
      description: 'Abrigo largo con forro suave para invierno.',
    },
    {
      title: 'Short Deportivo',
      description: 'Short ligero de entrenamiento con cintura elastica.',
    },
    {
      title: 'Top Deportivo',
      description: 'Top de alto soporte con tejido transpirable.',
    },
  ];

  for (const seedItem of productSeed) {
    const existing = await productRepo.findOne({
      where: { storeId: store.id, slug: slugify(seedItem.title) },
    });
    if (existing) continue;
    await productRepo.save(
      productRepo.create({
        tenantId: store.tenantId,
        storeId: store.id,
        title: seedItem.title,
        slug: slugify(seedItem.title),
        description: seedItem.description ?? null,
        status: 'active',
      }),
    );
  }

  await AppDataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('Seed clothes completed');
};

seedClothes().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed clothes failed', error);
  process.exit(1);
});
