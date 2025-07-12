import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc } from 'firebase/firestore';

// Firebase 配置
// 注意：这些是公开的配置信息，在生产环境中应该使用环境变量
const firebaseConfig = {
  // 这里需要用户填入自己的Firebase项目配置
  // 可以从Firebase控制台的项目设置中获取
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

// 初始化 Firebase
let app;
let db;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase 初始化成功');
  } else {
    console.warn('Firebase 配置不完整，请检查环境变量');
  }
} catch (error) {
  console.error('Firebase 初始化失败:', error);
}

/**
 * 格式化类目名称，用于匹配黑名单
 * @param {string} category - 原始类目名称
 * @returns {string} 格式化后的类目名称
 */
export const formatCategoryName = (category) => {
  if (!category || typeof category !== 'string') {
    return '';
  }
  
  // 根据需求文档进行格式化
  return category
    .replaceAll(" ", "")
    .replaceAll("&", "")
    .replaceAll("'", "")
    .replaceAll(",", "");
};

/**
 * 获取类目黑名单状态
 * @param {string} subCategory - 小类目名称
 * @returns {Promise<boolean>} 是否在黑名单中 (is_exclude: true)
 */
export const getCategoryBlacklistStatus = async (subCategory) => {
  if (!db) {
    console.warn('Firestore 未初始化，跳过黑名单检查');
    return false;
  }

  if (!subCategory) {
    return false;
  }

  try {
    const formattedCategory = formatCategoryName(subCategory);
    if (!formattedCategory) {
      return false;
    }

    const docRef = doc(db, 'firestore_collection_category', formattedCategory);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.is_exclude === true;
    } else {
      // 文档不存在，默认不在黑名单中
      return false;
    }
  } catch (error) {
    console.error('获取类目黑名单状态失败:', error);
    return false;
  }
};

/**
 * 批量获取多个类目的黑名单状态
 * @param {Array<string>} subCategories - 小类目名称数组
 * @returns {Promise<Object>} 类目黑名单状态映射 {category: isBlacklisted}
 */
export const getBatchCategoryBlacklistStatus = async (subCategories) => {
  if (!db) {
    console.warn('Firestore 未初始化，跳过黑名单检查');
    return {};
  }

  if (!subCategories || subCategories.length === 0) {
    return {};
  }

  const blacklistMap = {};

  try {
    // 去重并格式化类目名称
    const uniqueCategories = [...new Set(subCategories.filter(Boolean))];
    const formattedCategories = uniqueCategories.map(formatCategoryName).filter(Boolean);

    if (formattedCategories.length === 0) {
      return {};
    }

    // 批量查询
    const promises = formattedCategories.map(async (formattedCategory) => {
      try {
        const docRef = doc(db, 'firestore_collection_category', formattedCategory);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            category: formattedCategory,
            isBlacklisted: data.is_exclude === true
          };
        } else {
          return {
            category: formattedCategory,
            isBlacklisted: false
          };
        }
      } catch (error) {
        console.error(`获取类目 ${formattedCategory} 黑名单状态失败:`, error);
        return {
          category: formattedCategory,
          isBlacklisted: false
        };
      }
    });

    const results = await Promise.all(promises);
    
    // 构建映射表
    results.forEach(result => {
      blacklistMap[result.category] = result.isBlacklisted;
    });

    // 为原始类目名称创建映射
    uniqueCategories.forEach(originalCategory => {
      const formattedCategory = formatCategoryName(originalCategory);
      if (formattedCategory && blacklistMap[formattedCategory] !== undefined) {
        blacklistMap[originalCategory] = blacklistMap[formattedCategory];
      }
    });

  } catch (error) {
    console.error('批量获取类目黑名单状态失败:', error);
  }

  return blacklistMap;
};

/**
 * 获取所有黑名单类目
 * @returns {Promise<Array<string>>} 黑名单类目数组
 */
export const getAllBlacklistedCategories = async () => {
  if (!db) {
    console.warn('Firestore 未初始化，无法获取黑名单');
    return [];
  }

  try {
    const q = query(
      collection(db, 'firestore_collection_category'),
      where('is_exclude', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const blacklistedCategories = [];
    
    querySnapshot.forEach((doc) => {
      blacklistedCategories.push(doc.id);
    });

    return blacklistedCategories;
  } catch (error) {
    console.error('获取所有黑名单类目失败:', error);
    return [];
  }
};

/**
 * 检查产品是否在黑名单中
 * @param {Object} product - 产品对象
 * @param {Object} blacklistMap - 黑名单映射表
 * @returns {boolean} 是否在黑名单中
 */
export const isProductBlacklisted = (product, blacklistMap) => {
  if (!product || !product.subCategory || !blacklistMap) {
    return false;
  }

  const formattedCategory = formatCategoryName(product.subCategory);
  return blacklistMap[product.subCategory] === true || blacklistMap[formattedCategory] === true;
};

/**
 * 测试 Firebase 连接
 * @returns {Promise<boolean>} 连接是否成功
 */
export const testFirebaseConnection = async () => {
  if (!db) {
    return false;
  }

  try {
    // 尝试读取一个测试文档
    const testDocRef = doc(db, 'firestore_collection_category', 'test');
    await getDoc(testDocRef);
    return true;
  } catch (error) {
    console.error('Firebase 连接测试失败:', error);
    return false;
  }
};

/**
 * 获取所有类目及其黑名单状态
 * @returns {Promise<Array>} 类目数组，每个元素包含 {id, isBlacklisted}
 */
export const getAllCategoriesWithStatus = async () => {
  if (!db) {
    console.warn('Firestore 未初始化，无法获取类目列表');
    return [];
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'firestore_collection_category'));
    const categories = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        id: doc.id,
        isBlacklisted: data.is_exclude === true
      });
    });

    // 按类目名称排序
    categories.sort((a, b) => a.id.localeCompare(b.id));
    
    return categories;
  } catch (error) {
    console.error('获取所有类目失败:', error);
    return [];
  }
};

/**
 * 更新类目黑名单状态
 * @param {string} categoryId - 类目ID
 * @param {boolean} isBlacklisted - 是否为黑名单
 * @returns {Promise<boolean>} 更新是否成功
 */
export const updateCategoryBlacklistStatus = async (categoryId, isBlacklisted) => {
  if (!db) {
    console.warn('Firestore 未初始化，无法更新类目状态');
    return false;
  }

  if (!categoryId) {
    console.error('类目ID不能为空');
    return false;
  }

  try {
    const docRef = doc(db, 'firestore_collection_category', categoryId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // 文档存在，更新状态
      await updateDoc(docRef, {
        is_exclude: isBlacklisted
      });
    } else {
      // 文档不存在，创建新文档
      await setDoc(docRef, {
        is_exclude: isBlacklisted
      });
    }

    console.log(`类目 ${categoryId} 黑名单状态已更新为: ${isBlacklisted}`);
    return true;
  } catch (error) {
    console.error('更新类目黑名单状态失败:', error);
    return false;
  }
};

/**
 * 批量更新类目黑名单状态
 * @param {Array<{id: string, isBlacklisted: boolean}>} updates - 更新数据数组
 * @returns {Promise<{success: number, failed: number}>} 更新结果统计
 */
export const batchUpdateCategoryBlacklistStatus = async (updates) => {
  if (!db) {
    console.warn('Firestore 未初始化，无法批量更新类目状态');
    return { success: 0, failed: updates.length };
  }

  if (!updates || updates.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  try {
    const promises = updates.map(async (update) => {
      const result = await updateCategoryBlacklistStatus(update.id, update.isBlacklisted);
      if (result) {
        success++;
      } else {
        failed++;
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('批量更新类目黑名单状态失败:', error);
    failed = updates.length;
  }

  return { success, failed };
};

export { db, app }; 