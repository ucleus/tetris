export const conditionPalette = {
  NEW: 'bg-emerald-100 text-emerald-800',
  USED_A: 'bg-blue-100 text-blue-800',
  USED_B: 'bg-yellow-100 text-yellow-800',
  USED_C: 'bg-orange-100 text-orange-800',
  REFURB: 'bg-purple-100 text-purple-800',
  FOR_PARTS: 'bg-red-100 text-red-800'
};

export const sampleProducts = [
  {
    id: 1,
    name: 'Clinical Audiometer Pro X1',
    price: 7499.0,
    category: 'Audiometer',
    condition: 'NEW',
    verified: true,
    description: 'Flagship two-channel audiometer with speech and pediatric modules.',
    calibrationDate: '2024-01-15',
    warranty: '24 months manufacturer warranty',
    compliance: 'FDA Class II | IEC 60645-1',
    shipping: 'Ships in 3 business days with white-glove setup',
    stock: 6,
    weightKg: 4.5,
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
      'https://images.unsplash.com/photo-1582719478125-4f59fb29b0f4'
    ]
  },
  {
    id: 2,
    name: 'Tympanometer Versa 200',
    price: 2899.0,
    category: 'Tympanometer',
    condition: 'REFURB',
    verified: true,
    description: 'Mid-volume tympanometer refurbished and calibrated with new probes.',
    calibrationDate: '2024-03-02',
    warranty: '12 months clinic-grade warranty',
    compliance: 'CE | ISO 13485 workshop',
    shipping: 'Ships in 5 business days, foam crated',
    stock: 3,
    weightKg: 2.2,
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    ]
  },
  {
    id: 3,
    name: 'OAE Screener Pocket',
    price: 1299.0,
    category: 'OAE Screener',
    condition: 'USED_A',
    verified: true,
    description: 'Clinic-retired otoacoustic emissions screener with brand new tips.',
    calibrationDate: '2023-12-11',
    warranty: '6 months service warranty',
    compliance: 'FDA Class II | ISO 60645-6',
    shipping: 'Ships next day air with shock indicator',
    stock: 5,
    weightKg: 0.8,
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    ]
  },
  {
    id: 4,
    name: 'Video Otoscope HD',
    price: 1899.0,
    category: 'Otoscope',
    condition: 'USED_B',
    verified: false,
    description: 'High-definition video otoscope with adjustable LED light ring.',
    calibrationDate: null,
    warranty: '30-day functional guarantee',
    compliance: 'CE',
    shipping: 'Ships in 2 business days',
    stock: 8,
    weightKg: 1.2,
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
    ]
  }
];
