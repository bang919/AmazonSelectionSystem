import * as XLSX from 'xlsx';

/**
 * 解析Excel文件并提取产品数据
 * @param {File} file - 上传的Excel文件
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<Array>} 解析后的产品数据数组
 */
export const parseExcelFile = async (file, onProgress = () => {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        onProgress(20); // 文件读取完成
        
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        onProgress(40); // 工作簿解析完成
        
        // 获取第一张工作表
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        onProgress(60); // 工作表获取完成
        
        // 将工作表转换为JSON
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        onProgress(80); // 数据转换完成
        
        // 检查数据结构，第一行可能是描述性标题（如Product-xxx），第二行才是真正的标题
        let headers;
        let dataStartIndex;
        
        console.log('Excel原始数据行数:', rawData.length);
        console.log('第一行数据:', rawData[0]);
        if (rawData.length > 1) {
          console.log('第二行数据:', rawData[1]);
        }
        
        // 检查第一行第一个单元格是否以"Product-"开头
        if (rawData.length > 1 && 
            rawData[0] && 
            rawData[0][0] && 
            typeof rawData[0][0] === 'string' && 
            rawData[0][0].startsWith('Product-')) {
          
          console.log('检测到第一行是描述性标题:', rawData[0][0]);
          // 第一行是描述性标题，第二行是真正的标题行
          headers = rawData[1];
          dataStartIndex = 2;
        } else {
          console.log('第一行就是标题行');
          // 第一行就是标题行
          headers = rawData[0];
          dataStartIndex = 1;
        }
        
        console.log('使用的标题行:', headers);
        console.log('数据从第', dataStartIndex + 1, '行开始');
        
        // 验证标题行是否包含必要字段
        if (!headers || !Array.isArray(headers)) {
          throw new Error('无法找到有效的标题行');
        }
        
        // 检查是否包含ASIN字段（必需字段）
        const hasASIN = headers.some(header => 
          header && typeof header === 'string' && header.includes('ASIN')
        );
        
        if (!hasASIN) {
          console.warn('标题行中未找到ASIN字段:', headers);
        }
        
        const products = [];
        
        for (let i = dataStartIndex; i < rawData.length; i++) {
          const row = rawData[i];
          if (row && row.length > 0) {
            const product = {};
            
            headers.forEach((header, index) => {
              if (header && row[index] !== undefined) {
                product[header] = row[index];
              }
            });
            
            // 只添加有ASIN的产品（确保是有效的产品数据）
            if (product['ASIN']) {
              products.push(formatProductData(product));
            }
          }
        }
        
        onProgress(100); // 解析完成
        resolve(products);
        
      } catch (error) {
        console.error('解析Excel文件时发生错误:', error);
        reject(new Error('文件解析失败，请检查文件格式是否正确'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 20); // 文件读取占20%进度
        onProgress(progress);
      }
    };
    
    reader.readAsBinaryString(file);
  });
};

/**
 * 格式化产品数据，统一字段名称
 * @param {Object} rawProduct - 原始产品数据
 * @returns {Object} 格式化后的产品数据
 */
const formatProductData = (rawProduct) => {
  return {
    asin: rawProduct['ASIN'] || '',
    title: rawProduct['商品标题'] || '',
    price: parseFloat(rawProduct['价格($)']) || 0,
    mainCategory: rawProduct['大类目'] || '',
    subCategory: rawProduct['小类目'] || '',
    monthlySales: parseInt(rawProduct['月销量']) || 0,
    monthlyRevenue: parseFloat(rawProduct['月销售额($)']) || 0,
    reviewCount: parseInt(rawProduct['评分数']) || 0,
    rating: parseFloat(rawProduct['评分']) || 0,
    launchDate: rawProduct['上架时间'] || '',
    shippingMethod: rawProduct['配送方式'] || '',
    sellerLocation: rawProduct['卖家所属地'] || '',
    mainImage: rawProduct['商品主图'] || '',
    productUrl: rawProduct['商品详情页链接'] || '',
    // 保留原始数据以备后用
    raw: rawProduct
  };
};

/**
 * 验证文件格式
 * @param {File} file - 上传的文件
 * @returns {Object} 验证结果
 */
export const validateFile = (file) => {
  const result = {
    valid: true,
    error: null
  };
  
  // 检查文件类型
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    result.valid = false;
    result.error = '请上传.xlsx格式的文件';
    return result;
  }
  
  // 检查文件大小（10MB限制）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    result.valid = false;
    result.error = '文件大小不能超过10MB';
    return result;
  }
  
  return result;
};

/**
 * 计算上架至今天数
 * @param {string} launchDate - 上架日期
 * @returns {number} 天数
 */
export const calculateDaysSinceLaunch = (launchDate) => {
  if (!launchDate) return 0;
  
  try {
    const launch = new Date(launchDate);
    const now = new Date();
    const diffTime = Math.abs(now - launch);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.warn('日期解析失败:', launchDate);
    return 0;
  }
}; 