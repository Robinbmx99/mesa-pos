import { MenuItem, Table } from './types';

export const INITIAL_INVENTORY: MenuItem[] = [
  // Burgers
  {
    id: '1',
    name: 'Wagyu Trufa',
    description: 'Carne wagyu madurada, aioli de trufa negra, rúcula y queso gouda ahumado en pan brioche.',
    price: 18.00,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    isPopular: true
  },
  {
    id: '2',
    name: 'La Clásica Mesa',
    description: 'Pan brioche, cheddar añejo, salsa secreta de la casa, lechuga, tomate.',
    price: 14.00,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    stock: 42
  },
  {
    id: '3',
    name: 'Pollo Picante',
    description: 'Muslo crujiente, ensalada picante, pepinillos de la casa, mayonesa de chipotle.',
    price: 16.50,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1615557960916-5f4791effe9d?auto=format&fit=crop&w=800&q=80',
    stock: 5
  },
  {
    id: '10',
    name: 'Doble Bacon Smash',
    description: 'Doble carne smasheada, doble bacon crujiente, queso americano y salsa BBQ.',
    price: 17.50,
    category: 'burgers',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80',
    stock: 25
  },
  
  // Drinks
  {
    id: '4',
    name: 'Cola Artesanal',
    description: 'Cola hecha a mano con azúcar de caña real y botánicos.',
    price: 5.00,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
    stock: 100
  },
  {
    id: '11',
    name: 'Limonada de Menta',
    description: 'Limones frescos exprimidos, menta triturada y hielo picado.',
    price: 4.50,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    stock: 50
  },
  {
    id: '12',
    name: 'Cerveza IPA Local',
    description: 'Cerveza artesanal de la ciudad con notas cítricas.',
    price: 7.00,
    category: 'drinks',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80',
    stock: 30
  },

  // Sides
  {
    id: '5',
    name: 'Papas Trufadas',
    description: 'Papas cortadas a mano con aceite de trufa y parmesano.',
    price: 8.00,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1573080496987-a199f8cd4058?auto=format&fit=crop&w=800&q=80',
    stock: 20
  },
  {
    id: '13',
    name: 'Aros de Cebolla',
    description: 'Aros de cebolla gigantes rebozados en cerveza.',
    price: 6.50,
    category: 'sides',
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80',
    stock: 15
  },

  // Desserts
  {
    id: '6',
    name: 'Volcán de Chocolate',
    description: 'Pastel de chocolate caliente con centro líquido.',
    price: 12.00,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    stock: 8
  },
  {
    id: '14',
    name: 'Cheesecake de Frutos Rojos',
    description: 'Estilo New York con salsa casera de frambuesa.',
    price: 10.00,
    category: 'desserts',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
    stock: 12
  }
];

export const INITIAL_TABLES: Table[] = [
  { id: 1, status: 'occupied', guests: 4 },
  { id: 2, status: 'free', guests: 0 },
  { id: 3, status: 'dirty', guests: 0 },
  { id: 4, status: 'occupied', guests: 2 },
  { id: 5, status: 'free', guests: 0 }, // Demo table starts free now
  { id: 6, status: 'free', guests: 0 },
  { id: 7, status: 'free', guests: 0 },
  { id: 8, status: 'free', guests: 0 },
];
