import { testFirebaseConnection } from '../../lib/firebase';

export default async function handler(req, res) {
  try {
    const isConnected = await testFirebaseConnection();
    res.status(200).json({ 
      success: true, 
      isConnected,
      message: isConnected ? 'Firebase 连接成功' : 'Firebase 连接失败'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Firebase 连接测试出错'
    });
  }
} 