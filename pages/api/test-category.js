import { getCategoryBlacklistStatus } from '../../lib/firebase';

export default async function handler(req, res) {
  try {
    // 测试访问 Accessories(HomeKitchen) 类目
    const categoryStatus = await getCategoryBlacklistStatus('Accessories(HomeKitchen)');
    
    res.status(200).json({ 
      success: true, 
      category: 'Accessories(HomeKitchen)',
      isBlacklisted: categoryStatus,
      message: `类目访问成功，黑名单状态: ${categoryStatus}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: '类目访问测试出错'
    });
  }
} 