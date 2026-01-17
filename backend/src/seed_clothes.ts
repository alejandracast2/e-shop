import 'dotenv/config';
import { AppDataSource } from './data-source';
import { Product } from './modules/product/entities/product.entity';

const seedClothes = async () => {
  await AppDataSource.initialize();

  const productRepo = AppDataSource.getRepository(Product);

  const productSeed: Array<Partial<Product>> = [
    {
      name: 'Camiseta Basica Algodon',
      description: 'Camiseta unisex de algodon suave, corte regular.',
      price: 18,
      sku: 'ROP-001',
      imageUrl:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      stock: 50,
      isActive: true,
    },
    {
      name: 'Sudadera Oversize',
      description: 'Sudadera de felpa con capucha y bolsillo canguro.',
      price: 42,
      sku: 'ROP-002',
      imageUrl:
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
      stock: 22,
      isActive: true,
    },
    {
      name: 'Jeans Slim Azul',
      description: 'Jeans slim fit con elastano para mayor comodidad.',
      price: 55,
      sku: 'ROP-003',
      imageUrl:
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
      stock: 28,
      isActive: true,
    },
    {
      name: 'Chaqueta Denim Clasica',
      description: 'Chaqueta de mezclilla con bolsillos frontales.',
      price: 68,
      sku: 'ROP-004',
      imageUrl:
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
      stock: 16,
      isActive: true,
    },
    {
      name: 'Vestido Midi Floral',
      description: 'Vestido midi ligero con estampado floral.',
      price: 62,
      sku: 'ROP-005',
      imageUrl:
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
      stock: 14,
      isActive: true,
    },
    {
      name: 'Zapatillas Urbanas',
      description: 'Zapatillas ligeras con suela de goma.',
      price: 74,
      sku: 'ROP-006',
      imageUrl:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      stock: 30,
      isActive: true,
    },
    {
      name: 'Camisa Lino Manga Larga',
      description: 'Camisa de lino fresca, ideal para dias calidos.',
      price: 46,
      sku: 'ROP-007',
      imageUrl:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      stock: 20,
      isActive: true,
    },
    {
      name: 'Falda Plisada',
      description: 'Falda midi plisada con caida ligera.',
      price: 38,
      sku: 'ROP-008',
      imageUrl:
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
      stock: 18,
      isActive: true,
    },
    {
      name: 'Pantalon Chino Beige',
      description: 'Pantalon chino slim con tejido elastico.',
      price: 49,
      sku: 'ROP-009',
      imageUrl:
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
      stock: 26,
      isActive: true,
    },
    {
      name: 'Abrigo Largo Lana',
      description: 'Abrigo largo con forro suave para invierno.',
      price: 120,
      sku: 'ROP-010',
      imageUrl:
        'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=800&q=80',
      stock: 10,
      isActive: true,
    },
    {
      name: 'Short Deportivo',
      description: 'Short ligero de entrenamiento con cintura elastica.',
      price: 24,
      sku: 'ROP-011',
      imageUrl:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
      stock: 34,
      isActive: true,
    },
    {
      name: 'Top Deportivo',
      description: 'Top de alto soporte con tejido transpirable.',
      price: 28,
      sku: 'ROP-012',
      imageUrl:
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
      stock: 25,
      isActive: true,
    },
  ];

  for (const seedItem of productSeed) {
    const existing = await productRepo.findOne({
      where: { sku: seedItem.sku ?? '' },
    });
    if (existing) continue;
    await productRepo.save(productRepo.create(seedItem));
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
