## ① Firebaseの初期化は一箇所にまとめる

- Firebase設定は **単一のconfigファイル** で管理
- 複数箇所での初期化は **パフォーマンス低下やエラーの原因**
- 対応策：`/src/config/firebase.js` のような専用ファイルで **シングルトンパターン** を使用

---

## ② `onSnapshot` リスナーの適切な管理

- **ベストプラクティス：リスナーのクリーンアップを忘れない**
- `useEffect` のreturn文で **必ずunsubscribe()を実行**
- メモリリークを防ぐため、**コンポーネントのアンマウント時に必ず解除**

```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
    // データ処理
  });
  
  return () => unsubscribe(); // 重要！
}, []);
```

---

## ③ Firestoreのクエリ最適化

- 大量データの取得時は **`limit()` を使ったページネーション実装**
- 複合インデックスが必要な場合は **Firebase Console で事前に作成**
- `where` 句の使用時は **インデックスの自動作成を活用**

```javascript
// 良い例：ページネーション
const q = query(
  collection(db, 'contacts'),
  where('workspace', '==', workspaceId),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

---

## ④ Firebase Authentication のセッション管理

- **`onAuthStateChanged` を使った認証状態の監視**
- **Context API や状態管理ライブラリでユーザー情報を共有**
- ローディング状態の適切な管理で **フラッシュを防ぐ**

```javascript
// Context での実装例
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## ⑤ Firestore Security Rules の設計

- **最小権限の原則** を厳守
- ユーザーは **自分のデータのみアクセス可能** にする
- **バリデーションルール** をセキュリティルールに含める

```javascript
// firestore.rules の例
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のプロフィールのみ編集可能
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // ワークスペースメンバーのみアクセス可能
    match /workspaces/{workspaceId}/contacts/{document=**} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/workspaces/$(workspaceId)/members/$(request.auth.uid));
    }
  }
}
```

---

## ⑥ オフライン対応とキャッシュ戦略

- **`enablePersistence()` でオフラインサポートを有効化**
- キャッシュとサーバーデータの **同期状態を適切に表示**
- ネットワークエラー時の **フォールバック処理を実装**

```javascript
// オフライン対応の有効化
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// 初期化時
enablePersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('複数タブで開いているため、オフライン機能を無効化');
  } else if (err.code === 'unimplemented') {
    console.log('ブラウザがオフライン機能に対応していません');
  }
});
```

---

## 🔧 おすすめ追加セクション

---

### ⑦ プロジェクト構成のベストプラクティス

    src/
      └ components/       // UIコンポーネント
          └ auth/        // 認証関連
          └ contacts/    // 連絡先管理
          └ shared/      // 共通コンポーネント
      └ config/          // Firebase設定
          └ firebase.js
      └ hooks/           // カスタムフック
          └ useAuth.js
          └ useFirestore.js
      └ services/        // ビジネスロジック
          └ contacts.js
          └ workspace.js
      └ utils/           // ユーティリティ関数

---

### ⑧ カスタムフックでのFirestore操作

```javascript
// hooks/useFirestore.js
export const useCollection = (collectionName, queryConstraints = []) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...queryConstraints);
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocuments(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { documents, loading, error };
};
```

---

### ⑨ バッチ処理とトランザクション

```javascript
// 複数ドキュメントの一括更新
const batchUpdate = async (updates) => {
  const batch = writeBatch(db);
  
  updates.forEach(({ ref, data }) => {
    batch.update(ref, data);
  });
  
  try {
    await batch.commit();
    console.log('バッチ更新成功');
  } catch (error) {
    console.error('バッチ更新エラー:', error);
  }
};

// トランザクション例
const transferContact = async (contactId, fromWorkspace, toWorkspace) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 読み取り
      const contactDoc = await transaction.get(doc(db, 'contacts', contactId));
      
      if (!contactDoc.exists()) {
        throw new Error('Contact not found');
      }
      
      // 書き込み
      transaction.update(doc(db, 'contacts', contactId), {
        workspace: toWorkspace,
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Transaction failed:', error);
  }
};
```

---

### ⑩ Firebase Performance Monitoring

```javascript
// パフォーマンス監視の実装
import { getPerformance, trace } from 'firebase/performance';

const perf = getPerformance();

// カスタムトレースの例
export const measureContactLoad = async () => {
  const loadTrace = trace(perf, 'load_contacts');
  loadTrace.start();
  
  try {
    // 連絡先データの取得処理
    const contacts = await getContacts();
    
    // カスタム属性の追加
    loadTrace.putAttribute('contact_count', String(contacts.length));
    
    return contacts;
  } finally {
    loadTrace.stop();
  }
};
```

---

### ⑪ エラーハンドリングのベストプラクティス

```javascript
// 統一的なエラーハンドリング
export const handleFirebaseError = (error) => {
  const errorMessages = {
    'permission-denied': 'アクセス権限がありません',
    'unavailable': 'サービスが一時的に利用できません',
    'unauthenticated': 'ログインが必要です',
    'not-found': 'データが見つかりません',
    'already-exists': 'すでに存在します',
    'failed-precondition': '前提条件を満たしていません',
    'resource-exhausted': 'リソースが枯渇しています',
    'cancelled': '操作がキャンセルされました',
    'data-loss': 'データが失われました',
    'unknown': '不明なエラーが発生しました'
  };

  return errorMessages[error.code] || error.message;
};
```

---

### ⑫ 環境変数の管理

```javascript
// .env.local
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

// config/firebase.js
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
``` 