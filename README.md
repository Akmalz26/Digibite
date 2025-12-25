# 🍔 DigiBite - Sistem Pemesanan Kantin Digital

DigiBite adalah aplikasi pemesanan makanan digital untuk kantin Digitech University dengan fitur multi-tenant, pembayaran Midtrans, dan panel admin/seller.

![DigiBite Logo](public/logo.png)

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Teknologi](#-teknologi)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Konfigurasi Supabase](#-konfigurasi-supabase)
- [Konfigurasi Midtrans](#-konfigurasi-midtrans)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Struktur Proyek](#-struktur-proyek)
- [Panduan Penggunaan](#-panduan-penggunaan)

---

## ✨ Fitur

### 👤 Pengguna (Customer)
- 🔐 Registrasi & Login
- 🍽️ Lihat daftar tenant dan menu
- 🛒 Keranjang belanja
- 💳 Pembayaran via Midtrans (QRIS, GoPay, OVO, Transfer, dll)
- 💵 Pembayaran tunai (cash)
- 📜 Riwayat pesanan

### 🏪 Seller (Pemilik Tenant)
- 📊 Dashboard statistik
- 📦 Kelola produk (CRUD)
- 📋 Kelola pesanan
- 💰 Lihat saldo & tarik saldo
- 🔔 Notifikasi real-time

### 🛡️ Admin
- 📈 Dashboard analitik
- 👥 Kelola pengguna & role
- 🏢 Kelola tenant
- 📦 Lihat semua produk
- 📊 Laporan & export
- 💸 Approve/reject penarikan saldo seller
- 💰 Saldo admin dari biaya layanan

---

## 🛠️ Teknologi

| Kategori | Teknologi |
|----------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State Management | Zustand |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| Payment | Midtrans Snap |
| Animation | Framer Motion |
| Icons | Lucide React |

---

## 📦 Prasyarat

Pastikan sudah terinstall:

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** atau **pnpm** atau **bun**
- **Git** ([Download](https://git-scm.com/))
- Akun **Supabase** ([Daftar](https://supabase.com/))
- Akun **Midtrans Sandbox** ([Daftar](https://dashboard.sandbox.midtrans.com/))

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/akmalz26/digibite.git
cd digibite
```

### 2. Install Dependencies

```bash
npm install
# atau
pnpm install
# atau
bun install
```

### 3. Buat File Environment

Buat file `.env.local` di root folder:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Midtrans Configuration (Sandbox)
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXXXXXXXXXXXXX
```

---

## 🗄️ Konfigurasi Supabase

### Step 1: Buat Project Supabase

1. Buka [supabase.com](https://supabase.com/) dan login
2. Klik **"New Project"**
3. Isi detail project:
   - **Name**: digibite
   - **Database Password**: (simpan password ini!)
   - **Region**: Southeast Asia (Singapore)
4. Klik **"Create new project"**

### Step 2: Dapatkan API Keys

1. Buka **Project Settings** > **API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Step 3: Jalankan Migration Database

Buka **SQL Editor** di Supabase Dashboard dan jalankan file-file berikut secara berurutan:

#### 1. Initial Schema (`001_initial_schema.sql`)
```sql
-- Salin isi file: supabase/migrations/001_initial_schema.sql
-- Jalankan di SQL Editor
```

#### 2. Fix Signup Trigger (`002_fix_signup_trigger.sql`)
```sql
-- Salin isi file: supabase/migrations/002_fix_signup_trigger.sql
-- Jalankan di SQL Editor
```

#### 3. Payment Methods (`003_payment_methods.sql`)
```sql
-- Salin isi file: supabase/migrations/003_payment_methods.sql
-- Jalankan di SQL Editor
```

#### 4. Withdrawals (`004_withdrawals.sql`)
```sql
-- Salin isi file: supabase/migrations/004_withdrawals.sql
-- Jalankan di SQL Editor
```

#### 5. Service Fee & Admin Balance (`005_service_fee_admin_balance.sql`)
```sql
-- Salin isi file: supabase/migrations/005_service_fee_admin_balance.sql
-- Jalankan di SQL Editor
```

#### 6. Fix Phone Number Trigger (`006_fix_phone_trigger.sql`)
```sql
-- Salin isi file: supabase/migrations/006_fix_phone_trigger.sql
-- Jalankan di SQL Editor
```

#### 7. Register Seller Function (`007_register_seller_function.sql`)
```sql
-- Salin isi file: supabase/migrations/007_register_seller_function.sql
-- Jalankan di SQL Editor
```

#### 8. Fix Admin Balance Trigger (`008_fix_admin_balance_trigger.sql`)
```sql
-- Salin isi file: supabase/migrations/008_fix_admin_balance_trigger.sql
-- Jalankan di SQL Editor
```

#### 9. Auto Process Orders (`009_auto_process_orders.sql`)
```sql
-- Salin isi file: supabase/migrations/009_auto_process_orders.sql
-- Jalankan di SQL Editor
```

### Step 4: Setup Storage Bucket

1. Buka **Storage** di Supabase Dashboard
2. Klik **"New bucket"**
3. Buat bucket:
   - **Name**: `products`
   - **Public**: ✅ Enabled
4. Buat bucket lagi:
   - **Name**: `avatars`
   - **Public**: ✅ Enabled

### Step 5: Setup RLS Policies untuk Storage

Jalankan di **SQL Editor**:

```sql
-- Policies untuk bucket products
CREATE POLICY "Public read access for products" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload products" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own uploads" ON storage.objects
  FOR UPDATE USING (bucket_id = 'products' AND auth.uid()::text = owner);

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'products' AND auth.uid()::text = owner);

-- Policies untuk bucket avatars
CREATE POLICY "Public read access for avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = owner);
```

### Step 6: Enable Realtime

1. Buka **Database** > **Replication**
2. Enable untuk tabel:
   - `orders`
   - `withdrawals`

### Step 7: Buat User Admin Pertama

1. Register user baru via aplikasi
2. Buka **Table Editor** > **profiles**
3. Edit user yang baru dibuat
4. Ubah `role` dari `user` menjadi `admin`

---

## 💳 Konfigurasi Midtrans

### Step 1: Daftar Akun Sandbox

1. Buka [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/)
2. Daftar akun baru atau login

### Step 2: Dapatkan API Keys

1. Buka **Settings** > **Access Keys**
2. Copy:
   - **Client Key** → `VITE_MIDTRANS_CLIENT_KEY`
   - **Server Key** → untuk Edge Function

### Step 3: Setup Supabase Edge Function

#### 3.1 Install Supabase CLI

```bash
npm install -g supabase
```

#### 3.2 Login ke Supabase

```bash
supabase login
```

#### 3.3 Buat Edge Function

```bash
# Di folder project
supabase functions new create-midtrans-transaction
```

#### 3.4 Edit File Function

Edit file `supabase/functions/create-midtrans-transaction/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id } = await req.json()
    
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        profiles (name, email, phone),
        order_items (
          quantity,
          price_at_time,
          products (name)
        )
      `)
      .eq('id', order_id)
      .single()

    if (orderError) throw orderError

    // Prepare Midtrans payload
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
    const authString = btoa(serverKey + ':')

    const items = order.order_items.map((item: any) => ({
      id: item.products?.name?.substring(0, 50) || 'product',
      name: item.products?.name || 'Product',
      price: Math.round(item.price_at_time),
      quantity: item.quantity,
    }))

    // Add service fee if exists
    if (order.service_fee > 0) {
      items.push({
        id: 'service-fee',
        name: 'Biaya Layanan',
        price: Math.round(order.service_fee),
        quantity: 1,
      })
    }

    const payload = {
      transaction_details: {
        order_id: order.midtrans_order_id,
        gross_amount: Math.round(order.total_amount),
      },
      item_details: items,
      customer_details: {
        first_name: order.profiles?.name || 'Customer',
        email: order.profiles?.email || '',
        phone: order.profiles?.phone || '',
      },
      callbacks: {
        finish: `${Deno.env.get('FRONTEND_URL')}/user/history`,
      },
    }

    // Call Midtrans Snap API
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (result.token) {
      // Save snap token to order
      await supabaseClient
        .from('orders')
        .update({ snap_token: result.token })
        .eq('id', order_id)
    }

    return new Response(JSON.stringify({
      snap_token: result.token,
      redirect_url: result.redirect_url,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

#### 3.5 Deploy Function

```bash
supabase functions deploy create-midtrans-transaction
```

#### 3.6 Set Environment Variables

Di Supabase Dashboard > **Edge Functions** > **create-midtrans-transaction** > **Secrets**:

| Key | Value |
|-----|-------|
| `MIDTRANS_SERVER_KEY` | SB-Mid-server-XXXXXXXX |
| `FRONTEND_URL` | http://localhost:5173 (atau URL production) |

### Step 4: Setup Midtrans Notification (Webhook)

1. Buka Midtrans Dashboard > **Settings** > **Configuration**
2. Set **Payment Notification URL**:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/midtrans-webhook
   ```

#### Buat Webhook Function

```bash
supabase functions new midtrans-webhook
```

Edit `supabase/functions/midtrans-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const notification = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const orderId = notification.order_id
    const transactionStatus = notification.transaction_status
    const fraudStatus = notification.fraud_status

    let newStatus = 'pending'

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        newStatus = 'paid'
      }
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      newStatus = 'cancel'
    }

    // Update order by midtrans_order_id
    await supabaseClient
      .from('orders')
      .update({ 
        status: newStatus,
        midtrans_status: transactionStatus 
      })
      .eq('midtrans_order_id', orderId)

    return new Response('OK', { status: 200 })
  } catch (error) {
    return new Response(error.message, { status: 500 })
  }
})
```

Deploy:
```bash
supabase functions deploy midtrans-webhook
```

---

## 🖥️ Menjalankan Aplikasi

### Development Mode

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173)

### Build Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 📁 Struktur Proyek

```
digibite/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── GlassCard.tsx   # Glass morphism card
│   │   └── FloatingCart.tsx
│   ├── layouts/            # Layout components
│   │   ├── AdminLayout.tsx
│   │   ├── SellerLayout.tsx
│   │   └── UserLayout.tsx
│   ├── pages/              # Page components
│   │   ├── admin/          # Admin pages
│   │   ├── seller/         # Seller pages
│   │   └── user/           # User pages
│   ├── services/           # API services
│   │   ├── adminService.ts
│   │   ├── orderService.ts
│   │   └── tenantService.ts
│   ├── store/              # Zustand stores
│   │   ├── authStore.ts
│   │   └── cartStore.ts
│   ├── lib/                # Utilities
│   │   └── supabase.ts
│   ├── types/              # TypeScript types
│   └── App.tsx             # Main app component
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge functions
├── .env.local              # Environment variables
└── package.json
```

---

## 📖 Panduan Penggunaan

### Untuk Customer

1. **Register/Login** di halaman utama
2. **Pilih Tenant** yang diinginkan
3. **Tambahkan menu** ke keranjang
4. **Checkout** dan pilih metode pembayaran
5. **Selesaikan pembayaran** (Midtrans/Tunai)
6. **Pantau status** di riwayat pesanan

### Untuk Seller

1. Minta admin untuk mengubah role menjadi `seller`
2. Admin akan membuat **tenant** untuk Anda
3. Login dan akses **Dashboard Seller**
4. **Tambah produk** di menu Produk
5. **Kelola pesanan** yang masuk
6. **Tarik saldo** saat sudah terkumpul

### Untuk Admin

1. Login dengan akun admin
2. **Dashboard**: Lihat statistik keseluruhan
3. **Pengguna**: Kelola user dan ubah role
4. **Tenant**: Kelola tenant dan pemiliknya
5. **Produk**: Lihat semua produk
6. **Pesanan**: Kelola semua pesanan
7. **Penarikan**: Approve/reject permintaan penarikan
8. **Laporan**: Lihat analitik dan export data

---

## 🔐 Role & Permission

| Fitur | User | Seller | Admin |
|-------|------|--------|-------|
| Lihat Menu | ✅ | ✅ | ✅ |
| Order | ✅ | ✅ | ✅ |
| Kelola Produk | ❌ | ✅ (own) | ✅ (all) |
| Kelola Pesanan | ❌ | ✅ (own) | ✅ (all) |
| Tarik Saldo | ❌ | ✅ | ❌ |
| Approve Penarikan | ❌ | ❌ | ✅ |
| Kelola User | ❌ | ❌ | ✅ |
| Lihat Laporan | ❌ | ✅ (own) | ✅ (all) |

---

## 💰 Alur Pembayaran & Saldo

```
Customer Bayar Rp 52.000
         │
         ├── Subtotal Produk: Rp 50.000 → Saldo Seller
         └── Biaya Layanan: Rp 2.000 → Saldo Admin
```

---

## 🐛 Troubleshooting

### Error: "User not authenticated"
- Pastikan sudah login
- Cek apakah session masih valid
- Clear localStorage dan login ulang

### Error: "Failed to get snap token"
- Pastikan MIDTRANS_SERVER_KEY sudah benar
- Cek Edge Function logs di Supabase Dashboard
- Pastikan order memiliki `midtrans_order_id`

### Error: "RLS policy violation"
- Cek apakah RLS policy sudah benar
- Pastikan user memiliki role yang sesuai
- Jalankan ulang migration jika perlu

### Pesanan tidak update setelah bayar
- Cek webhook URL sudah benar
- Cek logs di Midtrans Dashboard
- Pastikan Edge Function `midtrans-webhook` sudah deploy

---

## 📄 License

MIT License - Silakan gunakan dan modifikasi sesuai kebutuhan.

---


## 📞 Support

Jika ada pertanyaan atau masalah:
- Buka **Issue** di GitHub
- Email: support@digibite.com

---

**Made with ❤️ using React, Supabase & Midtrans**
