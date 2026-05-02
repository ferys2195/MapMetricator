---
description: Aturan arsitektur wajib untuk proyek Next.js Frontend. Berlaku untuk semua file TypeScript dan TSX. AI harus mengikuti panduan ini secara strict tanpa pengecualian.
globs: ["**/*.ts", "**/*.tsx", "!**/*.test.ts", "!**/*.test.tsx"]
alwaysApply: true
---

# Next.js Layered Architecture — Frontend

## Konteks Proyek

- Framework: Next.js dengan App Router
- Language: TypeScript (strict mode) — `any` dilarang keras
- Styling: Shadcn UI, Tailwind CSS
- Arsitektur: Feature-based

---

## Alur Data (WAJIB dipatuhi, tidak boleh diskip)

```
Page (app/) → Component (features/*/components/) → Hook (features/*/hooks/)
```

Dependency hanya boleh mengalir **ke bawah**. Layer atas boleh memanggil layer di bawahnya, tidak boleh sebaliknya.

---

## Struktur Folder Wajib

```
src/
├── app/                            # Next.js App Router — routing ONLY
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── {feature}/
│   │       ├── page.tsx            # Entry point, hanya layout & render feature component
│   │       └── [id]/
│   │           └── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── features/                       # SEMUA logic fitur ada di sini
│   └── {feature-name}/             # Nama folder: kebab-case, plural
│       ├── index.ts                # PUBLIC API — satu-satunya export yang keluar
│       ├── components/             # UI components milik fitur ini
│       │   ├── {Feature}Table.tsx
│       │   ├── {Feature}Form.tsx
│       │   └── {Feature}Card.tsx
│       ├── hooks/                  # State management & side effects
│       │   ├── use{Feature}s.ts
│       │   └── use{Feature}Form.ts
│       ├── api/                    # HTTP calls ke Laravel — SATU-SATUNYA tempat fetch
│       │   └── {feature}.api.ts    # Jika ada
│       └── types/                  # TypeScript interfaces
│           └── {feature}.types.ts
│
├── components/                     # Shared UI (bukan milik satu fitur)
│   ├── ui/                         # Primitives: Button, Input, Modal, Table, dll
│   └── layout/                     # Header, Sidebar, Footer
│
├── lib/                            # Konfigurasi & utilities global
│   ├── axios.ts                    # Axios instance — WAJIB digunakan semua API calls
│   └── utils.ts
│
└── types/                          # Global types
    └── api.types.ts                # ApiResponse<T>, ApiErrorResponse
```

**Jika AI membuat file di luar struktur ini, itu adalah kesalahan.**

---

## Tanggung Jawab Setiap Layer

### `app/*/page.tsx` — Entry Point Routing

**BOLEH:**

- Definisi layout halaman
- Render satu feature component utama
- Server-side data fetching jika menggunakan React Server Components (utamakan untuk menggunakan Server Component)

**DILARANG:**

- Logic bisnis atau kondisi data
- `fetch()`, `axios`, atau HTTP calls langsung
- `useState`, `useEffect` (gunakan hooks di features/)
- Import langsung dari dalam folder fitur selain via `index.ts`

```tsx
// ✅ BENAR — app/(dashboard)/students/page.tsx
import { StudentListSection } from '@/features/students';

export default function StudentsPage() {
    return (
        <main>
            <h1 className="text-2xl font-bold mb-6">Data Siswa</h1>
            <StudentListSection />
        </main>
    );
}

// ❌ SALAH — fetch langsung di page
export default async function StudentsPage() {
    const res = await fetch('/api/students'); // DILARANG
    const students = await res.json();
    return <div>{students.map(...)}</div>;
}
```

---

### `features/*/components/` — UI Murni

**BOLEH:**

- Menerima data via props (typed dengan interface)
- Menampilkan UI berdasarkan props
- Memanggil callback dari props untuk event (onDelete, onSubmit, dll)
- `useState` untuk UI state lokal (buka/tutup modal, toggle, dll)

**DILARANG:**

- `fetch()` atau `axios` langsung
- Memanggil API layer langsung
- Business logic (kalkulasi, kondisi data bisnis)
- State yang berhubungan dengan data remote (gunakan hooks)

```tsx
// ✅ BENAR
interface StudentTableProps {
  students: Student[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  onEdit: (student: Student) => void;
}

export function StudentTable({
  students,
  isLoading,
  onDelete,
  onEdit,
}: StudentTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Nama</th>
          <th>Email</th>
          <th>Kelas</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id}>
            <td>{student.name}</td>
            <td>{student.email}</td>
            <td>{student.class?.name ?? "-"}</td>
            <td>
              <button onClick={() => onEdit(student)}>Edit</button>
              <button onClick={() => onDelete(student.id)}>Hapus</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ❌ SALAH — fetch data di dalam component
export function StudentTable() {
  const [students, setStudents] = useState([]);
  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then(setStudents); // DILARANG
  }, []);
}
```

---

### `features/*/hooks/` — State & Side Effects

**BOLEH:**

- Memanggil API layer (`{feature}.api.ts`)
- Mengelola state: data, isLoading, error
- Mengelola UI state yang kompleks (selected item, pagination, filter)
- Expose fungsi untuk action (create, update, delete)

**DILARANG:**

- `fetch()` atau `axios` langsung — harus via API layer
- JSX / markup
- Import dari API layer fitur lain (gunakan hooks dari fitur tersebut)

```tsx
// ✅ BENAR — features/students/hooks/useStudents.ts
import { useState, useEffect, useCallback } from "react";
import { studentApi } from "../api/student.api";
import type { Student, CreateStudentDto } from "../types/student.types";

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentApi.getAll();
      setStudents(data);
    } catch {
      setError("Gagal memuat data siswa.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createStudent = async (payload: CreateStudentDto): Promise<void> => {
    await studentApi.create(payload);
    await fetchAll();
  };

  const deleteStudent = async (id: number): Promise<void> => {
    await studentApi.delete(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    students,
    isLoading,
    error,
    createStudent,
    deleteStudent,
    refetch: fetchAll,
  };
}

// ❌ SALAH — axios langsung di hook
const fetchAll = async () => {
  const res = await axios.get("/api/students"); // DILARANG — gunakan studentApi
};
```

---

### `features/*/api/` — HTTP Layer (Satu-satunya tempat fetch)

**BOLEH:**

- Semua `axios` calls ke Laravel API
- Membungkus response dan mengekstrak `.data`
- Satu file per resource (`student.api.ts`, `teacher.api.ts`)

**DILARANG:**

- State (`useState`, `useReducer`)
- JSX / markup
- Business logic
- `fetch()` native — gunakan `apiClient` dari `lib/axios.ts`

```ts
// ✅ BENAR — features/students/api/student.api.ts
import { apiClient } from "@/lib/axios";
import type {
  Student,
  CreateStudentDto,
  UpdateStudentDto,
} from "../types/student.types";
import type { ApiResponse } from "@/types/api.types";

export const studentApi = {
  getAll: async (): Promise<Student[]> => {
    const { data } = await apiClient.get<ApiResponse<Student[]>>("/students");
    return data.data;
  },

  getById: async (id: number): Promise<Student> => {
    const { data } = await apiClient.get<ApiResponse<Student>>(
      `/students/${id}`,
    );
    return data.data;
  },

  create: async (payload: CreateStudentDto): Promise<Student> => {
    const { data } = await apiClient.post<ApiResponse<Student>>(
      "/students",
      payload,
    );
    return data.data;
  },

  update: async (id: number, payload: UpdateStudentDto): Promise<Student> => {
    const { data } = await apiClient.put<ApiResponse<Student>>(
      `/students/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/students/${id}`);
  },
};

// ❌ SALAH — fetch native bukan axios
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/students`); // DILARANG
```

---

### `features/*/types/` — TypeScript Types

**BOLEH:**

- `interface` dan `type` definitions
- DTO types untuk request payload
- Extend dari global types jika perlu

**DILARANG:**

- Logic apapun
- Import dari layer lain (types harus murni definisi)

```ts
// ✅ BENAR — features/students/types/student.types.ts
export interface Student {
  id: number;
  name: string;
  email: string;
  class?: {
    id: number;
    name: string;
  };
  created_at: string;
}

export interface CreateStudentDto {
  name: string;
  email: string;
  class_id: number;
}

export interface UpdateStudentDto extends Partial<CreateStudentDto> {}
```

---

### `features/*/index.ts` — Public API Fitur

Ini adalah **satu-satunya** file yang boleh di-import oleh layer luar (page, fitur lain).

**Hanya export yang dibutuhkan dari luar.** Jangan export internal implementation.

```ts
// ✅ BENAR — features/students/index.ts
export { StudentListSection } from "./components/StudentListSection";
export { StudentForm } from "./components/StudentForm";
export { useStudents } from "./hooks/useStudents";
export type { Student, CreateStudentDto } from "./types/student.types";

// JANGAN export: studentApi, internal sub-components
```

---

## Global Setup (Wajib Ada)

```ts
// src/lib/axios.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  },
);
```

```ts
// src/types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}
```

---

## Naming Convention (Wajib)

| Komponen       | Pola                  | Contoh                                 |
| -------------- | --------------------- | -------------------------------------- |
| Feature folder | kebab-case plural     | `students/`, `class-rooms/`            |
| Component      | PascalCase            | `StudentTable.tsx`, `StudentForm.tsx`  |
| Hook           | `use` + PascalCase    | `useStudents.ts`, `useStudentForm.ts`  |
| API file       | `{resource}.api.ts`   | `student.api.ts`                       |
| Types file     | `{resource}.types.ts` | `student.types.ts`                     |
| Interface      | PascalCase            | `Student`, `CreateStudentDto`          |
| DTO suffix     | `Dto`                 | `CreateStudentDto`, `UpdateStudentDto` |

---

## Aturan TypeScript (Wajib)

- **`any` dilarang keras** — selalu definisikan type yang proper
- Semua props component harus typed dengan `interface`
- Semua return value function yang non-trivial harus typed
- Gunakan `type` untuk union/intersection, `interface` untuk object shapes
- Gunakan `unknown` bukan `any` jika tipe tidak pasti, lalu narrow dengan type guard

---

## Aturan Import (Wajib)

```ts
// ✅ BENAR — import dari public API fitur
import { StudentTable } from "@/features/students";

// ❌ SALAH — import langsung dari dalam folder fitur lain
import { StudentTable } from "@/features/students/components/StudentTable";

// ✅ BENAR — import antar file dalam fitur yang sama
import { studentApi } from "../api/student.api";
import type { Student } from "../types/student.types";
```

---

## Cara AI Merespons Permintaan Fitur Baru

Ketika diminta membuat fitur (contoh: "buat halaman daftar guru"):

1. **Sebutkan semua file yang akan dibuat** sebelum mulai coding
2. **Urutan pembuatan file:**
   ```
   1. Types (features/{feature}/types/{feature}.types.ts)
   2. API layer (features/{feature}/api/{feature}.api.ts)
   3. Hook (features/{feature}/hooks/use{Feature}.ts)
   4. Component (features/{feature}/components/{Feature}*.tsx)
   5. index.ts (features/{feature}/index.ts)
   6. Page (app/(dashboard)/{feature}/page.tsx)
   ```
3. **Tanyakan dulu** jika ada ambiguitas sebelum menulis kode

---

## Larangan Keras (Hard Rules)

AI **tidak boleh** menghasilkan kode yang:

- Menaruh `fetch()` atau `axios` di dalam Component atau Page
- Menaruh `useState` + `fetch` di Component (gunakan hook)
- Menggunakan tipe `any`
- Mengimport langsung dari dalam folder fitur lain (harus via `index.ts`)
- Membuat file di luar struktur folder yang sudah ditentukan
- Menaruh business logic di Component (harus di hook atau API layer)
- Menggunakan `fetch()` native alih-alih `apiClient` dari `lib/axios.ts`
