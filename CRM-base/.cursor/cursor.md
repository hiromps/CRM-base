## ① ルートグループがネストルーティングとして認識されてしまう

- `/ (admin) /page.tsx` のようなルートグループは **URLルーティングとしては認識されない**
- ただし、`/page.tsx`（トップページ）と競合するため **ビルドエラーになる**
- 対応策：ルートグループはあくまで **グルーピング用途** に使い、トップレベルとの競合を避ける

---

## ② `useEffect()` の多用は避けるべき

- **ベストプラクティス：サーバーコンポーネントでのデータフェッチ**
- `DAL（Data Access Layer）` のように分離したファイルを作成し、**フェッチ処理をまとめる**
- フロントでの副作用管理ではなく、**初期レンダリング時点でデータ取得** を推奨

---

## ③ ストリーミングデータフェッチングを使っていない

- 各UIコンポーネントでデータ取得が必要な場合は **`<Suspense>` を使った分割読み込みが理想**
- サーバーコンポーネントと組み合わせて **スケルトンUI** での表示ができる
- 非同期対応の子コンポーネント + `Suspense` が基本構成

---

## ④ Server Actions を使っていない

- デフォルトでは `onClick` などの **クライアント側イベントハンドラで書かれがち**
- **「Server Actions で実装して」と明示的に指示する必要あり**
- フォーム処理などは `use server` を用いた **Server Actionが理想**

---

## ⑤ `useSearchParams` や動的ルートパラメータ `/blog/[id]` 受け取りの非同期化

- `useSearchParams()` や `params.id` など、**非同期での受け取りが必要**
- `async` 関数の中で `await` して処理しないとエラーになる可能性あり
- SSRやRSCでは `params` を `async` 関数の引数として受け取る形になる

---

## ⑥ Supabaseのクライアントは実行環境に応じて使い分ける

- **クライアント側**：`createClient()`（`@supabase/supabase-js`）
- **サーバー側（RSC / Server Actions）**：`createServerClient()`（`@supabase/ssr`）
- 明確に使い分けないと、**セッションが取得できない、エラーになる**等の問題が発生

---

## 🔧 おすすめ追加セクション

---

### ⑦ ディレクトリ構成のベストプラクティス

    app/
      └ (admin)/       // グルーピング用途のみ
      └ dashboard/
          └ page.tsx
      └ blog/
          └ [id]/
              └ page.tsx
    lib/
      └ dal/           // Supabaseなどのデータ取得ロジック
      └ auth/          // 認証処理（middleware等）
    components/
      └ ui/            // プレゼンテーションコンポーネント
      └ skeleton/      // ローディング用コンポーネント
      └ shared/        // 再利用コンポーネント

---

### ⑧ Server Actions + Form Handling のベストプラクティス

    // app/contact/page.tsx
    export default function ContactPage() {
      return (
        <form action={submitContact} className="...">
          <input type="text" name="name" />
          <textarea name="message" />
          <button type="submit">送信</button>
        </form>
      )
    }

    async function submitContact(formData: FormData) {
      'use server'
      const name = formData.get('name') as string
      const message = formData.get('message') as string
      // DB保存などの処理
    }

- フォーム送信 → Server Action → DB保存 or API呼び出しの構成が美しい
- バリデーションは `zod` + `formData.get()` で堅牢化

---

### ⑨ Supabaseのセッション取得方法（RSC）

    // lib/auth/getSession.ts
    import { createServerClient } from '@supabase/ssr'
    import { cookies } from 'next/headers'

    export const getSession = async () => {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies }
      )
      const {
        data: { session }
      } = await supabase.auth.getSession()
      return session
    }

- サーバーで認証状態が必要なときに活用
- ミドルウェアやRSCの認可判定に使える

---

### ⑩ ローディングUIの設計（Suspense + Skeleton）

    // app/dashboard/page.tsx
    import { Suspense } from 'react'
    import DashboardContent from './DashboardContent'
    import Skeleton from '@/components/skeleton/Dashboard'

    export default function Page() {
      return (
        <Suspense fallback={<Skeleton />}>
          <DashboardContent />
        </Suspense>
      )
    }

- UX向上に必須。特にダッシュボードや一覧表示など。
- `Skeleton` はなるべく各機能ごとに設計しておくと流用可能