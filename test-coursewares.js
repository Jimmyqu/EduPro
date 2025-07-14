// 测试课件接口
async function testCoursewaresAPI() {
  const API_BASE_URL = 'http://localhost:8000/api';
  
  try {
    console.log('🚀 测试课件接口...');
    
    // 测试获取课件列表
    const response = await fetch(`${API_BASE_URL}/coursewares?page=1&per_page=10`);
    const data = await response.json();
    
    console.log('✅ 接口响应状态:', response.status);
    console.log('📋 响应数据结构:');
    console.log('- code:', data.code);
    console.log('- message:', data.message);
    console.log('- total:', data.data?.total);
    console.log('- coursewares count:', data.data?.coursewares?.length);
    
    if (data.data?.coursewares?.length > 0) {
      console.log('📚 第一个课件示例:');
      const firstCourseware = data.data.coursewares[0];
      console.log('- ID:', firstCourseware.courseware_id);
      console.log('- 标题:', firstCourseware.title);
      console.log('- 内容URL:', firstCourseware.content_url);
      console.log('- 时长:', firstCourseware.duration_minutes);
      console.log('- 是否已选课:', firstCourseware.is_enrolled);
      
      if (firstCourseware.course) {
        console.log('- 所属课程:', firstCourseware.course.title);
        console.log('- 课程分类:', firstCourseware.course.category);
      }
    }
    
    console.log('✅ 课件接口测试成功！');
    
  } catch (error) {
    console.error('❌ 课件接口测试失败:', error);
  }
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  window.testCoursewaresAPI = testCoursewaresAPI;
  console.log('💡 在浏览器控制台中运行: testCoursewaresAPI()');
}

// 如果在 Node.js 环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testCoursewaresAPI;
} 